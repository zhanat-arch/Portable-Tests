import { buildNatalChart, buildPersonalForecasts, SIGN_IDS } from './engine.mjs';
import { revealCalculatedResult, showCalculationLoader } from '../loader-overlay.js';

const supported = ['ru', 'kk', 'en', 'fr'];
const browserLang = (navigator.language || 'ru').toLowerCase().split('-')[0];
let lang = localStorage.getItem('pt.lang') || (supported.includes(browserLang) ? browserLang : 'ru');
let L;
let view = localStorage.getItem('pt.horoscope.ready') === '1' ? 'result' : 'form';
let searchResults = [];
let searchTimer;
let mapOpen = false;
const app = document.querySelector('#app');
const ONLINE = globalThis.PT_CONFIG.onlineUrl('horoscope/');
const SUPPORT = { boosty: 'https://boosty.to/zhanat-arch', kofi: 'https://ko-fi.com/zhanat_arch' };
const BODY_SYMBOLS = { Sun: '☉', Moon: '☾', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇' };
const storage = {
  get(key, fallback = '') { return localStorage.getItem(key) ?? fallback; },
  set(key, value) { localStorage.setItem(key, value); },
  json(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } }
};
let location = storage.json('pt.horoscope.location');
const draft = {
  birth: storage.get('pt.syutsai.birth'),
  exactTime: storage.get('pt.syutsai.birthTime'),
  mode: storage.get('pt.horoscope.timeMode', storage.get('pt.syutsai.birthTime') ? 'exact' : 'unknown'),
  period: storage.get('pt.horoscope.period', 'day'),
  query: location?.display || storage.get('pt.horoscope.place')
};

const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const fmt = (text, values = {}) => Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), text);
const load = async code => {
  try {
    const [base, journal] = await Promise.all([
      fetch(`locales/${code}.json?v=4`, { cache: 'no-store' }).then(response => response.json()),
      fetch(`locales/${code}.journal.json?v=4`, { cache: 'no-store' }).then(response => response.json())
    ]);
    return { ...base, journal };
  } catch {
    const [base, journal] = await Promise.all([
      fetch('locales/ru.json?v=4', { cache: 'no-store' }).then(response => response.json()),
      fetch('locales/ru.journal.json?v=4', { cache: 'no-store' }).then(response => response.json())
    ]);
    return { ...base, journal };
  }
};

function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 2200);
}

function header() {
  return `<header class="top"><a class="brand" href="../index.html"><span class="mark">✦</span><span>${L.app}</span></a><div class="tools"><a href="../syutsai/">← ${L.syutsai}</a><select id="lang" aria-label="${L.language}">${supported.map(code => `<option>${code.toUpperCase()}</option>`).join('')}</select></div></header>`;
}

function bindHeader() {
  const select = document.querySelector('#lang');
  select.value = lang.toUpperCase();
  select.onchange = async event => {
    lang = event.target.value.toLowerCase();
    storage.set('pt.lang', lang);
    document.documentElement.lang = lang;
    L = await load(lang);
    render();
  };
}

function saveDraftFromForm() {
  const birth = document.querySelector('#birth');
  const exactTime = document.querySelector('#exact-time');
  const query = document.querySelector('#place-query');
  if (birth) draft.birth = birth.value;
  if (exactTime) draft.exactTime = exactTime.value;
  if (query) draft.query = query.value.trim();
}

function periodOptions() {
  return ['night', 'morning', 'day', 'evening'].map(id => `<option value="${id}" ${draft.period === id ? 'selected' : ''}>${L.periods[id]}</option>`).join('');
}

function selectedPlace() {
  if (!location) return `<div class="place-empty">${L.placeNotSelected}</div>`;
  return `<div class="selected-place"><span>✓</span><div><b>${esc(location.display)}</b><small>${esc(location.timezone)} · ${Number(location.latitude).toFixed(2)}, ${Number(location.longitude).toFixed(2)}</small></div><button id="clear-place" type="button" aria-label="${L.changePlace}">×</button></div>`;
}

