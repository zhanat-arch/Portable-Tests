import assert from 'node:assert/strict';
import { pairCompatibility, soloCompatibility, zodiacCompatibility, numberCompatibility } from '../engine.mjs';

const pair=pairCompatibility('1990-04-12','1992-11-23');
assert.ok(pair.overall>=32&&pair.overall<=96);
assert.deepEqual(pairCompatibility('1990-04-12','1992-11-23').scores,pairCompatibility('1992-11-23','1990-04-12').scores);
assert.equal(zodiacCompatibility('aries','libra').overall,zodiacCompatibility('libra','aries').overall);
assert.equal(numberCompatibility(1,8).overall,numberCompatibility(8,1).overall);
assert.equal(soloCompatibility('1990-04-12').signRanking.length,12);
assert.equal(soloCompatibility('1990-04-12').numberRanking.length,9);
console.log('OK: compatibility engine is deterministic, symmetric, and bounded');
