import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const codes = ['ru', 'kk', 'en', 'fr'];
const fail = message => { throw new Error(message); };
const stableShape = value => Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, item && typeof item === 'object' && !Array.isArray(item) ? stableShape(item) : typeof item]));
const locales = await Promise.all(codes.map(code => readFile(resolve(root, `horoscope/locales/${code}.json`), 'utf8').then(JSON.parse)));
const shape = JSON.stringify(stableShape(locales[0]));
locales.forEach((locale, index) => {
  JSON.stringify(stableShape(locale)) === shape || fail(`${codes[index]}: locale shape differs`);
  Object.keys(locale.zodiac).length === 12 || fail(`${codes[index]}: zodiac must contain 12 signs`);
});
const app = await readFile(resolve(root, 'horoscope/app.js'), 'utf8');
app.includes("zodiacSign") || fail('date-based sign preview missing');
app.includes("pt.horoscope.place") || fail('birthplace local storage missing');
app.includes("../syutsai/") || fail('Syutsai navigation missing');
console.log('OK: horoscope placeholder, sign preview, local birth details, and four matching locales');
