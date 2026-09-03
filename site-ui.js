const PT_LIVE_ROOT = 'https://zhanat-arch.github.io/Portable-Tests/';
const PT_ROOT = (() => {
  if (location.protocol === 'file:') return PT_LIVE_ROOT;
  const scriptUrl = document.currentScript?.src;
  if (scriptUrl) return new URL('./', scriptUrl).href;
  const projectPath = '/Portable-Tests/';
  return new URL(location.pathname.includes(projectPath) ? projectPath : '/', location.origin).href;
})();
const PT_ONLINE_ROOT = location.protocol === 'file:' ? PT_LIVE_ROOT : PT_ROOT;
const PT_HOME = PT_ONLINE_ROOT;
globalThis.PT_CONFIG = Object.freeze({
  liveRoot: PT_LIVE_ROOT,
  appRoot: PT_ROOT,
  onlineRoot: PT_ONLINE_ROOT,
  url(path = '') { return new URL(path, PT_ROOT).href; },
  onlineUrl(path = '') { return new URL(path, PT_ONLINE_ROOT).href; }
});
const PT_VERSION = '1.10.2';
const PT_GA_ID = 'G-37RB6NC78X';
const PT_SUPPORT = { boosty:'https://boosty.to/zhanat-arch', kofi:'https://ko-fi.com/zhanat_arch' };
const PT_LANGS = ['ru','kk','en','fr'];
let ptInstallPrompt = null;
let ptReloading = false;
const PT_COPY = {
  ru:{title:'Portable Tests остаётся бесплатным',text:'Установите всё приложение, поделитесь им или поддержите разработчика. Личный результат и ответы не передаются.',install:'Установить приложение',installed:'Приложение уже установлено',update:'Проверить обновление',updating:'Обновление проверено · перезагружаю',boosty:'Поддержать проект',kofi:'Угостить кофе',share:'Поделиться приложением',privacy:'Устанавливается главный каталог Portable Tests. При отправке откроется обычная ссылка — без вашего результата.',theme:'Оформление',normal:'Обычная тема',readable:'Читаемая тема',ambassador:'Ищем эксперта по Сюцай и астрологии для сотрудничества.',copied:'Ссылка на приложение скопирована',installTitle:'Как установить Portable Tests',iosSteps:'Откройте страницу в Safari, нажмите «Поделиться» внизу экрана и выберите «На экран Домой».',browserSteps:'Откройте меню браузера и выберите «Установить приложение» или «Добавить на главный экран».',close:'Понятно'},
  kk:{title:'Portable Tests тегін болып қалады',text:'Толық қолданбаны орнатыңыз, бөлісіңіз немесе әзірлеушіні қолдаңыз. Жеке нәтиже мен жауаптар берілмейді.',install:'Қолданбаны орнату',installed:'Қолданба орнатылған',update:'Жаңартуды тексеру',updating:'Жаңарту тексерілді · қайта жүктелуде',boosty:'Жобаны қолдау',kofi:'Кофеге қолдау',share:'Қолданбамен бөлісу',privacy:'Portable Tests басты каталогы орнатылады. Нәтижеңізсіз қарапайым сілтеме жіберіледі.',theme:'Көрініс',normal:'Қалыпты тақырып',readable:'Оқуға ыңғайлы',ambassador:'Сюцай және астрология маманын ынтымақтастыққа шақырамыз.',copied:'Қолданба сілтемесі көшірілді',installTitle:'Portable Tests орнату жолы',iosSteps:'Бетті Safari-де ашыңыз, төмендегі «Бөлісу» батырмасын басып, «Басты экранға» таңдаңыз.',browserSteps:'Браузер мәзірін ашып, «Қолданбаны орнату» немесе «Басты экранға қосу» таңдаңыз.',close:'Түсінікті'},
  en:{title:'Portable Tests stays free',text:'Install the full app, share it, or support the developer. Your personal result and answers are not included.',install:'Install the app',installed:'App is already installed',update:'Check for updates',updating:'Update checked · reloading',boosty:'Support the project',kofi:'Buy a coffee',share:'Share the app',privacy:'This installs the main Portable Tests catalog. Sharing uses the regular link without your result.',theme:'Appearance',normal:'Standard theme',readable:'Readable theme',ambassador:'We are looking for a Syutsai and astrology expert to collaborate with.',copied:'App link copied',installTitle:'How to install Portable Tests',iosSteps:'Open this page in Safari, tap Share at the bottom, then choose “Add to Home Screen”.',browserSteps:'Open the browser menu and choose “Install app” or “Add to Home screen”.',close:'Got it'},
  fr:{title:'Portable Tests reste gratuit',text:'Installez l’application complète, partagez-la ou soutenez le développeur. Votre résultat et vos réponses ne sont pas transmis.',install:'Installer l’application',installed:'Application déjà installée',update:'Vérifier les mises à jour',updating:'Mise à jour vérifiée · rechargement',boosty:'Soutenir le projet',kofi:'Offrir un café',share:'Partager l’application',privacy:'Le catalogue principal Portable Tests sera installé. Le partage utilise le lien normal, sans votre résultat.',theme:'Affichage',normal:'Thème standard',readable:'Thème lisible',ambassador:'Nous cherchons une personne experte en Syutsai et en astrologie pour collaborer.',copied:'Lien de l’application copié',installTitle:'Installer Portable Tests',iosSteps:'Ouvrez cette page dans Safari, touchez Partager en bas, puis « Sur l’écran d’accueil ».',browserSteps:'Ouvrez le menu du navigateur et choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».',close:'Compris'}
};
const PT_METRICS_COPY={
  ru:'Анонимная статистика помогает улучшать приложение. Имена, даты, ответы, тексты снов и результаты не отправляются.',
  kk:'Анонимді статистика қолданбаны жақсартуға көмектеседі. Есімдер, күндер, жауаптар, түс мәтіндері және нәтижелер жіберілмейді.',
  en:'Anonymous usage statistics help improve the app. Names, dates, answers, dream text and results are never sent.',
  fr:'Des statistiques anonymes nous aident à améliorer l’application. Noms, dates, réponses, rêves et résultats ne sont jamais envoyés.'
};
const PT_LEGAL_COPY={ru:'Конфиденциальность и условия',kk:'Құпиялылық және шарттар',en:'Privacy and terms',fr:'Confidentialité et conditions'};
const PT_BRAND_TAGLINE={ru:'Твой порт в мир развлечений',kk:'Ойын-сауық әлеміне апарар портыңыз',en:'Your port to entertainment',fr:'Votre porte vers le divertissement'};
function ptCopy(){return Object.fromEntries(Object.entries(PT_COPY[ptLanguage()]).map(([key,value])=>[key,typeof value==='string'?value.replaceAll('Portable Tests','PortHub'):value]))}

