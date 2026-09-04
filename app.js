const VERSION = '1.11.2';
const SUPPORTED = ['ru', 'kk', 'en', 'fr'];
const CATEGORY_ICONS = { astro: '🔮', career: '💼', psychology: '🧠', fun: '🙂', interactive: '🎲', games: '🎮' };
const state = { lang: detectLanguage(), registry: [], locales: {}, filter: 'all', query: '', limit: 9, registration: null, suggestions: [], suggestionIndex: -1, pinned: readLocal('pt.hub.pinned', []), usage: readLocal('pt.hub.usage', {}) };
const PERSONAL_COPY={ru:{pin:'Закрепить',unpin:'Открепить',pinned:'Закреплено',pinnedLead:'Ваши избранные разделы всегда под рукой.'},kk:{pin:'Бекіту',unpin:'Ажырату',pinned:'Бекітілген',pinnedLead:'Таңдаулы бөлімдеріңіз әрқашан жоғарыда.'},en:{pin:'Pin',unpin:'Unpin',pinned:'Pinned',pinnedLead:'Your favorite sections stay within easy reach.'},fr:{pin:'Épingler',unpin:'Détacher',pinned:'Épinglés',pinnedLead:'Vos rubriques favorites restent toujours accessibles.'}};

function readLocal(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}}
function personal(){return PERSONAL_COPY[state.lang]||PERSONAL_COPY.ru}
function isPinned(id){return state.pinned.includes(id)}
function personalized(items){return [...items].sort((a,b)=>Number(isPinned(b.id))-Number(isPinned(a.id))+(Number(state.usage[b.id]||0)-Number(state.usage[a.id]||0)))}
function recordOpen(id){state.usage[id]=Number(state.usage[id]||0)+1;localStorage.setItem('pt.hub.usage',JSON.stringify(state.usage))}
function togglePin(id){state.pinned=isPinned(id)?state.pinned.filter(item=>item!==id):[id,...state.pinned];localStorage.setItem('pt.hub.pinned',JSON.stringify(state.pinned));renderContent()}

function detectLanguage() {
  const saved = localStorage.getItem('pt.lang')?.toLowerCase();
  if (SUPPORTED.includes(saved)) return saved;
  const browser = navigator.language?.slice(0, 2).toLowerCase();
  return SUPPORTED.includes(browser) ? browser : 'ru';
}

function text(value) {
  if (typeof value === 'string') return value;
  return value?.[state.lang] ?? value?.ru ?? '';
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[char]);
}

function interpolate(value, params = {}) {
  return String(value).replace(/\{(\w+)\}/g, (_, key) => params[key] ?? '');
}

function normalize(value = '') {
  return String(value).toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/ё/g, 'е').trim();
}

async function readJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}

function categoryIds() {
  return [...new Set(state.registry.map((item) => item.category))];
}

function shareValue(value) {
  if (Number.isFinite(value)) return Number(value);
  const match = String(value ?? '').trim().toLowerCase().match(/^([\d.,]+)\s*([kmкм]?)$/);
  if (!match) return 0;
  const number = Number(match[1].replace(',', '.'));
  const multiplier = ['k', 'к'].includes(match[2]) ? 1000 : ['m', 'м'].includes(match[2]) ? 1000000 : 1;
  return Number.isFinite(number) ? number * multiplier : 0;
}

