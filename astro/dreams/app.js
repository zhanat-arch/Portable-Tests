import { decodeResult, encodeResult, interpretDream, interpolate, pick, searchObjects } from './engine.mjs';
import { revealCalculatedResult, showCalculationLoader } from '../../loader-overlay.js';

const SUPPORTED = ['ru', 'kk', 'en', 'fr'];
const state = {
  lang: detectLanguage(),
  locale: null,
  objectsData: null,
  rulesData: null,
  object: null,
  selection: { objectId: null, targetId: null, actionId: null, detailId: null, emotionId: null },
  activeSuggestion: -1,
  suggestions: [],
  timer: null,
  view: 'builder'
};

function detectLanguage() {
  const saved = localStorage.getItem('pt.lang')?.toLowerCase();
  if (SUPPORTED.includes(saved)) return saved;
  const browser = navigator.language?.slice(0, 2).toLowerCase();
  return SUPPORTED.includes(browser) ? browser : 'ru';
}

async function readJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}

async function load(lang = state.lang) {
  const [locale, objectsData, rulesData] = await Promise.all([
    readJson(`locales/${lang}.json`),
    state.objectsData ?? readJson('data/objects.json'),
    state.rulesData ?? readJson('data/rules.json')
  ]);
  state.lang = lang;
  state.locale = locale;
  state.objectsData = objectsData;
  state.rulesData = rulesData;
  document.documentElement.lang = lang;
  document.title = `${locale.badge} · Portable Tests`;
  localStorage.setItem('pt.lang', lang);
}

function optionsMarkup() {
  return SUPPORTED.map((code) => `<option value="${code}"${code === state.lang ? ' selected' : ''}>${code.toUpperCase()}</option>`).join('');
}

function topMarkup() {
  return `<header class="top">
    <a class="brand" href="../../index.html"><span class="mark">☾</span><span>${state.locale.app}</span></a>
    <div class="tools"><a class="home" href="../../index.html">${state.locale.home}</a><select id="lang" aria-label="Language">${optionsMarkup()}</select></div>
  </header>`;
}

function heroMarkup() {
  return `<section class="hero panel">
    <div class="eyebrow">${state.locale.badge}</div>
    <h1>${state.locale.title}</h1>
    <p>${state.locale.lead}</p>
    <div class="facts">${state.locale.facts.map((fact) => `<span>${fact}</span>`).join('')}</div>
  </section>`;
}

function selectedObjectMarkup() {
  const object = state.object;
  if (!object) return '';
  return `<div class="selected-object">
    <div><strong>${object.icon} ${pick(object.name, state.lang)}</strong><small>${state.locale.category[object.category] ?? object.category}</small></div>
    <button type="button" id="changeObject" aria-label="${state.locale.change}" title="${state.locale.change}">×</button>
  </div>`;
}

function chipsMarkup(group, items) {
  const selectedId = state.selection[`${group}Id`];
  return items.map((item) => `<button type="button" class="chip${item.id === selectedId ? ' selected' : ''}" data-group="${group}" data-id="${item.id}" aria-pressed="${item.id === selectedId}"><span>${item.icon}</span>${pick(item.label, state.lang)}</button>`).join('');
}

function questionMarkup(number, group, items) {
  const question = state.locale.questions[group];
  return `<section class="question-card"><div class="question-head"><b>${number}</b><div><h2>${question.title}</h2><p>${question.hint}</p></div></div><div class="chips">${chipsMarkup(group, items)}</div></section>`;
}

function detailsMarkup() {
  if (!state.object) return '';
  const remaining = ['targetId', 'actionId', 'detailId', 'emotionId'].filter((key) => !state.selection[key]).length;
  return `<div class="details" id="details">
    <div><div class="step-kicker"><b>02</b><span>${state.locale.step2}</span></div><p class="step-lead">${state.locale.step2Lead}</p></div>
    ${questionMarkup(1, 'target', state.rulesData.targets)}
    ${questionMarkup(2, 'action', state.rulesData.actions)}
    ${questionMarkup(3, 'detail', state.rulesData.details)}
    ${questionMarkup(4, 'emotion', state.rulesData.emotions)}
    <div class="build-footer"><span class="ready-note">${remaining ? interpolate(state.locale.remaining, { count: remaining }) : state.locale.ready}</span><button class="primary" id="interpret"${remaining ? ' disabled' : ''}>${state.locale.interpret}</button></div>
  </div>`;
}

