import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const test = resolve(root, 'tests/career');
let html = await readFile(resolve(test, 'index.html'), 'utf8');
const css = await readFile(resolve(test, 'styles.css'), 'utf8');
let data = await readFile(resolve(test, 'data.js'), 'utf8');
let app = await readFile(resolve(test, 'app.js'), 'utf8');
const siteUi = await readFile(resolve(root, 'site-ui.js'), 'utf8');
const liveRoot = siteUi.match(/const PT_LIVE_ROOT = '([^']+)'/)?.[1];
if (!liveRoot) throw new Error('PT_LIVE_ROOT not found in site-ui.js');

data = data.replace(/export const /g, 'const ');
app = app.replace(/^import[^\n]+\n/gm, '');
html = html
  .replace('<link rel="stylesheet" href="styles.css">', `<style>${css}</style>`)
  .replace('<script type="module" src="app.js"></script>', `<script>${siteUi}\n${data}\n${app}</script>`)
  .replace('<title>', '<!-- Полностью автономная версия: ответы не отправляются в сеть. -->\n<title>');

const heroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720"><defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#211d58"/><stop offset=".55" stop-color="#6654d8"/><stop offset="1" stop-color="#d56d9c"/></linearGradient><radialGradient id="g"><stop stop-color="#fff5ae"/><stop offset="1" stop-color="#fff5ae" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="720" fill="url(#b)"/><circle cx="245" cy="120" r="260" fill="url(#g)" opacity=".45"/><circle cx="1050" cy="650" r="330" fill="#ffbdd5" opacity=".18"/><g fill="none" stroke="#fff" stroke-opacity=".34" stroke-width="3"><path d="M160 520C310 380 410 430 520 290S770 160 1040 255"/><circle cx="160" cy="520" r="16"/><circle cx="520" cy="290" r="16"/><circle cx="1040" cy="255" r="16"/></g><g transform="translate(355 170)"><rect width="490" height="365" rx="42" fill="#17152d" fill-opacity=".78" stroke="#fff" stroke-opacity=".25"/><rect x="42" y="44" width="195" height="28" rx="14" fill="#fff" opacity=".9"/><rect x="42" y="94" width="360" height="14" rx="7" fill="#fff" opacity=".25"/><rect x="42" y="122" width="285" height="14" rx="7" fill="#fff" opacity=".18"/><g transform="translate(42 178)"><rect width="118" height="118" rx="25" fill="#ffd76f"/><path d="M31 82l27-31 20 20 22-30" fill="none" stroke="#33285f" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><circle cx="100" cy="41" r="8" fill="#33285f"/></g><g transform="translate(181 178)"><rect width="118" height="118" rx="25" fill="#8ee3ce"/><circle cx="59" cy="48" r="25" fill="#33285f"/><path d="M26 98c7-24 20-35 33-35s26 11 33 35" fill="#33285f"/></g><g transform="translate(320 178)"><rect width="118" height="118" rx="25" fill="#e6b1ff"/><path d="M30 84V56m29 28V34m29 50V46" stroke="#33285f" stroke-width="13" stroke-linecap="round"/></g></g><g fill="#fff" font-family="system-ui,sans-serif" font-weight="800"><text x="62" y="650" font-size="34" opacity=".9">42 действия · 7 направлений · ваша рабочая смесь</text></g></svg>`;
const hero = Buffer.from(heroSvg).toString('base64');
html = html
  .replace('../../hero-career.png', `data:image/svg+xml;base64,${hero}`)
  .replaceAll('../../index.html', liveRoot);

html = html.replace(/[ \t]+(?=\r?$)/gm, '');
await writeFile(resolve(root, 'downloads/career-interests.html'), html, 'utf8');
console.log('Built downloads/career-interests.html', Buffer.byteLength(html), 'bytes');
