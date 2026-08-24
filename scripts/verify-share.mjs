import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const fail = message => { throw new Error(message); };
const [career, quick, home, sw, horoscope] = await Promise.all([
  readFile(resolve(root, 'tests/career/app.js'), 'utf8'),
  readFile(resolve(root, 'tests/quick/app.js'), 'utf8'),
  readFile(resolve(root, 'index.html'), 'utf8'),
  readFile(resolve(root, 'service-worker.js'), 'utf8'),
  readFile(resolve(root, 'horoscope/app.js'), 'utf8')
]);

for (const [source, name] of [[career, 'career'], [quick, 'quick']]) {
  source.includes('#r=') || fail(`${name}: no result fragment`);
  source.includes('sharedResult') || fail(`${name}: no shared result view`);
  source.includes('url:resultUrl') || fail(`${name}: Web Share does not use result URL`);
  source.includes('RESULT_UI') || fail(`${name}: no result navigation`);
}

home.includes('syutsai/') || fail('home missing syutsai');
home.includes('horoscope/') || fail('home missing horoscope');
for (const link of ['tests/career/index.html', 'test=team', 'test=decisions', 'test=environment', 'test=battery', 'test=tabs', 'test=animal', 'test=lifeAnimal']) {
  home.includes(link) || fail(`home missing ${link}`);
}
home.includes('Карта, неделя и год уже работают') || fail('home does not advertise the live forecasts');
sw.includes('portable-tests-v1.7.0') || fail('PWA cache not bumped');
for (const asset of ['./horoscope/index.html', './horoscope/journal.css', './horoscope/engine.mjs', './horoscope/locales/ru.journal.json', './horoscope/locales/kk.journal.json', './horoscope/locales/en.journal.json', './horoscope/locales/fr.journal.json', './horoscope/vendor/astronomy-engine-2.1.19.min.js', './horoscope/vendor/leaflet-1.9.4.js', './horoscope/vendor/tz-lookup-6.1.25.js']) {
  sw.includes(asset) || fail(`PWA cache missing ${asset}`);
}
sw.includes('origin!==self.location.origin') || fail('cross-origin map/search requests must bypass PWA cache');
horoscope.includes('navigator.geolocation') || fail('horoscope map has no geolocation fallback');
horoscope.includes('support-share') || fail('horoscope support footer has no sharing action');
console.log('OK: result links, shared cards, live personal forecasts, eight catalog entries, and PWA v1.7.0');
