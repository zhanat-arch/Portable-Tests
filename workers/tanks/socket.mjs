import { randomBytes } from 'node:crypto';
import { WebSocketServer } from 'ws';

// Tank Battle 90 engine © phanngoc, MIT. The server owns the simulation.
export function attachTankSocket(server, engine, origin = 'https://porthub.fyi') {
  const { Game, COLS, ROWS, TILE, TICK_HZ } = engine;
  const matches = new Map();
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024, perMessageDeflate: false });
  const send = (peer, value) => {
    if (peer.readyState === 1) {
      if (peer.bufferedAmount > 64 * 1024) peer.terminate();
      else peer.send(typeof value === 'string' ? value : JSON.stringify(value));
    }
  };
  const broadcast = (match, value) => {
    const data = JSON.stringify(value);
    for (const peer of match.peers) send(peer, data);
  };
  const map = game => ({ t: 'map', map: game.fullMap(), stage: game.stage, status: game.status });

  server.on('upgrade', (req, socket, head) => {
    if (req.url !== '/v1/tanks/ws' || req.headers.origin !== origin || wss.clients.size >= 72) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      return;
    }
    wss.handleUpgrade(req, socket, head, peer => wss.emit('connection', peer));
  });
  wss.on('connection', peer => {
    peer.on('error', () => {});
    let match, slot, windowStart = Date.now(), messages = 0;
    peer.alive = true;
    peer.on('pong', () => { peer.alive = true; });
    const idle = setTimeout(() => { if (!match) peer.terminate(); }, 30_000);
    send(peer, { t: 'hello', cols: COLS, rows: ROWS, tile: TILE });
    peer.on('message', (raw, binary) => {
      const now = Date.now();
      if (now - windowStart >= 1000) { windowStart = now; messages = 0; }
      if (binary || ++messages > 90) return peer.close(1008, 'Input limit');
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }
      if (!msg || typeof msg !== 'object') return;
      if (msg.t === 'ping') return send(peer, { t: 'pong' });
      if (!match) {
        if (msg.t === 'create') {
          if (matches.size >= 16) return send(peer, { t: 'nojoin', reason: 'busy' });
          const code = randomBytes(8).toString('hex').toUpperCase();
          match = { code, game: new Game(), peers: new Set(), host: peer, stage: 0 };
          matches.set(code, match);
        } else if (msg.t === 'join') {
          const code = typeof msg.room === 'string' && /^[\dA-F]{16}$/i.test(msg.room) ? msg.room.toUpperCase() : '';
          match = matches.get(code);
          if (!match) return send(peer, { t: 'nojoin', reason: 'notfound' });
          if (match.peers.size >= 4) {
            match = undefined;
            return send(peer, { t: 'nojoin', reason: 'full' });
          }
        } else return;
        const name = typeof msg.name === 'string' ? msg.name.trim().slice(0, 12) : '';
        slot = match.game.addPlayer(name).slot;
        match.peers.add(peer);
        clearTimeout(idle);
        return send(peer, { ...map(match.game), t: 'init', room: match.code, you: slot });
      }
      const { game } = match;
      if (msg.t === 'ctrl' && Number.isInteger(msg.dir) && msg.dir >= 0 && msg.dir < 4) {
        game.players.get(slot).ctrl = { dir: msg.dir, moving: msg.moving === true, fire: msg.fire === true };
      } else if (peer === match.host) {
        if (msg.t === 'begin' && game.status === 'waiting') game.startGame();
        if (msg.t === 'restart' && game.status === 'gameover') game.restart();
      }
    });
    peer.on('close', () => {
      clearTimeout(idle);
      if (!match) return;
      match.game.removePlayer(slot);
      match.peers.delete(peer);
      if (!match.peers.size) matches.delete(match.code);
      else if (match.host === peer) match.host = match.peers.values().next().value;
    });
  });
  const tick = setInterval(() => {
    for (const match of matches.values()) {
      const { game } = match;
      game.update();
      const stage = game.stage + ':' + game.status;
      if (stage !== match.stage && game.status === 'playing') broadcast(match, map(game));
      match.stage = stage;
      broadcast(match, game.snapshot());
    }
  }, 1000 / TICK_HZ);
  const heartbeat = setInterval(() => {
    for (const peer of wss.clients) {
      if (!peer.alive) peer.terminate();
      else { peer.alive = false; peer.ping(); }
    }
  }, 15_000);
  server.once('close', () => {
    clearInterval(tick);
    clearInterval(heartbeat);
    for (const peer of wss.clients) peer.terminate();
    wss.close();
  });
}
