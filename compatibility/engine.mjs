import { syutsaiCore, zodiacSign } from '../syutsai/engine.mjs';

export const ENGINE_VERSION = 'compatibility-symbolic-v2';
export const categories = ['communication','emotions','daily','attraction','pace','repair'];

export const signs = {
  aries:{element:'fire',modality:'cardinal',traits:{communication:86,emotions:61,daily:46,attraction:92,pace:94,repair:72}},
  taurus:{element:'earth',modality:'fixed',traits:{communication:58,emotions:84,daily:92,attraction:78,pace:42,repair:66}},
  gemini:{element:'air',modality:'mutable',traits:{communication:96,emotions:55,daily:40,attraction:82,pace:82,repair:81}},
  cancer:{element:'water',modality:'cardinal',traits:{communication:64,emotions:96,daily:80,attraction:76,pace:47,repair:74}},
  leo:{element:'fire',modality:'fixed',traits:{communication:82,emotions:78,daily:57,attraction:95,pace:76,repair:67}},
  virgo:{element:'earth',modality:'mutable',traits:{communication:70,emotions:66,daily:96,attraction:57,pace:59,repair:83}},
  libra:{element:'air',modality:'cardinal',traits:{communication:94,emotions:80,daily:67,attraction:86,pace:62,repair:88}},
  scorpio:{element:'water',modality:'fixed',traits:{communication:53,emotions:97,daily:69,attraction:98,pace:55,repair:58}},
  sagittarius:{element:'fire',modality:'mutable',traits:{communication:81,emotions:57,daily:36,attraction:88,pace:95,repair:79}},
  capricorn:{element:'earth',modality:'cardinal',traits:{communication:59,emotions:67,daily:97,attraction:61,pace:64,repair:76}},
  aquarius:{element:'air',modality:'fixed',traits:{communication:89,emotions:45,daily:56,attraction:74,pace:73,repair:70}},
  pisces:{element:'water',modality:'mutable',traits:{communication:66,emotions:94,daily:49,attraction:83,pace:44,repair:77}}
};

export const numbers = {
  1:{traits:{communication:78,emotions:55,daily:57,attraction:88,pace:92,repair:64}},
  2:{traits:{communication:90,emotions:94,daily:76,attraction:72,pace:44,repair:91}},
  3:{traits:{communication:96,emotions:73,daily:43,attraction:86,pace:77,repair:82}},
  4:{traits:{communication:58,emotions:68,daily:98,attraction:55,pace:49,repair:74}},
  5:{traits:{communication:85,emotions:50,daily:33,attraction:94,pace:97,repair:70}},
  6:{traits:{communication:82,emotions:96,daily:90,attraction:80,pace:54,repair:88}},
  7:{traits:{communication:46,emotions:61,daily:71,attraction:64,pace:41,repair:62}},
  8:{traits:{communication:69,emotions:58,daily:92,attraction:77,pace:84,repair:68}},
  9:{traits:{communication:88,emotions:90,daily:54,attraction:82,pace:59,repair:86}}
};

const elementBase = {
  fire:{fire:76,earth:60,air:86,water:55},
  earth:{fire:60,earth:81,air:58,water:85},
  air:{fire:86,earth:58,air:79,water:65},
  water:{fire:55,earth:85,air:65,water:82}
};
const modalityBase = {same:68,different:78};
const categoryWeights={communication:.18,emotions:.18,daily:.15,attraction:.18,pace:.13,repair:.18};
const clamp = value => Math.max(28,Math.min(97,Math.round(value)));
const similarity = (a,b) => 100-Math.abs(a-b);
const pairCode=(a,b)=>[String(a),String(b)].sort().join('_');

export function scoreBand(score){
  if(score<45)return'fragile';
  if(score<56)return'contrast';
  if(score<67)return'sparks';
  if(score<76)return'workable';
  if(score<85)return'strong';
  if(score<92)return'close';
  return'rare';
}

export function stableHash(value){
  let hash=2166136261;
  for(const char of String(value)){hash^=char.codePointAt(0);hash=Math.imul(hash,16777619)}
  return hash>>>0;
}

function weightedOverall(scores){
  return clamp(categories.reduce((sum,key)=>sum+scores[key]*categoryWeights[key],0));
}

