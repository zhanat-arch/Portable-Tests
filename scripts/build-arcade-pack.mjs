// Package the reviewed MIT arcade without its preview-only server or friends room.
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { terms } from '../workers/arcade-local/terms.mjs';
import { catalogCopy } from '../workers/arcade-local/catalog-copy.mjs';
import { gameCopy, sharedGameLabels } from '../workers/arcade-local/game-copy.mjs';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, '_site/arcade-review');
const output = path.join(root, 'games/arcade');
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
const release = '11714';
const localCopy = Object.fromEntries(Object.entries(terms).map(([lang, labels]) => [
  lang, { ...labels, ...catalogCopy[lang], ...gameCopy[lang] }
]));
const i18n = (await read('i18n.js'))
  .replace('var LANGS = [', 'var LANGS = [{code:"ru",short:"RU",name:"Русский"},{code:"kk",short:"KK",name:"Қазақша"},')
  .replace('var S = {', 'var S = {' + JSON.stringify(localCopy).slice(1, -1) + ',')
  .replace("normalize(global.localStorage.getItem(STORE_KEY))", "normalize(global.localStorage.getItem(STORE_KEY) || global.localStorage.getItem('pt.lang'))")
  .replace("global.localStorage.setItem(STORE_KEY, next);", "global.localStorage.setItem(STORE_KEY, next); if (['ru','kk','en','fr'].includes(next)) global.localStorage.setItem('pt.lang', next);")
  .replace("if (doc.getElementById('wg-lang')) return;", "if (doc.getElementById('catalog-lang') || doc.getElementById('wg-lang')) return;")
  .replace("a.href = '../';", "a.href = '../?lang=' + encodeURIComponent(lang);")
  .replace("existing.setAttribute('aria-label', lbl);", "existing.setAttribute('aria-label', lbl); existing.href = '../?lang=' + encodeURIComponent(lang);")
  .replace('var lang = fromQuery()', `Object.assign(S.en,${JSON.stringify(catalogCopy.en)},{"hub.about":"Free browser games under the MIT license. Game records are saved on this device."});
  Object.assign(S.fr,${JSON.stringify(catalogCopy.fr)},{"hub.about":"Jeux gratuits sous licence MIT. Les records sont enregistrés sur cet appareil."});
  var sharedGameLabels = ${JSON.stringify(sharedGameLabels)};
  Object.entries(S.en).forEach(function(entry){
    var key = entry[0], labels = sharedGameLabels[entry[1]];
    if (!Array.isArray(labels)) return;
    if (!Object.hasOwn(S.ru,key)) S.ru[key] = labels[0];
    if (!Object.hasOwn(S.kk,key)) S.kk[key] = labels[1];
  });
  var lang = fromQuery()`);

const catalog = rawCatalog
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
  .replace('</body>', '<script src="../../site-ui.js?v=11715"></script></body>');

const css = await readFile(path.join(root, 'workers/arcade-local/catalog.css'), 'utf8');
const license = await read('LICENSE');
if (!license.startsWith('MIT License') || !license.includes('mashukui') ||
    /saveone\.pro|goatcounter|sendBeacon/i.test(catalog + i18n)) throw Error('Unexpected arcade sources');
await write('index.html', catalog);
await write('i18n.js', i18n);
await write('catalog.css', css + '\nmain { width:100%; max-width:1100px }\n');
await write('LICENSE', license);
for (const id of gameIds) {
  const file = id + '/index.html';
  const html = await read(file);
  if (/saveone\.pro|goatcounter|sendBeacon|XMLHttpRequest|serviceWorker/i.test(html) ||
      [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/gi)].some(match => match[1] !== '../i18n.js')) {
    throw Error('Unexpected scripts in ' + file);
  }
  await write(file, html.replace('src="../i18n.js"', `src="../i18n.js?v=${release}"`)
    .replace(/(<a href="\.\.\/" data-i18n="common.moreGames">[^<]*<\/a>)/g, '$1 · <a href="../LICENSE">MIT</a>'));
}
const directories = (await readdir(output, { withFileTypes: true })).filter(entry => entry.isDirectory());
if (directories.some(entry => !gameIds.includes(entry.name))) throw Error('Unexpected existing arcade page');
console.log(`Packaged ${gameIds.length} games in games/arcade`);
