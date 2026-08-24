import { zodiacSign } from '../syutsai/engine.mjs';

const supported = ['ru', 'kk', 'en', 'fr'];
const browserLang = (navigator.language || 'ru').toLowerCase().split('-')[0];
let lang = localStorage.getItem('pt.lang') || (supported.includes(browserLang) ? browserLang : 'ru');
let L;
const app = document.querySelector('#app');
const esc = value => String(value ?? '').replace(/[&<>"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);
const load = async code => {
  try { return await fetch(`locales/${code}.json?v=1`, { cache: 'no-store' }).then(response => response.json()); }
  catch { return fetch('locales/ru.json?v=1', { cache: 'no-store' }).then(response => response.json()); }
};

function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 1600);
}

function render() {
  const birth = localStorage.getItem('pt.syutsai.birth') || '';
  const birthTime = localStorage.getItem('pt.syutsai.birthTime') || '';
  const place = localStorage.getItem('pt.horoscope.place') || '';
  const sign = birth ? L.zodiac[zodiacSign(birth)] : null;
  app.innerHTML = `<header class="top"><a class="brand" href="../index.html"><span class="mark">✦</span><span>${L.app}</span></a><div class="tools"><a href="../syutsai/">← ${L.syutsai}</a><select id="lang" aria-label="${L.language}">${supported.map(code => `<option>${code.toUpperCase()}</option>`).join('')}</select></div></header>
    <main class="page">
      <section class="hero"><span class="badge">${L.badge}</span><h1>${L.title}</h1><p>${L.lead}</p><div class="status">● ${L.status}</div></section>
      <section class="preview panel"><div><span class="kicker">${L.previewKicker}</span><h2>${sign ? `${sign.symbol} ${L.yourSign}: ${sign.name}` : L.previewTitle}</h2><p>${sign ? L.previewReady : L.previewText}</p></div><div class="form"><label>${L.birth}<input id="birth" type="date" value="${esc(birth)}" max="${new Date().toISOString().slice(0, 10)}"></label><label>${L.time}<input id="time" type="time" value="${esc(birthTime)}"></label><label>${L.place}<input id="place" type="text" maxlength="80" value="${esc(place)}" placeholder="${L.placePlaceholder}"></label><button id="preview">${L.previewButton}</button></div><p class="privacy">🔒 ${L.privacy}</p></section>
      <section class="panel roadmap"><span class="kicker">${L.fullKicker}</span><h2>${L.fullTitle}</h2><p>${L.fullText}</p><div class="grid"><article><b>☉</b><h3>${L.sun}</h3><p>${L.sunText}</p></article><article><b>☾</b><h3>${L.moon}</h3><p>${L.moonText}</p></article><article><b>↗</b><h3>${L.ascendant}</h3><p>${L.ascendantText}</p></article><article><b>⌂</b><h3>${L.houses}</h3><p>${L.housesText}</p></article></div><div class="notice">${L.notice}</div></section>
      <a class="back-card" href="../syutsai/"><span>🔮</span><div><b>${L.backTitle}</b><small>${L.backText}</small></div><i>→</i></a>
      <p class="disclaimer">${L.disclaimer}</p>
    </main>`;
  const select = document.querySelector('#lang');
  select.value = lang.toUpperCase();
  select.onchange = async event => { lang = event.target.value.toLowerCase(); localStorage.setItem('pt.lang', lang); document.documentElement.lang = lang; L = await load(lang); render(); };
  document.querySelector('#preview').onclick = () => {
    const date = document.querySelector('#birth').value;
    if (!date) return toast(L.missing);
    localStorage.setItem('pt.syutsai.birth', date);
    localStorage.setItem('pt.syutsai.birthTime', document.querySelector('#time').value);
    localStorage.setItem('pt.horoscope.place', document.querySelector('#place').value.trim());
    render();
  };
}

document.documentElement.lang = lang;
L = await load(lang);
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('../service-worker.js').then(registration => registration.update()).catch(() => {});