function traitScores(left,right,base=70,modality=72){
  return Object.fromEntries(categories.map(category=>{
    const same=similarity(left.traits[category],right.traits[category]);
    let score=same*.64+base*.36;
    if(category==='attraction')score=same*.42+base*.58+4;
    if(category==='emotions')score=same*.58+base*.42;
    if(category==='daily'||category==='pace')score=same*.72+base*.28;
    if(category==='repair')score=same*.52+base*.23+modality*.25;
    return[category,clamp(score)];
  }));
}

function rankedContext(scores){
  const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  return{strongest:ranked[0][0],attention:ranked.at(-1)[0],ranked};
}

export function zodiacCompatibility(leftId,rightId){
  const left=signs[leftId],right=signs[rightId];
  if(!left||!right)throw new TypeError('Unknown zodiac sign');
  const element=elementBase[left.element][right.element];
  const modality=left.modality===right.modality?modalityBase.same:modalityBase.different;
  const base=element*.72+modality*.28;
  const scores=traitScores(left,right,base,modality);
  const context=rankedContext(scores);
  return{overall:weightedOverall(scores),scores,elements:[left.element,right.element],elementPair:pairCode(left.element,right.element),modalities:[left.modality,right.modality],...context};
}

export function numberCompatibility(leftNumber,rightNumber){
  const left=numbers[leftNumber],right=numbers[rightNumber];
  if(!left||!right)throw new TypeError('Unknown number');
  const numericDistance=Math.abs(Number(leftNumber)-Number(rightNumber));
  const complementBase=76-Math.min(numericDistance,5)*1.5;
  const scores=traitScores(left,right,complementBase,74);
  const context=rankedContext(scores);
  return{overall:weightedOverall(scores),scores,numbers:[Number(leftNumber),Number(rightNumber)],numberPair:pairCode(leftNumber,rightNumber),...context};
}

export function personFromBirth(birth){
  const core=syutsaiCore(birth);
  return{sign:zodiacSign(birth),consciousness:core.consciousness,mission:core.mission};
}

function personCode(person){return`${person.sign}:${person.consciousness}:${person.mission}`}
function narrativeContext(people,scores,zodiac,consciousness,mission){
  const signature=people.map(personCode).sort().join('|');
  const seed=stableHash(signature);
  const ranked=rankedContext(scores);
  return{
    signature,seed,band:scoreBand(weightedOverall(scores)),elementPair:zodiac.elementPair,
    consciousnessPair:consciousness.numberPair,missionPair:mission.numberPair,
    strongest:ranked.strongest,attention:ranked.attention,
    variants:{headline:seed%12,analysis:Math.floor(seed/13)%12,advice:Math.floor(seed/157)%10,share:Math.floor(seed/1571)%8}
  };
}

export function pairCompatibility(first,second){
  const a=typeof first==='string'?personFromBirth(first):first;
  const b=typeof second==='string'?personFromBirth(second):second;
  const zodiac=zodiacCompatibility(a.sign,b.sign);
  const consciousness=numberCompatibility(a.consciousness,b.consciousness);
  const mission=numberCompatibility(a.mission,b.mission);
  const numberScores=Object.fromEntries(categories.map(key=>[key,clamp(consciousness.scores[key]*.72+mission.scores[key]*.28)]));
  const numberOverall=weightedOverall(numberScores);
  const scores=Object.fromEntries(categories.map(key=>[key,clamp(zodiac.scores[key]*.52+numberScores[key]*.48)]));
  const overall=weightedOverall(scores);
  const context=narrativeContext([a,b],scores,zodiac,consciousness,mission);
  context.band=scoreBand(overall);
  return{version:ENGINE_VERSION,people:[a,b],overall,scores,zodiac,syutsai:{overall:numberOverall,scores:numberScores,consciousness,mission},strongest:context.strongest,attention:context.attention,context};
}

export function soloCompatibility(birth){
  const person=typeof birth==='string'?personFromBirth(birth):birth;
  const signRanking=Object.keys(signs).map(sign=>{const match=zodiacCompatibility(person.sign,sign);return{id:sign,value:match.overall,strongest:match.strongest,attention:match.attention,elementPair:match.elementPair}}).sort((a,b)=>b.value-a.value||a.id.localeCompare(b.id));
  const numberRanking=Object.keys(numbers).map(number=>{const match=numberCompatibility(person.consciousness,Number(number));return{id:Number(number),value:match.overall,strongest:match.strongest,attention:match.attention,numberPair:match.numberPair}}).sort((a,b)=>b.value-a.value||a.id-b.id);
  return{version:ENGINE_VERSION,person,signRanking,numberRanking};
}
