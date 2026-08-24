import assert from 'node:assert/strict';
import { rootNumber, isoWeek, hash, syutsaiCore, cycles, birthRhythm, zodiacSign, buildForecast } from '../engine.mjs';

assert.equal(rootNumber(199), 1);
assert.deepEqual(isoWeek(new Date('2021-01-01T12:00:00Z')), { year: 2020, week: 53 });
assert.equal(hash('same'), hash('same'));
assert.notEqual(hash('same'), hash('other'));

const core = syutsaiCore('1990-01-28');
assert.equal(core.consciousness, 1, '28 => consciousness number 1');
assert.equal(core.mission, 3, 'all birth-date digits => mission number 3');
assert.equal(core.matrix.counts[1], 2);
assert.ok(core.matrix.missing.includes(4));
assert.throws(() => syutsaiCore('2026-02-30'), /Invalid birth date/);

assert.equal(cycles('2000-02-29', new Date('2026-01-01T12:00:00Z')).isoYear, 2026);
assert.deepEqual(birthRhythm('08:35'), { hour: 8, minute: 35, period: 'morning' });
assert.equal(birthRhythm(''), null);
assert.equal(birthRhythm('25:00'), null);
assert.equal(zodiacSign('1990-08-24'), 'virgo');
assert.equal(zodiacSign('1990-08-22'), 'leo');

const noTime = buildForecast({ birth: '1990-01-01', traits: {} });
assert.equal(noTime.rhythm, null);
assert.equal(noTime.profile.hasTestProfile, false);
assert.deepEqual(noTime.profile.signals, []);

const fixtures = Array.from({ length: 20 }, (_, index) => ({
  input: {
    birth: `19${70 + index}-0${index % 9 + 1}-${String(index % 27 + 1).padStart(2, '0')}`,
    birthTime: index % 2 ? '18:45' : '',
    now: new Date('2026-08-24T12:00:00Z'),
    traits: {
      analytical: (index * 17) % 101,
      social: (index * 31) % 101,
      enterprising: (index * 43) % 101,
      organizing: (index * 11) % 101
    }
  }
}));

fixtures.forEach(fixture => {
  const result = buildForecast(fixture.input);
  assert.ok(result.week.tags.length);
  assert.ok(result.week.work >= 3 && result.week.work <= 10);
  assert.equal(result.profile.signals.length, 4);
  assert.equal(JSON.stringify(result), JSON.stringify(buildForecast(fixture.input)), 'forecast must be deterministic');
});

console.log('OK: Syutsai core, matrix, birth time, zodiac, ISO week, and 20 deterministic forecasts');
