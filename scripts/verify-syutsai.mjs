import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const app = await readFile(resolve(root, 'syutsai/app.js'), 'utf8');
const engine = await readFile(resolve(root, 'syutsai/engine.mjs'), 'utf8');
const locales = Object.fromEntries(await Promise.all(['ru', 'kk', 'en', 'fr'].map(async code => [code, JSON.parse(await readFile(resolve(root, `syutsai/locales/${code}.json`), 'utf8'))])));
const fail = message => { throw new Error(message); };

const shape = value => Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, item && typeof item === 'object' && !Array.isArray(item) ? shape(item) : Array.isArray(item) ? `array:${item.length}` : typeof item]));
const canonicalShape = JSON.stringify(shape(locales.ru));
for (const [code, locale] of Object.entries(locales)) {
  JSON.stringify(shape(locale)) === canonicalShape || fail(`${code}: locale shape differs from ru`);
  typeof locale.relationships === 'string' || fail(`${code}: relationships must be a title string`);
  typeof locale.relationLabels === 'object' || fail(`${code}: relationLabels must be an object`);
  Object.keys(locale.numberProfiles).length === 9 || fail(`${code}: nine number profiles required`);
  Object.values(locale.numberProfiles).every(profile => profile.simple) || fail(`${code}: plain-language number hints required`);
  Object.keys(locale.traitHints).length === 9 || fail(`${code}: nine trait hints required`);
  Object.keys(locale.zodiac).length === 12 || fail(`${code}: twelve zodiac labels required`);
  JSON.stringify(locale).includes('[object Object]') && fail(`${code}: object leaked into copy`);
}

app.includes('L.relationships') || fail('app does not use relationships title');
app.includes('L.relationLabels') || fail('app does not use relation labels');
app.includes('birthTime') || fail('optional birth time missing');
app.includes('pt.syutsai.name') || fail('optional name missing');
app.includes("location.hash.startsWith('#r=')") || fail('shared result fragment missing');
app.includes("test: 'syutsai'") || fail('shared result payload missing');
app.includes('weeklyDigest') || fail('plain-language weekly digest missing');
app.includes('scoreGuide') || fail('score explanation missing');
app.includes('../horoscope/') || fail('horoscope section link missing');
app.includes('birth, birthTime') && app.includes('portableForecast') || fail('portable forecast not generated');
engine.includes('consciousness: rootNumber(parsed.day)') || fail('consciousness formula missing');
engine.includes('birthTimeAffectsCore') && fail('runtime should not claim birth time changes core');

console.log('OK: four matching locales, readable relationship labels, 9 number profiles, optional name/time, shared result links, and date-based core');
