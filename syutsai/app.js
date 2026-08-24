import { buildForecast } from './engine.mjs';
import { questions as careerQuestions, scales as careerScales } from '../tests/career/data.js';
import { tests as quickTests } from '../tests/quick/library-1.4.4.js';

const supported = ['ru', 'kk', 'en', 'fr'];
const browserLang = (navigator.language || 'ru').toLowerCase().split('-')[0];
let lang = localStorage.getItem('pt.lang') || (supported.includes(browserLang) ? browserLang : 'ru');
let L;
let forecast;
const app = document.querySelector('#app');
const ONLINE = 'https://zhanat-arch.github.io/Portable-Tests/';
const enc = value => btoa(unescape(encodeURIComponent(JSON.stringify(value)))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const dec = value => { try { return JSON.parse(decodeURIComponent(escape(atob(value.replaceAll('-', '+').replaceAll('_', '/'))))); } catch { return null; } };
let sharedResult = dec(location.hash.startsWith('#r=') ? location.hash.slice(3) : '');
if (sharedResult?.test !== 'syutsai' || !sharedResult.forecast?.core?.consciousness) sharedResult = null;
if (sharedResult && supported.includes(sharedResult.lang)) lang = sharedResult.lang;

const load = async locale => {
  try {
    return await fetch(`locales/${locale}.json?v=152`, { cache: 'no-store' }).then(response => response.json());
  } catch {
    return fetch('locales/ru.json?v=152', { cache: 'no-store' }).then(response => response.json());
  }
};
const f = (text, values = {}) => Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), text);
const esc = value => String(value ?? '').replace(/[&<>"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);
const trait = id => L.traits[id] || id;
const read = key => { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } };
const add = (bucket, key, value) => { (bucket[key] ??= []).push(value); };
const avg = values => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

function careerTraits() {
  const answers = read('pt.career.answers');
  if (!Object.keys(answers).length) return {};
  const totals = Object.fromEntries(careerScales.map(scale => [scale, { value: 0, max: 0 }]));
  careerQuestions.forEach(question => {
    const answer = answers[question.id];
    if (answer === undefined) return;
    Object.entries(question.weights).forEach(([key, weight]) => {
      totals[key].value += answer * weight;
      totals[key].max += 4 * weight;
    });
  });
  return Object.fromEntries(Object.entries(totals).filter(([, value]) => value.max).map(([key, value]) => [key, Math.round(value.value / value.max * 100)]));
}

function quickScores(id) {
  const test = quickTests[id];
  const answers = read(`pt.${id}.answers`);
  if (!test || !Object.keys(answers).length) return {};
  const sums = Object.fromEntries(Object.keys(test.scales).map(key => [key, { value: 0, max: 0 }]));
  test.questions.forEach((question, index) => {
    if (answers[index] === undefined) return;
    sums[question.scale].value += answers[index];
    sums[question.scale].max += 4;
  });
  return Object.fromEntries(Object.entries(sums).filter(([, value]) => value.max).map(([key, value]) => [key, Math.round(value.value / value.max * 100)]));
}

function profileTraits() {
  const bucket = {};
  Object.entries(careerTraits()).forEach(([key, value]) => add(bucket, key, value));
  const mapping = {
    rational: 'analytical', intuitive: 'creative', collab: 'social', rapid: 'enterprising',
    reflective: 'analytical', focus: 'analytical', social: 'social', freedom: 'enterprising',
    structure: 'organizing', hands: 'practical', pace: 'flexibility', ideas: 'creative',
    strategy: 'analytical', connector: 'social', coordinator: 'organizing', builder: 'practical', quality: 'technical'
  };
  ['decisions', 'environment', 'team'].forEach(id => {
    Object.entries(quickScores(id)).forEach(([key, value]) => add(bucket, mapping[key] || key, value));
  });
  return Object.fromEntries(Object.entries(bucket).map(([key, values]) => [key, avg(values)]));
}

function shell(body) {
  app.innerHTML = `<header class="top"><a class="brand" href="../index.html"><span class="mark">P</span><span>${L.app}</span></a><div class="tools"><a class="ghost" href="../index.html">← ${L.back}</a><select id="lang" aria-label="${L.language}">${supported.map(code => `<option>${code.toUpperCase()}</option>`).join('')}</select></div></header>${body}`;
  const select = document.querySelector('#lang');
  select.value = lang.toUpperCase();
  select.onchange = async event => {
    lang = event.target.value.toLowerCase();
    localStorage.setItem('pt.lang', lang);
    document.documentElement.lang = lang;
    L = await load(lang);
    render();
  };
}

function intro() {
  const name = localStorage.getItem('pt.syutsai.name') || '';
  const birth = localStorage.getItem('pt.syutsai.birth') || '';
  const birthTime = localStorage.getItem('pt.syutsai.birthTime') || '';
  shell(`<main class="page intro-page">
    <section class="hero">
      <span class="badge">${L.badge}</span>
      <h1>${L.title}</h1>
      <p>${L.intro}</p>
      <div class="hero-metrics"><span><b>2</b>${L.metricNumbers}</span><span><b>6</b>${L.metricAreas}</span><span><b>1</b>${L.metricWeek}</span></div>
    </section>
    <section class="offer panel"><div><span class="section-kicker">${L.freeKicker}</span><h2>${L.freeTitle}</h2><p>${L.freeText}</p></div><span class="offer-price">${L.freePrice}</span></section>
    <section class="panel form-panel">
      <div class="form-grid">
        <div class="field"><label for="name">${L.name}</label><input id="name" type="text" maxlength="40" autocomplete="name" placeholder="${L.namePlaceholder}" value="${esc(name)}"><small>${L.nameHint}</small></div>
        <div class="field"><label for="birth">${L.birth} *</label><input id="birth" type="date" value="${esc(birth)}" max="${new Date().toISOString().slice(0, 10)}" required><small>${L.birthHint}</small></div>
        <div class="field optional"><label for="birth-time">${L.birthTime}</label><input id="birth-time" type="time" value="${esc(birthTime)}"><small>${L.birthTimeHint}</small></div>
      </div>
      <button class="primary wide" id="build">${L.build}</button>
      <div class="privacy">🔒 ${L.privacy}</div>
    </section>
    <section class="honesty panel"><div class="honesty-icon">✓</div><div><h2>${L.coreRuleTitle}</h2><p>${L.coreRule}</p></div></section>
    <section class="astro-teaser panel"><span class="astro-icon">✦</span><div><span class="section-kicker">${L.separateSystem}</span><h2>${L.horoscopeTitle}</h2><p>${L.horoscopeText}</p></div><span class="soon">${L.soon}</span></section>
    <p class="disclaimer centered">${L.disclaimer}</p>
  </main>`);
  document.querySelector('#build').onclick = () => {
    const enteredName = document.querySelector('#name').value.trim();
    const enteredBirth = document.querySelector('#birth').value;
    const enteredTime = document.querySelector('#birth-time').value;
    if (!enteredBirth) return toast(L.missing);
    localStorage.setItem('pt.syutsai.name', enteredName);
    localStorage.setItem('pt.syutsai.birth', enteredBirth);
    localStorage.setItem('pt.syutsai.birthTime', enteredTime);
    showForecast(enteredBirth, enteredTime, enteredName);
  };
}

function reasons() {
  const items = [
    f(L.texts.why1, { number: forecast.core.consciousness, title: L.numberProfiles[forecast.core.consciousness].title }),
    f(L.texts.why2, { number: forecast.core.mission, title: L.numberProfiles[forecast.core.mission].title }),
    f(L.texts.why3, { theme: L.themes[forecast.cycles.week] })
  ];
  if (forecast.profile.hasTestProfile) items.push(f(L.texts.why4, { top: trait(forecast.profile.top.id), value: forecast.profile.top.value }));
  return `<details class="why"><summary>${L.why}</summary><ul>${items.map(item => `<li>${item}</li>`).join('')}</ul></details>`;
}

function weeklyCard(title, text, score, icon) {
  return `<section class="block"><div class="row"><h2>${icon} ${title}</h2>${score ? `<span class="score-pill">${score}/10</span>` : ''}</div><p>${text}</p>${reasons()}</section>`;
}

function numberHero(number, label) {
  const profile = L.numberProfiles[number];
  return `<article class="number-hero"><span class="number">${number}</span><div><span class="section-kicker">${label}</span><h3>${profile.title}</h3><p>${profile.core}</p></div></article>`;
}

function passport(name) {
  const consciousness = L.numberProfiles[forecast.core.consciousness];
  const mission = L.numberProfiles[forecast.core.mission];
  const values = { mind: consciousness.title.toLowerCase(), mission: mission.title.toLowerCase() };
  const dominant = forecast.core.matrix.dominant.length
    ? forecast.core.matrix.dominant.map(item => `<span class="matrix-chip strong">${item.digit} × ${item.count}</span>`).join('')
    : `<span class="matrix-note">${L.matrixBalanced}</span>`;
  const missing = forecast.core.matrix.missing.map(digit => `<span class="matrix-chip">${digit}</span>`).join('') || `<span class="matrix-note">${L.matrixFull}</span>`;
  const greeting = name ? f(L.greeting, { name: esc(name) }) : L.passportLead;
  const signals = forecast.profile.signals.map(signal => `<span class="signal"><b>${trait(signal.id)}</b> ${signal.value}%</span>`).join('');
  const behavior = forecast.profile.hasTestProfile
    ? `<div class="behavior"><div class="row"><div><span class="section-kicker">${L.fromTests}</span><h3>${L.behaviorTitle}</h3></div><span class="depth-label">${L[forecast.profile.depth]}</span></div><p>${f(L.behaviorText, { top: trait(forecast.profile.top.id), second: trait(forecast.profile.second.id) })}</p><div class="signals">${signals}</div></div>`
    : `<div class="behavior empty"><div><span class="section-kicker">${L.fromTests}</span><h3>${L.behaviorTitle}</h3><p>${L.behaviorEmpty}</p></div><a class="secondary" href="../index.html">${L.takeTests}</a></div>`;

  return `<section class="passport panel">
    <div class="row passport-title"><div><span class="section-kicker">${L.permanent}</span><h2>${greeting}</h2></div><span class="lock">♾ ${L.general}</span></div>
    <p class="passport-lead">${f(L.core, { consciousness: forecast.core.consciousness, mission: forecast.core.mission })}</p>
    <div class="number-grid">${numberHero(forecast.core.consciousness, L.consciousness)}${numberHero(forecast.core.mission, L.mission)}</div>
    <div class="passport-grid">
      <article><h3>🧭 ${L.decisionStyle}</h3><p>${f(L.profileTexts.decision, values)}</p></article>
      <article><h3>💼 ${L.workStyle}</h3><p>${f(L.profileTexts.work, values)}</p></article>
      <article><h3>💬 ${L.communicationStyle}</h3><p>${f(L.profileTexts.communication, values)}</p></article>
      <article><h3>💳 ${L.moneyStyle}</h3><p>${f(L.profileTexts.money, values)}</p></article>
      <article><h3>🌘 ${L.shadow}</h3><p>${consciousness.shadow} ${mission.shadow}</p></article>
      <article><h3>🔋 ${L.resource}</h3><p>${consciousness.resource} ${mission.resource}</p></article>
    </div>
    <div class="matrix"><div><h3>${L.matrixStrong}</h3><div class="matrix-list">${dominant}</div><p>${L.matrixStrongHint}</p></div><div><h3>${L.matrixMissing}</h3><div class="matrix-list">${missing}</div><p>${L.matrixMissingHint}</p></div></div>
    ${behavior}
  </section>`;
}

function extraLayers() {
  const clock = forecast.rhythm && Number.isInteger(forecast.rhythm.hour) ? `${String(forecast.rhythm.hour).padStart(2, '0')}:${String(forecast.rhythm.minute).padStart(2, '0')} · ` : '';
  const time = forecast.rhythm
    ? `<article class="extra-card"><span class="section-kicker">${L.optionalLayer}</span><h3>🕰 ${L.rhythmTitle}</h3><p><b>${clock}${L.rhythms[forecast.rhythm.period].title}</b> ${L.rhythms[forecast.rhythm.period].text}</p><small>${L.rhythmNote}</small></article>`
    : `<article class="extra-card muted-card"><span class="section-kicker">${L.optionalLayer}</span><h3>🕰 ${L.rhythmTitle}</h3><p>${L.rhythmEmpty}</p><button class="text-button" id="add-time">${L.addTime}</button></article>`;
  const zodiac = L.zodiac[forecast.zodiac];
  return `<section class="extra-grid">${time}<article class="extra-card"><span class="section-kicker">${L.separateSystem}</span><h3>${zodiac.symbol} ${L.zodiacTitle}: ${zodiac.name}</h3><p>${L.zodiacNote}</p><small>${L.horoscopeText}</small></article></section>`;
}

function showForecast(birth, birthTime = '', name = '', sharedForecast = null) {
  const isShared = Boolean(sharedForecast);
  forecast = sharedForecast || buildForecast({ birth, birthTime, traits: profileTraits() });
  const weekKey = `${forecast.cycles.isoYear}-W${forecast.cycles.isoWeek}`;
  const previousWeek = isShared ? '' : localStorage.getItem('pt.syutsai.week');
  const isNew = !isShared && previousWeek && previousWeek !== weekKey;
  if (!isShared) localStorage.setItem('pt.syutsai.week', weekKey);
  const top = trait(forecast.profile.top.id);
  const mind = L.numberProfiles[forecast.core.consciousness].title.toLowerCase();
  const mission = L.numberProfiles[forecast.core.mission].title.toLowerCase();
  const theme = L.themes[forecast.cycles.week];
  const relation = L.relationLabels[forecast.week.relation];
  const values = { top, mind, mission, theme };
  const portableForecast = {
    core: forecast.core,
    cycles: forecast.cycles,
    rhythm: forecast.rhythm ? { period: forecast.rhythm.period } : null,
    zodiac: forecast.zodiac,
    profile: forecast.profile,
    week: forecast.week
  };
  const resultUrl = `${ONLINE}syutsai/#r=${enc({ v: 1, test: 'syutsai', lang, forecast: portableForecast })}`;
  const rawShare = f(L.shareCard, {
    name: name ? `${name} · ` : '', week: forecast.cycles.isoWeek,
    consciousness: forecast.core.consciousness, mission: forecast.core.mission,
    theme, work: forecast.week.work, money: forecast.week.money, url: resultUrl
  });
  const share = esc(rawShare);

  shell(`<main class="page result-page">
    <div class="result-tools">${isShared ? `<span class="badge">↗ ${L.sharedResult}</span>` : isNew ? `<span class="badge">✨ ${L.newWeek}</span>` : '<span></span>'}<div class="result-actions">${isShared ? `<button class="secondary" id="take">${L.takeThis}</button><a class="secondary" href="../index.html">${L.otherTests}</a>` : `<button class="secondary" id="edit">${L.editData}</button>`}</div></div>
    <section class="result-banner"><span>${L.freeKicker}</span><strong>${L.freeTitle}</strong><b>${L.freePrice}</b></section>
    ${passport(name)}
    ${extraLayers()}
    <div class="layer-separator"><span>${L.weeklyLayer}</span><p>${L.weeklyLayerHint}</p></div>
    <section class="headline panel"><div class="row"><div><span class="badge">${L.week} ${forecast.cycles.isoWeek}</span><h1>${L.theme}</h1></div><span class="relation">${relation}</span></div><p>${f(L.texts.theme, values)}</p><p>${L.texts[forecast.week.relation]}</p>${reasons()}</section>
    <section class="panel compact"><div class="cycles"><div class="cycle"><b>${forecast.core.consciousness}</b><span>${L.consciousness}</span></div><div class="cycle"><b>${forecast.core.mission}</b><span>${L.mission}</span></div><div class="cycle"><b>${forecast.cycles.year}</b><span>${L.year}</span></div><div class="cycle"><b>${forecast.cycles.month}</b><span>${L.month}</span></div><div class="cycle"><b>${forecast.cycles.week}</b><span>${L.week}</span></div></div><p class="cycle-note">${L.weekFormulaNote}</p></section>
    <div class="report-grid">
      ${weeklyCard(L.work, f(L.texts.work, { ...values, score: forecast.week.work }), forecast.week.work, '💼')}
      ${weeklyCard(L.money, f(L.texts.money, { ...values, score: forecast.week.money }), forecast.week.money, '💳')}
      ${weeklyCard(L.relationships, f(L.texts.relationships, { ...values, score: forecast.week.relations }), forecast.week.relations, '💬')}
      ${weeklyCard(L.decisions, f(L.texts.decisions, { ...values, score: forecast.week.decisions }), forecast.week.decisions, '🧭')}
      ${weeklyCard(L.energy, f(L.texts.energy, { ...values, score: forecast.week.energy }), forecast.week.energy, '🔋')}
      ${weeklyCard(L.risk, f(L.texts.risk, values), null, '⚠️')}
      ${weeklyCard(L.window, f(L.texts.window, values), null, '✨')}
      ${weeklyCard(L.avoid, f(L.texts.avoid, values), null, '⛔')}
    </div>
    ${weeklyCard(L.mode, f(L.texts.mode, values), null, '🎯')}
    ${weeklyCard(L.joke, f(L.texts.joke, values), null, '😄')}
    <section class="share-card"><span class="section-kicker">${L.readyCard}</span><h2>${L.share}</h2><pre id="card">${share}</pre><div class="actions"><button class="primary" id="share">${L.share}</button><button class="secondary" id="copy">${L.copy}</button></div></section>
    <details class="panel method"><summary><b>${L.how}</b></summary><p>${L.howText}</p><p>${L.nameTimeRule}</p><p class="disclaimer">${L.disclaimer}</p></details>
  </main>`);

  const copy = async () => { await navigator.clipboard.writeText(rawShare); toast(L.copied); };
  document.querySelector('#copy').onclick = copy;
  document.querySelector('#share').onclick = () => navigator.share
    ? navigator.share({ title: L.title, text: rawShare, url: resultUrl })
    : copy();
  const edit = document.querySelector('#edit');
  if (edit) edit.onclick = intro;
  const take = document.querySelector('#take');
  if (take) take.onclick = () => { history.replaceState(null, '', location.pathname); sharedResult = null; intro(); };
  const addTime = document.querySelector('#add-time');
  if (addTime) addTime.onclick = intro;
}

function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 1700);
}

function render() {
  if (sharedResult) return showForecast('', '', '', sharedResult.forecast);
  const birth = localStorage.getItem('pt.syutsai.birth');
  const birthTime = localStorage.getItem('pt.syutsai.birthTime') || '';
  const name = localStorage.getItem('pt.syutsai.name') || '';
  birth ? showForecast(birth, birthTime, name) : intro();
}

document.documentElement.lang = lang;
L = await load(lang);
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('../service-worker.js').then(registration => registration.update()).catch(() => {});
