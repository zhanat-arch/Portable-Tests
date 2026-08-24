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

const [app, engine, page] = await Promise.all([
  readFile(resolve(root, 'horoscope/app.js'), 'utf8'),
  readFile(resolve(root, 'horoscope/engine.mjs'), 'utf8'),
  readFile(resolve(root, 'horoscope/index.html'), 'utf8')
]);
for (const item of ['buildNatalChart', 'geocoding-api', 'pt.horoscope.location', 'navigator.geolocation', 'tile.openstreetmap.org', 'tzlookup', 'birth-map']) {
  app.includes(item) || fail(`horoscope app missing ${item}`);
}
for (const item of ['zonedLocalDate', 'GeoVector', 'Ecliptic', 'ascendantLongitude', 'wholeSignHouses', 'possibleAscendants']) {
  engine.includes(item) || fail(`horoscope engine missing ${item}`);
}
for (const asset of ['astronomy-engine-2.1.19.min.js', 'leaflet-1.9.4.css', 'leaflet-1.9.4.js', 'tz-lookup-6.1.25.js', 'app.js?v=2']) {
  page.includes(asset) || fail(`horoscope page missing ${asset}`);
}
locales.some(locale => /полная карта.*готовится|full chart coming soon|carte complète bientôt|толық карта — жақында/i.test(JSON.stringify(locale))) && fail('stale horoscope placeholder copy remains');
console.log('OK: full natal chart, exact and broad time modes, place search, map fallback, geolocation, and four matching locales');