function ptSafeValue(value){return String(value||'').toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,48)}
function ptModuleId(){
  const path=location.pathname.replace(/\/+$/,'').split('/').filter(Boolean);
  const test=ptSafeValue(new URLSearchParams(location.search).get('test'));
  if(test)return `quick_${test}`;
  const rootIndex=path.indexOf('Portable-Tests');
  const parts=path.slice(rootIndex>=0?rootIndex+1:0).filter(part=>!part.endsWith('.html'));
  return ptSafeValue(parts.join('_'))||'home';
}
function ptSafePage(){
  const test=ptSafeValue(new URLSearchParams(location.search).get('test'));
  return `${location.origin}${location.pathname}${test?`?test=${test}`:''}`;
}
function ptTrack(eventName,parameters={}){
  if(typeof window.gtag!=='function')return;
  const safe={module_id:ptModuleId(),language:ptLanguage()};
  for(const [key,value] of Object.entries(parameters))safe[key]=typeof value==='number'?value:ptSafeValue(value);
  window.gtag('event',eventName,safe);
}
function ptAnalytics(){
  if(location.protocol!=='https:'||document.querySelector(`script[data-pt-ga="${PT_GA_ID}"]`))return;
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){window.dataLayer.push(arguments)};
  window.gtag('js',new Date());
  window.gtag('config',PT_GA_ID,{send_page_view:false,anonymize_ip:true,allow_google_signals:false});
  const script=document.createElement('script');script.async=true;script.dataset.ptGa=PT_GA_ID;script.src=`https://www.googletagmanager.com/gtag/js?id=${PT_GA_ID}`;document.head.appendChild(script);
  window.gtag('event','page_view',{page_title:document.title,page_location:ptSafePage(),page_path:location.pathname,module_id:ptModuleId(),language:ptLanguage()});
  document.addEventListener('click',event=>{
    const target=event.target.closest('button,a,[data-object],[data-pin]');if(!target)return;
    let name='',extra={};
    if(target.matches('[data-pt-install]'))name='app_install_click';
    else if(target.matches('[data-pt-share]'))name='app_share';
    else if(target.matches('[data-pt-update]'))name='app_update_check';
    else if(target.matches('[data-pin]')){name='module_pin';extra.item_id=target.dataset.pin}
    else if(target.matches('.open-card,.retake-card')){name='module_open';extra.item_id=target.closest('[data-id]')?.dataset.id}
    else if(target.matches('#start'))name='test_start';
    else if(target.matches('#share,#shareResult'))name='result_share';
    else if(target.matches('#again'))name='test_restart';
    else if(target.matches('#interpret'))name='dream_interpret';
    else if(target.matches('[data-object]'))name='dream_symbol_select';
    else if(target.matches('#throw'))name='dice_throw';
    else if(target.matches('#calculate'))name='calculation_start';
    if(name)ptTrack(name,extra);
  },{capture:true});
  document.addEventListener('change',event=>{if(event.target.matches('[data-played]'))ptTrack('game_known_toggle',{item_id:event.target.dataset.played})});
  const seenResults=new WeakSet(),markResults=()=>document.querySelectorAll('.result-card,.result-page,.result-hero,.meme-result,.gamer-result,.result-head,#result:not([hidden])').forEach(node=>{if(seenResults.has(node))return;seenResults.add(node);ptTrack('result_view',{shared:location.hash.startsWith('#r=')?'yes':'no'})});
  markResults();new MutationObserver(markResults).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  window.ptAnalytics={track:ptTrack,moduleId:ptModuleId};
}

