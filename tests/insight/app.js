import { tests } from './data.js';

const ONLINE = 'https://zhanat-arch.github.io/Portable-Tests/';
const SUPPORT = { boosty: 'https://boosty.to/zhanat-arch', kofi: 'https://ko-fi.com/zhanat_arch' };
const supported = ['ru','kk','en','fr'];
const browserLang = (navigator.language || 'ru').toLowerCase().split('-')[0];
let lang = localStorage.getItem('pt.lang') || (supported.includes(browserLang) ? browserLang : 'ru');
const id = new URLSearchParams(location.search).get('test') || 'strengths';
const test = tests[id] || tests.strengths;
let answers = read(`pt.insight.${test.id}.answers`);
let at = 0;
let screen = 'intro';

const enc = value => btoa(unescape(encodeURIComponent(JSON.stringify(value)))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const dec = value => { try { return JSON.parse(decodeURIComponent(escape(atob(value.replaceAll('-','+').replaceAll('_','/'))))); } catch { return null; } };
let shared = dec(location.hash.startsWith('#r=') ? location.hash.slice(3) : '');
if (shared?.test === test.id && shared.scores) { lang = supported.includes(shared.lang) ? shared.lang : lang; screen = 'result'; }
else shared = null;

const I = {
  ru:{app:'Portable Tests',home:'На главную',private:'Ответы и дата остаются на этом устройстве',start:'Начать',items:'вопросов',back:'Назад',next:'Дальше',of:'из',questionNote:'Насколько это похоже на вас в реальной жизни?',answers:['Почти никогда','Редко','По-разному','Часто','Почти всегда'],result:'Ваш результат',shared:'С вами поделились результатом',blend:'Главное сочетание',strength:'Как это помогает',shadow:'Где нужен баланс',environment:'Подходящая среда',experiment:'Проверка в реальности',stack:'Ваш рабочий набор',read:'Как читать результат',readText:'Проценты отражают только ваши ответы внутри этого теста. Они не сравнивают вас с другими и не измеряют интеллект.',show:'Показать все проценты',hide:'Скрыть проценты',date:'Дата рождения',dateHint:'Нужна только для игрового числа; в ссылку результата дата не попадает.',dateCode:'Число даты',behavior:'Что показали ответы без даты',dateLayer:'Дата добавила 20% игрового веса этому направлению.',missingDate:'Укажите дату рождения',share:'Поделиться результатом',copy:'Скопировать ссылку',copied:'Ссылка результата скопирована',again:'Пройти заново',other:'Другие тесты',support:'☕ Поддержать разработчика',supportText:'Все результаты открыты бесплатно. Если тест оказался полезным, можно угостить разработчика кофе или поделиться приложением.',close:'Закрыть',entertainment:'РАЗВЛЕКАТЕЛЬНЫЙ СЛОЙ',serious:'ДЛЯ САМОРЕФЛЕКСИИ'},
  kk:{app:'Portable Tests',home:'Басты бет',private:'Жауап пен күн осы құрылғыда қалады',start:'Бастау',items:'сұрақ',back:'Артқа',next:'Әрі қарай',of:'/',questionNote:'Бұл нақты өмірде сізге қаншалықты ұқсайды?',answers:['Ешқашан дерлік','Сирек','Әртүрлі','Жиі','Әрқашан дерлік'],result:'Сіздің нәтижеңіз',shared:'Сізбен нәтижені бөлісті',blend:'Негізгі үйлесім',strength:'Қалай көмектеседі',shadow:'Қай жерде теңгерім керек',environment:'Қолайлы орта',experiment:'Нақты тексеріс',stack:'Жұмыс жинағыңыз',read:'Нәтижені қалай оқу керек',readText:'Пайыздар тек осы тесттегі жауаптарыңызды көрсетеді. Олар өзгелермен салыстырмайды және интеллектті өлшемейді.',show:'Барлық пайызды көрсету',hide:'Пайызды жасыру',date:'Туған күн',dateHint:'Тек ойын саны үшін керек; нәтиже сілтемесіне күн кірмейді.',dateCode:'Күн саны',behavior:'Күнсіз жауап нәтижесі',dateLayer:'Күн бұл бағытқа 20% ойын салмағын қосты.',missingDate:'Туған күнді көрсетіңіз',share:'Нәтижемен бөлісу',copy:'Сілтемені көшіру',copied:'Нәтиже сілтемесі көшірілді',again:'Қайта өту',other:'Басқа тесттер',support:'☕ Әзірлеушіні қолдау',supportText:'Барлық нәтиже тегін. Пайдалы болса, кофемен қолдаңыз немесе қолданбамен бөлісіңіз.',close:'Жабу',entertainment:'ОЙЫН-САУЫҚ ҚАБАТЫ',serious:'ӨЗІН ТАНУ ҮШІН'},
  en:{app:'Portable Tests',home:'Home',private:'Answers and date stay on this device',start:'Start',items:'questions',back:'Back',next:'Next',of:'of',questionNote:'How often is this true of you in real life?',answers:['Almost never','Rarely','It varies','Often','Almost always'],result:'Your result',shared:'Someone shared this result with you',blend:'Leading blend',strength:'How it helps',shadow:'Where balance helps',environment:'A fitting environment',experiment:'Reality check',stack:'Your working stack',read:'How to read the result',readText:'Percentages summarize your answers inside this quiz. They do not compare you with others or measure intelligence.',show:'Show all percentages',hide:'Hide percentages',date:'Birth date',dateHint:'Used only for the playful number; the date is not included in a shared result link.',dateCode:'Birth-date number',behavior:'What answers showed without the date',dateLayer:'The date added a 20% playful weight to this direction.',missingDate:'Enter a birth date',share:'Share result',copy:'Copy result link',copied:'Result link copied',again:'Take again',other:'Other tests',support:'☕ Support the developer',supportText:'Every result stays free. If this helped, buy the developer a coffee or share the app.',close:'Close',entertainment:'ENTERTAINMENT LAYER',serious:'FOR SELF-REFLECTION'},
  fr:{app:'Portable Tests',home:'Accueil',private:'Les réponses et la date restent sur cet appareil',start:'Commencer',items:'questions',back:'Retour',next:'Suivant',of:'sur',questionNote:'À quelle fréquence cela vous ressemble-t-il dans la vie réelle ?',answers:['Presque jamais','Rarement','Cela dépend','Souvent','Presque toujours'],result:'Votre résultat',shared:'Ce résultat a été partagé avec vous',blend:'Combinaison principale',strength:'Comment cela aide',shadow:'Où chercher l’équilibre',environment:'Environnement favorable',experiment:'Test dans la réalité',stack:'Votre ensemble de forces',read:'Comment lire le résultat',readText:'Les pourcentages résument vos réponses dans ce test. Ils ne vous comparent pas aux autres et ne mesurent pas l’intelligence.',show:'Afficher tous les pourcentages',hide:'Masquer les pourcentages',date:'Date de naissance',dateHint:'Utilisée seulement pour le nombre ludique ; elle n’entre pas dans le lien partagé.',dateCode:'Nombre de naissance',behavior:'Ce que montrent les réponses sans la date',dateLayer:'La date a ajouté un poids ludique de 20 % à cette direction.',missingDate:'Indiquez une date de naissance',share:'Partager le résultat',copy:'Copier le lien',copied:'Lien du résultat copié',again:'Recommencer',other:'Autres tests',support:'☕ Soutenir le développeur',supportText:'Tous les résultats restent gratuits. Si ce test vous aide, offrez un café au développeur ou partagez l’application.',close:'Fermer',entertainment:'COUCHE DIVERTISSANTE',serious:'POUR RÉFLÉCHIR SUR SOI'}
};

const $ = selector => document.querySelector(selector);
const app = $('#app');
const t = () => I[lang];
const text = value => value?.[lang] || value?.ru || '';
const itemCount = count => {
  if (lang !== 'ru') return `${count} ${t().items}`;
  const tail = count % 100;
  const word = tail >= 11 && tail <= 14 ? 'вопросов' : count % 10 === 1 ? 'вопрос' : count % 10 >= 2 && count % 10 <= 4 ? 'вопроса' : 'вопросов';
  return `${count} ${word}`;
};
function read(key){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return{}}}

