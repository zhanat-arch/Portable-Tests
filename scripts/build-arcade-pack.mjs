// Package the reviewed MIT arcade without its preview-only server or friends room.
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { terms } from '../workers/arcade-local/terms.mjs';
import { catalogCopy } from '../workers/arcade-local/catalog-copy.mjs';
import { gameCopy, sharedGameLabels } from '../workers/arcade-local/game-copy.mjs';
import { buildSnake } from './build-arcade-snake.mjs';
import { attachArcadeResult } from './arcade-results.mjs';
import { arcadeRules } from '../workers/game-api/arcade-rules.mjs';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, '_site/arcade-review');
const friendsPreview = process.argv.includes('--friends-preview');
const output = path.join(root, friendsPreview ? '_site/arcade-friends/games/arcade' : 'games/arcade');
const read = file => readFile(path.join(source, file), 'utf8');
async function write(file, contents) {
  const destination = path.join(output, file);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, contents.replaceAll('\r\n', '\n'));
}

const rawCatalog = await read('index.html');
const gameIds = [...rawCatalog.matchAll(/\{ id: '([a-z0-9-]+)',/g)].map(match => match[1]);
if (gameIds.length !== 47 || new Set(gameIds).size !== 47 || gameIds.includes('2048')) {
  throw Error('Unexpected reviewed game registry');
}
if (Object.keys(arcadeRules).length !== gameIds.length || gameIds.some(id => !Object.hasOwn(arcadeRules, id))) {
  throw Error('Arcade score rules do not match the catalog');
}
const release = '11721';
const directionalControls = {
  snake: 'keys', 'slide-puzzle': 'keys',
  'maze-muncher': '#pad', sokoban: '#dpad', 'cross-road': '#dpad'
};
const localCopy = Object.fromEntries(Object.entries(terms).map(([lang, labels]) => [
  lang, { ...labels, ...catalogCopy[lang], ...gameCopy[lang] }
]));
const snakeModeKeys = ['modeLabel', 'modeClassic', 'modeWrap', 'modeTurbo', 'won', 'startSpeed', 'speedSlow', 'speedNormal', 'speedFast', 'swipeZone'];
const snakeModeCopy = {
  ru: ['Режим', 'Классика · стены', 'Сквозные стены', 'Турбо · сквозные стены', 'Поле заполнено!', 'Скорость на старте', 'Медленная', 'Обычная', 'Быстрая', 'Свайпни для поворота'],
  kk: ['Режім', 'Классика · қабырғалар', 'Ашық шекара', 'Турбо · ашық шекара', 'Алаң толды!', 'Бастапқы жылдамдық', 'Баяу', 'Қалыпты', 'Жылдам', 'Бұрылу үшін сырғыт'],
  en: ['Mode', 'Classic · walls', 'Wraparound', 'Turbo · wraparound', 'Board cleared!', 'Starting speed', 'Slow', 'Normal', 'Fast', 'Swipe to steer'],
  fr: ['Mode', 'Classique · murs', 'Bords traversables', 'Turbo · bords traversables', 'Plateau rempli !', 'Vitesse de départ', 'Lente', 'Normale', 'Rapide', 'Balaye pour tourner']
};
const snakeLabels = lang => Object.fromEntries(snakeModeKeys.map((key, i) => ['snake.' + key, snakeModeCopy[lang][i]]));
const fleetSpacingCopy = {
  ru: 'Корабли не могут касаться друг друга даже по диагонали.',
  kk: 'Кемелер бір-біріне қиғашынан да жанаспауы керек.',
  en: 'Ships must have an empty gap, even diagonally.',
  fr: 'Les navires doivent être séparés, même en diagonale.'
};
Object.assign(localCopy.ru, snakeLabels('ru'));
Object.assign(localCopy.kk, snakeLabels('kk'));
const i18n = (await read('i18n.js'))
  .replace('var LANGS = [', 'var LANGS = [{code:"ru",short:"RU",name:"Русский"},{code:"kk",short:"KK",name:"Қазақша"},')
  .replace('var S = {', 'var S = {' + JSON.stringify(localCopy).slice(1, -1) + ',')
  .replace("normalize(global.localStorage.getItem(STORE_KEY))", "normalize(global.localStorage.getItem(STORE_KEY) || global.localStorage.getItem('pt.lang'))")
  .replace("global.localStorage.setItem(STORE_KEY, next);", "global.localStorage.setItem(STORE_KEY, next); if (['ru','kk','en','fr'].includes(next)) global.localStorage.setItem('pt.lang', next);")
  .replace("if (doc.getElementById('wg-lang')) return;", "if (doc.getElementById('catalog-lang') || doc.getElementById('wg-lang')) return;")
  .replace("a.href = '../';", "a.href = '../?lang=' + encodeURIComponent(lang);")
  .replace("existing.setAttribute('aria-label', lbl);", "existing.setAttribute('aria-label', lbl); existing.href = '../?lang=' + encodeURIComponent(lang);")
  .replace('var lang = fromQuery()', `Object.assign(S.en,${JSON.stringify({...catalogCopy.en,...snakeLabels('en')})},{"hub.about":"Free browser games under the MIT license. Game records are saved on this device."});
  Object.assign(S.fr,${JSON.stringify({...catalogCopy.fr,...snakeLabels('fr')})},{"hub.about":"Jeux gratuits sous licence MIT. Les records sont enregistrés sur cet appareil."});
  Object.entries(${JSON.stringify(fleetSpacingCopy)}).forEach(function(entry) {
    S[entry[0]]['battleship.tip'] += '<br>' + entry[1];
  });
  var sharedGameLabels = ${JSON.stringify(sharedGameLabels)};
  Object.entries(S.en).forEach(function(entry){
    var key = entry[0], labels = sharedGameLabels[entry[1]];
    if (!Array.isArray(labels)) return;
    if (!Object.hasOwn(S.ru,key)) S.ru[key] = labels[0];
    if (!Object.hasOwn(S.kk,key)) S.kk[key] = labels[1];
  });
  var lang = fromQuery()`);

const blockDropIcon = '<svg width="1em" height="1em" viewBox="0 0 48 48" aria-hidden="true" focusable="false" style="display:block"><g stroke="#d4bcff" stroke-width="1.25"><rect x="16.5" y="8.5" width="15" height="15" rx="3" fill="#b089ff"/><rect x="0.5" y="24.5" width="15" height="15" rx="3" fill="#9169ed"/><rect x="16.5" y="24.5" width="15" height="15" rx="3" fill="#7953d7"/><rect x="32.5" y="24.5" width="15" height="15" rx="3" fill="#9169ed"/></g></svg>';
const catalog = rawCatalog
  .replace(/(\{ id: 'block-drop',\s+icon: )'[^']*'/, (_, prefix) => prefix + JSON.stringify(blockDropIcon))
  .replace('</head>', `<link rel="canonical" href="https://porthub.fyi/games/arcade/"><link rel="stylesheet" href="catalog.css?v=${release}"></head>`)
  .replace('src="i18n.js"', `src="i18n.js?v=${release}"`)
  .replace('<div class="hero">', '<header class="topbar catalog-topbar"><a class="brand" href="../../">PortHub</a><select id="catalog-lang" aria-label="Language"></select></header><main><div class="hero">')
  .replace(/^\s*<div class="lang-slot" data-lang-switcher><\/div>\r?\n/m, '\n')
  .replace('<h1 data-i18n="hub.title">🎮 Web Games</h1>', '<h1 data-i18n="hub.title">Browser games</h1>')
  .replace(/<div class="contribute"[^>]*>[\s\S]*?<\/div>/, '')
  .replace('GitHub</a><br>', 'GitHub</a> · <a href="LICENSE" data-pt-keep-path>MIT</a>')
  .replace('<script type="application/ld+json"', '</main><script type="application/ld+json"')
  .replace("a.href = g.id + '/';", "a.href = g.id + '/?lang=' + encodeURIComponent(WG.current()); a.dataset.ptKeepPath = '';")
  .replace("var q = cat === 'All' ? location.pathname : location.pathname + '?cat=' + cat.toLowerCase();", "var q = new URL(location.href); q.hash = ''; if (cat === 'All') q.searchParams.delete('cat'); else q.searchParams.set('cat',cat.toLowerCase());")
  .replace('WG.onChange(renderAll);', `var select = document.getElementById('catalog-lang');
  WG.langs.forEach(function(option){ select.add(new Option(option.name,option.code)); });
  function syncPicker() {
    var code = WG.current();
    select.value = code;
    select.setAttribute('aria-label',t('common.language'));
    if (['ru','kk','en','fr'].includes(code)) {
      try { localStorage.setItem('pt.lang', code); } catch {}
    }
  }
  select.addEventListener('change',function(){ WG.setLang(select.value); });
  WG.onChange(function(){ syncPicker(); renderAll(); });
  syncPicker();`)
  .replace('<body>', '<body data-pt-scroll-top>')
  .replace('</body>', `<script src="../../site-ui.js?v=${release}"></script></body>`);

const css = await readFile(path.join(root, 'workers/arcade-local/catalog.css'), 'utf8');
const license = await read('LICENSE');
if (!license.startsWith('MIT License') || !license.includes('mashukui') ||
    /saveone\.pro|goatcounter|sendBeacon/i.test(catalog + i18n)) throw Error('Unexpected arcade sources');
await write('index.html', catalog);
const gameTools = await readFile(path.join(root, 'workers/arcade-local/game-tools.js'), 'utf8');
const friends = friendsPreview ? await readFile(path.join(root, 'workers/arcade-local/friends.js'), 'utf8') : '';
await write('i18n.js', i18n + '\n' + gameTools + (friends ? '\nwindow.PHArcadeRules = ' + JSON.stringify(arcadeRules) + ';\n' + friends : ''));
await write('catalog.css', css + '\nmain { width:100%; max-width:1100px }\n');
await write('LICENSE', license);
if (friendsPreview) {
  const sharedCss = await readFile(path.join(root, 'games/arcade/game-tools.css'), 'utf8');
  const friendsCss = await readFile(path.join(root, 'workers/arcade-local/friends.css'), 'utf8');
  await write('game-tools.css', sharedCss + '\n' + friendsCss);
  await write('catalog.css', css + '\nmain { width:100%; max-width:1100px }\n' + friendsCss);
}
for (const id of gameIds) {
  const file = id + '/index.html';
  let html = await read(file);
  if (/saveone\.pro|goatcounter|sendBeacon|XMLHttpRequest|serviceWorker/i.test(html) ||
      [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/gi)].some(match => match[1] !== '../i18n.js')) {
    throw Error('Unexpected scripts in ' + file);
  }
  const controls = directionalControls[id] ? ` data-ph-arrows="${directionalControls[id]}"` : '';
  if (id === 'snake') html = buildSnake(html, friendsPreview);
  else if (friendsPreview) html = attachArcadeResult(id, html);
  if (id === 'battleship') {
    // In single-board mode the CSS follows these classes, including after tab clicks.
    html = html.replace("    var single = boardsEl.classList.contains('mode-single');", `    boardsEl.classList.toggle('view-mine', view === 'mine');
    boardsEl.classList.toggle('view-enemy', view === 'enemy');
    var single = boardsEl.classList.contains('mode-single');`)
      .replace("if (rr >= N || cc >= N)", "if (rr < 0 || rr >= N || cc < 0 || cc >= N)")
      .replace(`function canPlace(f, cells) {
    for (var i = 0; i < cells.length; i++) if (f.grid[cells[i]]) return false;
    return true;
  }`, `function canPlace(f, cells, ship) {
    // Check the full ring around each segment without wrapping across rows.
    return cells.every(function (cell) {
      var row = Math.floor(cell / N), col = cell % N;
      for (var r = Math.max(0, row - 1); r <= Math.min(N - 1, row + 1); r++) {
        for (var c = Math.max(0, col - 1); c <= Math.min(N - 1, col + 1); c++) {
          var owner = f.grid[r * N + c];
          if (owner && owner !== ship.k) return false;
        }
      }
      return true;
    });
  }`)
      .replaceAll('canPlace(f, cells)', 'canPlace(f, cells, ship)')
      .replace('canPlace(fleets.mine, cells)', 'canPlace(fleets.mine, cells, ship)')
      .replace('    c = Math.min(c, N - ship.size);\n', '')
      .replace('c = Math.min(i % N, N - ship.size)', 'c = i % N')
      .replace("          setShip(fleets.mine, ship, r, Math.min(c, N - ship.size), dir);\n          selShip = Math.max(0, nextUnplaced());", `          if (setShip(fleets.mine, ship, r, c, dir)) {
            selShip = Math.max(0, nextUnplaced());
            setHint('');
          } else {
            setHint(t('battleship.badSpot'));
          }`)
      .replace('    }\n  }\n\n  // ===== 开火 =====', `      if (!done) {
        // Guaranteed layout for the five ships on this 10×10 board.
        clearFleet(f);
        f.ships.forEach(function (ship, index) { setShip(f, ship, index * 2, 0, 'h'); });
        return;
      }
    }
  }

  // ===== 开火 =====`);
  }
  if (id === 'tic-tac-toe') {
    html = html.replace("    for (var i = 0; i < 9; i++) {\n      var el = cells[i];", `    var result = over ? winnerOf(board) : null;
    for (var i = 0; i < 9; i++) {
      var el = cells[i];`)
      .replace("      el.disabled = over", "      if (result && result.line.indexOf(i) !== -1) el.classList.add('win');\n      el.disabled = over")
      .replace("    var line = [];\n", "")
      .replace("      line = w.line;\n", "")
      .replace(/      if \(w\.p === 'X'\) \{ s\.x\+\+; line\.forEach[^\n]+\n      else \{ s\.o\+\+; line\.forEach[^\n]+/, "      if (w.p === 'X') s.x++;\n      else s.o++;")
      // The board enables buttons based on whose turn it is.
      .replace("    renderBoard();\n    var w = winnerOf(board);", "    var w = winnerOf(board);")
      .replace("    turn = player === 'X' ? 'O' : 'X';\n    renderStatus();", "    turn = player === 'X' ? 'O' : 'X';\n    renderStatus();\n    renderBoard();");
  }
  await write(file, html.replace('src="../i18n.js"', `src="../i18n.js?v=${release}"`)
    .replace(/navigator\.clipboard && navigator\.clipboard\.writeText/g, 'window.PHArcadeShare')
    .replace(/navigator\.clipboard\.writeText\((full|txt)\)\.then\(done, /g, 'PHArcadeShare.score($1, done, ')
    .replace(/\b(url|u):\s*location\.href\b/g, '$1: PHArcadeShare.url()')
    .replace('</head>', `<link rel="stylesheet" href="../game-tools.css?v=${release}"></head>`)
    .replace('<body data-wg-home>', `<body data-wg-home data-ph-arcade data-ph-game="${id}"${controls}><header class="wg-tools ph-arcade-toolbar"></header>`)
    .replace('</body>', `<script src="../../../site-ui.js?v=${release}" data-pt-analytics-only></script></body>`)
    .replace(/(<a href="\.\.\/" data-i18n="common.moreGames">[^<]*<\/a>)/g, '$1 · <a href="../LICENSE">MIT</a>'));
}
const directories = (await readdir(output, { withFileTypes: true })).filter(entry => entry.isDirectory());
if (directories.some(entry => !gameIds.includes(entry.name))) throw Error('Unexpected existing arcade page');
console.log(`Packaged ${gameIds.length} games in games/arcade`);
