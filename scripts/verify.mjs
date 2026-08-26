import { questions, scales, careers } from '../tests/career/data.js';
import { tests as quickTests, gameGuide } from '../tests/quick/library.js';
import { tests as insightTests } from '../tests/insight/data.js';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const fail = message => { throw new Error(message); };
const langs = ['ru','kk','en','fr'];
const root = resolve(import.meta.dirname, '..');

questions.length === 42 || fail('Expected 42 career questions');
new Set(questions.map(question => question.id)).size === 42 || fail('Career IDs must be unique');
careers.length >= 18 || fail('Career catalog is too small');
const careerCounts = Object.fromEntries(scales.map(scale => [scale, 0]));
for (const question of questions) {
  for (const lang of langs) question.text[lang]?.trim() || fail(`${question.id}: missing ${lang}`);
  const keys = Object.keys(question.weights);
  keys.length === 1 || fail(`${question.id}: career activity must measure one scale`);
  keys.forEach(scale => { scales.includes(scale) || fail(`${question.id}: unknown scale ${scale}`); careerCounts[scale] += 1; });
}
new Set(Object.values(careerCounts)).size === 1 || fail('Career scales have unequal question counts');

for (const [id, test] of Object.entries(insightTests)) {
  const counts = Object.fromEntries(Object.keys(test.scales).map(scale => [scale, 0]));
  test.questions.length === test.count || fail(`${id}: unexpected question count`);
  for (const question of test.questions) {
    for (const lang of langs) question.text[lang]?.trim() || fail(`${id}: missing ${lang}`);
    counts[question.scale] === undefined && fail(`${id}: unknown scale ${question.scale}`);
    counts[question.scale] += 1;
  }
  new Set(Object.values(counts)).size === 1 || fail(`${id}: scales have unequal exposure`);
}

for (const [id, test] of Object.entries(quickTests)) {
  test.questions.length >= 8 || fail(`${id}: too short`);
  for (const question of test.questions) {
    for (const lang of langs) question.text[lang]?.trim() || fail(`${id}: missing ${lang}`);
    test.scales[question.scale] || fail(`${id}: invalid scale`);
  }
  await stat(resolve(root, `downloads/${id}.html`));
}

for (const lang of langs) {
  const locale = JSON.parse(await readFile(resolve(root, `compatibility/locales/${lang}.json`), 'utf8'));
  Object.keys(locale.signs).length === 12 || fail(`compatibility ${lang}: missing signs`);
  Object.keys(locale.numbers).length === 9 || fail(`compatibility ${lang}: missing numbers`);
  const dreamLocale = JSON.parse(await readFile(resolve(root, `astro/dreams/locales/${lang}.json`), 'utf8'));
  dreamLocale.schoolTitles?.islamic || fail(`dreams ${lang}: missing Islamic tradition label`);
  dreamLocale.schoolTitles?.psychology || fail(`dreams ${lang}: missing psychology label`);
  dreamLocale.schoolTitles?.popular || fail(`dreams ${lang}: missing folk label`);
}

const dreamObjects = JSON.parse(await readFile(resolve(root, 'astro/dreams/data/objects.json'), 'utf8'));
dreamObjects.objects.length >= 80 || fail('dreams: object library is too small');
for (const object of dreamObjects.objects) for (const lang of langs) {
  object.name?.[lang]?.trim() || fail(`dreams ${object.id}: missing ${lang} name`);
  object.focus?.[lang]?.trim() || fail(`dreams ${object.id}: missing ${lang} focus`);
}
quickTests.gamer?.questions.length === 18 || fail('gamer: expected 18 situations');
gameGuide.games.length >= 15 || fail('gamer: game catalog is too small');
new Set(gameGuide.games.map(game => game.id)).size === gameGuide.games.length || fail('gamer: duplicate game IDs');

const sw = await readFile(resolve(root, 'service-worker.js'), 'utf8');
for (const asset of ['./app.js','./styles.css','./tests-registry.json','./hub-locales.json','./tests/insight/index.html','./compatibility/index.html','./compatibility/engine.mjs','./compatibility/locales/ru.json','./astro/dreams/index.html','./astro/dreams/data/objects.json','./og-cover.webp']) {
  sw.includes(asset) || fail(`PWA cache missing ${asset}`);
}
!sw.includes('./downloads/career-interests.html') || fail('Large standalone downloads must load on demand, not during PWA installation');
console.log(`OK: 42 balanced career activities, ${careers.length} careers, ${Object.keys(insightTests).length} insight tests, ${Object.keys(quickTests).length} quick tests, 4 compatibility locales`);
