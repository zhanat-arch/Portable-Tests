import { syutsaiCore, zodiacSign } from '../syutsai/engine.mjs';

export const ENGINE_VERSION = 'compatibility-symbolic-v1';
export const categories = ['communication','pace','closeness','daily','decisions'];

export const signs = {
  aries:{element:'fire',modality:'cardinal',traits:{communication:88,pace:92,closeness:58,daily:48,decisions:90}},
  taurus:{element:'earth',modality:'fixed',traits:{communication:58,pace:43,closeness:82,daily:88,decisions:62}},
  gemini:{element:'air',modality:'mutable',traits:{communication:94,pace:78,closeness:52,daily:42,decisions:72}},
  cancer:{element:'water',modality:'cardinal',traits:{communication:62,pace:48,closeness:94,daily:78,decisions:55}},
  leo:{element:'fire',modality:'fixed',traits:{communication:82,pace:74,closeness:76,daily:58,decisions:84}},
  virgo:{element:'earth',modality:'mutable',traits:{communication:68,pace:58,closeness:64,daily:94,decisions:76}},
  libra:{element:'air',modality:'cardinal',traits:{communication:92,pace:61,closeness:78,daily:66,decisions:57}},
  scorpio:{element:'water',modality:'fixed',traits:{communication:52,pace:56,closeness:96,daily:70,decisions:82}},
  sagittarius:{element:'fire',modality:'mutable',traits:{communication:80,pace:91,closeness:55,daily:38,decisions:78}},
  capricorn:{element:'earth',modality:'cardinal',traits:{communication:57,pace:63,closeness:65,daily:96,decisions:91}},
  aquarius:{element:'air',modality:'fixed',traits:{communication:86,pace:72,closeness:43,daily:58,decisions:81}},
  pisces:{element:'water',modality:'mutable',traits:{communication:64,pace:45,closeness:92,daily:50,decisions:48}}
};

export const numbers = {
  1:{traits:{communication:78,pace:90,closeness:54,daily:55,decisions:92}},
  2:{traits:{communication:88,pace:45,closeness:92,daily:74,decisions:48}},
  3:{traits:{communication:94,pace:75,closeness:70,daily:42,decisions:62}},
  4:{traits:{communication:57,pace:50,closeness:65,daily:96,decisions:86}},
  5:{traits:{communication:83,pace:94,closeness:48,daily:34,decisions:72}},
  6:{traits:{communication:80,pace:55,closeness:94,daily:88,decisions:60}},
  7:{traits:{communication:45,pace:42,closeness:58,daily:70,decisions:84}},
  8:{traits:{communication:68,pace:82,closeness:55,daily:90,decisions:96}},
  9:{traits:{communication:86,pace:60,closeness:88,daily:52,decisions:66}}
};

const elementBase = {
  fire:{fire:76,earth:60,air:84,water:55},
  earth:{fire:60,earth:80,air:58,water:84},
  air:{fire:84,earth:58,air:78,water:64},
  water:{fire:55,earth:84,air:64,water:81}
};
const modalityBase = {same:68,different:77};
const clamp = value => Math.max(32,Math.min(96,Math.round(value)));
const similarity = (a,b) => 100-Math.abs(a-b);

function traitScores(left,right,base=70){
  return Object.fromEntries(categories.map(category=>{
    const same=similarity(left.traits[category],right.traits[category]);
    const score=same*.64+base*.36;
    return[category,clamp(score)];
  }));
}

export function zodiacCompatibility(leftId,rightId){
  const left=signs[leftId],right=signs[rightId];
  if(!left||!right)throw new TypeError('Unknown zodiac sign');
  const element=elementBase[left.element][right.element];
  const modality=left.modality===right.modality?modalityBase.same:modalityBase.different;
  const base=element*.72+modality*.28;
  const scores=traitScores(left,right,base);
  const overall=clamp(categories.reduce((sum,key)=>sum+scores[key],0)/categories.length);
  return{overall,scores,elements:[left.element,right.element],modalities:[left.modality,right.modality]};
}

export function numberCompatibility(leftNumber,rightNumber){
  const left=numbers[leftNumber],right=numbers[rightNumber];
  if(!left||!right)throw new TypeError('Unknown number');
  const scores=traitScores(left,right,72);
  const overall=clamp(categories.reduce((sum,key)=>sum+scores[key],0)/categories.length);
  return{overall,scores,numbers:[Number(leftNumber),Number(rightNumber)]};
}

export function personFromBirth(birth){
  const core=syutsaiCore(birth);
  return{sign:zodiacSign(birth),consciousness:core.consciousness,mission:core.mission};
}

export function pairCompatibility(first,second){
  const a=typeof first==='string'?personFromBirth(first):first;
  const b=typeof second==='string'?personFromBirth(second):second;
  const zodiac=zodiacCompatibility(a.sign,b.sign);
  const consciousness=numberCompatibility(a.consciousness,b.consciousness);
  const mission=numberCompatibility(a.mission,b.mission);
  const numberScores=Object.fromEntries(categories.map(key=>[key,clamp(consciousness.scores[key]*.7+mission.scores[key]*.3)]));
  const numberOverall=clamp(consciousness.overall*.7+mission.overall*.3);
  const scores=Object.fromEntries(categories.map(key=>[key,clamp(zodiac.scores[key]*.55+numberScores[key]*.45)]));
  const overall=clamp(zodiac.overall*.55+numberOverall*.45);
  const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  return{version:ENGINE_VERSION,people:[a,b],overall,scores,zodiac,syutsai:{overall:numberOverall,scores:numberScores,consciousness,mission},strongest:ranked[0][0],attention:ranked.at(-1)[0]};
}

export function soloCompatibility(birth){
  const person=typeof birth==='string'?personFromBirth(birth):birth;
  const signRanking=Object.keys(signs).map(sign=>({id:sign,value:zodiacCompatibility(person.sign,sign).overall})).sort((a,b)=>b.value-a.value||a.id.localeCompare(b.id));
  const numberRanking=Object.keys(numbers).map(number=>({id:Number(number),value:numberCompatibility(person.consciousness,Number(number)).overall})).sort((a,b)=>b.value-a.value||a.id-b.id);
  return{version:ENGINE_VERSION,person,signRanking,numberRanking};
}