function builderMarkup() {
  return `${topMarkup()}<main>${heroMarkup()}<section class="builder panel">
    <div class="step-kicker"><b>01</b><span>${state.locale.step1}</span></div>
    ${state.object ? selectedObjectMarkup() : `<div class="search-wrap">
      <label class="search-shell"><span>⌕</span><input id="dreamSearch" type="search" autocomplete="off" aria-label="${state.locale.searchLabel}" aria-controls="suggestions" aria-autocomplete="list" aria-expanded="false" placeholder="${state.locale.searchPlaceholder}"><button type="button" class="clear-search" id="clearSearch" aria-label="Clear" hidden>×</button></label>
      <div class="dropdown" id="suggestions" role="listbox" hidden></div>
      <div class="popular"><span class="popular-label">${state.locale.popular}</span>${state.objectsData.popular.map((id) => {
        const object = state.objectsData.objects.find((item) => item.id === id);
        return `<button type="button" data-object="${id}">${object.icon} ${pick(object.name, state.lang)}</button>`;
      }).join('')}</div>
    </div>`}
    ${detailsMarkup()}
  </section></main><div id="toast" role="status"></div>`;
}

function renderBuilder({ focusSearch = false, scrollDetails = false } = {}) {
  state.view = 'builder';
  document.getElementById('app').innerHTML = builderMarkup();
  bindCommon();
  bindBuilder();
  if (focusSearch) document.getElementById('dreamSearch')?.focus();
  if (scrollDetails) document.getElementById('details')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderSuggestions(items, message = '') {
  const dropdown = document.getElementById('suggestions');
  const input = document.getElementById('dreamSearch');
  if (!dropdown || !input) return;
  state.suggestions = items;
  state.activeSuggestion = -1;
  if (message) dropdown.innerHTML = `<p class="dropdown-note">${message}</p>`;
  else dropdown.innerHTML = items.map((object, index) => `<button type="button" class="suggestion" role="option" aria-selected="false" data-index="${index}" data-object="${object.id}"><span class="icon">${object.icon}</span><span><b>${pick(object.name, state.lang)}</b><small>${state.locale.category[object.category] ?? object.category}</small></span></button>`).join('');
  dropdown.hidden = !message && !items.length;
  input.setAttribute('aria-expanded', String(!dropdown.hidden));
}

function showPopularSuggestions() {
  renderSuggestions(state.objectsData.popular.map((id) => state.objectsData.objects.find((object) => object.id === id)).filter(Boolean));
}

function updateSearch() {
  const input = document.getElementById('dreamSearch');
  const clear = document.getElementById('clearSearch');
  if (!input) return;
  clear.hidden = !input.value;
  const query = input.value.trim();
  if (!query) return showPopularSuggestions();
  if (query.length < 2) return renderSuggestions([], state.locale.searchHint);
  const items = searchObjects(state.objectsData.objects, query, state.lang);
  renderSuggestions(items, items.length ? '' : state.locale.notFound);
}

function chooseObject(id) {
  const object = state.objectsData.objects.find((item) => item.id === id);
  if (!object) return;
  state.object = object;
  state.selection = { objectId: id, targetId: null, actionId: null, detailId: null, emotionId: null };
  renderBuilder({ scrollDetails: true });
}

function bindBuilder() {
  const input = document.getElementById('dreamSearch');
  const suggestions = document.getElementById('suggestions');
  suggestions?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-object]');
    if (button) chooseObject(button.dataset.object);
  });
  if (input) {
    input.addEventListener('focus', () => {
      if (!input.value.trim()) showPopularSuggestions();
      else updateSearch();
    });
    input.addEventListener('input', () => {
      clearTimeout(state.timer);
      state.timer = setTimeout(updateSearch, 100);
    });
    input.addEventListener('keydown', (event) => {
      const dropdown = document.getElementById('suggestions');
      if (dropdown?.hidden) return;
      if (event.key === 'Escape') {
        dropdown.hidden = true;
        input.setAttribute('aria-expanded', 'false');
        return;
      }
      if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key) || !state.suggestions.length) return;
      event.preventDefault();
      if (event.key === 'ArrowDown') state.activeSuggestion = (state.activeSuggestion + 1) % state.suggestions.length;
      if (event.key === 'ArrowUp') state.activeSuggestion = (state.activeSuggestion - 1 + state.suggestions.length) % state.suggestions.length;
      if (event.key === 'Enter') return chooseObject(state.suggestions[Math.max(0, state.activeSuggestion)].id);
      dropdown.querySelectorAll('.suggestion').forEach((button, index) => {
        const active = index === state.activeSuggestion;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
      });
    });
  }

  document.getElementById('clearSearch')?.addEventListener('click', () => {
    input.value = '';
    updateSearch();
    input.focus();
  });
  document.getElementById('changeObject')?.addEventListener('click', () => {
    state.object = null;
    state.selection = { objectId: null, targetId: null, actionId: null, detailId: null, emotionId: null };
    history.replaceState(null, '', location.pathname + location.search);
    renderBuilder({ focusSearch: true });
  });
  document.querySelectorAll('[data-group]').forEach((button) => button.addEventListener('click', () => {
    state.selection[`${button.dataset.group}Id`] = button.dataset.id;
    renderBuilder();
    document.querySelector(`[data-group="${button.dataset.group}"][data-id="${button.dataset.id}"]`)?.focus();
  }));
  document.getElementById('interpret')?.addEventListener('click', async () => {
    await showCalculationLoader({ kind: 'dreams', lang: state.lang });
    showResult();
    revealCalculatedResult(document.querySelector('.result'));
  });
}

