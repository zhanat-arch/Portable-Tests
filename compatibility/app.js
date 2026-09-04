import { pairCompatibility, soloCompatibility, signs } from './engine.mjs?v=1115';
import { buildPairNarrative, buildRankingDetail, narrativeUi } from './narratives.mjs?v=1115';
import { revealCalculatedResult, showCalculationLoader } from '../loader-overlay.js?v=1115';

const ONLINE=globalThis.PT_CONFIG?.onlineRoot||new URL('../',location.href).href;
const supported=['ru','kk','en','fr'];
const browserLang=(navigator.language||'ru').toLowerCase().split('-')[0];
let lang=localStorage.getItem('pt.lang')||(supported.includes(browserLang)?browserLang:'ru');
let tone=localStorage.getItem('pt.compatibility.tone')||'humor';
if(!['normal','humor'].includes(tone))tone='humor';
let L;
let mode='pair';
let resultData=null;
let verdictRevealed=false;

const glyph={aries:'♈',taurus:'♉',gemini:'♊',cancer:'♋',leo:'♌',virgo:'♍',libra:'♎',scorpio:'♏',sagittarius:'♐',capricorn:'♑',aquarius:'♒',pisces:'♓'};
const enc=value=>btoa(unescape(encodeURIComponent(JSON.stringify(value)))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const dec=value=>{try{return JSON.parse(decodeURIComponent(escape(atob(value.replaceAll('-','+').replaceAll('_','/')))))}catch{return null}};
let shared=dec(location.hash.startsWith('#r=')?location.hash.slice(3):'');
if(!['pair','solo'].includes(shared?.mode))shared=null;
if(shared&&supported.includes(shared.lang))lang=shared.lang;
if(shared&&['normal','humor'].includes(shared.tone))tone=shared.tone;

const $=selector=>document.querySelector(selector);
const app=$('#app');
const load=async code=>{try{return await fetch(`locales/${code}.json?v=1115`,{cache:'no-store'}).then(response=>response.json())}catch{return fetch('locales/ru.json?v=1115',{cache:'no-store'}).then(response=>response.json())}};
const f=(template,values={})=>Object.entries(values).reduce((value,[key,replacement])=>value.replaceAll(`{${key}}`,replacement),template);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const cleanName=value=>String(value||'').trim().replace(/\s+/g,' ').slice(0,32);
const ui=()=>narrativeUi(lang);

function track(name,extra={}){globalThis.ptAnalytics?.track?.(name,{module_id:'compatibility',...extra})}

function shell(body){
  app.innerHTML=`<header class="top"><a class="brand" href="../index.html"><span class="mark">P</span><span>${L.app}</span></a><div class="tools"><a class="home" href="../index.html">⌂ ${L.home}</a><select id="lang" aria-label="${L.language}">${supported.map(code=>`<option>${code.toUpperCase()}</option>`).join('')}</select></div></header>${body}`;
  $('#lang').value=lang.toUpperCase();
  $('#lang').onchange=async event=>{lang=event.target.value.toLowerCase();localStorage.setItem('pt.lang',lang);document.documentElement.lang=lang;L=await load(lang);render()};
}

function hero(){return `<section class="panel hero"><span class="badge">${L.badge}</span><h1>${L.title}</h1><p>${L.intro}</p><div class="hero-facts"><span>🔒 ${L.factLocal}</span><span>✦ ${L.factLayers}</span><span>✓ ${L.factScience}</span></div></section>`}

function research(){return `<section class="panel research"><div class="eyebrow">${L.researchKicker}</div><h2>${L.researchTitle}</h2><p>${L.researchIntro}</p><div class="fact"><b>10M+</b><div><strong>${L.voasTitle}</strong><p>${L.voasText}</p></div></div><div class="fact"><b>65K+</b><div><strong>${L.swedenTitle}</strong><p>${L.swedenText}</p></div></div><div class="fact"><b>↔</b><div><strong>${L.realTitle}</strong><p>${L.realText}</p></div></div><details><summary>${L.sources}</summary><ul><li><a href="https://magonia.com/wp-content/uploads/2018/04/voas-astrology.pdf" target="_blank" rel="noopener">${L.sourceVoas}</a></li><li><a href="https://link.springer.com/article/10.1186/s41118-020-00103-5" target="_blank" rel="noopener">${L.sourceSweden}</a></li><li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4298140/" target="_blank" rel="noopener">${L.sourceCommunication}</a></li></ul></details><p class="disclaimer">${L.researchLimit}</p></section>`}

function personForm(prefix,title,stored={}){const person=stored&&typeof stored==='object'?stored:{};return `<section class="person"><h2>${title}</h2><div class="field"><label for="${prefix}-name">${L.name}</label><input id="${prefix}-name" maxlength="32" autocomplete="off" placeholder="${L.namePlaceholder}" value="${esc(person.name||'')}"><small>${L.nameHint}</small></div><div class="field"><label for="${prefix}-birth">${L.birth} *</label><input id="${prefix}-birth" type="date" max="${new Date().toISOString().slice(0,10)}" value="${esc(person.birth||'')}"></div></section>`}

function intro(){
  const saved=(()=>{try{const value=JSON.parse(localStorage.getItem('pt.compatibility.form')||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return{}}})();
  shell(`${hero()}<div class="tabs"><button class="tab ${mode==='pair'?'active':''}" data-mode="pair">♡ ${L.pairMode}</button><button class="tab ${mode==='solo'?'active':''}" data-mode="solo">✦ ${L.soloMode}</button></div><section class="panel form-panel">${mode==='pair'?`<div class="form-grid">${personForm('a',L.personA,saved.a)}${personForm('b',L.personB,saved.b)}</div><div class="vs">${L.vs}</div>`:personForm('a',L.yourProfile,saved.a)}<div class="honesty">💡 ${L.honesty}</div><div class="privacy">🔒 ${L.privacy}</div><button class="primary wide" id="calculate">${mode==='pair'?L.calculatePair:L.calculateSolo}</button></section>${research()}`);
  document.querySelectorAll('.tab').forEach(button=>button.onclick=()=>{mode=button.dataset.mode;render()});
  $('#calculate').onclick=calculate;
}

async function calculate(){
  const a={name:cleanName($('#a-name').value),birth:$('#a-birth').value};
  const b=mode==='pair'?{name:cleanName($('#b-name').value),birth:$('#b-birth').value}:null;
  if(!a.birth||(mode==='pair'&&!b.birth))return toast(L.missing);
  localStorage.setItem('pt.compatibility.form',JSON.stringify({a,b}));
  verdictRevealed=false;
  if(mode==='pair'){
    const result=pairCompatibility(a.birth,b.birth);
    resultData={mode:'pair',names:[a.name||L.personA,b.name||L.personB],people:result.people,result};
  }else{
    const result=soloCompatibility(a.birth);
    resultData={mode:'solo',name:a.name||L.personA,person:result.person,result};
  }
  history.replaceState(null,'',location.pathname);
  trackMetric();track('compatibility_calculate',{calculation_mode:mode});
  await showCalculationLoader({kind:'compatibility',lang});
  render();
  revealCalculatedResult(app.querySelector('main'));
}

function toneControl(){
  const U=ui();
  return `<section class="tone-control" aria-label="${U.toneLabel}"><span>${U.toneLabel}</span><div class="tone-options"><button type="button" data-tone="normal" class="${tone==='normal'?'active':''}" aria-pressed="${tone==='normal'}">${U.normal}</button><button type="button" data-tone="humor" class="${tone==='humor'?'active':''}" aria-pressed="${tone==='humor'}">${U.humor}</button></div></section>`;
}

function bindTone(){
  document.querySelectorAll('[data-tone]').forEach(button=>button.onclick=()=>{tone=button.dataset.tone;localStorage.setItem('pt.compatibility.tone',tone);track('compatibility_tone',{tone});render()});
}

function socialProof(){return `<section class="card social-proof" id="social-proof" hidden data-metric="compatibility_calculated" data-min="100"><strong id="social-count"></strong><p>${L.socialPrivacy}</p></section>`}

function categoryCards(scores){
  const U=ui();
  return `<section class="card category-panel"><h2>${L.categoriesTitle}</h2><p class="muted">${U.details}</p><div class="category-list">${Object.entries(scores).map(([key,value])=>{const detail=buildRankingDetail({strongest:key,attention:key},lang,tone);return `<article class="category"><button type="button" class="category-button" data-category="${key}" aria-expanded="false"><span><strong>${L.categories[key]}</strong><small>${scoreMeaning(value)}</small></span><b>${value}%</b><span class="category-chevron">⌄</span><span class="track"><i style="width:${value}%"></i></span></button><div class="category-detail" hidden><p><b>${U.rankWhy}:</b> ${esc(detail.why)}</p><p><b>${U.rankRisk}:</b> ${esc(detail.risk)}</p><p><b>${U.rankTip}:</b> ${esc(detail.tip)}</p></div></article>`}).join('')}</div><details class="algorithm-note"><summary>${L.howRead}</summary><p>${L.howReadText}</p></details></section>`;
}

function scoreMeaning(value){
  const labels={ru:['требует внимания','есть точки настройки','хороший запас','одна из сильных зон'],kk:['назар аудару керек','баптайтын тұстары бар','жақсы қор бар','ең күшті тұстардың бірі'],en:['needs attention','has room to tune','a good reserve','one of your strongest areas'],fr:['demande de l’attention','peut encore s’ajuster','une bonne réserve','un de vos points forts']};
  return labels[lang][value<56?0:value<72?1:value<85?2:3];
}

function bindCategories(){
  document.querySelectorAll('.category-button').forEach(button=>button.onclick=()=>{const detail=button.closest('.category').querySelector('.category-detail'),open=detail.hidden;detail.hidden=!open;button.setAttribute('aria-expanded',String(open));if(open)track('compatibility_category_open',{category:button.dataset.category})});
}

function actions(payload,title,shareText){
  const U=ui(),url=`${ONLINE}compatibility/index.html#r=${enc(payload)}`;
  return `<div class="share-note">🔒 ${payload.mode==='pair'?U.shareSafe:U.shareSafeSolo}</div><div class="footer-actions"><button class="primary" id="share">${payload.mode==='pair'?U.sharePair:L.share}</button><button class="secondary" id="copy">${L.copy}</button><button class="secondary" id="again">${L.again}</button><a class="btn ghost" href="../index.html">${L.other}</a></div><span id="share-data" data-url="${esc(url)}" data-title="${esc(title)}" data-text="${esc(shareText)}"></span>`;
}

function verdictCard(narrative){
  const U=ui();
  return `<section class="panel verdict-shell ${verdictRevealed?'revealed':'locked'}"><div class="verdict-lock"><span>✦</span><strong>${verdictRevealed?U.unlocked:U.locked}</strong>${verdictRevealed?'':`<button class="primary" id="unlock-verdict">${U.unlock}</button>`}</div><div class="verdict-content" aria-hidden="${!verdictRevealed}"><div class="eyebrow">${tone==='humor'?U.humor:U.normal}</div><h2>${esc(narrative.headline)}</h2><p class="verdict-analysis">${esc(narrative.element)} ${esc(narrative.numbers)}</p><div class="verdict-grid"><article><span>✦</span><h3>${U.strength}</h3><p>${esc(narrative.strength)}</p></article><article><span>⚡</span><h3>${U.friction}</h3><p>${esc(narrative.friction)}</p></article><article><span>→</span><h3>${U.advice}</h3><p>${esc(narrative.advice)}</p></article></div></div></section>`;
}

function pairResult(){
  const data=resultData,[a,b]=data.names,result=data.result,[personA,personB]=result.people,U=ui();
  const narrative=buildPairNarrative(result,data.names,lang,tone);
  const payload={v:2,mode:'pair',lang,tone,names:data.names,people:result.people};
  shell(`<main>${toneControl()}<section class="panel result-head"><div class="eyebrow">${shared?L.sharedResult||L.pairResult:L.pairResult}</div><div class="ring" style="--score:${result.overall}"><strong>${result.overall}%</strong><small>${L.symbolicIndex}</small></div><h1>${esc(a)} + ${esc(b)}</h1><p class="result-lead">${f(L.pairLead,{a:esc(a),b:esc(b),strong:L.categories[result.strongest],attention:L.categories[result.attention]})}</p></section>${verdictCard(narrative)}<section class="system-grid"><article class="card"><div class="eyebrow">${L.zodiacTitle}</div><div class="system-score">${result.zodiac.overall}%</div><h3>${glyph[personA.sign]} ${L.signs[personA.sign]} + ${glyph[personB.sign]} ${L.signs[personB.sign]}</h3><p>${f(L.zodiacText,{signA:L.signs[personA.sign],elementA:L.elements[signs[personA.sign].element],signB:L.signs[personB.sign],elementB:L.elements[signs[personB.sign].element]})}</p><small>${L.systemIndex}</small></article><article class="card"><div class="eyebrow">${L.syutsaiTitle}</div><div class="system-score">${result.syutsai.overall}%</div><h3>${personA.consciousness} · ${L.numbers[personA.consciousness]} + ${personB.consciousness} · ${L.numbers[personB.consciousness]}</h3><p>${f(L.syutsaiText,{conA:personA.consciousness,conB:personB.consciousness,missionA:personA.mission,missionB:personB.mission})}</p><small>${L.systemIndex}</small></article></section>${categoryCards(result.scores)}${socialProof()}${research()}<section class="panel result-actions"><p class="disclaimer">${L.disclaimer}</p>${actions(payload,`${a} + ${b} · ${result.overall}%`,narrative.share)}</section></main>`);
  bindTone();bindCategories();
  if($('#unlock-verdict'))$('#unlock-verdict').onclick=()=>{verdictRevealed=true;track('compatibility_verdict_reveal',{tone});render()};
  bindActions();loadMetric();
}

function ranking(title,items,type){
  const U=ui();
  return `<section class="ranking"><h2>${title}</h2>${items.map((item,index)=>{const detail=buildRankingDetail(item,lang,tone);return `<details class="rank-item" ${index>=5?'hidden':''}><summary><span>${index+1}</span><span><strong>${type==='sign'?`${glyph[item.id]} ${L.signs[item.id]}`:`${item.id} · ${L.numbers[item.id]}`}</strong><small>${U.rankOpen}</small></span><b>${item.value}%</b></summary><div class="rank-detail"><p><b>${U.rankWhy}:</b> ${esc(detail.why)}</p><p><b>${U.rankRisk}:</b> ${esc(detail.risk)}</p><p><b>${U.rankTip}:</b> ${esc(detail.tip)}</p></div></details>`}).join('')}<button class="secondary rank-toggle">${L.showAll}</button></section>`;
}

function soloResult(){
  const data=resultData,result=data.result,person=result.person;
  const payload={v:2,mode:'solo',lang,tone,name:data.name,person};
  const shareText=`${L.signs[person.sign]} · ${L.consciousness} ${person.consciousness}: ${result.signRanking.slice(0,3).map(item=>L.signs[item.id]).join(', ')}.`;
  shell(`<main>${toneControl()}<section class="panel result-head"><div class="eyebrow">${L.soloResult}</div><div class="symbols">${glyph[person.sign]}</div><h1>${esc(data.name)}: ${L.signs[person.sign]} · ${person.consciousness}</h1><p class="result-lead">${f(L.soloLead,{name:esc(data.name)})}</p><div class="honesty">${L.namesDontScore}</div></section><section class="rankings">${ranking(L.signRanking,result.signRanking,'sign')}${ranking(L.numberRanking,result.numberRanking,'number')}</section>${socialProof()}${research()}<section class="panel result-actions"><p class="disclaimer">${L.disclaimer}</p>${actions(payload,`${data.name} · ${L.signs[person.sign]}`,shareText)}</section></main>`);
  bindTone();
  document.querySelectorAll('.rank-toggle').forEach(button=>button.onclick=()=>{const box=button.closest('.ranking'),extra=box.querySelectorAll('.rank-item[hidden]');if(extra.length){extra.forEach(item=>item.hidden=false);button.textContent=L.hideAll}else{box.querySelectorAll('.rank-item').forEach((item,index)=>{if(index>=5)item.hidden=true});button.textContent=L.showAll}});
  document.querySelectorAll('.rank-item').forEach(item=>item.addEventListener('toggle',()=>{if(item.open)track('compatibility_ranking_open')}));
  bindActions();loadMetric();
}

function bindActions(){
  const data=$('#share-data');
  $('#share').onclick=async()=>{track('compatibility_result_share',{share_kind:'pair_result'});if(navigator.share){try{await navigator.share({title:data.dataset.title,text:data.dataset.text,url:data.dataset.url});return}catch(error){if(error.name==='AbortError')return}}copy(`${data.dataset.text}\n${data.dataset.url}`)};
  $('#copy').onclick=()=>{track('compatibility_result_share',{share_kind:'copy'});copy(`${data.dataset.text}\n${data.dataset.url}`)};
  $('#again').onclick=()=>{history.replaceState(null,'',location.pathname);shared=null;resultData=null;verdictRevealed=false;render()};
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
async function copy(value){try{await navigator.clipboard.writeText(value)}catch{const input=document.createElement('textarea');input.value=value;input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.select();document.execCommand('copy');input.remove()}toast(L.copied)}
function toast(value){const element=$('#toast');element.textContent=value;element.classList.add('show');setTimeout(()=>element.classList.remove('show'),1800)}
function render(){document.documentElement.lang=lang;document.title=`${L.title} · PortHub`;if(shared&&!resultData)restoreShared();if(resultData?.mode==='pair')pairResult();else if(resultData?.mode==='solo')soloResult();else intro()}

load(lang).then(locale=>{L=locale;render()}).catch(error=>{
  console.error('Compatibility startup failed',error);
  app.innerHTML=`<main class="startup-error"><section class="panel"><span class="badge">PortHub</span><h1>Не удалось открыть расчёт</h1><p>Файлы страницы не загрузились полностью. Обновите страницу — введённые ранее данные останутся на этом устройстве.</p><button class="primary wide" type="button" id="startup-retry">Обновить страницу</button></section></main>`;
  document.querySelector('#startup-retry')?.addEventListener('click',()=>location.reload());
});