function ptEnsureSeo(){
  const url=ptSafePage(),image=`${PT_HOME}og-cover.webp`,description=document.querySelector('meta[name="description"]')?.content||'PortHub — тесты, игры и личные разборы без регистрации, прямо на вашем устройстве.';
  const ensure=(selector,tag,attributes)=>{let node=document.head.querySelector(selector);if(!node){node=document.createElement(tag);for(const [key,value] of Object.entries(attributes))node.setAttribute(key,value);document.head.appendChild(node)}return node};
  ensure('link[rel="canonical"]','link',{rel:'canonical',href:url}).href=url;
  const metas=[['meta[property="og:type"]',{property:'og:type',content:'website'}],['meta[property="og:url"]',{property:'og:url',content:url}],['meta[property="og:title"]',{property:'og:title',content:document.title}],['meta[property="og:description"]',{property:'og:description',content:description}],['meta[property="og:image"]',{property:'og:image',content:image}],['meta[name="twitter:card"]',{name:'twitter:card',content:'summary_large_image'}]];
  metas.forEach(([selector,attributes])=>{const node=ensure(selector,'meta',attributes);node.content=attributes.content});
  if(!document.querySelector('script[data-pt-schema]')){const schema=document.createElement('script');schema.type='application/ld+json';schema.dataset.ptSchema='';schema.textContent=JSON.stringify({'@context':'https://schema.org','@type':'WebApplication',name:document.title,url,description,applicationCategory:'LifestyleApplication',operatingSystem:'Any',isAccessibleForFree:true,inLanguage:ptLanguage(),offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}});document.head.appendChild(schema)}
}

