import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const fail = message => { throw new Error(message); };
const paths = {
  career:'tests/career/app.js', quick:'tests/quick/app.js', insight:'tests/insight/app.js', compatibility:'compatibility/app.js', dreams:'astro/dreams/app.js'
};
for (const [name, path] of Object.entries(paths)) {
  const source = await readFile(resolve(root, path), 'utf8');
  source.includes('#r=') || fail(`${name}: no result fragment`);
  source.includes('navigator.share') || fail(`${name}: Web Share missing`);
}
for (const name of ['career','quick','insight']) {
  const source = await readFile(resolve(root, paths[name]), 'utf8');
  source.includes("get('view')") || fail(`${name}: saved result cannot be opened directly`);
  source.includes("get('retake')") || fail(`${name}: retake route missing`);
}

const [home, sw, horoscope, registrySource, hubLocalesSource, siteUi, robots, sitemap] = await Promise.all([
  readFile(resolve(root, 'index.html'), 'utf8'),
  readFile(resolve(root, 'service-worker.js'), 'utf8'),
  readFile(resolve(root, 'horoscope/app.js'), 'utf8'),
  readFile(resolve(root, 'tests-registry.json'), 'utf8'),
  readFile(resolve(root, 'hub-locales.json'), 'utf8'),
  readFile(resolve(root, 'site-ui.js'), 'utf8'),
  readFile(resolve(root, 'robots.txt'), 'utf8'),
  readFile(resolve(root, 'sitemap.xml'), 'utf8')
]);
const registry = JSON.parse(registrySource);
const hubLocales = JSON.parse(hubLocalesSource);
const quickIndex = await readFile(resolve(root, 'tests/quick/index.html'), 'utf8');
const quickApp = await readFile(resolve(root, 'tests/quick/app.js'), 'utf8');
quickIndex.includes('app.js?v=183') || fail('quick tests are not using the current app');
!quickIndex.includes('app-1.4.4.js') || fail('quick tests still load the frozen legacy app');
for (const marker of ["launch.get('view')==='result'", "launch.get('retake')==='1'", 'step=test.questions.length']) quickApp.includes(marker) || fail(`quick saved-result routing missing ${marker}`);
for (const link of ['tests/career/index.html','test=strengths','test=trajectory','test=numerology','compatibility/','syutsai/','horoscope/','astro/dreams/','modules/dice-fate.html','test=team','test=decisions','test=environment','test=battery','test=tabs','test=animal','test=lifeAnimal','test=gamer']) {
  registry.some(item => item.path.includes(link)) || fail(`registry missing ${link}`);
}
home.includes('app.js?v=193') || fail('home does not load the dynamic hub');
!home.includes('<article class="card') || fail('home still contains hard-coded cards');
for (const lang of ['ru','kk','en','fr']) hubLocales[lang]?.viewResult && hubLocales[lang]?.retake || fail(`hub locale ${lang} is incomplete`);
!home.includes('Красивые игровые разборы') || fail('astrology catalog still uses playful wording');
sw.includes('portable-tests-v1.9.3') || fail('PWA cache not bumped to v1.9.3');
for (const asset of ['app.js','styles.css','tests-registry.json','hub-locales.json','astro/dreams/index.html','astro/dreams/app.js','astro/dreams/data/objects.json','astro/dreams/locales/kk.json']) sw.includes(asset) || fail(`PWA missing ${asset}`);
sw.includes('origin!==self.location.origin') || fail('cross-origin requests must bypass PWA cache');
horoscope.includes('navigator.geolocation') || fail('horoscope map has no geolocation fallback');
siteUi.includes('G-37RB6NC78X') || fail('GA4 measurement ID missing');
siteUi.includes('send_page_view:false') && siteUi.includes('ptSafePage()') || fail('GA4 page views are not privacy-sanitized');
for (const event of ['module_open','test_start','result_view','dream_interpret','dice_throw','app_install_click','result_share']) siteUi.includes(event) || fail(`GA4 event missing ${event}`);
home.includes('rel="canonical"') && home.includes('og-cover.webp') || fail('Home SEO metadata is incomplete');
robots.includes('sitemap.xml') && sitemap.includes('/astro/dreams/') && sitemap.includes('test=gamer') || fail('SEO discovery files are incomplete');
!sw.includes('./downloads/career-interests.html') || fail('PWA install still downloads standalone bundles eagerly');
console.log('OK: share links, dynamic registry hub, privacy-safe GA4 events, SEO discovery, and PWA v1.9.3');