function timeFields() {
  if (draft.mode === 'exact') return `<label class="field"><span>${L.exactTime}</span><input id="exact-time" type="time" value="${esc(draft.exactTime)}"><small>${L.exactHelp}</small></label>`;
  if (draft.mode === 'approx') return `<label class="field"><span>${L.approxPeriod}</span><select id="period">${periodOptions()}</select><small>${L.approxHelp}</small></label>`;
  return `<div class="time-note"><b>${L.unknownTitle}</b><span>${L.unknownHelp}</span></div>`;
}

function renderForm() {
  app.innerHTML = `${header()}<main class="page">
    <section class="hero"><span class="badge">${L.badge}</span><h1>${L.title}</h1><p>${L.lead}</p><div class="status">● ${L.status}</div></section>
    <section class="panel build-panel"><div class="build-intro"><span class="kicker">${L.formKicker}</span><h2>${L.formTitle}</h2><p>${L.formText}</p><div class="need-list"><span><b>1</b>${L.needDate}</span><span><b>2</b>${L.needTime}</span><span><b>3</b>${L.needPlace}</span></div></div>
      <div class="form">
        <label class="field"><span>${L.birth}</span><input id="birth" type="date" value="${esc(draft.birth)}" max="${new Date().toISOString().slice(0, 10)}"></label>
        <label class="field"><span>${L.timeKnowledge}</span><select id="time-mode"><option value="exact" ${draft.mode === 'exact' ? 'selected' : ''}>${L.timeModes.exact}</option><option value="approx" ${draft.mode === 'approx' ? 'selected' : ''}>${L.timeModes.approx}</option><option value="unknown" ${draft.mode === 'unknown' ? 'selected' : ''}>${L.timeModes.unknown}</option></select></label>
        ${timeFields()}
        <div class="place-field"><label for="place-query">${L.place}</label><div class="search-row"><input id="place-query" type="search" autocomplete="off" maxlength="80" value="${esc(draft.query)}" placeholder="${L.placePlaceholder}"><button id="search-place" type="button">${L.search}</button></div><small>${L.placeHelp}</small><div id="place-results" class="place-results"></div>${selectedPlace()}<div class="map-actions"><button id="toggle-map" type="button">🗺 ${mapOpen ? L.closeMap : L.chooseOnMap}</button><button id="use-location" type="button">⌖ ${L.useCurrent}</button></div>${mapOpen ? `<div class="map-wrap"><div id="birth-map" aria-label="${L.mapLabel}"></div><p>${L.mapHelp}</p></div>` : ''}<div class="attribution">${L.placeProvider} <a href="https://open-meteo.com/en/docs/geocoding-api" target="_blank" rel="noreferrer">Open‑Meteo / GeoNames</a></div></div>
        <button class="primary" id="build" type="button">${L.build}</button>
      </div>
      <p class="privacy">🔒 ${L.privacy}</p>
    </section>
    <section class="panel accuracy"><span class="kicker">${L.accuracyKicker}</span><h2>${L.accuracyTitle}</h2><div class="accuracy-grid"><article><b>${L.timeModes.exact}</b><p>${L.exactAccuracy}</p></article><article><b>${L.timeModes.approx}</b><p>${L.rangeAccuracy}</p></article><article><b>${L.timeModes.unknown}</b><p>${L.dateAccuracy}</p></article></div></section>
    <p class="disclaimer">${L.disclaimer}</p>
  </main>`;
  bindHeader();
  bindForm();
  if (mapOpen) initMap();
}

function placeLabel(item) {
  return [item.name, item.admin1, item.country].filter(Boolean).filter((value, index, array) => array.indexOf(value) === index).join(', ');
}

function showPlaceResults(message = '') {
  const holder = document.querySelector('#place-results');
  if (!holder) return;
  if (message) { holder.innerHTML = `<div class="search-message">${message}</div>`; return; }
  holder.innerHTML = searchResults.length ? searchResults.map((item, index) => `<button class="place-option" type="button" data-place="${index}"><span><b>${esc(placeLabel(item))}</b><small>${esc(item.timezone || '')}</small></span><i>→</i></button>`).join('') : `<div class="search-message">${L.noPlaces}</div>`;
  holder.querySelectorAll('[data-place]').forEach(button => {
    button.onclick = () => {
      const item = searchResults[Number(button.dataset.place)];
      location = {
        id: item.id,
        display: placeLabel(item),
        name: item.name,
        admin1: item.admin1 || '',
        country: item.country || '',
        latitude: item.latitude,
        longitude: item.longitude,
        elevation: item.elevation || 0,
        timezone: item.timezone
      };
      draft.query = location.display;
      storage.set('pt.horoscope.location', JSON.stringify(location));
      storage.set('pt.horoscope.place', location.display);
      searchResults = [];
      renderForm();
    };
  });
}

