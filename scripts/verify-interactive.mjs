import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const fail = message => { throw new Error(message); };
const read = path => readFile(resolve(root, path), 'utf8');

const [loader, dice, horoscope, syutsai, insight, dreams, registryText, sw] = await Promise.all([
  read('loader-overlay.js'), read('modules/dice-fate.html'), read('horoscope/app.js'),
  read('syutsai/app.js'), read('tests/insight/app.js'), read('astro/dreams/app.js'),
  read('tests-registry.json'), read('service-worker.js')
]);
const registry = JSON.parse(registryText);

for (const marker of ['duration=3000','setInterval','},800)','requestAnimationFrame','getContext(\'2d\')','prefers-reduced-motion','calculation-local']) {
  loader.includes(marker) || fail(`Loader missing ${marker}`);
}
for (const [name, source, kind] of [
  ['horoscope', horoscope, 'horoscope'], ['syutsai', syutsai, 'syutsai'],
  ['numerology', insight, 'numerology'], ['dreams', dreams, 'dreams']
]) {
  source.includes('loader-overlay.js') || fail(`${name}: loader import missing`);
  source.includes(`kind: '${kind}'`) || source.includes(`kind:'${kind}'`) || fail(`${name}: wrong loader profile`);
  source.includes('revealCalculatedResult') || fail(`${name}: result reveal missing`);
}
insight.includes("test.id==='numerology'") || fail('Loader must not delay every insight quiz');

for (const marker of ['transform-style:preserve-3d','crypto.getRandomValues','navigator.vibrate','devicemotion','DeviceMotionEvent.requestPermission','navigator.share','toDataURL(\'image/png\')','#r=','Символический шанс','Символдық мүмкіндік','Symbolic chance','Chance symbolique']) {
  dice.includes(marker) || fail(`Dice missing ${marker}`);
}
for (const language of ['ru:','kk:','en:','fr:']) dice.includes(language) || fail(`Dice missing ${language} locale`);

const item = registry.find(entry => entry.id === 'dice-of-fate');
item || fail('Dice is absent from registry');
item.path === './modules/dice-fate.html' || fail('Dice path is incorrect');
item.category === 'interactive' || fail('Dice category is incorrect');
item.metrics.rating === null && item.metrics.shareCount === null || fail('Do not publish invented dice metrics');

sw.includes("portable-tests-v1.9.1") || fail('PWA cache version was not bumped');
for (const asset of ['./loader-overlay.js','./modules/dice-fate.html']) sw.includes(asset) || fail(`PWA missing ${asset}`);
!registryText.includes('38.9k') && !registryText.includes('"rating":5') || fail('Invented metrics leaked into registry');

console.log('OK: local 3-second loader in 4 calculation flows, 3D dice, sharing, PNG, haptics, shake, privacy, and PWA assets');
