import assert from 'node:assert/strict';
import { categories, pairCompatibility, scoreBand, soloCompatibility, stableHash, zodiacCompatibility, numberCompatibility } from '../engine.mjs';

const pair=pairCompatibility('1990-04-12','1992-11-23');
assert.ok(pair.overall>=32&&pair.overall<=96);
assert.equal(categories.length,6);
assert.deepEqual(pairCompatibility('1990-04-12','1992-11-23').scores,pairCompatibility('1992-11-23','1990-04-12').scores);
assert.deepEqual(pairCompatibility('1990-04-12','1992-11-23').context,pairCompatibility('1992-11-23','1990-04-12').context);
assert.equal(zodiacCompatibility('aries','libra').overall,zodiacCompatibility('libra','aries').overall);
assert.equal(numberCompatibility(1,8).overall,numberCompatibility(8,1).overall);
assert.equal(soloCompatibility('1990-04-12').signRanking.length,12);
assert.equal(soloCompatibility('1990-04-12').numberRanking.length,9);
assert.ok(pair.context.variants.headline>=0&&pair.context.variants.headline<12);
assert.equal(stableHash('same pair'),stableHash('same pair'));
assert.equal(scoreBand(44),'fragile');
assert.equal(scoreBand(92),'rare');
console.log('OK: compatibility engine is deterministic, symmetric, and bounded');
