import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const codes = ['ru', 'kk', 'en', 'fr'];
const fail = message => { throw new Error(message); };
const stableShape = value => {
  if (Array.isArray(value)) return [`array:${value.length}`, ...value.map(stableShape)];
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, stableShape(item)]));
  }
  return typeof value;
};

const locales = await Promise.all(codes.map(code => readFile(resolve(root, `horoscope/locales/${code}.json`), 'utf8').then(JSON.parse)));
const journals = await Promise.all(codes.map(code => readFile(resolve(root, `horoscope/locales/${code}.journal.json`), 'utf8').then(JSON.parse)));
const shape = JSON.stringify(stableShape(locales[0]));
locales.forEach((locale, index) => {
  JSON.stringify(stableShape(locale)) === shape || fail(`${codes[index]}: locale shape differs`);
  Object.keys(locale.zodiac).length === 12 || fail(`${codes[index]}: zodiac must contain 12 signs`);
  Object.keys(locale.planets).length === 10 || fail(`${codes[index]}: planets must contain 10 bodies`);
  Object.keys(locale.planetRoles).length === 10 || fail(`${codes[index]}: roles must contain 10 bodies`);
  Object.keys(locale.signStyles).length === 12 || fail(`${codes[index]}: sign styles must contain 12 signs`);
  locale.houseThemes.length === 12 || fail(`${codes[index]}: houses must contain 12 themes`);
  ['exact', 'approx', 'unknown'].every(key => locale.timeModes[key]) || fail(`${codes[index]}: time modes missing`);
  ['night', 'morning', 'day', 'evening'].every(key => /\d{2}:\d{2}/.test(locale.periods[key])) || fail(`${codes[index]}: explicit period ranges missing`);
});
const journalShape = JSON.stringify(stableShape(journals[0]));
journals.forEach((journal, index) => {
  JSON.stringify(stableShape(journal)) === journalShape || fail(`${codes[index]}: journal locale shape differs`);
  Object.keys(journal.signs).length === 12 || fail(`${codes[index]}: journal must contain 12 signs`);
  Object.keys(journal.donate).length === 12 || fail(`${codes[index]}: donation copy must contain 12 signs`);
  Object.values(journal.signs).every(sign => ['core', 'inner', 'outer', 'love', 'work', 'advice'].every(key => sign[key])) || fail(`${codes[index]}: journal sign text missing`);
  ['fallbackName', 'shareButton', 'sharePrivacy', 'ambassadorTitle', 'ambassadorText', 'ambassadorButton'].every(key => journal.ui[key]) || fail(`${codes[index]}: journal support UI missing keys`);
});

const [app, engine, page] = await Promise.all([
  readFile(resolve(root, 'horoscope/app.js'), 'utf8'),
  readFile(resolve(root, 'horoscope/engine.mjs'), 'utf8'),
  readFile(resolve(root, 'horoscope/index.html'), 'utf8')
]);
for (const item of ['buildNatalChart', 'buildPersonalForecasts', 'geocoding-api', 'pt.horoscope.location', 'pt.syutsai.name', 'navigator.geolocation', 'tile.openstreetmap.org', 'tzlookup', 'birth-map', 'position.stable === false', 'support-share', 'ambassador-note']) {
  app.includes(item) || fail(`horoscope app missing ${item}`);
}
for (const item of ['zonedLocalDate', 'GeoVector', 'Ecliptic', 'ascendantLongitude', 'wholeSignHouses', 'possibleAscendants', 'buildPersonalForecasts', 'YEARLY_BODIES']) {
  engine.includes(item) || fail(`horoscope engine missing ${item}`);
}
for (const asset of ['astronomy-engine-2.1.19.min.js', 'leaflet-1.9.4.css', 'leaflet-1.9.4.js', 'tz-lookup-6.1.25.js', 'journal.css?v=4', 'app.js?v=5']) {
  page.includes(asset) || fail(`horoscope page missing ${asset}`);
}
locales.some(locale => /полная карта.*готовится|full chart coming soon|carte complète bientôt|толық карта — жақында/i.test(JSON.stringify(locale))) && fail('stale horoscope placeholder copy remains');
console.log('OK: natal chart, exact-time UI regression, personal week/year, support footer, and four matching journal locales');