function ptLanguage(){
  const html=(document.documentElement.lang||'').slice(0,2).toLowerCase();
  if(PT_LANGS.includes(html))return html;
  try{const saved=(localStorage.getItem('pt.lang')||'').slice(0,2).toLowerCase();if(PT_LANGS.includes(saved))return saved}catch{}
  return 'ru';
}

function ptTheme(){
  try{return localStorage.getItem('pt.theme')==='readable'?'readable':'normal'}catch{return 'normal'}
}

function ptApplyTheme(theme){
  const value=theme==='readable'?'readable':'normal';
  document.documentElement.dataset.ptTheme=value;
  try{localStorage.setItem('pt.theme',value)}catch{}
  document.querySelectorAll('[data-pt-theme-choice]').forEach(button=>{
    const active=button.dataset.ptThemeChoice===value;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
}

function ptApplyBranding(){
  const lang=ptLanguage(),tagline=PT_BRAND_TAGLINE[lang];
  document.querySelectorAll('header.top,header.topbar').forEach(header=>{
    header.classList.add('pt-site-header');
    const brand=header.querySelector('a.brand');
    if(!brand)return;
    brand.href=PT_ROOT;
    brand.setAttribute('aria-label',`PortHub — ${tagline}`);
    if(brand.dataset.ptBrandLang===lang)return;
    brand.dataset.ptBrandLang=lang;
    brand.innerHTML=`<span class="brand-wordmark"><span class="brand-port">Port</span><span class="brand-hub">Hub</span></span><span class="brand-tagline">${tagline}</span>`;
  });
}

function ptInstallStyles(){
  if(document.getElementById('pt-global-ui-styles'))return;
  const style=document.createElement('style');
  style.id='pt-global-ui-styles';
  style.textContent=`
    html,body,button,input,select,textarea{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif!important;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;font-synthesis:none}
    body{overflow-wrap:break-word}
    .pt-site-header{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;width:min(1180px,calc(100% - 20px))!important;margin:10px auto 18px!important;padding:11px 14px!important;border:1px solid #2e2a39!important;border-radius:18px!important;background:#15131c!important;color:#fff!important;box-shadow:0 14px 35px #17121f33!important}.pt-site-header .brand{display:grid!important;gap:4px!important;color:#fff!important;text-decoration:none!important}.pt-site-header .brand-wordmark{display:flex!important;align-items:center!important;width:max-content!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#fff!important;font-size:1.52rem!important;font-weight:950!important;line-height:1!important;letter-spacing:-.055em!important;box-shadow:none!important}.pt-site-header .brand-port{display:inline!important;color:#fff!important}.pt-site-header .brand-hub{display:inline!important;margin-left:2px!important;padding:5px 7px 6px!important;border-radius:7px!important;background:linear-gradient(145deg,#a77bff,#7c45ed)!important;color:#0d0b13!important;box-shadow:0 7px 18px #6634df32!important}.pt-site-header .brand-tagline{display:block!important;max-width:none!important;color:#bdb7c7!important;font-size:.52rem!important;font-weight:850!important;line-height:1.1!important;letter-spacing:.055em!important;text-transform:uppercase!important;white-space:nowrap!important}.pt-site-header .tools,.pt-site-header .header-tools{color:#fff}.pt-site-header select,.pt-site-header button,.pt-site-header .tools a{border-color:#494354!important;background:#24212d!important;color:#fff!important}
    .pt-global-footer{position:relative;z-index:7;width:min(980px,calc(100% - 20px));margin:48px auto max(90px,env(safe-area-inset-bottom));padding:clamp(22px,5vw,38px);border:1px solid #36314a;border-radius:28px;background:linear-gradient(145deg,#211b3a,#141222);color:#fff;box-shadow:0 26px 80px #08061155}
    .pt-global-footer *{box-sizing:border-box}.pt-global-footer h2{margin:5px 0 10px;color:#fff;font-size:clamp(1.55rem,5vw,2.35rem);line-height:1.08;letter-spacing:-.025em}.pt-global-footer p{max-width:760px;margin:0;color:#d6d0df;font-size:1rem;line-height:1.65}.pt-footer-kicker{color:#f2cb75;font-size:.75rem;font-weight:850;letter-spacing:.13em;text-transform:uppercase}
    .pt-footer-brand{display:flex;align-items:center;gap:10px;margin-bottom:12px}.pt-footer-wordmark{display:flex;align-items:center;padding:7px 8px 7px 11px;border-radius:10px;background:#0d0c11;color:#fff;font-size:1.5rem;font-weight:950;line-height:1;letter-spacing:-.055em}.pt-footer-wordmark b{margin-left:2px;padding:5px 7px 6px;border-radius:7px;background:linear-gradient(145deg,#a77bff,#7c45ed);color:#0d0b13}.pt-footer-tagline{color:#aaa2b8;font-size:.72rem;font-weight:750;line-height:1.25}.pt-footer-version{color:#f2cb75;font-size:.68rem;font-weight:850}
    .pt-footer-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:22px}.pt-footer-button{display:flex;align-items:center;justify-content:center;min-height:50px;padding:11px 14px;border:1px solid #514964;border-radius:15px;background:#2c2643;color:#fff!important;font-size:.92rem;font-weight:800;text-align:center;text-decoration:none;cursor:pointer}.pt-footer-button.primary{border-color:#f2cb75;background:#f2cb75;color:#20182d!important}.pt-footer-button:hover,.pt-footer-button:focus-visible{outline:3px solid #9c8aff55;outline-offset:2px}.pt-footer-button[data-pt-update]{grid-column:1/-1}
    .pt-footer-privacy{display:block;margin-top:12px;color:#aaa2b8;font-size:.8rem;line-height:1.5}.pt-footer-legal{display:inline-flex;margin-top:11px;color:#f2cb75!important;font-size:.84rem;font-weight:800;text-decoration:none}.pt-footer-legal:hover{text-decoration:underline}.pt-footer-bottom{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-top:24px;padding-top:18px;border-top:1px solid #3b354c}.pt-footer-theme{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.pt-footer-theme>span{margin-right:3px;color:#bdb6c8;font-size:.82rem}.pt-theme-choice{min-height:42px;padding:8px 11px;border:1px solid #4b455b;border-radius:12px;background:#201c31;color:#dcd6e4;font-weight:750;cursor:pointer}.pt-theme-choice.active{border-color:#f2cb75;background:#3a3043;color:#fff}.pt-ambassador{max-width:420px!important;color:#aaa2b8!important;font-size:.8rem!important;text-align:right}
    .pt-global-toast{position:fixed;z-index:10000;left:50%;bottom:90px;transform:translate(-50%,130px);max-width:calc(100% - 24px);padding:12px 16px;border-radius:14px;background:#171321;color:#fff;font-weight:800;text-align:center;transition:.22s}.pt-global-toast.show{transform:translate(-50%,0)}.pt-install-dialog{width:min(500px,calc(100% - 24px));padding:0;border:1px solid #49415c;border-radius:24px;background:#1d1830;color:#fff;box-shadow:0 30px 90px #08061199}.pt-install-dialog::backdrop{background:#0d0a18bb;backdrop-filter:blur(6px)}.pt-install-card{padding:25px}.pt-install-card h2{margin:0 0 12px;color:#fff;font-size:1.65rem}.pt-install-card p{margin:0 0 19px;color:#d6d0df;line-height:1.65}.pt-install-card button{width:100%;min-height:50px;border:0;border-radius:14px;background:#f2cb75;color:#20182d;font-weight:850;cursor:pointer}
    html[data-pt-theme="readable"]{font-size:18px}
    html[data-pt-theme="readable"] body{font-size:1rem}
    html[data-pt-theme="readable"] :where(p,li,label,small,.lead,.muted){line-height:1.72!important;letter-spacing:.002em!important;opacity:1!important}
    html[data-pt-theme="readable"] :where(h1,h2,h3){line-height:1.1!important;letter-spacing:-.025em!important;font-weight:800!important}
    html[data-pt-theme="readable"] :where(button,.btn,a.open-card,a.link-btn){min-height:50px;font-weight:750!important}
    html[data-pt-theme="readable"] :where(.panel,.card,.catalog-card,.block,.feature){backdrop-filter:none!important}
    @media(max-width:680px){.pt-site-header{padding:9px 10px!important;border-radius:15px!important}.pt-site-header .brand-wordmark{font-size:1.3rem!important}.pt-site-header .brand-hub{padding:4px 6px 5px!important}.pt-site-header .brand-tagline{font-size:.42rem!important;max-width:145px!important;overflow:hidden!important;text-overflow:ellipsis!important}.pt-global-footer{border-radius:22px;padding:22px 18px}.pt-footer-actions{grid-template-columns:1fr}.pt-footer-button[data-pt-update]{grid-column:auto}.pt-footer-bottom{align-items:flex-start;flex-direction:column}.pt-ambassador{text-align:left!important}.pt-footer-theme{width:100%}.pt-theme-choice{flex:1}}
    @media(prefers-reduced-motion:reduce){.pt-global-toast{transition:none}}
  `;
  document.head.appendChild(style);
}

function ptRemoveLegacySupport(){
  document.querySelectorAll('.support-card').forEach(element=>element.hidden=true);
  document.querySelectorAll('#support').forEach(button=>button.closest('.support')?.setAttribute('hidden',''));
  document.querySelectorAll('p.support').forEach(element=>element.hidden=true);
}

function ptFooterMarkup(){
  const copy=ptCopy(),theme=ptTheme();
  return `<div class="pt-footer-brand"><span class="pt-footer-wordmark">Port<b>Hub</b></span><span class="pt-footer-tagline">${PT_BRAND_TAGLINE[ptLanguage()]}<br><span class="pt-footer-version">v${PT_VERSION}</span></span></div><h2>${copy.title.replaceAll('Portable Tests','PortHub')}</h2><p>${copy.text}</p><div class="pt-footer-actions"><button class="pt-footer-button primary" type="button" data-pt-install>📲 ${copy.install}</button><button class="pt-footer-button" type="button" data-pt-share>↗ ${copy.share}</button><a class="pt-footer-button" href="${PT_SUPPORT.boosty}" target="_blank" rel="noopener">☕ ${copy.boosty}</a><a class="pt-footer-button" href="${PT_SUPPORT.kofi}" target="_blank" rel="noopener">☕ ${copy.kofi}</a><button class="pt-footer-button" type="button" data-pt-update>↻ ${copy.update} · v${PT_VERSION}</button></div><small class="pt-footer-privacy">🔒 ${copy.privacy.replaceAll('Portable Tests','PortHub')}<br>📊 ${PT_METRICS_COPY[ptLanguage()]}</small><a class="pt-footer-legal" href="${PT_CONFIG.url('privacy/')}">🛡️ ${PT_LEGAL_COPY[ptLanguage()]}</a><div class="pt-footer-bottom"><div class="pt-footer-theme"><span>Аа · ${copy.theme}</span><button class="pt-theme-choice ${theme==='normal'?'active':''}" type="button" data-pt-theme-choice="normal" aria-pressed="${theme==='normal'}">${copy.normal}</button><button class="pt-theme-choice ${theme==='readable'?'active':''}" type="button" data-pt-theme-choice="readable" aria-pressed="${theme==='readable'}">${copy.readable}</button></div><p class="pt-ambassador">📣 ${copy.ambassador}</p></div>`;
}

function ptToast(message){
  let toast=document.querySelector('.pt-global-toast');
  if(!toast){toast=document.createElement('div');toast.className='pt-global-toast';toast.setAttribute('role','status');document.body.appendChild(toast)}
  toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1900);
}

async function ptShareApp(){
  const copy=ptCopy();
  const data={title:'PortHub',text:copy.text,url:PT_HOME};
  try{
    if(navigator.share)await navigator.share(data);
    else{await navigator.clipboard.writeText(PT_HOME);ptToast(copy.copied)}
  }catch(error){if(error?.name!=='AbortError')ptToast(copy.copied)}
}

function ptIsInstalled(){
  return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

function ptInstallHelp(){
  const copy=ptCopy(),isIos=/iphone|ipad|ipod/i.test(navigator.userAgent);
  let dialog=document.querySelector('.pt-install-dialog');
  if(!dialog){dialog=document.createElement('dialog');dialog.className='pt-install-dialog';document.body.appendChild(dialog)}
  dialog.innerHTML=`<div class="pt-install-card"><h2>📲 ${copy.installTitle}</h2><p>${isIos?copy.iosSteps:copy.browserSteps}</p><button type="button">${copy.close}</button></div>`;
  dialog.querySelector('button').addEventListener('click',()=>dialog.close());
  dialog.showModal();
}

async function ptInstallApp(){
  const copy=ptCopy();
  if(ptIsInstalled())return ptToast(copy.installed);
  if(!ptInstallPrompt)return ptInstallHelp();
  ptInstallPrompt.prompt();
  await ptInstallPrompt.userChoice;
  ptInstallPrompt=null;
}

async function ptUpdateApp(){
  const copy=ptCopy();
  try{
    const registration=await navigator.serviceWorker?.getRegistration(PT_ROOT) || await navigator.serviceWorker?.register(`${PT_ROOT}service-worker.js`,{scope:PT_ROOT});
    await registration?.update();
    if(registration?.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});
  }catch{}
  ptToast(copy.updating);
  setTimeout(()=>location.reload(),900);
}

function ptEnsurePwa(){
  if(!document.querySelector('link[rel="manifest"]')){const link=document.createElement('link');link.rel='manifest';link.href=`${PT_ROOT}manifest.webmanifest`;document.head.appendChild(link)}
  if(!document.querySelector('link[rel="apple-touch-icon"]')){const link=document.createElement('link');link.rel='apple-touch-icon';link.href=`${PT_ROOT}icon-192.png`;document.head.appendChild(link)}
  if(!document.querySelector('meta[name="apple-mobile-web-app-capable"]')){const meta=document.createElement('meta');meta.name='apple-mobile-web-app-capable';meta.content='yes';document.head.appendChild(meta)}
  navigator.serviceWorker?.register(`${PT_ROOT}service-worker.js`,{scope:PT_ROOT}).then(registration=>registration.update()).catch(()=>{});
}

function ptRenderFooter(){
  ptInstallStyles();ptRemoveLegacySupport();
  let footer=document.querySelector('.pt-global-footer');
  if(!footer){footer=document.createElement('footer');footer.className='pt-global-footer';document.body.appendChild(footer)}
  footer.innerHTML=ptFooterMarkup();
  footer.querySelector('[data-pt-share]').addEventListener('click',ptShareApp);
  footer.querySelector('[data-pt-install]').addEventListener('click',ptInstallApp);
  footer.querySelector('[data-pt-update]').addEventListener('click',ptUpdateApp);
  footer.querySelectorAll('[data-pt-theme-choice]').forEach(button=>button.addEventListener('click',()=>ptApplyTheme(button.dataset.ptThemeChoice)));
  ptApplyTheme(ptTheme());
}

function ptStart(){
  ptEnsureSeo();
  ptAnalytics();
  ptEnsurePwa();
  ptApplyBranding();
  ptRenderFooter();
  let scheduled=false;
  const refresh=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;ptApplyBranding();ptRemoveLegacySupport()})};
  new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true});
  new MutationObserver(ptRenderFooter).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
}

window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();ptInstallPrompt=event});
window.addEventListener('appinstalled',()=>{ptInstallPrompt=null;ptToast(ptCopy().installed)});
navigator.serviceWorker?.addEventListener('controllerchange',()=>{if(ptReloading)return;ptReloading=true;location.reload()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ptStart,{once:true});else ptStart();
