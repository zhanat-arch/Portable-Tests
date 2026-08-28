const LANGS = ['ru', 'kk', 'en', 'fr'];
const UI = {
  ru:{language:'Язык',eyebrow:'ИГРЫ В БРАУЗЕРЕ',title:'Играть можно сразу.',lead:'Полноценные игры, которые работают на компьютере и телефоне. Без регистрации и обязательной установки.',all:'Все',towerDefense:'Tower Defense',catalog:'КАТАЛОГ',open:'Открыть страницу игры',details:'Об игре и лицензии',author:'Автор',source:'Исходный код',license:'Лицензия',version:'Версия исходника',changes:'Что изменено у нас',principlesLabel:'КАК МЫ ДОБАВЛЯЕМ ИГРЫ',principlesTitle:'Открытый код — с честным авторством',principlesText:'Если игра основана на открытом проекте, рядом всегда указаны автор, исходный код, лицензия и наши изменения.',loading:'Загрузка…',error:'Каталог не загрузился. Обновите страницу.'},
  kk:{language:'Тіл',eyebrow:'БРАУЗЕРДЕГІ ОЙЫНДАР',title:'Бірден ойнауға болады.',lead:'Компьютер мен телефонда жұмыс істейтін толық ойындар. Тіркелу және міндетті орнату жоқ.',all:'Барлығы',towerDefense:'Tower Defense',catalog:'КАТАЛОГ',open:'Ойын бетін ашу',details:'Ойын және лицензия туралы',author:'Автор',source:'Бастапқы код',license:'Лицензия',version:'Бастапқы нұсқа',changes:'Бізде не өзгерді',principlesLabel:'ОЙЫНДАРДЫ ҚАЛАЙ ҚОСАМЫЗ',principlesTitle:'Ашық код — авторы анық көрсетіледі',principlesText:'Ойын ашық жобаға негізделсе, авторы, бастапқы коды, лицензиясы және біздің өзгерістеріміз әрдайым көрсетіледі.',loading:'Жүктелуде…',error:'Каталог жүктелмеді. Бетті жаңартыңыз.'},
  en:{language:'Language',eyebrow:'BROWSER GAMES',title:'Play right away.',lead:'Complete games that work on desktop and mobile. No registration or mandatory installation.',all:'All',towerDefense:'Tower Defense',catalog:'CATALOG',open:'Open game page',details:'About the game and license',author:'Author',source:'Source code',license:'License',version:'Upstream version',changes:'What we changed',principlesLabel:'HOW WE ADD GAMES',principlesTitle:'Open source with clear credit',principlesText:'When a game is based on an open project, we always show the author, source, license, and our changes.',loading:'Loading…',error:'The catalog could not load. Refresh the page.'},
  fr:{language:'Langue',eyebrow:'JEUX DANS LE NAVIGATEUR',title:'Jouez tout de suite.',lead:'Des jeux complets sur ordinateur et mobile, sans inscription ni installation obligatoire.',all:'Tout',towerDefense:'Tower Defense',catalog:'CATALOGUE',open:'Ouvrir la page du jeu',details:'À propos du jeu et de la licence',author:'Auteur',source:'Code source',license:'Licence',version:'Version d’origine',changes:'Nos modifications',principlesLabel:'COMMENT NOUS AJOUTONS LES JEUX',principlesTitle:'Open source avec une attribution claire',principlesText:'Lorsqu’un jeu repose sur un projet ouvert, nous indiquons toujours l’auteur, la source, la licence et nos modifications.',loading:'Chargement…',error:'Le catalogue n’a pas pu être chargé. Actualisez la page.'}
};

const state = { lang:'ru', category:'all', games:[] };
const $ = (selector) => document.querySelector(selector);

function initialLanguage(){
  const saved = localStorage.getItem('pt.lang');
  if(LANGS.includes(saved)) return saved;
  const browser = (navigator.language || 'ru').slice(0,2).toLowerCase();
  return LANGS.includes(browser) ? browser : 'ru';
}

