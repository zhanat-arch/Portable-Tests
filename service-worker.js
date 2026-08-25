const CACHE='portable-tests-v1.8.4';
const ASSETS=[
  './','./index.html','./manifest.webmanifest','./icon.svg','./hero-career.png','./hero-team.png','./hero-decisions.png','./hero-environment.png',
  './tests/career/index.html','./tests/career/styles.css','./tests/career/app.js','./tests/career/data.js',
  './tests/insight/index.html','./tests/insight/styles.css','./tests/insight/app.js','./tests/insight/data.js',
  './tests/quick/index.html','./tests/quick/app.js','./tests/quick/library.js','./tests/quick/app-1.4.3.js','./tests/quick/library-1.4.3.js','./tests/quick/app-1.4.4.js','./tests/quick/library-1.4.4.js',
  './downloads/career-interests.html','./downloads/team.html','./downloads/decisions.html','./downloads/environment.html','./downloads/battery.html','./downloads/tabs.html','./downloads/animal.html','./downloads/lifeAnimal.html',
  './meme-animal-cat.png','./meme-animal-capybara.png','./meme-animal-raccoon.png','./meme-animal-owl.png','./meme-life-wolf.png','./meme-life-fox.png','./meme-life-bear.png','./meme-life-dolphin.png',
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