function shareLabel(value) {
  return new Intl.NumberFormat(state.lang, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function savedCount(key) {
  try { return Object.values(JSON.parse(localStorage.getItem(key) || '{}')).filter((value) => Number.isFinite(Number(value))).length; }
  catch { return 0; }
}

function isCompleted(item) {
  return item.progress && savedCount(item.progress.key) >= item.progress.count;
}

function addParam(path, param) {
  if (!param) return path;
  return `${path}${path.includes('?') ? '&' : '?'}${param}`;
}

function matches(item, query = state.query) {
  const needle = normalize(query);
  if (!needle) return true;
  const haystack = [text(item.title), text(item.description), ...(item.tags?.[state.lang] ?? item.tags?.ru ?? [])].map(normalize).join(' ');
  return haystack.includes(needle);
}

function trendingItems() {
  const measured = state.registry.filter((item) => shareValue(item.metrics?.shareCount) >= 100);
  const pool = measured.length ? state.registry.filter((item) => item.metrics?.isViralTop || shareValue(item.metrics?.shareCount) >= 100) : state.registry.filter((item) => item.metrics?.isViralTop);
  return pool.sort((a, b) => shareValue(b.metrics?.shareCount) - shareValue(a.metrics?.shareCount));
}

function filteredItems() {
  let items = state.registry.filter((item) => matches(item));
  if (state.filter === 'trending') {
    const ids = new Set(trendingItems().map((item) => item.id));
    items = items.filter((item) => ids.has(item.id));
  } else if (state.filter !== 'all') items = items.filter((item) => item.category === state.filter);
  return personalized(items);
}

function optionsMarkup() {
  return SUPPORTED.map((code) => `<option value="${code}"${code === state.lang ? ' selected' : ''}>${code.toUpperCase()}</option>`).join('');
}

function filtersMarkup(locale) {
  const filters = [
    { id:'all', icon:'⌂', label:locale.all },
    { id:'trending', icon:'🚀', label:locale.trending },
    ...categoryIds().map((id) => ({ id, icon:CATEGORY_ICONS[id] ?? '•', label:locale.categories[id] ?? id }))
  ];
  return filters.map((item) => `<button class="filter-pill${state.filter === item.id ? ' active' : ''}" type="button" data-filter="${item.id}" aria-pressed="${state.filter === item.id}">${item.icon} ${escapeHtml(item.label)}</button>`).join('');
}

function layoutMarkup() {
  const locale = state.locales[state.lang];
  const trust = locale.trust.map((item) => interpolate(item, { count: state.registry.length }));
  return `<header class="topbar">
    <a class="brand" href="./" aria-label="PortHub — ${escapeHtml(locale.brandTagline)}"><span class="brand-wordmark"><span class="brand-port">Port</span><span class="brand-hub">Hub</span></span><span class="brand-tagline">${escapeHtml(locale.brandTagline)}</span></a>
    <div class="header-tools"><button class="share-button" id="shareApp" type="button">${locale.shareApp}</button><button class="update-button" id="update" type="button">↻ v${VERSION}</button><select id="lang" aria-label="Language">${optionsMarkup()}</select><button class="icon-button" id="openMenu" type="button" aria-label="${locale.menu}" aria-controls="drawer">☰</button></div>
  </header>
  <main class="shell">
    <section class="hero"><div class="eyebrow">${locale.eyebrow}</div><h1>${locale.title}</h1><p>${locale.lead}</p><div class="trust">${trust.slice(0, 2).map((item) => `<span>${item}</span>`).join('')}<div class="hero-languages" aria-label="Language">${SUPPORTED.map((code) => `<button type="button" data-hero-lang="${code}" class="${code === state.lang ? 'active' : ''}" aria-pressed="${code === state.lang}">${code.toUpperCase()}</button>`).join('')}</div></div></section>
    <section class="discover" aria-label="${locale.search}">
      <label class="search-box"><span>⌕</span><input id="search" type="search" autocomplete="off" aria-autocomplete="list" aria-controls="searchSuggestions" placeholder="${locale.search}" value="${escapeHtml(state.query)}"><button class="clear-search" id="clearSearch" type="button" aria-label="Clear"${state.query ? '' : ' hidden'}>×</button></label>
      <div class="search-suggestions" id="searchSuggestions" role="listbox" hidden></div>
      <div class="filters" id="filters">${filtersMarkup(locale)}</div>
      <div class="summary-line"><span id="foundCount"></span><span>🔒 ${trust[0].replace(/^🔒\s*/, '')}</span></div>
    </section>
    <div id="content"></div>
    <footer class="foot">${locale.footer}</footer>
  </main>
  <nav class="bottom-nav" aria-label="${locale.menu}">
    <button class="bottom-link active" type="button" data-bottom="all"><b>🏠</b>${locale.home}</button>
    <button class="bottom-link" type="button" data-bottom="trending"><b>🚀</b>${locale.trending}</button>
    <button class="bottom-link" type="button" data-bottom="astro"><b>🔮</b>${locale.categories.astro}</button>
    <button class="bottom-link" type="button" data-bottom="career"><b>💼</b>${locale.categories.career}</button>
  </nav>
  <div class="drawer-backdrop" id="drawerBackdrop" hidden></div>
  <aside class="drawer" id="drawer" aria-label="${locale.menu}" hidden><div class="drawer-head"><h2>${locale.menu}</h2><button class="icon-button" id="closeMenu" type="button" aria-label="Close">×</button></div><div class="drawer-list">
    <button class="drawer-link" type="button" data-drawer="all"><span>⌂ ${locale.all}</span><span>${interpolate(locale.tests,{count:state.registry.length})}</span></button>
    ${categoryIds().map((id) => { const count = state.registry.filter((item) => item.category === id).length; return `<button class="drawer-link" type="button" data-drawer="${id}"><span>${CATEGORY_ICONS[id] ?? '•'} ${locale.categories[id] ?? id}</span><span>${interpolate(locale.tests,{count})}</span></button>`; }).join('')}
  </div></aside><div id="toast" role="status"></div>`;
}

function categoryLabel(item) {
  const locale = state.locales[state.lang];
  return `${CATEGORY_ICONS[item.category] ?? '•'} ${locale.categories[item.category] ?? item.category}`;
}

function cardMarkup(item) {
  const locale = state.locales[state.lang];
  const complete = isCompleted(item);
  const rating = Number(item.metrics?.rating);
  const shares = shareValue(item.metrics?.shareCount);
  const primaryPath = complete ? addParam(item.path, item.progress.resultParam) : item.path;
  const badge = item.badge ? `<span class="badge ${item.badge.tone ?? ''}">${text(item.badge.label)}</span>` : '';
  const media = item.image ? `<img src="${item.image}" alt="" loading="lazy">` : `<span aria-hidden="true">${item.icon}</span>`;
  const pinned=isPinned(item.id),pinLabel=pinned?personal().unpin:personal().pin;
  return `<article class="catalog-card${complete ? ' completed' : ''}${pinned?' pinned':''}" data-id="${item.id}">
    <div class="card-media">${media}<span class="category-chip">${categoryLabel(item)}</span><button class="pin-card" type="button" data-pin="${item.id}" aria-label="${pinLabel}" aria-pressed="${pinned}">${pinned?'★':'☆'}</button></div>
    <div class="card-body"><div class="card-flags">${badge}${complete ? `<span class="complete-mark">${locale.completed}</span>` : ''}</div><h3>${text(item.title)}</h3><p>${text(item.description)}</p>
      <div class="card-meta"><span class="metric">⏱ ${text(item.time)}</span>${Number.isFinite(rating) && rating >= 4.8 ? `<span class="metric rating">★ ${rating.toFixed(1)}</span>` : ''}${shares >= 100 ? `<span class="metric share-count">↗ ${shareLabel(shares)}</span>` : ''}</div>
      <div class="card-actions"><a class="open-card" href="${primaryPath}">${complete ? locale.viewResult : locale.start}</a>${complete ? `<a class="retake-card" href="${addParam(item.path, item.progress.retakeParam)}">${locale.retake}</a>` : ''}</div>
    </div></article>`;
}

function sectionMarkup({ id, kicker, title, lead, items, variant = '' }) {
  if (!items.length) return '';
  return `<section class="catalog-section" id="${id}"><div class="section-head"><div><div class="section-kicker">${kicker}</div><h2>${title}</h2></div><p>${lead}</p></div><div class="cards ${variant}">${items.map(cardMarkup).join('')}</div></section>`;
}

function renderContent() {
  const locale = state.locales[state.lang];
  const allFiltered = filteredItems();
  const activeSearch = Boolean(state.query.trim()) || state.filter !== 'all';
  const measuredShares = state.registry.some((item) => shareValue(item.metrics?.shareCount) >= 100);
  const measuredRatings = state.registry.some((item) => item.metrics?.isPopular && Number(item.metrics?.rating) >= 4.8);
  const trend = trendingItems();
  const recommended = measuredRatings
    ? state.registry.filter((item) => item.metrics?.isPopular && Number(item.metrics?.rating) >= 4.8).sort((a, b) => b.metrics.rating - a.metrics.rating)
    : state.registry.filter((item) => item.metrics?.isPopular);
  const fresh = state.registry.filter((item) => item.metrics?.isNew);
  const pinnedItems = state.pinned.map(id=>state.registry.find(item=>item.id===id)).filter(Boolean);
  const shown = allFiltered.slice(0, state.limit);
  const content = document.getElementById('content');
  document.getElementById('foundCount').textContent = interpolate(locale.found, { count: allFiltered.length });
  content.innerHTML = `${activeSearch ? '' : sectionMarkup({
    id:'pinnedSection', kicker:'★', title:personal().pinned, lead:personal().pinnedLead, items:pinnedItems, variant:'pinned-grid'
  })}${activeSearch ? '' : sectionMarkup({
    id:'trendingSection', kicker:measuredShares ? locale.sharedKicker : locale.featuredKicker, title:measuredShares ? locale.sharedTitle : locale.featuredTitle, lead:measuredShares ? locale.sharedLead : locale.featuredLead, items:trend, variant:'viral'
  })}${activeSearch ? '' : sectionMarkup({
    id:'popularSection', kicker:measuredRatings ? locale.ratedKicker : locale.recommendedKicker, title:measuredRatings ? locale.ratedTitle : locale.recommendedTitle, lead:measuredRatings ? locale.ratedLead : locale.recommendedLead, items:recommended
  })}${activeSearch ? '' : sectionMarkup({
    id:'newSection', kicker:locale.newKicker, title:locale.newTitle, lead:locale.newLead, items:fresh
  })}<section class="catalog-section" id="directory"><div class="section-head"><div><div class="section-kicker">${locale.catalogKicker}</div><h2>${locale.catalogTitle}</h2></div><p>${locale.catalogLead}</p></div><div class="cards">${shown.length ? shown.map(cardMarkup).join('') : `<div class="empty">${locale.empty}</div>`}</div>${shown.length < allFiltered.length ? `<button class="show-more" id="showMore" type="button">${locale.showMore}</button>` : ''}</section>`;
  document.getElementById('showMore')?.addEventListener('click', () => { state.limit += 6; renderContent(); document.getElementById('showMore')?.focus(); });
  content.querySelectorAll('[data-pin]').forEach(button=>button.addEventListener('click',()=>togglePin(button.dataset.pin)));
  content.querySelectorAll('.open-card,.retake-card').forEach(link=>link.addEventListener('click',()=>recordOpen(link.closest('[data-id]')?.dataset.id)));
  updateActiveControls();
}

function updateActiveControls() {
  document.querySelectorAll('[data-filter]').forEach((button) => {
    const active = button.dataset.filter === state.filter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('[data-bottom]').forEach((button) => button.classList.toggle('active', button.dataset.bottom === state.filter || (state.filter === 'all' && button.dataset.bottom === 'all')));
}

function setFilter(filter, { scroll = true } = {}) {
  state.filter = filter;
  state.limit = 9;
  closeDrawer();
  renderContent();
  if (scroll) document.getElementById(filter === 'trending' && !state.query ? 'directory' : 'directory')?.scrollIntoView({ behavior:'smooth', block:'start' });
}

function renderSuggestions() {
  const box = document.getElementById('searchSuggestions');
  const query = state.query.trim();
  if (query.length < 2) { state.suggestions = []; box.hidden = true; box.innerHTML = ''; return; }
  const items = state.registry.filter((item) => matches(item, query)).slice(0, 5);
  state.suggestions = items;
  state.suggestionIndex = -1;
  if (!items.length) { box.hidden = true; box.innerHTML = ''; return; }
  box.innerHTML = items.map((item) => `<button type="button" role="option" aria-selected="false" data-suggestion="${item.id}"><span>${item.icon}</span><span><b>${text(item.title)}</b><small>${categoryLabel(item)}</small></span></button>`).join('');
  box.hidden = false;
  box.querySelectorAll('[data-suggestion]').forEach((button) => button.addEventListener('click', () => chooseSuggestion(button.dataset.suggestion)));
}

function chooseSuggestion(id) {
  const item = state.registry.find((entry) => entry.id === id);
  if (!item) return;
  state.query = text(item.title);
  const input = document.getElementById('search');
  input.value = state.query;
  document.getElementById('clearSearch').hidden = false;
  document.getElementById('searchSuggestions').hidden = true;
  state.limit = 9;
  renderContent();
  document.getElementById('directory')?.scrollIntoView({ behavior:'smooth', block:'start' });
}

function openDrawer() {
  document.body.classList.add('drawer-open');
  document.getElementById('drawer').hidden = false;
  document.getElementById('drawerBackdrop').hidden = false;
  document.getElementById('closeMenu').focus();
}

function closeDrawer() {
  document.body.classList.remove('drawer-open');
  const drawer = document.getElementById('drawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (drawer) drawer.hidden = true;
  if (backdrop) backdrop.hidden = true;
}

async function shareApp() {
  const locale = state.locales[state.lang];
  const data = { title:'PortHub', text:locale.shareText.replaceAll('Portable Tests','PortHub'), url:globalThis.PT_CONFIG?.onlineRoot || location.href };
  if (navigator.share) {
    try { await navigator.share(data); return; } catch (error) { if (error.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(data.url); }
  catch {
    const input = document.createElement('textarea'); input.value = data.url; input.style.position = 'fixed'; input.style.opacity = '0'; document.body.appendChild(input); input.select(); document.execCommand('copy'); input.remove();
  }
  toast(locale.copied);
}

function toast(message) {
  const element = document.getElementById('toast');
  element.textContent = message; element.classList.add('show'); setTimeout(() => element.classList.remove('show'), 1800);
}

function bindLayout() {
  let searchTimer;
  const input = document.getElementById('search');
  input.addEventListener('input', () => {
    state.query = input.value;
    document.getElementById('clearSearch').hidden = !state.query;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.limit = 9; renderContent(); renderSuggestions(); }, 100);
  });
  input.addEventListener('focus', renderSuggestions);
  input.addEventListener('keydown', (event) => {
    const box = document.getElementById('searchSuggestions');
    if (event.key === 'Escape') { box.hidden = true; return; }
    if (box.hidden || !state.suggestions.length || !['ArrowDown','ArrowUp','Enter'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowDown') state.suggestionIndex = (state.suggestionIndex + 1) % state.suggestions.length;
    if (event.key === 'ArrowUp') state.suggestionIndex = (state.suggestionIndex - 1 + state.suggestions.length) % state.suggestions.length;
    if (event.key === 'Enter') return chooseSuggestion(state.suggestions[Math.max(0, state.suggestionIndex)].id);
    box.querySelectorAll('[data-suggestion]').forEach((button, index) => { const active = index === state.suggestionIndex; button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active)); });
  });
  document.getElementById('clearSearch').addEventListener('click', () => { state.query = ''; input.value = ''; state.limit = 9; document.getElementById('clearSearch').hidden = true; document.getElementById('searchSuggestions').hidden = true; renderContent(); input.focus(); });
  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => setFilter(button.dataset.filter)));
  document.querySelectorAll('[data-bottom]').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.bottom === 'all') { state.filter = 'all'; state.query = ''; state.limit = 9; document.getElementById('search').value = ''; renderContent(); scrollTo({ top:0, behavior:'smooth' }); }
    else if (button.dataset.bottom === 'trending' && !state.query) { state.filter = 'all'; renderContent(); document.getElementById('trendingSection')?.scrollIntoView({ behavior:'smooth', block:'start' }); document.querySelectorAll('[data-bottom]').forEach((item) => item.classList.toggle('active', item === button)); }
    else setFilter(button.dataset.bottom);
  }));
  document.querySelectorAll('[data-drawer]').forEach((button) => button.addEventListener('click', () => setFilter(button.dataset.drawer)));
  document.getElementById('openMenu').addEventListener('click', openDrawer);
  document.getElementById('closeMenu').addEventListener('click', closeDrawer);
  document.getElementById('drawerBackdrop').addEventListener('click', closeDrawer);
  document.getElementById('shareApp').addEventListener('click', shareApp);
  document.querySelectorAll('[data-hero-lang]').forEach((button) => button.addEventListener('click', () => { state.lang = button.dataset.heroLang; localStorage.setItem('pt.lang', state.lang); render(); }));
  document.getElementById('lang').addEventListener('change', (event) => { state.lang = event.target.value; localStorage.setItem('pt.lang', state.lang); render(); });
  document.getElementById('update').addEventListener('click', checkOrInstallUpdate);
}