function graphMarkup(result) {
  const parts = [
    `${result.object.icon} ${result.object.name}`,
    `${result.selection.target.icon} ${result.selection.target.label}`,
    `${result.selection.action.icon} ${result.selection.action.label}`,
    `${result.selection.detail.icon} ${result.selection.detail.label}`,
    `${result.selection.emotion.icon} ${result.selection.emotion.label}`
  ];
  return `<div class="graph" aria-label="${state.locale.graphTitle}">${parts.map((part, index) => `${index ? '<i>＋</i>' : ''}<span>${part}</span>`).join('')}</div>`;
}

function schoolMarkup(id, icon, text) {
  return `<article class="school"><div class="school-icon">${icon}</div><h2>${state.locale.schoolTitles[id]}</h2><small>${state.locale.schoolSubs[id]}</small><p>${text}</p></article>`;
}

function resultMarkup(result) {
  const title = interpolate(state.locale.resultTitle, { object: result.object.name });
  return `${topMarkup()}<main class="result">
    <section class="result-hero panel"><div class="eyebrow">${state.locale.resultBadge}</div><h1>${title}</h1><p>${result.summary}</p>${graphMarkup(result)}</section>
    <section class="schools">
      ${schoolMarkup('islamic', '🌙', result.schools.islamic)}
      ${schoolMarkup('psychology', '🧠', result.schools.psychology)}
      ${schoolMarkup('popular', '🔮', result.schools.popular)}
    </section>
    <section class="factors">
      <article class="factor"><div class="label">${state.locale.factorDetail}</div><h3>${result.selection.detail.icon} ${result.selection.detail.label}</h3><p>${result.selection.detail.text}</p></article>
      <article class="factor"><div class="label">${state.locale.factorEmotion}</div><h3>${result.selection.emotion.icon} ${result.selection.emotion.label}</h3><p>${result.selection.emotion.text}</p></article>
    </section>
    <details class="sources panel"><summary>${state.locale.sourcesTitle}</summary><p>${state.locale.sourcesIntro}</p><ul>
      <li><a href="https://quran.com/en/yusuf/44-111" target="_blank" rel="noopener">${state.locale.sourceIslamic}</a> · <a href="https://sunnah.com/bukhari/91" target="_blank" rel="noopener">Sahih al-Bukhari 91</a> · <a href="https://www.aub.edu.lb/articles/Pages/aub-press-publishes-new-edition-classical-arabic-text-dream-interpretation.aspx" target="_blank" rel="noopener">AUB Press</a></li>
      <li><a href="https://www.gutenberg.org/ebooks/66048" target="_blank" rel="noopener">${state.locale.sourcePsy}</a> · <a href="https://www.gutenberg.org/files/48225/48225-h/48225-h" target="_blank" rel="noopener">Jung</a></li>
      <li><a href="https://www.gutenberg.org/ebooks/926" target="_blank" rel="noopener">${state.locale.sourceFolk}</a></li>
    </ul></details>
    <section class="panel sources"><div class="notice">${state.locale.notice}</div><p>${state.locale.nightmare}</p><p>🔒 ${state.locale.privacy}</p>
      <div class="footer-actions"><button class="primary" id="shareResult">${state.locale.share}</button><button class="secondary" id="copyResult">${state.locale.copy}</button><button class="secondary" id="again">${state.locale.again}</button><a class="link-btn" href="../../index.html">${state.locale.other}</a></div>
      <p class="support">${state.locale.support}</p>
    </section>
  </main><div id="toast" role="status"></div>`;
}