async function searchPlaces() {
  saveDraftFromForm();
  if (draft.query.length < 2) return showPlaceResults(L.shortQuery);
  showPlaceResults(L.searching);
  try {
    const endpoint = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(draft.query)}&count=8&language=${encodeURIComponent(lang)}&format=json`;
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('geocoding failed');
    const payload = await response.json();
    searchResults = (payload.results || []).filter(item => item.timezone && Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
    showPlaceResults();
  } catch {
    showPlaceResults(L.searchError);
  }
}

function bindForm() {
  document.querySelector('#time-mode').onchange = event => {
    saveDraftFromForm();
    draft.mode = event.target.value;
    renderForm();
  };
  const period = document.querySelector('#period');
  if (period) period.onchange = event => { draft.period = event.target.value; };
  const query = document.querySelector('#place-query');
  query.oninput = () => {
    draft.query = query.value.trim();
    clearTimeout(searchTimer);
    if (draft.query.length >= 3) searchTimer = setTimeout(searchPlaces, 550);
  };
  query.onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); searchPlaces(); } };
  document.querySelector('#search-place').onclick = searchPlaces;
  document.querySelector('#toggle-map').onclick = () => { saveDraftFromForm(); mapOpen = !mapOpen; renderForm(); };
  document.querySelector('#use-location').onclick = useCurrentLocation;
  const clear = document.querySelector('#clear-place');
  if (clear) clear.onclick = () => { location = null; draft.query = ''; localStorage.removeItem('pt.horoscope.location'); localStorage.removeItem('pt.horoscope.place'); renderForm(); };
  document.querySelector('#build').onclick = build;
}

function selectCoordinates(latitude, longitude, source) {
  try {
    const timezone = globalThis.tzlookup(Number(latitude), Number(longitude));
    location = {
      display: fmt(source === 'current' ? L.currentPoint : L.mapPoint, { latitude: Number(latitude).toFixed(4), longitude: Number(longitude).toFixed(4) }),
      name: source === 'current' ? L.currentPointShort : L.mapPointShort,
      admin1: '', country: '', latitude: Number(latitude), longitude: Number(longitude), elevation: 0, timezone, source
    };
    draft.query = location.display;
    storage.set('pt.horoscope.location', JSON.stringify(location));
    storage.set('pt.horoscope.place', location.display);
    renderForm();
    toast(L.pointSaved);
  } catch {
    toast(L.errors.coordinates);
  }
}

function initMap() {
  const holder = document.querySelector('#birth-map');
  if (!holder || !globalThis.L) return;
  const center = location ? [Number(location.latitude), Number(location.longitude)] : [20, 0];
  const map = globalThis.L.map(holder, { worldCopyJump: true }).setView(center, location ? 9 : 2);
  globalThis.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  let marker = location ? globalThis.L.circleMarker(center, { radius: 8, color: '#ffe98f', weight: 3, fillColor: '#6d54d6', fillOpacity: 1 }).addTo(map) : null;
  map.on('click', event => {
    const { lat, lng } = event.latlng;
    if (marker) marker.setLatLng(event.latlng); else marker = globalThis.L.circleMarker(event.latlng, { radius: 8, color: '#ffe98f', weight: 3, fillColor: '#6d54d6', fillOpacity: 1 }).addTo(map);
    selectCoordinates(lat, lng, 'map');
  });
  setTimeout(() => map.invalidateSize(), 0);
}

function useCurrentLocation() {
  if (!navigator.geolocation) return toast(L.locationUnavailable);
  toast(L.locating);
  navigator.geolocation.getCurrentPosition(
    position => selectCoordinates(position.coords.latitude, position.coords.longitude, 'current'),
    () => toast(L.locationDenied),
    { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
  );
}

function saveInputs() {
  storage.set('pt.syutsai.birth', draft.birth);
  storage.set('pt.syutsai.birthTime', draft.mode === 'exact' ? draft.exactTime : '');
  storage.set('pt.horoscope.timeMode', draft.mode);
  storage.set('pt.horoscope.period', draft.period);
  storage.set('pt.horoscope.ready', '1');
}

async function build() {
  saveDraftFromForm();
  if (!draft.birth) return toast(L.errors.birth);
  if (draft.mode === 'exact' && !draft.exactTime) return toast(L.errors.time);
  if (!location) return toast(L.errors.place);
  try {
    buildNatalChart(globalThis.Astronomy, { birth: draft.birth, mode: draft.mode, exactTime: draft.exactTime, period: draft.period, location });
  } catch (error) {
    return toast(error instanceof RangeError ? L.errors.timezone : L.errors.calculation);
  }
  saveInputs();
  await showCalculationLoader({ kind: 'horoscope', lang });
  view = 'result';
  render();
  revealCalculatedResult(app.querySelector('.result-page'));
  scrollTo({ top: 0, behavior: 'smooth' });
}

function degreeText(degree) {
  let whole = Math.floor(degree);
  let minutes = Math.round((degree - whole) * 60);
  if (minutes === 60) { whole += 1; minutes = 0; }
  return `${whole}°${String(minutes).padStart(2, '0')}′`;
}

function signName(id) {
  return `${L.zodiac[id].symbol} ${L.zodiac[id].name}`;
}

function positionLabel(position, showDegree = true) {
  if (position.stable === false) return position.possibleSigns.map(signName).join(` ${L.or} `);
  return `${signName(position.id)}${showDegree ? ` · ${degreeText(position.degree)}` : ''}`;
}

function wheel(chart) {
  const showDegree = chart.precision === 'exact';
  const point = (angle, radius) => {
    const radians = angle * Math.PI / 180;
    return `left:${50 + Math.sin(radians) * radius}%;top:${50 - Math.cos(radians) * radius}%`;
  };
  const signs = SIGN_IDS.map((id, index) => {
    const angle = index * 30 + 15;
    return `<span class="wheel-sign" style="${point(angle, 43)}">${L.zodiac[id].symbol}</span>`;
  }).join('');
  const planets = chart.positions.map((position, index) => {
    const angle = position.longitude;
    const radius = 29 + (index % 3) * 4;
    return `<span class="wheel-planet" title="${esc(L.planets[position.body])}: ${esc(positionLabel(position, showDegree))}" style="${point(angle, radius)}">${BODY_SYMBOLS[position.body]}</span>`;
  }).join('');
  const asc = chart.ascendant ? `<span class="wheel-angle asc" style="${point(chart.ascendant.longitude, 38)}">ASC</span>` : '';
  return `<div class="wheel" aria-label="${L.wheelLabel}"><div class="wheel-lines"></div>${signs}${planets}${asc}<div class="wheel-center"><b>${L.chart}</b><span>${chart.precision === 'exact' ? L.precision.exact : chart.precision === 'range' ? L.precision.range : L.precision.dateOnly}</span></div></div>`;
}

function placementText(position) {
  const role = L.planetRoles[position.body];
  if (!position.stable) return `${role} ${L.timeSensitive}`;
  return `${role} ${L.signStyles[position.id]}`;
}

function bigCard(kind, position, possible = [], showDegree = true) {
  const title = L.big[kind];
  const symbol = kind === 'sun' ? '☉' : kind === 'moon' ? '☾' : '↗';
  if (!position) {
    const labels = possible.map(signName).join(` ${L.or} `);
    return `<article class="big-card uncertain"><span>${symbol}</span><div><small>${title}</small><h3>${labels || L.notCalculated}</h3><p>${possible.length ? L.ascRangeText : L.ascUnknownText}</p></div></article>`;
  }
  return `<article class="big-card"><span>${symbol}</span><div><small>${title}</small><h3>${positionLabel(position, showDegree)}</h3><p>${placementText(position)}</p></div></article>`;
}

function planetCard(position, showDegree = true) {
  const house = position.house ? `<span class="house-tag">${fmt(L.houseTag, { number: position.house })}</span>` : '';
  const retrograde = position.retrograde && !['Sun', 'Moon'].includes(position.body) ? `<span class="retro">R · ${L.retrograde}</span>` : '';
  return `<article class="planet-card"><div class="planet-head"><span class="planet-symbol">${BODY_SYMBOLS[position.body]}</span><div><small>${L.planets[position.body]}</small><h3>${positionLabel(position, showDegree)}</h3></div></div><p>${placementText(position)}</p><div class="planet-meta">${house}${retrograde}</div></article>`;
}

function aspects(chart) {
  if (!chart.aspects.length) return `<div class="empty-note">${L.noStableAspects}</div>`;
  return `<div class="aspect-list">${chart.aspects.map(aspect => `<article><b>${BODY_SYMBOLS[aspect.first]} ${L.planets[aspect.first]} — ${BODY_SYMBOLS[aspect.second]} ${L.planets[aspect.second]}</b><span>${L.aspects[aspect.id]} · ${fmt(L.orb, { value: aspect.orb.toFixed(1) })}</span><p>${L.aspectTexts[aspect.id]}</p></article>`).join('')}</div>`;
}

function houses(chart) {
  if (!chart.houses) return `<div class="empty-note"><b>${L.housesUnavailableTitle}</b><p>${chart.precision === 'dateOnly' ? L.housesUnknown : L.housesRange}</p></div>`;
  return `<div class="houses-grid">${chart.houses.map(item => `<article><b>${item.house}</b><div><h3>${L.houseThemes[item.house - 1]}</h3><p>${signName(item.sign)}</p></div></article>`).join('')}</div>`;
}

function localeTag() {
  return { ru: 'ru-RU', kk: 'kk-KZ', en: 'en-US', fr: 'fr-FR' }[lang] || 'ru-RU';
}

function shortDate(value) {
  return new Intl.DateTimeFormat(localeTag(), { day: 'numeric', month: 'short' }).format(new Date(value));
}

function monthDate(value) {
  return new Intl.DateTimeFormat(localeTag(), { month: 'long', year: 'numeric' }).format(new Date(value));
}

function personalStory(chart, sun, moon) {
  const J = L.journal;
  const profile = J.signs;
  const ascendantId = chart.ascendant?.id || (chart.possibleAscendants.length === 1 ? chart.possibleAscendants[0] : null);
  const venus = chart.positions.find(item => item.body === 'Venus');
  const mars = chart.positions.find(item => item.body === 'Mars');
  const name = storage.get('pt.syutsai.name').trim();
  const title = fmt(J.ui.namedTitle, { name: esc(name || J.ui.fallbackName) });
  const ascendant = ascendantId
    ? `<article><small>${J.ui.ascTitle} · ${signName(ascendantId)}</small><p>${profile[ascendantId].outer}</p></article>`
    : `<article><small>${J.ui.ascTitle}</small><p>${J.ui.ascMissing}</p></article>`;
  return `<section class="panel journal-story"><span class="kicker">${J.ui.storyKicker}</span><h2>${title}</h2><p class="journal-lead">${J.ui.storyLead}</p>
    <div class="story-flow"><article><small>${J.ui.sunTitle} · ${signName(sun.id)}</small><p>${profile[sun.id].core}</p></article><article><small>${J.ui.moonTitle} · ${signName(moon.id)}</small><p>${profile[moon.id].inner}</p></article>${ascendant}</div>
    <p class="blend-note">${J.ui.blend}</p>
    <div class="life-grid"><article><span>♡</span><div><h3>${J.ui.loveTitle}</h3><p>${profile[venus.id].love}</p></div></article><article><span>↗</span><div><h3>${J.ui.workTitle}</h3><p>${profile[mars.id].work}</p></div></article><article><span>✦</span><div><h3>${J.ui.adviceTitle}</h3><p>${profile[sun.id].advice}</p></div></article></div>
  </section>`;
}

function eventReason(event, yearly = false) {
  const F = L.journal.forecast;
  return fmt(yearly ? F.yearReason : F.reason, {
    transit: L.planets[event.transitBody],
    transitSign: L.zodiac[event.transitSign].name,
    aspect: L.aspects[event.aspect].toLowerCase(),
    target: L.planets[event.natalBody],
    natalSign: L.zodiac[event.natalSign].name,
    date: shortDate(event.date)
  });
}

function eventNarrative(event) {
  const F = L.journal.forecast;
  const house = event.house ? ` ${fmt(F.houseLead, { house: L.houseThemes[event.house - 1].toLowerCase() })}` : '';
  return `${F.moves[event.transitBody]} ${F.areas[event.natalBody]} ${F.tones[event.aspect]}${house}`;
}

function eventCard(event, yearly = false, featured = false) {
  const F = L.journal.forecast;
  return `<article class="forecast-card ${featured ? 'featured' : ''}"><div class="forecast-card-top"><span>${yearly ? monthDate(event.date) : shortDate(event.date)}</span><b>${F.headlines[event.aspect]}</b></div><p>${eventNarrative(event)}</p><details><summary>${L.journal.ui.why}</summary><p>${eventReason(event, yearly)}</p></details></article>`;
}

function weeklyForecast(forecast, chart) {
  const J = L.journal;
  const events = forecast.events;
  const content = events.length
    ? `${eventCard(events[0], false, true)}${events.length > 1 ? `<h3 class="more-title">${J.ui.moreEvents}</h3><div class="forecast-grid">${events.slice(1, 4).map(event => eventCard(event)).join('')}</div>` : ''}`
    : `<div class="empty-note">${J.ui.weekEmpty}</div>`;
  const dates = events.length ? `<div class="date-chips"><b>${J.ui.importantDays}</b>${events.slice(0, 4).map(event => `<span>${shortDate(event.date)}</span>`).join('')}</div>` : '';
  return `<section class="panel journal-forecast week"><span class="kicker">${J.ui.weekKicker}</span><h2>${J.ui.weekTitle}</h2><p class="journal-lead">${fmt(J.ui.weekLead, { start: shortDate(forecast.start), end: shortDate(forecast.end) })}</p>${content}${dates}<p class="forecast-precision">${chart.houses ? J.ui.exactBenefit : J.ui.noHouseForecast}</p></section>`;
}

function yearlyForecast(forecast) {
  const J = L.journal;
  const content = forecast.events.length
    ? `<div class="year-timeline">${forecast.events.slice(0, 6).map(event => eventCard(event, true)).join('')}</div>`
    : `<div class="empty-note">${J.ui.yearEmpty}</div>`;
  return `<section class="panel journal-forecast year"><span class="kicker">${J.ui.yearKicker}</span><h2>${fmt(J.ui.yearTitle, { year: forecast.year })}</h2><p class="journal-lead">${J.ui.yearLead}</p>${content}</section>`;
}

function supportCard(sun) {
  const J = L.journal;
  return `<section class="panel support-card"><div><span class="kicker">${J.ui.supportKicker}</span><h2>${J.ui.supportTitle}</h2><p>${J.donate[sun.id]}</p><small>${J.ui.supportLead}</small></div><div class="support-actions"><a href="${SUPPORT.boosty}" target="_blank" rel="noopener">${J.ui.boosty}</a><a href="${SUPPORT.kofi}" target="_blank" rel="noopener">☕ ${J.ui.kofi}</a><button id="support-share" type="button">🚀 ${J.ui.shareButton}</button><small class="share-privacy">🔒 ${J.ui.sharePrivacy}</small><small>${J.ui.supportPrivacy}</small></div><aside class="ambassador-note"><span>📣</span><div><b>${J.ui.ambassadorTitle}</b><p>${J.ui.ambassadorText}</p><small>${J.ui.ambassadorButton}</small></div></aside></section>`;
}

async function shareProject() {
  const data = { title: 'Portable Tests', text: L.journal.ui.shareText, url: ONLINE };
  try {
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(`${data.text}\n${data.url}`);
      toast(L.journal.ui.copied);
    }
  } catch (error) {
    if (error?.name !== 'AbortError') toast(L.journal.ui.shareError);
  }
}

function renderResult() {
  let chart;
  try {
    chart = buildNatalChart(globalThis.Astronomy, { birth: draft.birth, mode: draft.mode, exactTime: draft.exactTime, period: draft.period, location });
  } catch {
    view = 'form';
    renderForm();
    return toast(L.errors.calculation);
  }
  const sun = chart.positions.find(item => item.body === 'Sun');
  const moon = chart.positions.find(item => item.body === 'Moon');
  let forecasts = { week: { start: new Date().toISOString(), end: new Date().toISOString(), events: [] }, year: { year: new Date().getFullYear(), events: [] } };
  try { forecasts = buildPersonalForecasts(globalThis.Astronomy, chart, new Date()); } catch {}
  const showDegree = chart.precision === 'exact';
  const timeValue = draft.mode === 'exact' ? draft.exactTime : draft.mode === 'approx' ? L.periods[draft.period] : L.timeModes.unknown;
  app.innerHTML = `${header()}<main class="page result-page">
    <div class="result-tools"><span class="precision-badge ${chart.precision}">${L.precision[chart.precision]}</span><button id="edit" type="button">${L.edit}</button></div>
    <section class="result-hero panel"><div><span class="kicker">${L.resultKicker}</span><h1>${L.resultTitle}</h1><p>${fmt(L.resultLead, { place: esc(location.display) })}</p><div class="birth-line"><span>📅 ${esc(draft.birth)}</span><span>🕰 ${esc(timeValue)}</span><span>📍 ${esc(location.display)}</span></div></div>${wheel(chart)}</section>
    ${personalStory(chart, sun, moon)}
    ${weeklyForecast(forecasts.week, chart)}
    ${yearlyForecast(forecasts.year)}
    <section class="panel"><span class="kicker">${L.bigKicker}</span><h2>${L.bigTitle}</h2><p>${L.bigIntro}</p><div class="big-grid">${bigCard('sun', sun, [], showDegree)}${bigCard('moon', moon, [], showDegree)}${bigCard('ascendant', chart.ascendant, chart.possibleAscendants, showDegree)}</div></section>
    <section class="panel"><span class="kicker">${L.planetsKicker}</span><h2>${L.planetsTitle}</h2><p>${L.planetsIntro}</p><div class="planet-grid">${chart.positions.map(position => planetCard(position, showDegree)).join('')}</div></section>
    <section class="panel"><span class="kicker">${L.aspectsKicker}</span><h2>${L.aspectsTitle}</h2><p>${L.aspectsIntro}</p>${aspects(chart)}</section>
    <section class="panel"><span class="kicker">${L.housesKicker}</span><h2>${L.housesTitle}</h2><p>${L.housesIntro}</p>${houses(chart)}</section>
    <details class="panel method"><summary>${L.methodTitle}</summary><p>${fmt(L.methodText, { timezone: esc(location.timezone), latitude: Number(location.latitude).toFixed(4), longitude: Number(location.longitude).toFixed(4) })}</p><p>${L.houseMethod}</p><p>${L.engineNote}</p><p class="sample-times">UTC: ${chart.samples.map(value => new Date(value).toISOString().slice(0, 16).replace('T', ' ')).join(' · ')}</p></details>
    ${supportCard(sun)}
    <div class="actions"><button class="primary" id="edit-bottom" type="button">${L.edit}</button><a href="../syutsai/">${L.backTitle}</a><a href="../index.html">${L.otherTests}</a></div>
    <p class="disclaimer">${L.journal.ui.journalNote} ${L.disclaimer}</p>
  </main>`;
  bindHeader();
  const edit = () => { view = 'form'; renderForm(); scrollTo({ top: 0, behavior: 'smooth' }); };
  document.querySelector('#edit').onclick = edit;
  document.querySelector('#edit-bottom').onclick = edit;
  document.querySelector('#support-share').onclick = shareProject;
}

function render() {
  if (view === 'result' && draft.birth && location) return renderResult();
  renderForm();
}

document.documentElement.lang = lang;
L = await load(lang);
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('../service-worker.js').then(registration => registration.update()).catch(() => {});
