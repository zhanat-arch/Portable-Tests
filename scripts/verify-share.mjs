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
for (const name of ['career','quick','insight']) {
  const source = await readFile(resolve(root, paths[name]), 'utf8');
  source.includes("get('view')") || fail(`${name}: saved result cannot be opened directly`);
  source.includes("get('retake')") || fail(`${name}: retake route missing`);
}

const [home, sw, horoscope] = await Promise.all([
  readFile(resolve(root, 'index.html'), 'utf8'),
  readFile(resolve(root, 'service-worker.js'), 'utf8'),
  readFile(resolve(root, 'horoscope/app.js'), 'utf8')
]);
const quickIndex = await readFile(resolve(root, 'tests/quick/index.html'), 'utf8');
const quickApp = await readFile(resolve(root, 'tests/quick/app.js'), 'utf8');
quickIndex.includes('app.js?v=183') || fail('quick tests are not using the current app');
!quickIndex.includes('app-1.4.4.js') || fail('quick tests still load the frozen legacy app');
for (const marker of ["launch.get('view')==='result'", "launch.get('retake')==='1'", 'step=test.questions.length']) quickApp.includes(marker) || fail(`quick saved-result routing missing ${marker}`);
for (const link of ['tests/career/index.html','test=strengths','test=trajectory','test=numerology','compatibility/','syutsai/','horoscope/','test=team','test=decisions','test=environment','test=battery','test=tabs','test=animal','test=lifeAnimal']) {
  home.includes(link) || fail(`home missing ${link}`);
}
for (const marker of ['progressTests','complete-pill','viewResult','retake']) home.includes(marker) || fail(`home missing completion marker ${marker}`);
!home.includes('Красивые игровые разборы') || fail('astrology catalog still uses playful wording');
sw.includes('portable-tests-v1.8.3') || fail('PWA cache not bumped to v1.8.3');
sw.includes('origin!==self.location.origin') || fail('cross-origin requests must bypass PWA cache');
horoscope.includes('navigator.geolocation') || fail('horoscope map has no geolocation fallback');
console.log('OK: share links, saved results, current quick-test app, and PWA v1.8.3');