function render() {
  document.documentElement.lang = state.lang;
  document.getElementById('app').innerHTML = layoutMarkup();
  bindLayout();
  renderContent();
  showUpdateReady();
}

function showUpdateReady() {
  const button = document.getElementById('update');
  if (!button || !state.registration?.waiting) return;
  button.textContent = state.locales[state.lang].install;
  button.classList.add('ready');
}

async function checkOrInstallUpdate() {
  const button = document.getElementById('update');
  if (state.registration?.waiting) { state.registration.waiting.postMessage({ type:'SKIP_WAITING' }); return; }
  button.textContent = '…';
  await state.registration?.update();
  if (!state.registration?.waiting) { button.textContent = `✓ v${VERSION}`; setTimeout(() => { const current = document.getElementById('update'); if (current) current.textContent = `↻ v${VERSION}`; }, 1600); }
  showUpdateReady();
}

async function initPwa() {
  if (!('serviceWorker' in navigator)) return;
  state.registration = await navigator.serviceWorker.register('./service-worker.js');
  await state.registration.update();
  showUpdateReady();
  state.registration.addEventListener('updatefound', () => state.registration.installing?.addEventListener('statechange', showUpdateReady));
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
  setInterval(() => state.registration?.update(), 60 * 60 * 1000);
}

async function init() {
  try {
    [state.registry, state.locales] = await Promise.all([readJson('tests-registry.json'), readJson('hub-locales.json')]);
    render();
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer(); });
    addEventListener('pageshow', renderContent);
    initPwa().catch(() => {});
  } catch (error) {
    console.error(error);
    document.getElementById('app').innerHTML = `<header class="topbar"><a class="brand" href="./"><span class="brand-wordmark"><span class="brand-port">Port</span><span class="brand-hub">Hub</span></span></a></header><main class="shell"><section class="loading-card">${state.locales[state.lang]?.loadError ?? 'Каталог не загрузился.'}<br><button class="show-more" onclick="location.reload()">↻</button></section></main>`;
  }
}

init();
