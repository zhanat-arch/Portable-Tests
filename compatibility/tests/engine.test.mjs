import assert from 'node:assert/strict';
import { categories, pairCompatibility, scoreBand, soloCompatibility, stableHash, zodiacCompatibility, numberCompatibility } from '../engine.mjs';
import { buildPairNarrative, buildRankingDetail, narrativeUi } from '../narratives.mjs';

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
for(const language of ['ru','kk','en','fr']){
  assert.ok(narrativeUi(language).unlock);
  for(const tone of ['normal','humor']){
    const narrative=buildPairNarrative(pair,['Alex','Sam'],language,tone);
    for(const value of Object.values(narrative))assert.ok(String(value).length>0);
    const detail=buildRankingDetail({strongest:pair.strongest,attention:pair.attention},language,tone);
    assert.ok(detail.why&&detail.risk&&detail.tip);
  }
}
console.log('OK: compatibility engine is deterministic, symmetric, and bounded');
