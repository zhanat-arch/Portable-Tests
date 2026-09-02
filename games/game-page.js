const LANGS=['ru','kk','en','fr'];
const UI={
  ru:{language:'Язык',back:'Все игры',play:'Играть',share:'Поделиться игрой',shareText:'Last Stand — Tower Defense с четырьмя картами, восемью видами башен и сохранением прогресса. Играть можно прямо в браузере.',notesTitle:'Наши заметки и лайфхаки',note:'Отправится эта страница с описанием. Игровой прогресс не передаётся.',copied:'Ссылка на игру скопирована.',author:'Автор',source:'Исходный код',license:'Лицензия',changes:'Что изменено у нас'},
  kk:{language:'Тіл',back:'Барлық ойындар',play:'Ойнау',share:'Ойынмен бөлісу',shareText:'Last Stand — төрт картасы, сегіз мұнара түрі және прогресті сақтауы бар Tower Defense. Браузерде бірден ойнауға болады.',notesTitle:'Біздің жазбалар мен лайфхактар',note:'Сипаттамасы бар осы бет жіберіледі. Ойын барысы берілмейді.',copied:'Ойын сілтемесі көшірілді.',author:'Автор',source:'Бастапқы код',license:'Лицензия',changes:'Бізде не өзгерді'},
  en:{language:'Language',back:'All games',play:'Play',share:'Share this game',shareText:'Last Stand is a tower-defense game with four maps, eight tower types, research, and saved progress. Play directly in your browser.',notesTitle:'Our notes and tips',note:'This description page is shared. Your game progress is not included.',copied:'Game link copied.',author:'Author',source:'Source code',license:'License',changes:'What we changed'},
  fr:{language:'Langue',back:'Tous les jeux',play:'Jouer',share:'Partager ce jeu',shareText:'Last Stand est un tower defense avec quatre cartes, huit types de tours, de la recherche et une progression sauvegardée. Jouez dans votre navigateur.',notesTitle:'Nos notes et astuces',note:'Cette page de présentation sera partagée. Votre progression ne sera pas transmise.',copied:'Lien du jeu copié.',author:'Auteur',source:'Code source',license:'Licence',changes:'Nos modifications'}
};
let game=null;
let lang='ru';
const $=selector=>document.querySelector(selector);

function chooseLanguage(){
  const saved=localStorage.getItem('pt.lang');
  if(LANGS.includes(saved))return saved;
  const browser=(navigator.language||'ru').slice(0,2).toLowerCase();
  return LANGS.includes(browser)?browser:'ru';
}

function escapeHtml(value){return String(value).replace(/[&<>'"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s]))}

function render(){
  if(!game)return;
  const t=UI[lang];
  const copy=game.copy[lang]||game.copy.ru;
  const gamesRoot=new URL('../',location.href);
  document.documentElement.lang=lang;
  $('#language').value=lang;
  $('#languageLabel').textContent=t.language;
  $('#backLink').textContent=`← ${t.back}`;
  $('#description').textContent=copy.description;
  $('#features').innerHTML=copy.features.map(item=>`<li>${escapeHtml(item)}</li>`).join('');
  $('#notesTitle').textContent=t.notesTitle;
  $('#notes').innerHTML=(copy.notes||[]).map(note=>`<article class="note-card"><span>${escapeHtml(note.icon)}</span><div><h3>${escapeHtml(note.title)}</h3><p>${escapeHtml(note.text)}</p></div></article>`).join('');
  $('#shareGame').textContent=`↗ ${t.share}`;
  $('#playGame').innerHTML=`<span>${escapeHtml(t.play)}</span><span aria-hidden="true">→</span>`;
  $('#playGame').href=new URL(game.launchPath||game.playPath,gamesRoot).href;
  $('#shareNote').textContent=t.note;
  $('#cover').src=new URL(game.image,gamesRoot).href;
  $('#cover').alt=`${game.title} — Tower Defense`;
  $('#meta').innerHTML=`<p><strong>${escapeHtml(t.author)}:</strong> ${escapeHtml(game.author)} · <strong>${escapeHtml(t.license)}:</strong> <a href="${new URL(`${game.playPath}LICENSE`,gamesRoot).href}" target="_blank">${escapeHtml(game.license)}</a> · <a href="${game.source}" target="_blank" rel="noopener">${escapeHtml(t.source)} ↗</a></p><p><strong>${escapeHtml(t.changes)}:</strong> ${escapeHtml(copy.changes)}</p>`;
}

async function shareGame(){
  const t=UI[lang];
  const pagePath=`games/${document.body.dataset.gameId}/`;
  const url=globalThis.PT_CONFIG?.onlineUrl(pagePath)||new URL(location.href).href;
  const payload={title:`${game.title} — Tower Defense`,text:game.copy[lang]?.shareText||t.shareText,url};
  if(navigator.share){
    try{await navigator.share(payload);return}catch(error){if(error?.name==='AbortError')return}
  }
  try{await navigator.clipboard.writeText(url)}catch{const area=document.createElement('textarea');area.value=url;document.body.append(area);area.select();document.execCommand('copy');area.remove()}
  $('#shareNote').textContent=t.copied;
  setTimeout(()=>{$('#shareNote').textContent=UI[lang].note},2200);
}

$('#language').addEventListener('change',event=>{lang=LANGS.includes(event.target.value)?event.target.value:'ru';localStorage.setItem('pt.lang',lang);window.dispatchEvent(new CustomEvent('pt-language-change',{detail:{lang}}));render()});
$('#shareGame').addEventListener('click',shareGame);

async function init(){
  lang=chooseLanguage();
  const response=await fetch('../games-registry.json',{cache:'no-store'});
  const games=await response.json();
  game=games.find(item=>item.id===document.body.dataset.gameId);
  if(!game)throw new Error('Game not found');
  render();
}

init().catch(error=>{console.error(error);$('#shareNote').textContent=UI[lang].note});
