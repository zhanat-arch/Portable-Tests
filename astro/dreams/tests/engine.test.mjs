import assert from 'node:assert/strict';
import fs from 'node:fs';
import { decodeResult, encodeResult, interpretDream, searchObjects } from '../engine.mjs';

const read = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
const objects = read('../data/objects.json');
const rules = read('../data/rules.json');
const ru = read('../locales/ru.json');
const en = read('../locales/en.json');

assert.equal(objects.objects.length, 47, 'Expected a substantial object library');
assert.equal(searchObjects(objects.objects, 'собачка', 'ru')[0].id, 'dog');
assert.equal(searchObjects(objects.objects, 'snake', 'en')[0].id, 'snake');
assert.equal(searchObjects(objects.objects, 'по', 'ru').some((item) => item.id === 'train'), true);
assert.deepEqual(searchObjects(objects.objects, 'с', 'ru'), [], 'Search starts at two characters');

const selection = { objectId: 'dog', targetId: 'to_me', actionId: 'aggression', detailId: 'dark', emotionId: 'fear' };
const result = interpretDream(selection, objects, rules, ru, 'ru');
assert.equal(result.object.name, 'Собака');
assert.match(result.summary, /Собака/);
assert.match(result.summary, /доверие|преданность/);
assert.match(result.schools.islamic, /классическ/i);
assert.match(result.schools.psychology, /границ|давлен/i);
assert.match(result.schools.popular, /разговор|спор|новост/i);

const english = interpretDream({ ...selection, actionId: 'strange' }, objects, rules, en, 'en');
assert.equal(english.object.name, 'Dog');
assert.match(english.schools.psychology, /associations/i);

const encoded = encodeResult(selection, 'ru');
assert.deepEqual(decodeResult(encoded), { lang: 'ru', selection });
assert.equal(decodeResult('not-a-result'), null);

console.log('OK: 47 dream symbols, multilingual search, hybrid reading, and share links');