function escapeHtml(value){
  return String(value).replace(/[&<>'"]/g,(symbol)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[symbol]));
}

function renderFilters(){
  const t = UI[state.lang];
  $('#filters').innerHTML = [
    ['all', t.all],
    ['tower-defense', `🏰 ${t.towerDefense}`]
  ].map(([id,label])=>`<button type="button" class="filter ${state.category===id?'active':''}" data-category="${id}" aria-pressed="${state.category===id}">${label}</button>`).join('');
}

function renderGames(){
  const t = UI[state.lang];
  const visible = state.games.filter((game)=>state.category==='all'||game.category===state.category);
  $('#games').innerHTML = visible.map((game)=>{
    const copy = game.copy[state.lang] || game.copy.ru;
    const features = copy.features.map((feature)=>`<li>${escapeHtml(feature)}</li>`).join('');
    return `<article class="game-card">
      <a class="game-image" href="${game.path}" aria-label="${escapeHtml(t.open)} — ${escapeHtml(game.title)}"><img src="${game.image}" alt="Last Stand — поле боя Tower Defense" loading="eager"></a>
      <div class="game-content">
        <div class="chips"><span>🏰 ${escapeHtml(t.towerDefense)}</span><span>📱 + 🖥️</span><span class="license-chip">${escapeHtml(game.license)}</span></div>
        <h3>${escapeHtml(game.title)}</h3>
        <p>${escapeHtml(copy.description)}</p>
        <ul class="features">${features}</ul>
        <a class="play" href="${game.path}">${escapeHtml(t.open)} <span aria-hidden="true">→</span></a>
        <details class="attribution">
          <summary>${escapeHtml(t.details)}</summary>
          <dl>
            <div><dt>${escapeHtml(t.author)}</dt><dd>${escapeHtml(game.author)}</dd></div>
            <div><dt>${escapeHtml(t.source)}</dt><dd><a href="${game.source}" target="_blank" rel="noopener">GitHub ↗</a></dd></div>
            <div><dt>${escapeHtml(t.license)}</dt><dd><a href="${game.playPath}LICENSE" target="_blank">${escapeHtml(game.license)} ↗</a></dd></div>
            <div><dt>${escapeHtml(t.version)}</dt><dd><code>${escapeHtml(game.upstreamCommit.slice(0,7))}</code></dd></div>
          </dl>
          <p><strong>${escapeHtml(t.changes)}:</strong> ${escapeHtml(copy.changes)}</p>
        </details>
      </div>
    </article>`;
  }).join('');
}

function renderCopy(){
  const t = UI[state.lang];
  document.documentElement.lang = state.lang;
  document.title = `${state.lang==='ru'?'Игры':state.lang==='kk'?'Ойындар':state.lang==='fr'?'Jeux':'Games'} — Portable Tests`;
  $('#language').value = state.lang;
  $('#languageLabel').textContent = t.language;
  $('#eyebrow').textContent = t.eyebrow;
  $('#title').textContent = t.title;
  $('#lead').textContent = t.lead;
  $('#catalogKicker').textContent = t.catalog;
  $('#catalogTitle').textContent = t.towerDefense;
  $('#principlesLabel').textContent = t.principlesLabel;
  $('#principlesTitle').textContent = t.principlesTitle;
  $('#principlesText').textContent = t.principlesText;
  renderFilters();
  renderGames();
}

$('#language').addEventListener('change',(event)=>{
  state.lang = LANGS.includes(event.target.value) ? event.target.value : 'ru';
  localStorage.setItem('pt.lang',state.lang);
  window.dispatchEvent(new CustomEvent('pt-language-change',{detail:{lang:state.lang}}));
  renderCopy();
});

$('#filters').addEventListener('click',(event)=>{
  const button = event.target.closest('[data-category]');
  if(!button) return;
  state.category = button.dataset.category;
  renderFilters();
  renderGames();
});

async function init(){
  state.lang = initialLanguage();
  try{
    const response = await fetch('./games-registry.json',{cache:'no-store'});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    state.games = await response.json();
    renderCopy();
  }catch(error){
    console.error(error);
    $('#games').innerHTML = `<p class="error">${escapeHtml(UI[state.lang].error)}</p>`;
  }
}

init();
