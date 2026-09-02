import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dir = resolve(root, 'tests/quick');
const template = await readFile(resolve(dir, 'index.html'), 'utf8');
const library = (await readFile(resolve(dir, 'library.js'), 'utf8')).replaceAll('export const ', 'const ');
const app = (await readFile(resolve(dir, 'app.js'), 'utf8'))
  .replace("import{tests,funProfiles,gameGuide}from'./library.js';import'../../site-ui.js';", '');
const css = await readFile(resolve(root, 'tests/career/styles.css'), 'utf8');
const siteUi = await readFile(resolve(root, 'site-ui.js'), 'utf8');
const liveRoot = siteUi.match(/const PT_LIVE_ROOT = '([^']+)'/)?.[1];
if (!liveRoot) throw new Error('PT_LIVE_ROOT not found in site-ui.js');

const images = { team: 'hero-team.webp', decisions: 'hero-decisions.webp', environment: 'hero-environment.webp' };
const ids = ['team', 'decisions', 'environment', 'battery', 'tabs', 'animal', 'lifeAnimal', 'gamer'];

for (const id of ids) {
  let html = template
    .replace('<link rel="stylesheet" href="../career/styles.css">', `<style>${css}</style>`)
    .replace('<script type="module" src="app.js?v=183"></script>', `<script>${siteUi}\nglobalThis.PORTABLE_TEST_ID='${id}';${library}\n${app}</script>`)
    .replaceAll('../../index.html', liveRoot);

  if (id === 'lifeAnimal') {
    for (const name of ['wolf', 'fox', 'bear', 'dolphin']) {
      const file = `meme-life-${name}.webp`;
      const base64 = (await readFile(resolve(root, file))).toString('base64');
      html = html.replaceAll(`../../${file}`, `data:image/webp;base64,${base64}`);
    }
  }
  if (id === 'animal') {
    for (const name of ['cat', 'capybara', 'raccoon', 'owl']) {
      const file = `meme-animal-${name}.webp`;
      const base64 = (await readFile(resolve(root, file))).toString('base64');
      html = html.replaceAll(`../../${file}`, `data:image/webp;base64,${base64}`);
    }
  }
  if (images[id]) {
    const base64 = (await readFile(resolve(root, images[id]))).toString('base64');
    html = html.replace(`../../${images[id]}`, `data:image/webp;base64,${base64}`);
  }

  html = html.replace(/[ \t]+(?=\r?$)/gm, '');
  await writeFile(resolve(root, `downloads/${id}.html`), html, 'utf8');
  console.log(id, Buffer.byteLength(html));
}
