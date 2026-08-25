import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const fail = message => { throw new Error(message); };
const paths = {
  career:'tests/career/app.js', quick:'tests/quick/app.js', insight:'tests/insight/app.js', compatibility:'compatibility/app.js'
};
for (const [name, path] of Object.entries(paths)) {
  const source = await readFile(resolve(root, path), 'utf8');
  source.includes('#r=') || fail(`${name}: no result fragment`);
  source.includes('navigator.share') || fail(`${name}: Web Share missing`);
}

const [home, sw, horoscope] = await Promise.all([
  readFile(resolve(root, 'index.html'), 'utf8'),
  readFile(resolve(root, 'service-worker.js'), 'utf8'),
  readFile(resolve(root, 'horoscope/app.js'), 'utf8')
]);
for (const link of ['tests/career/index.html','test=strengths','test=trajectory','test=numerology','compatibility/','syutsai/','horoscope/','test=team','test=decisions','test=environment','test=battery','test=tabs','test=animal','test=lifeAnimal']) {
  home.includes(link) || fail(`home missing ${link}`);
}
sw.includes('portable-tests-v1.8.1') || fail('PWA cache not bumped to v1.8.1');
sw.includes('origin!==self.location.origin') || fail('cross-origin requests must bypass PWA cache');
horoscope.includes('navigator.geolocation') || fail('horoscope map has no geolocation fallback');
console.log('OK: share links, new catalog entries, and PWA v1.8.1');