function shell(body){
  app.innerHTML=`<header class="top"><a class="brand" href="../../index.html"><span class="mark">P</span><span>${t().app}</span></a><div class="tools"><a class="home" href="../../index.html">⌂ ${t().home}</a><select id="lang" aria-label="Language">${supported.map(code=>`<option>${code.toUpperCase()}</option>`).join('')}</select></div></header>${body}`;
  $('#lang').value=lang.toUpperCase();
  $('#lang').onchange=event=>{lang=event.target.value.toLowerCase();localStorage.setItem('pt.lang',lang);document.documentElement.lang=lang;render()};
}

function intro(){
  const date=localStorage.getItem(`pt.insight.${test.id}.birth`)||'';
  shell(`<main class="card"><section class="hero"><span class="badge">${test.entertainment?t().entertainment:t().serious}</span><div class="hero-icon">${test.icon}</div><h1>${text(test.title)}</h1><p class="lead">${text(test.intro)}</p></section><div class="meta"><span class="pill">${itemCount(test.questions.length)}</span><span class="pill">${text(test.badge)}</span></div>${test.dateRequired?`<div class="date-box"><label for="birth">${t().date}</label><input id="birth" type="date" value="${date}" max="${new Date().toISOString().slice(0,10)}"><small>${t().dateHint}</small></div>`:''}<div class="privacy">🔒 ${t().private}</div><div class="actions"><button class="primary" id="start">${t().start} →</button></div><p class="disclaimer">${text(test.disclaimer)}</p></main>`);
  $('#start').onclick=()=>{
    if(test.dateRequired){const birth=$('#birth').value;if(!birth)return toast(t().missingDate);localStorage.setItem(`pt.insight.${test.id}.birth`,birth)}
    at=firstMissing();screen='quiz';render();
  };
}
function firstMissing(){const index=test.questions.findIndex((_,i)=>answers[i]===undefined);return index<0?0:index}
function quiz(){
  const question=test.questions[at],value=answers[at],percent=Math.round(at/test.questions.length*100);
  shell(`<main class="card"><div class="progress-row"><span>${at+1} ${t().of} ${test.questions.length}</span><span>${percent}%</span></div><div class="track"><i style="width:${percent}%"></i></div><p class="question-note">${t().questionNote}</p><h2 class="question">${text(question.text)}</h2><div class="answers">${t().answers.map((label,index)=>`<button class="answer ${value===index?'selected':''}" data-value="${index}"><b>${index+1}</b><span>${label}</span></button>`).join('')}</div><div class="nav"><button class="secondary" id="back" ${at===0?'disabled':''}>← ${t().back}</button><button class="primary" id="next" ${value===undefined?'disabled':''}>${t().next} →</button></div></main>`);
  document.querySelectorAll('.answer').forEach(button=>button.onclick=()=>{answers[at]=Number(button.dataset.value);localStorage.setItem(`pt.insight.${test.id}.answers`,JSON.stringify(answers));quiz()});
  $('#back').onclick=()=>{if(at>0){at-=1;render()}};
  $('#next').onclick=()=>{if(at===test.questions.length-1){screen='result'}else at+=1;render()};
}
function rootNumber(birth){let value=String(birth).replace(/\D/g,'').split('').reduce((sum,digit)=>sum+Number(digit),0);while(value>9)value=String(value).split('').reduce((sum,digit)=>sum+Number(digit),0);return value||9}
function calculate(){
  const scaleIds=Object.keys(test.scales),sum=Object.fromEntries(scaleIds.map(key=>[key,0])),max=Object.fromEntries(scaleIds.map(key=>[key,0]));
  test.questions.forEach((question,index)=>{sum[question.scale]+=(answers[index]??2);max[question.scale]+=4});
  const base=Object.fromEntries(scaleIds.map(key=>[key,Math.round(sum[key]/max[key]*100)]));
  const dateNumber=test.dateRequired?String(rootNumber(localStorage.getItem(`pt.insight.${test.id}.birth`))):null;
  const scores=Object.fromEntries(scaleIds.map(key=>[key,test.dateRequired?Math.round(base[key]*.8+(key===dateNumber?20:0)):base[key]]));
  return{base,scores,dateNumber};
}
function scoreData(){return shared?{scores:shared.scores,base:shared.base||shared.scores,dateNumber:shared.dateNumber||null}:calculate()}
function result(){
  const data=scoreData();
  const ranked=Object.entries(data.scores).map(([id,value])=>({id,value:Number(value),profile:test.scales[id]})).sort((a,b)=>b.value-a.value);
  const [top,second]=ranked,showCount=test.id==='strengths'?5:3;
  const payload={v:1,test:test.id,lang,scores:data.scores,base:data.base,dateNumber:data.dateNumber};
  const url=`${ONLINE}tests/insight/index.html?test=${test.id}#r=${enc(payload)}`;
  const shareText=`${text(test.title)}: ${text(top.profile.title)} + ${text(second.profile.title)}`;
  shell(`<main class="card"><section class="result-head"><div class="eyebrow">${shared?t().shared:(test.entertainment?t().entertainment:t().serious)}</div><div class="symbols">${top.profile.emoji} ${second.profile.emoji}</div><h1>${text(top.profile.title)} + ${text(second.profile.title)}</h1><p class="lead">${text(top.profile.lead)} ${text(second.profile.lead)}</p></section>
    ${test.dateRequired&&data.dateNumber?`<section class="block date-code"><div class="date-number">${data.dateNumber}</div><div><div class="eyebrow">${t().dateCode}</div><h2>${text(test.scales[data.dateNumber].title)}</h2><p>${t().dateLayer}</p></div></section>`:''}
    <section class="feature"><div class="eyebrow">${t().blend}</div><h2>${text(top.profile.label)} × ${text(second.profile.label)}</h2><p>${text(top.profile.lead)} ${text(second.profile.lead)}</p><div class="quote">${text(top.profile.joke)}</div></section>
    <div class="grid"><section class="mini"><h3>✦ ${t().strength}</h3><p>${text(top.profile.strength)} ${text(second.profile.strength)}</p></section><section class="mini"><h3>⚖ ${t().shadow}</h3><p>${text(top.profile.shadow)} ${text(second.profile.shadow)}</p></section><section class="mini"><h3>☀ ${t().environment}</h3><p>${text(top.profile.environment)} ${text(second.profile.environment)}</p></section><section class="mini"><h3>→ ${t().experiment}</h3><p>${text(top.profile.experiment)} ${text(second.profile.experiment)}</p></section></div>
    <section class="block"><h2>${t().stack}</h2>${test.dateRequired?`<p>${t().behavior}</p>`:''}<div class="stack">${ranked.slice(0,showCount).map(item=>`<article class="stack-item"><span>${item.profile.emoji}</span><div><h3>${text(item.profile.label)}</h3><p>${text(item.profile.areas)}</p></div><b>${data.base[item.id]}%</b></article>`).join('')}</div></section>
    <section class="block"><h2>${t().read}</h2><p>${t().readText}</p><button class="secondary" id="toggle">${t().show}</button><div class="scores" id="scores">${ranked.map(item=>`<div class="score"><strong>${item.profile.emoji} ${text(item.profile.label)}</strong><b>${item.value}%</b><div class="bar"><i style="width:${item.value}%;background:${item.profile.color}"></i></div></div>`).join('')}</div></section>
    <p class="disclaimer">${text(test.disclaimer)}</p><div class="footer-actions"><button class="primary" id="share">${t().share}</button><button class="secondary" id="copy">${t().copy}</button><button class="secondary" id="again">${t().again}</button><a class="btn ghost" href="../../index.html">${t().other}</a></div><div class="support"><button class="ghost" id="support">${t().support}</button></div></main><dialog id="dialog"><h2>${t().support}</h2><p class="lead">${t().supportText}</p><div class="actions"><a class="btn primary" href="${SUPPORT.boosty}" target="_blank" rel="noopener">Boosty</a><a class="btn secondary" href="${SUPPORT.kofi}" target="_blank" rel="noopener">Ko-fi</a><button class="ghost" id="close">${t().close}</button></div></dialog>`);
  $('#toggle').onclick=event=>{const scores=$('#scores'),open=scores.classList.toggle('open');event.currentTarget.textContent=open?t().hide:t().show};
  $('#share').onclick=async()=>navigator.share?navigator.share({title:text(test.title),text:shareText,url}):copy(`${shareText}\n${url}`);
  $('#copy').onclick=()=>copy(`${shareText}\n${url}`);
  $('#again').onclick=()=>{history.replaceState(null,'',`${location.pathname}?test=${test.id}`);shared=null;answers={};localStorage.removeItem(`pt.insight.${test.id}.answers`);screen='quiz';at=0;render()};
  $('#support').onclick=()=>$('#dialog').showModal();$('#close').onclick=()=>$('#dialog').close();
}
async function copy(value){await navigator.clipboard.writeText(value);toast(t().copied)}
function toast(value){const node=$('#toast');node.textContent=value;node.classList.add('show');setTimeout(()=>node.classList.remove('show'),1800)}
function render(){document.documentElement.lang=lang;document.title=`${text(test.title)} · Portable Tests`;({intro,quiz,result}[screen])()}
render();
