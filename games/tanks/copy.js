// UI strings used by the static menu and the live match.
const tankCopy = {
  ru: ['Создай матч и пригласи друзей', 'Имя', 'Создать онлайн-матч', 'или войди по коду', 'Код матча', 'Войти', 'Клавиатура + геймпад', 'Два геймпада', 'Вдвоём на одном экране', 'Защищай базу с орлом и отбивай атаки танков.', 'Матч', 'Игроки', 'Отправь ссылку друзьям', 'Скопировать ссылку', 'Начать сейчас', 'Игра окончена', 'Играть снова', 'Уровень', 'Враги', 'Выстрел', 'Турбо', 'Полный экран', 'Игры', 'Подключение…', 'Связь прервалась. Войди в матч снова.', 'Матч не найден.', 'В матче уже четыре игрока.', 'Все матчи заняты. Попробуй позже.', 'Введи код из 16 символов.', 'Ссылка скопирована', 'Счёт', 'Локальная игра', 'Старт', 'В меню', 'Джойстик', 'Звук', 'Матч начнётся, когда подключится второй игрок.'],
  kk: ['Матч ашып, достарыңды шақыр', 'Есім', 'Онлайн матч ашу', 'немесе кодпен кір', 'Матч коды', 'Кіру', 'Пернетақта + геймпад', 'Екі геймпад', 'Бір экранда екі ойыншы', 'Бүркіт бейнеленген базаны танктерден қорға.', 'Матч', 'Ойыншылар', 'Сілтемені достарыңа жібер', 'Сілтемені көшіру', 'Қазір бастау', 'Ойын аяқталды', 'Қайта ойнау', 'Деңгей', 'Жаулар', 'Ату', 'Турбо', 'Толық экран', 'Ойындар', 'Қосылуда…', 'Байланыс үзілді. Матчқа қайта кір.', 'Матч табылмады.', 'Матчта төрт ойыншы бар.', 'Барлық матч бос емес. Кейінірек көр.', '16 таңбалы кодты енгіз.', 'Сілтеме көшірілді', 'Ұпай', 'Жергілікті ойын', 'Бастау', 'Мәзірге', 'Джойстик', 'Дыбыс', 'Екінші ойыншы қосылғанда матч басталады.'],
  en: ['Create a match and invite friends', 'Your name', 'Create online match', 'or join with a code', 'Match code', 'Join', 'Keyboard + gamepad', 'Two gamepads', 'Two players on one screen', 'Defend the eagle base from enemy tanks.', 'Match', 'Players', 'Send this link to friends', 'Copy invite link', 'Start now', 'Game over', 'Play again', 'Stage', 'Enemies', 'Fire', 'Turbo', 'Fullscreen', 'Games', 'Connecting…', 'Disconnected. Join the match again.', 'Match not found.', 'This match already has four players.', 'All matches are busy. Try again later.', 'Enter the 16-character code.', 'Link copied', 'Score', 'Local play', 'Start', 'Back to menu', 'Joystick', 'Sound', 'The match starts when a second player joins.'],
  fr: ['Crée une partie et invite tes amis', 'Ton nom', 'Créer une partie en ligne', 'ou rejoindre avec un code', 'Code de la partie', 'Rejoindre', 'Clavier + manette', 'Deux manettes', 'Deux joueurs sur le même écran', 'Défends la base à l’aigle contre les chars ennemis.', 'Partie', 'Joueurs', 'Envoie ce lien à tes amis', 'Copier le lien', 'Démarrer', 'Partie terminée', 'Rejouer', 'Niveau', 'Ennemis', 'Tir', 'Turbo', 'Plein écran', 'Jeux', 'Connexion…', 'Connexion perdue. Rejoins la partie.', 'Partie introuvable.', 'La partie compte déjà quatre joueurs.', 'Toutes les parties sont occupées. Réessaie plus tard.', 'Saisis le code à 16 caractères.', 'Lien copié', 'Score', 'Jeu local', 'Démarrer', 'Retour au menu', 'Joystick', 'Son', 'La partie démarre à l’arrivée du deuxième joueur.']
};
const tankKeys = 'intro name create or code join keyboardPad pads local hint match players send copy begin over again stage enemies fire turbo fullscreen games connecting disconnected notfound full busy invalid copied score offline start menu joystick sound autoStart'.split(' ');
const tankText = key => tankCopy[tankLanguage][tankKeys.indexOf(key)] || '';
const tankSelect = document.getElementById('tankLang');
let tankLanguage = ['ru','kk','en','fr'].includes(new URLSearchParams(location.search).get('lang'))
  ? new URLSearchParams(location.search).get('lang') : 'en';
if (!new URLSearchParams(location.search).has('lang')) {
  try {
    const pref = localStorage.getItem('pt.lang') || navigator.language?.split('-')[0];
    if (Object.hasOwn(tankCopy, pref)) tankLanguage = pref;
  } catch {}
}
function translateTanks() {
  document.documentElement.lang = tankSelect.value = tankLanguage;
  const set = (selector, key, attr) => {
    const el = document.querySelector(selector);
    if (attr) el.setAttribute(attr, tankText(key));
    else el.textContent = tankText(key);
  };
  for (const [selector,key] of Object.entries({
    '#ovSub':'intro','#createBtn':'create','.ov-or':'or','#joinBtn':'join',
    '[value="keyboard-pad"]':'keyboardPad','[value="pads"]':'pads','#localBtn':'local',
    '#ovMenu .ov-hint':'hint','#matchLabel':'match','#playersLabel':'players','#inviteLabel':'send',
    '#copyBtn':'copy','#beginBtn':'begin','#ovWait .ov-hint':'autoStart',
    '#ovOver .ov-title':'over','#restartBtn2':'again','#stageLabel':'stage','#enemyLabel':'enemies',
    '#fireBtn':'fire','#turboBtn':'turbo','#tankHome':'games','#startBtn':'start','#menuBtn':'menu'
  })) set(selector,key);
  set('#nameInput','name','placeholder'); set('#codeInput','code','placeholder');
  set('#fullscreen','fullscreen','title'); set('#fullscreen','fullscreen','aria-label');
  set('#stick','joystick','aria-label'); set('#mute','sound','aria-label');
  document.getElementById('tankHome').href = '/' + tankLanguage + '/games/';
}
tankSelect.addEventListener('change', () => {
  tankLanguage = tankSelect.value;
  try { localStorage.setItem('pt.lang',tankLanguage); } catch {}
  const url = new URL(location.href);
  url.searchParams.set('lang',tankLanguage);
  history.replaceState(null,'',url);
  translateTanks();
  document.dispatchEvent(new Event('tanklanguage'));
});
translateTanks();
