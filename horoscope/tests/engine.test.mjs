import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { ascendantLongitude, buildNatalChart, buildPersonalForecasts, midheavenLongitude, signPosition, wholeSignHouses, zonedLocalDate } from '../engine.mjs';

const source = await readFile(new URL('../vendor/astronomy-engine-2.1.19.min.js', import.meta.url), 'utf8');
const context = {};
vm.runInNewContext(source, context);
const Astronomy = context.Astronomy;
assert.ok(Astronomy?.GeoVector, 'Astronomy Engine did not load');
const timezoneSource = await readFile(new URL('../vendor/tz-lookup-6.1.25.js', import.meta.url), 'utf8');
vm.runInNewContext(timezoneSource, context);
assert.equal(context.tzlookup(44.8528, 65.5092), 'Asia/Qyzylorda');

assert.equal(signPosition(0).id, 'aries');
assert.equal(signPosition(359.9).id, 'pisces');
assert.equal(wholeSignHouses(95)[0].sign, 'cancer');
assert.equal(wholeSignHouses(95)[11].sign, 'gemini');
assert.ok(Math.abs(ascendantLongitude(new Date('2000-01-01T12:00:00Z'), 0, 0, 0) - 90) < 0.001);
assert.ok(Math.abs(ascendantLongitude(new Date('2000-01-01T12:00:00Z'), 0, 0, 6) - 180) < 0.001);
assert.ok(Math.abs(midheavenLongitude(new Date('2000-01-01T12:00:00Z'), 0, 0)) < 0.001);

const location = { display: 'Qyzylorda, Kazakhstan', latitude: 44.8528, longitude: 65.5092, timezone: 'Asia/Qyzylorda' };
assert.equal(zonedLocalDate('1990-05-15', '14:30', location.timezone).matched, true);

const exact = buildNatalChart(Astronomy, { birth: '1990-05-15', mode: 'exact', exactTime: '14:30', location });
assert.equal(exact.positions.length, 10);
assert.equal(exact.positions.find(item => item.body === 'Sun').id, 'taurus');
assert.equal(exact.houses.length, 12);
assert.equal(exact.possibleAscendants.length, 1);
assert.equal(exact.precision, 'exact');
assert.ok(exact.aspects.length > 0);

const forecasts = buildPersonalForecasts(Astronomy, exact, new Date('2026-08-24T12:00:00Z'));
assert.equal(forecasts.week.start.slice(0, 10), '2026-08-24');
assert.equal(forecasts.week.end.slice(0, 10), '2026-08-30');
assert.ok(forecasts.week.events.length >= 1);
assert.ok(forecasts.week.events.every(event => event.date && event.transitBody && event.natalBody && event.aspect));
assert.equal(forecasts.year.year, 2026);
assert.ok(forecasts.year.events.length >= 1);
assert.ok(forecasts.year.events.every(event => ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].includes(event.transitBody)));

const approximate = buildNatalChart(Astronomy, { birth: '1990-05-15', mode: 'approx', period: 'morning', location });
assert.equal(approximate.samples.length, 3);
assert.equal(approximate.precision, 'range');
assert.ok(approximate.possibleAscendants.length >= 1);

const unknown = buildNatalChart(Astronomy, { birth: '1990-05-15', mode: 'unknown', location });
assert.equal(unknown.samples.length, 3);
assert.equal(unknown.ascendant, null);
assert.equal(unknown.houses, null);
assert.equal(unknown.precision, 'dateOnly');

console.log('OK: natal chart, exact mode, time ranges, weekly transits, and yearly transit timeline');
