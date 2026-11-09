// PortHub rules for the pinned Snake source. Fail if a future import changes an anchor.
import { snakeStartSpeeds } from '../workers/game-api/arcade-rules.mjs';

export function buildSnake(source, friendsPreview) {
  source = source.replaceAll('\r\n', '\n');
  const replace = (anchor, replacement) => {
    if (!source.includes(anchor)) throw new Error('Snake source changed at ' + String(anchor).slice(0, 80));
    source = source.replace(anchor, replacement);
  };
  replace('<div class="best" id="start-best"></div>', `<label class="snake-mode-label">
      <span data-i18n="snake.modeLabel">Mode</span>
      <select id="snake-mode">
        <option value="classic" data-i18n="snake.modeClassic">Classic walls</option>
        <option value="wrap" data-i18n="snake.modeWrap">Wraparound</option>
        <option value="turbo" data-i18n="snake.modeTurbo">Turbo</option>
      </select>
    </label>
    <label class="snake-mode-label">
      <span data-i18n="snake.startSpeed">Starting speed</span>
      <select id="snake-speed">
        <option value="slow" data-i18n="snake.speedSlow">Slow</option>
        <option value="normal" data-i18n="snake.speedNormal">Normal</option>
        <option value="fast" data-i18n="snake.speedFast">Fast</option>
      </select>
    </label>
    <div class="best" id="start-best"></div>`);
  replace('<button class="btn-ghost" id="btn-share"', '<button class="btn-ghost" id="snake-modes" data-i18n="snake.modeLabel">Mode</button>\n      <button class="btn-ghost" id="btn-share"');
  replace("var BEST_KEY = 'snake_best_v1';\n  var best = parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0;", `var modes = {
    classic: { wrap:false, start:150, floor:65, every:5, step:12, best:'snake_best_v1' },
    wrap: { wrap:true, start:150, floor:65, every:5, step:12, best:'ph.snake.best.wrap.v1' },
    turbo: { wrap:true, start:115, floor:45, every:3, step:10, best:'ph.snake.best.turbo.v1' }
  };
  var storedMode = localStorage.getItem('ph.snake.mode.v1');
  var mode = Object.hasOwn(modes, storedMode) ? storedMode : 'classic';
  var startSpeeds = ${JSON.stringify(snakeStartSpeeds)};
  var storedSpeed = localStorage.getItem('ph.snake.speed.v1');
  var speed = Object.hasOwn(startSpeeds, storedSpeed) ? storedSpeed : 'normal';
  function startingInterval() { return Math.round(modes[mode].start * startSpeeds[speed]); }
  function bestKey() { return speed === 'normal' ? modes[mode].best : modes[mode].best + '.' + speed; }
  function readBest() {
    return Math.max(0, parseInt(localStorage.getItem(bestKey()) || '0', 10) || 0);
  }
  var best = readBest();`);
  const appleStart = source.indexOf('  function spawnApple() {');
  const appleEnd = source.indexOf('  function reset()', appleStart);
  if (appleStart < 0 || appleEnd < 0) throw Error('Snake apple generator changed');
  source = source.slice(0, appleStart) + `  function spawnApple() {
    var occupied = new Set(snake.map(function (part) { return part.y * COLS + part.x; }));
    var cellsLeft = COLS * ROWS - occupied.size;
    if (!cellsLeft) return null;
    var pick = Math.floor(Math.random() * cellsLeft);
    for (var cell = 0; cell < COLS * ROWS; cell++) {
      if (!occupied.has(cell) && pick-- === 0) return { x:cell % COLS, y:Math.floor(cell / COLS) };
    }
  }

` + source.slice(appleEnd);
  replace('tickMs = 150; tickAcc = 0;', 'tickMs = startingInterval(); tickAcc = 0;');
  replace('function speedLevel() { return 1 + Math.floor(applesEaten / 5); }', `function speedLevel() {
    var pace = modes[mode];
    var maxSteps = Math.ceil((startingInterval() - pace.floor) / pace.step);
    return 1 + Math.min(maxSteps, Math.floor(applesEaten / pace.every));
  }`);
  replace('  refreshBest();\n  WG.onChange', `  var modeSelect = document.getElementById('snake-mode');
  modeSelect.value = mode;
  var speedSelect = document.getElementById('snake-speed');
  speedSelect.value = speed;
  function updateSettings() {
    if (state !== STATE.READY || !Object.hasOwn(modes, modeSelect.value) ||
        !Object.hasOwn(startSpeeds, speedSelect.value)) return;
    mode = modeSelect.value;
    speed = speedSelect.value;
    localStorage.setItem('ph.snake.mode.v1', mode);
    localStorage.setItem('ph.snake.speed.v1', speed);
    best = readBest();
    refreshBest();
    reset();
  }
  modeSelect.addEventListener('change', updateSettings);
  speedSelect.addEventListener('change', updateSettings);
  document.getElementById('snake-modes').addEventListener('click', function () {
    state = STATE.READY;
    reset();
    overOverlay.classList.add('hidden');
    startOverlay.classList.remove('hidden');
    modeSelect.focus();
  });
  refreshBest();
  WG.onChange`);
  replace('var k = e.key.toLowerCase();', `if (e.target.closest?.('select, input, textarea, dialog')) return;
    var physical = {KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',KeyP:'p'};
    var k = physical[e.code] || e.key.toLowerCase();`);
  replace("if (e.code === 'Space') {", "if (e.code === 'Space' && !e.target.closest?.('button, a')) {");
  replace('Math.abs(dx) < 24 && Math.abs(dy) < 24', 'Math.abs(dx) < 16 && Math.abs(dy) < 16');
  replace('if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) return die();', `if (modes[mode].wrap) {
      head.x = (head.x + COLS) % COLS;
      head.y = (head.y + ROWS) % ROWS;
    } else if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) return die();`);
  replace('if (applesEaten % 5 === 0) tickMs = Math.max(65, tickMs - 12); // speed up every 5 apples',
    'if (applesEaten % modes[mode].every === 0) tickMs = Math.max(modes[mode].floor, tickMs - modes[mode].step);');
  replace("localStorage.setItem(BEST_KEY, String(best))", "localStorage.setItem(bestKey(), String(best))");
  replace("    updateHud();\n  }\n\n  function die() {", `    updateHud();
    if (!apple) die(true);
  }

  function die(won) {${friendsPreview ? "\n    PHArcadeRoom.record('snake', speed === 'normal' ? mode : mode + '-' + speed, score);" : ''}
    document.getElementById('snake-win').hidden = !won;`);
  replace('<div class="medal" id="medal">🥉</div>', '<div class="medal" id="medal">🥉</div>\n    <strong id="snake-win" data-i18n="snake.won" hidden>Board cleared!</strong>');
  replace('    var pulse = 1 +', '    if (apple) {\n    var pulse = 1 +');
  replace('    // snake (gradient body)', '    }\n\n    // snake (gradient body)');
  return source;
}
