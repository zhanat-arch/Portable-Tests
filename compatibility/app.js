import { pairCompatibility, soloCompatibility, signs } from './engine.mjs';

const ONLINE='https://zhanat-arch.github.io/Portable-Tests/';
const SUPPORT={boosty:'https://boosty.to/zhanat-arch',kofi:'https://ko-fi.com/zhanat_arch'};
const supported=['ru','kk','en','fr'];
const browserLang=(navigator.language||'ru').toLowerCase().split('-')[0];
let lang=localStorage.getItem('pt.lang')||(supported.includes(browserLang)?browserLang:'ru');
let L;
let mode='pair';
let resultData=null;

const glyph={aries:'♈',taurus:'♉',gemini:'♊',cancer:'♋',leo:'♌',virgo:'♍',libra:'♎',scorpio:'♏',sagittarius:'♐',capricorn:'♑',aquarius:'♒',pisces:'♓'};
const enc=value=>btoa(unescape(encodeURIComponent(JSON.stringify(value)))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const dec=value=>{try{return JSON.parse(decodeURIComponent(escape(atob(value.replaceAll('-','+').replaceAll('_','/')))))}catch{return null}};
let shared=dec(location.hash.startsWith('#r=')?location.hash.slice(3):'');
if(!['pair','solo'].includes(shared?.mode))shared=null;
if(shared&&supported.includes(shared.lang))lang=shared.lang;

const $=selector=>document.querySelector(selector);
const app=$('#app');
const load=async code=>{try{return await fetch(`locales/${code}.json?v=180`,{cache:'no-store'}).then(response=>response.json())}catch{return fetch('locales/ru.json?v=180',{cache:'no-store'}).then(response=>response.json())}};
const f=(template,values={})=>Object.entries(values).reduce((value,[key,replacement])=>value.replaceAll(`{${key}}`,replacement),template);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const cleanName=value=>String(value||'').trim().replace(/\s+/g,' ').slice(0,32);

function shell(body){
  app.innerHTML=`<header class="top"><a class="brand" href="../index.html"><span class="mark">P</span><span>${L.app}</span></a><div class="tools"><a class="home" href="../index.html">⌂ ${L.home}</a><select id="lang" aria-label="${L.language}">${supported.map(code=>`<option>${code.toUpperCase()}</option>`).join('')}</select></div></header>${body}`;
  $('#lang').value=lang.toUpperCase();
  $('#lang').onchange=async event=>{lang=event.target.value.toLowerCase();localStorage.setItem('pt.lang',lang);document.documentElement.lang=lang;L=await load(lang);render()};
}

function hero(){return `<section class="panel hero"><span class="badge">${L.badge}</span><h1>${L.title}</h1><p>${L.intro}</p><div class="hero-facts"><span>🔒 ${L.factLocal}</span><span>✦ ${L.factLayers}</span><span>✓ ${L.factScience}</span></div></section>`}

function research(){return `<section class="panel research"><div class="eyebrow">${L.researchKicker}</div><h2>${L.researchTitle}</h2><p>${L.researchIntro}</p><div class="fact"><b>10M+</b><div><strong>${L.voasTitle}</strong><p>${L.voasText}</p></div></div><div class="fact"><b>65K+</b><div><strong>${L.swedenTitle}</strong><p>${L.swedenText}</p></div></div><div class="fact"><b>↔</b><div><strong>${L.realTitle}</strong><p>${L.realText}</p></div></div><details><summary>${L.sources}</summary><ul><li><a href="https://magonia.com/wp-content/uploads/2018/04/voas-astrology.pdf" target="_blank" rel="noopener">${L.sourceVoas}</a></li><li><a href="https://link.springer.com/article/10.1186/s41118-020-00103-5" target="_blank" rel="noopener">${L.sourceSweden}</a></li><li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4298140/" target="_blank" rel="noopener">${L.sourceCommunication}</a></li></ul></details><p class="disclaimer">${L.researchLimit}</p></section>`}

function personForm(prefix,title,stored={}){return `<section class="person"><h2>${title}</h2><div class="field"><label for="${prefix}-name">${L.name}</label><input id="${prefix}-name" maxlength="32" autocomplete="off" placeholder="${L.namePlaceholder}" value="${esc(stored.name||'')}"><small>${L.nameHint}</small></div><div class="field"><label for="${prefix}-birth">${L.birth} *</label><input id="${prefix}-birth" type="date" max="${new Date().toISOString().slice(0,10)}" value="${esc(stored.birth||'')}"></div></section>`}

function intro(){
  const saved=(()=>{try{return JSON.parse(localStorage.getItem('pt.compatibility.form')||'{}')}catch{return{}}})();
  shell(`${hero()}<div class="tabs"><button class="tab ${mode==='pair'?'active':''}" data-mode="pair">♡ ${L.pairMode}</button><button class="tab ${mode==='solo'?'active':''}" data-mode="solo">✦ ${L.soloMode}</button></div><section class="panel form-panel">${mode==='pair'?`<div class="form-grid">${personForm('a',L.personA,saved.a)}${personForm('b',L.personB,saved.b)}</div><div class="vs">${L.vs}</div>`:personForm('a',L.yourProfile,saved.a)}<div class="honesty">💡 ${L.honesty}</div><div class="privacy">🔒 ${L.privacy}</div><button class="primary wide" id="calculate">${mode==='pair'?L.calculatePair:L.calculateSolo}</button></section>${research()}`);
  document.querySelectorAll('.tab').forEach(button=>button.onclick=()=>{mode=button.dataset.mode;render()});
  $('#calculate').onclick=calculate;
}

function calculate(){
  const a={name:cleanName($('#a-name').value),birth:$('#a-birth').value};
  const b=mode==='pair'?{name:cleanName($('#b-name').value),birth:$('#b-birth').value}:null;
  if(!a.birth||(mode==='pair'&&!b.birth))return toast(L.missing);
  localStorage.setItem('pt.compatibility.form',JSON.stringify({a,b}));
  if(mode==='pair'){
    const result=pairCompatibility(a.birth,b.birth);
    resultData={mode:'pair',names:[a.name||L.personA,b.name||L.personB],people:result.people,result};
  }else{
    const result=soloCompatibility(a.birth);
    resultData={mode:'solo',name:a.name||L.personA,person:result.person,result};
  }
  history.replaceState(null,'',location.pathname);
  trackMetric();render();
}

function band(score){return score<56?'low':score<70?'mid':score<83?'good':'high'}
function socialProof(){return `<section class="card social-proof" id="social-proof" hidden data-metric="compatibility_calculated" data-min="100"><strong id="social-count"></strong><p>${L.socialPrivacy}</p></section>`}
function categoryBars(scores){return `<section class="card"><h2>${L.categoriesTitle}</h2><div class="category-list">${Object.entries(scores).map(([key,value])=>`<div class="category"><strong>${L.categories[key]}</strong><b>${value}%</b><div class="track"><i style="width:${value}%"></i></div></div>`).join('')}</div><details><summary>${L.howRead}</summary><p>${L.howReadText}</p></details></section>`}
function actions(payload,title,shareText){
  const url=`${ONLINE}compatibility/index.html#r=${enc(payload)}`;
  return `<div class="footer-actions"><button class="primary" id="share">${L.share}</button><button class="secondary" id="copy">${L.copy}</button><button class="secondary" id="again">${L.again}</button><a class="btn ghost" href="../index.html">${L.other}</a></div><div class="support"><button class="ghost" id="support">${L.support}</button></div><dialog id="dialog"><h2>${L.support}</h2><p>${L.supportText}</p><div class="footer-actions"><a class="btn primary" href="${SUPPORT.boosty}" target="_blank" rel="noopener">Boosty</a><a class="btn secondary" href="${SUPPORT.kofi}" target="_blank" rel="noopener">Ko-fi</a><button class="ghost" id="close">${L.close}</button></div></dialog><span id="share-data" data-url="${esc(url)}" data-title="${esc(title)}" data-text="${esc(shareText)}"></span>`;
}

function pairResult(){
  const data=resultData;
  const [a,b]=data.names;
  const result=data.result;
  const [personA,personB]=result.people;
  const lead=f(L.pairLead,{a:esc(a),b:esc(b),strong:L.categories[result.strongest],attention:L.categories[result.attention]});
  const payload={v:1,mode:'pair',lang,names:data.names,people:result.people};
  const shareText=`${a} + ${b}: ${result.overall}% — ${L.bands[band(result.overall)]}.`;
  shell(`<main><section class="panel result-head"><div class="eyebrow">${shared?L.sharedResult||L.pairResult:L.pairResult}</div><div class="ring" style="--score:${result.overall}"><strong>${result.overall}%</strong><small>${L.symbolicIndex}</small></div><h1>${esc(a)} + ${esc(b)}</h1><h2>${L.bands[band(result.overall)]}</h2><p class="result-lead">${lead}</p></section><section class="system-grid"><article class="card"><div class="eyebrow">${L.zodiacTitle}</div><div class="system-score">${result.zodiac.overall}%</div><h3>${glyph[personA.sign]} ${L.signs[personA.sign]} + ${glyph[personB.sign]} ${L.signs[personB.sign]}</h3><p>${f(L.zodiacText,{signA:L.signs[personA.sign],elementA:L.elements[signs[personA.sign].element],signB:L.signs[personB.sign],elementB:L.elements[signs[personB.sign].element]})}</p><small>${L.systemIndex}</small></article><article class="card"><div class="eyebrow">${L.syutsaiTitle}</div><div class="system-score">${result.syutsai.overall}%</div><h3>${personA.consciousness} · ${L.numbers[personA.consciousness]} + ${personB.consciousness} · ${L.numbers[personB.consciousness]}</h3><p>${f(L.syutsaiText,{conA:personA.consciousness,conB:personB.consciousness,missionA:personA.mission,missionB:personB.mission})}</p><small>${L.systemIndex}</small></article></section><section class="advice-grid"><article class="card"><div class="eyebrow">${L.strongTitle}</div><h2>${L.categories[result.strongest]}</h2><p>${L.strong[result.strongest]}</p></article><article class="card"><div class="eyebrow">${L.attentionTitle}</div><h2>${L.categories[result.attention]}</h2><p>${L.attention[result.attention]}</p></article></section>${categoryBars(result.scores)}${socialProof()}${research()}<section class="panel"><p class="disclaimer">${L.disclaimer}</p>${actions(payload,`${a} + ${b}`,shareText)}</section></main>`);
  bindActions();loadMetric();
}

function ranking(title,items,type){return `<section class="ranking"><h2>${title}</h2>${items.map((item,index)=>`<article class="rank-item" ${index>=5?'hidden':''}><span>${index+1}</span><div><strong>${type==='sign'?`${glyph[item.id]} ${L.signs[item.id]}`:`${item.id} · ${L.numbers[item.id]}`}</strong><small>${L.rankHint}</small></div><b>${item.value}%</b></article>`).join('')}<button class="secondary rank-toggle">${L.showAll}</button></section>`}
function soloResult(){
  const data=resultData,result=data.result,person=result.person;
  const payload={v:1,mode:'solo',lang,name:data.name,person};
  const shareText=`${L.signs[person.sign]} · ${L.consciousness} ${person.consciousness}: ${result.signRanking.slice(0,3).map(item=>L.signs[item.id]).join(', ')}.`;
  shell(`<main><section class="panel result-head"><div class="eyebrow">${L.soloResult}</div><div class="symbols" style="font-size:70px;margin:18px">${glyph[person.sign]}</div><h1>${esc(data.name)}: ${L.signs[person.sign]} · ${person.consciousness}</h1><p class="result-lead">${f(L.soloLead,{name:esc(data.name)})}</p><div class="honesty">${L.namesDontScore}</div></section><section class="rankings">${ranking(L.signRanking,result.signRanking,'sign')}${ranking(L.numberRanking,result.numberRanking,'number')}</section>${socialProof()}${research()}<section class="panel"><p class="disclaimer">${L.disclaimer}</p>${actions(payload,`${data.name} · ${L.signs[person.sign]}`,shareText)}</section></main>`);
  document.querySelectorAll('.rank-toggle').forEach(button=>button.onclick=()=>{const box=button.closest('.ranking'),extra=box.querySelectorAll('.rank-item[hidden]');if(extra.length){extra.forEach(item=>item.hidden=false);button.textContent=L.hideAll}else{box.querySelectorAll('.rank-item').forEach((item,index)=>{if(index>=5)item.hidden=true});button.textContent=L.showAll}});
  bindActions();loadMetric();
}

function bindActions(){
  const data=$('#share-data');
  $('#share').onclick=async()=>navigator.share?navigator.share({title:data.dataset.title,text:data.dataset.text,url:data.dataset.url}):copy(`${data.dataset.text}\n${data.dataset.url}`);
  $('#copy').onclick=()=>copy(`${data.dataset.text}\n${data.dataset.url}`);
  $('#again').onclick=()=>{history.replaceState(null,'',location.pathname);shared=null;resultData=null;render()};
  $('#support').onclick=()=>$('#dialog').showModal();$('#close').onclick=()=>$('#dialog').close();
}

function restoreShared(){
  if(!shared)return;
  if(shared.mode==='pair'&&Array.isArray(shared.people)&&shared.people.length===2){
    const names=(shared.names||[]).map(cleanName);resultData={mode:'pair',names:[names[0]||L.personA,names[1]||L.personB],people:shared.people,result:pairCompatibility(shared.people[0],shared.people[1])};
  }else if(shared.mode==='solo'&&shared.person){
    resultData={mode:'solo',name:cleanName(shared.name)||L.personA,person:shared.person,result:soloCompatibility(shared.person)};
  }else shared=null;
}

async function trackMetric(){
  const endpoint=globalThis.PORTABLE_METRICS_ENDPOINT;
  if(!endpoint)return;
  try{await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event:'compatibility_calculated'})})}catch{}
}
async function loadMetric(){
  const endpoint=globalThis.PORTABLE_METRICS_ENDPOINT,box=$('#social-proof');
  if(!endpoint||!box)return;
  try{const response=await fetch(`${endpoint}?event=compatibility_calculated`,{cache:'no-store'});const data=await response.json();const count=Number(data.count)||0;if(count>=100){$('#social-count').textContent=f(L.socialProof,{count:new Intl.NumberFormat(lang).format(count)});box.hidden=false}}catch{}
}
async function copy(value){await navigator.clipboard.writeText(value);toast(L.copied)}
function toast(value){const element=$('#toast');element.textContent=value;element.classList.add('show');setTimeout(()=>element.classList.remove('show'),1800)}
function render(){document.documentElement.lang=lang;if(shared&&!resultData)restoreShared();if(resultData?.mode==='pair')pairResult();else if(resultData?.mode==='solo')soloResult();else intro()}

L=await load(lang);render();
