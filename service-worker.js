const CACHE='porthub-v1.10.2';
const ASSETS=[
  './','./index.html','./styles.css','./brand.css','./app.js','./site-ui.js','./loader-overlay.js','./tests-registry.json','./hub-locales.json','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./og-cover.webp','./robots.txt','./sitemap.xml','./privacy/','./privacy/index.html','./privacy/styles.css','./privacy/app.js','./hero-career.webp','./hero-team.webp','./hero-decisions.webp','./hero-environment.webp','./assets/fly-meme.webp','./assets/fly-sprite.png','./assets/fly-sprite-walk2.png','./assets/fly-sprite-groom.png','./modules/dice-fate.html','./modules/dice-variants.js','./modules/fly-game.html','./modules/fly-game.js','./modules/fly-engine.js','./games/','./games/index.html','./games/styles.css','./games/app.js','./games/game-page.js','./games/games-registry.json','./games/last-stand/','./games/last-stand/index.html','./games/tower-defense/last-stand/docs/hero.png','./games/flatland-td/','./games/flatland-td/index.html','./games/tower-defense/flatland-td/branding/flatland-logo-large.png',
  './tests/career/index.html','./tests/career/styles.css','./tests/career/app.js','./tests/career/data.js',
  './tests/insight/index.html','./tests/insight/styles.css','./tests/insight/app.js','./tests/insight/data.js',
  './tests/quick/index.html','./tests/quick/app.js','./tests/quick/library.js','./tests/quick/app-1.4.3.js','./tests/quick/library-1.4.3.js','./tests/quick/app-1.4.4.js','./tests/quick/library-1.4.4.js',
  './meme-animal-cat.webp','./meme-animal-capybara.webp','./meme-animal-raccoon.webp','./meme-animal-owl.webp','./meme-life-wolf.webp','./meme-life-fox.webp','./meme-life-bear.webp','./meme-life-dolphin.webp',
  './compatibility/index.html','./compatibility/styles.css','./compatibility/app.js','./compatibility/engine.mjs','./compatibility/locales/ru.json','./compatibility/locales/kk.json','./compatibility/locales/en.json','./compatibility/locales/fr.json',
  './astro/dreams/index.html','./astro/dreams/styles.css','./astro/dreams/app.js','./astro/dreams/engine.mjs','./astro/dreams/data/objects.json','./astro/dreams/data/rules.json','./astro/dreams/locales/ru.json','./astro/dreams/locales/kk.json','./astro/dreams/locales/en.json','./astro/dreams/locales/fr.json',
  './syutsai/index.html','./syutsai/styles.css','./syutsai/app.js','./syutsai/engine.mjs','./syutsai/locales/ru.json','./syutsai/locales/kk.json','./syutsai/locales/en.json','./syutsai/locales/fr.json','./syutsai/data/cycles/numbers.json','./syutsai/data/forecast/rules.json','./syutsai/data/share/cards.json',
  './horoscope/index.html','./horoscope/styles.css','./horoscope/journal.css','./horoscope/app.js','./horoscope/engine.mjs','./horoscope/locales/ru.json','./horoscope/locales/kk.json','./horoscope/locales/en.json','./horoscope/locales/fr.json','./horoscope/locales/ru.journal.json','./horoscope/locales/kk.journal.json','./horoscope/locales/en.journal.json','./horoscope/locales/fr.journal.json','./horoscope/vendor/astronomy-engine-2.1.19.min.js','./horoscope/vendor/astronomy-engine.LICENSE.txt','./horoscope/vendor/leaflet-1.9.4.css','./horoscope/vendor/leaflet-1.9.4.js','./horoscope/vendor/leaflet.LICENSE.txt','./horoscope/vendor/tz-lookup-6.1.25.js','./horoscope/vendor/tz-lookup.LICENSE.txt'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response}).catch(()=>caches.match(request,{ignoreSearch:true}).then(hit=>hit||caches.match('./index.html'))));
    return;
  }
  event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}return response}).catch(()=>caches.match(request,{ignoreSearch:true})));
});
