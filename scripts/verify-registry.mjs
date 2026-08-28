import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const fail = message => { throw new Error(message); };
const langs = ['ru','kk','en','fr'];
const registry = JSON.parse(await readFile(resolve(root, 'tests-registry.json'), 'utf8'));
const locales = JSON.parse(await readFile(resolve(root, 'hub-locales.json'), 'utf8'));
const home = await readFile(resolve(root, 'index.html'), 'utf8');
const app = await readFile(resolve(root, 'app.js'), 'utf8');
const styles = await readFile(resolve(root, 'styles.css'), 'utf8');

registry.length >= 16 || fail('Registry lost catalog entries');
new Set(registry.map(item => item.id)).size === registry.length || fail('Registry IDs must be unique');
const categories = new Set(registry.map(item => item.category));
for (const category of ['astro','career','psychology','fun','interactive','games']) categories.has(category) || fail(`Missing category ${category}`);

for (const item of registry) {
  item.path?.startsWith('./') || fail(`${item.id}: invalid path`);
  item.icon || fail(`${item.id}: missing icon`);
  for (const lang of langs) {
    item.title?.[lang]?.trim() || fail(`${item.id}: missing ${lang} title`);
    item.description?.[lang]?.trim() || fail(`${item.id}: missing ${lang} description`);
    item.time?.[lang]?.trim() || fail(`${item.id}: missing ${lang} time`);
    item.tags?.[lang]?.length || fail(`${item.id}: missing ${lang} tags`);
  }
  for (const key of ['isViralTop','isPopular','isNew','rating','shareCount']) key in item.metrics || fail(`${item.id}: missing metric ${key}`);
  if (item.image) await stat(resolve(root, item.image.replace(/^\.\//,'')));
}

for (const lang of langs) {
  locales[lang] || fail(`Missing hub locale ${lang}`);
  for (const category of categories) locales[lang].categories?.[category] || fail(`${lang}: missing category ${category}`);
}

/app\.js\?v=\d+/.test(home) || fail('Dynamic app is not loaded');
home.includes('name="color-scheme" content="light"') || fail('Hub must declare a stable light color scheme');
!home.includes('<article') || fail('Cards must not be hard-coded in HTML');
for (const marker of ['tests-registry.json','setTimeout(() => { state.limit = 9; renderContent(); renderSuggestions(); }, 100)','data-bottom','data-drawer','showMore']) app.includes(marker) || fail(`Hub app missing ${marker}`);
for (const marker of ['color-scheme:only light','--muted:#575264','.update-button{display:inline-flex']) styles.includes(marker) || fail(`Mobile contrast fix missing ${marker}`);
registry.every(item => item.metrics.rating === null && item.metrics.shareCount === null) || fail('Do not publish invented ratings or share counts');

console.log(`OK: ${registry.length} registry modules, ${categories.size} dynamic categories, 4 locales, search, filters, drawer, and mobile nav`);
