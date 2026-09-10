const enc=new TextEncoder();
const json=(data,status=200,origin='*')=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=utf-8','access-control-allow-origin':origin,'access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PUT,OPTIONS','vary':'Origin','cache-control':'no-store'}});
const clean=(value,max)=>String(value||'').replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,max);
const token=(bytes=18)=>{const a=crypto.getRandomValues(new Uint8Array(bytes));return btoa(String.fromCharCode(...a)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')};
const hash=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const bearer=request=>(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
const allowed=(request,env)=>{const o=request.headers.get('origin');return !o||o===env.ALLOWED_ORIGIN||/^http:\/\/localhost(?::\d+)?$/.test(o)};
const safeInt=(value,min,max,fallback=min)=>{const n=Math.floor(Number(value));return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback};

async function createRoom(request,env,origin){
  const body=await request.json(),now=Date.now(),roomId=token(8),roomKey=token(24),playerId=token(9),playerKey=token(24);
  const name=clean(body.name,40)||'2048',playerName=clean(body.playerName,24)||'Player',deviceId=clean(body.deviceId,80)||token(8);
  await env.DB.batch([
    env.DB.prepare('INSERT INTO rooms(id,name,key_hash,created_at,updated_at) VALUES(?,?,?,?,?)').bind(roomId,name,await hash(roomKey),now,now),
    env.DB.prepare('INSERT INTO players(id,room_id,name,key_hash,device_id,updated_at) VALUES(?,?,?,?,?,?)').bind(playerId,roomId,playerName,await hash(playerKey),deviceId,now)
  ]);
  return json({roomId,roomKey,playerId,playerKey,syncAfter:safeInt(env.SYNC_SECONDS,60,3600,120)},201,origin);
}
async function roomAuth(request,env,id){const key=bearer(request);if(!key)return null;return env.DB.prepare('SELECT id,name FROM rooms WHERE id=? AND key_hash=?').bind(id,await hash(key)).first()}
async function playerAuth(request,env,id,playerId){const key=bearer(request);if(!key)return null;return env.DB.prepare('SELECT id,room_id,score,moves,active_ms,review_until FROM players WHERE id=? AND room_id=? AND key_hash=?').bind(playerId,id,await hash(key)).first()}
async function joinRoom(request,env,id,origin){const room=await roomAuth(request,env,id);if(!room)return json({error:'not_found'},404,origin);const body=await request.json(),now=Date.now(),playerId=token(9),playerKey=token(24),name=clean(body.playerName,24)||'Player',deviceId=clean(body.deviceId,80)||token(8);await env.DB.prepare('INSERT INTO players(id,room_id,name,key_hash,device_id,updated_at) VALUES(?,?,?,?,?,?)').bind(playerId,id,name,await hash(playerKey),deviceId,now).run();await env.DB.prepare('UPDATE rooms SET updated_at=? WHERE id=?').bind(now,id).run();return json({roomId:id,roomName:room.name,playerId,playerKey,syncAfter:safeInt(env.SYNC_SECONDS,60,3600,120)},201,origin)}
async function getRoom(request,env,id,origin){const room=await roomAuth(request,env,id);if(!room)return json({error:'not_found'},404,origin);const now=Date.now(),rows=await env.DB.prepare('SELECT id,name,score,max_tile AS maxTile,lives,moves,active_ms AS activeMs,status,updated_at AS updatedAt,CASE WHEN review_until>? THEN 1 ELSE 0 END AS review FROM players WHERE room_id=? ORDER BY score DESC, updated_at ASC LIMIT 100').bind(now,id).all();return json({room:{id:room.id,name:room.name},leaderboard:rows.results,syncAfter:safeInt(env.SYNC_SECONDS,60,3600,120)},200,origin)}
async function updateScore(request,env,id,playerId,origin){const player=await playerAuth(request,env,id,playerId);if(!player)return json({error:'not_found'},404,origin);const body=await request.json(),score=safeInt(body.score,0,2147483647),maxTile=safeInt(body.maxTile,2,1073741824,2),lives=safeInt(body.lives,0,3,3),moves=safeInt(body.moves,0,2147483647),activeMs=safeInt(body.activeMs,0,2147483647),status=body.status==='finished'?'finished':'playing',now=Date.now();if(score<player.score||moves<player.moves||activeMs<player.active_ms)return json({error:'stale_state'},409,origin);
  // Only impossible jumps between snapshots are reviewed; a large gradual total stays clean.
  const deltaMoves=moves-player.moves,deltaMs=activeMs-player.active_ms,deltaScore=score-player.score;
  const tooFast=deltaMs>=30000&&deltaMoves>0&&deltaMoves/(deltaMs/1000)>safeInt(env.MAX_MOVES_PER_SECOND,4,20,8);
  const impossibleGain=deltaMoves>=20&&deltaScore>Math.max(50000,deltaMoves*Math.max(128,maxTile*8));
  const reviewUntil=tooFast||impossibleGain?now+86400000:Number(player.review_until)||0;
  await env.DB.batch([env.DB.prepare('UPDATE players SET score=?,max_tile=?,lives=?,moves=?,active_ms=?,status=?,review_until=?,updated_at=? WHERE id=?').bind(score,maxTile,lives,moves,activeMs,status,reviewUntil,now,playerId),env.DB.prepare('UPDATE rooms SET updated_at=? WHERE id=?').bind(now,id)]);return json({ok:true,review:reviewUntil>now,syncAfter:safeInt(env.SYNC_SECONDS,60,3600,120)},200,origin)}

export default{async fetch(request,env){const origin=request.headers.get('origin')||env.ALLOWED_ORIGIN;if(!allowed(request,env))return json({error:'origin'},403,'null');if(request.method==='OPTIONS')return json({},204,origin);const url=new URL(request.url),parts=url.pathname.replace(/^\/v1\/?/,'').split('/').filter(Boolean);try{if(request.method==='POST'&&parts.join('/')==='rooms')return createRoom(request,env,origin);if(parts[0]==='rooms'&&parts[1]&&parts[2]==='join'&&request.method==='POST')return joinRoom(request,env,parts[1],origin);if(parts[0]==='rooms'&&parts[1]&&parts.length===2&&request.method==='GET')return getRoom(request,env,parts[1],origin);if(parts[0]==='rooms'&&parts[1]&&parts[2]==='players'&&parts[3]&&request.method==='PUT')return updateScore(request,env,parts[1],parts[3],origin);return json({error:'not_found'},404,origin)}catch(error){console.error(error);return json({error:'server_error'},500,origin)}}};