function showResult({ replace = false } = {}) {
  const result = interpretDream(state.selection, state.objectsData, state.rulesData, state.locale, state.lang);
  state.view = 'result';
  const hash = `#r=${encodeResult(state.selection, state.lang)}`;
  if (replace) history.replaceState(null, '', hash);
  else if (location.hash !== hash) history.pushState(null, '', hash);
  document.getElementById('app').innerHTML = resultMarkup(result);
  bindCommon();
  document.getElementById('shareResult').addEventListener('click', () => shareResult(result));
  document.getElementById('copyResult').addEventListener('click', () => copyResult(result));
  document.getElementById('again').addEventListener('click', () => {
    state.object = null;
    state.selection = { objectId: null, targetId: null, actionId: null, detailId: null, emotionId: null };
    history.pushState(null, '', location.pathname + location.search);
    renderBuilder({ focusSearch: true });
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function currentUrl() {
  return new URL(location.href).href;
}

async function shareResult(result) {
  const data = {
    title: interpolate(state.locale.shareTitle, { object: result.object.name }),
    text: interpolate(state.locale.shareText, { object: result.object.name }),
    url: currentUrl()
  };
  if (navigator.share) {
    try { await navigator.share(data); return; } catch (error) { if (error.name === 'AbortError') return; }
  }
  await copyResult(result);
}

async function copyResult() {
  const value = currentUrl();
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const input = document.createElement('textarea');
    input.value = value;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    input.remove();
  }
  toast(state.locale.copied);
}

function toast(message) {
  const element = document.getElementById('toast');
  if (!element) return;
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 2200);
}

function bindCommon() {
  document.getElementById('lang')?.addEventListener('change', async (event) => {
    await load(event.target.value);
    if (state.view === 'result') showResult({ replace: true });
    else renderBuilder();
  });
}

function readHash() {
  const match = location.hash.match(/^#r=(.+)$/);
  if (!match) return false;
  const decoded = decodeResult(match[1]);
  if (!decoded) return false;
  if (SUPPORTED.includes(decoded.lang) && decoded.lang !== state.lang) return decoded;
  state.selection = decoded.selection;
  state.object = state.objectsData.objects.find((item) => item.id === decoded.selection.objectId) ?? null;
  if (!state.object) return false;
  showResult({ replace: true });
  return true;
}

async function init() {
  try {
    await load();
    const decoded = readHash();
    if (decoded && typeof decoded === 'object') {
      await load(decoded.lang);
      state.selection = decoded.selection;
      state.object = state.objectsData.objects.find((item) => item.id === decoded.selection.objectId) ?? null;
      if (state.object) showResult({ replace: true });
      else renderBuilder();
    } else if (!decoded) renderBuilder();
    addEventListener('popstate', () => {
      if (!readHash()) renderBuilder();
    });
  } catch (error) {
    console.error(error);
    document.getElementById('app').innerHTML = `<header class="top"><a class="brand" href="../../index.html"><span class="mark">☾</span><span>Portable Tests</span></a></header><main><section class="builder panel"><h1>Portable Tests</h1><p>${state.locale?.loadError ?? 'Не удалось открыть базу толкований.'}</p><button class="primary" onclick="location.reload()">↻</button></section></main>`;
  }
}

init();
