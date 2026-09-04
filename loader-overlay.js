const COPY = {
  ru: {
    title:'Собираем ваш разбор', local:'Расчёт выполняется на этом устройстве',
    horoscope:['Считываем астрологическую матрицу…','Сопоставляем координаты карты неба…','Собираем индивидуальный прогноз…'],
    syutsai:['Сопоставляем числовые коды Сюцай…','Проверяем личные циклы недели…','Собираем понятный разбор…'],
    numerology:['Считываем ответы теста…','Сопоставляем число даты…','Собираем карьерный профиль…'],
    dreams:['Соединяем детали сна…','Сопоставляем три традиции…','Собираем личное толкование…'],
    compatibility:['Сопоставляем знаки зодиака…','Проверяем сочетание чисел Сюцай…','Собираем разбор вашей совместимости…']
  },
  kk: {
    title:'Талдауыңызды жинап жатырмыз', local:'Есеп осы құрылғыда орындалады',
    horoscope:['Астрологиялық матрицаны оқып жатырмыз…','Аспан картасының координаттарын салыстырамыз…','Жеке болжамды жинаймыз…'],
    syutsai:['Сюцай сандық кодтарын салыстырамыз…','Аптаның жеке циклдерін тексереміз…','Түсінікті талдауды жинаймыз…'],
    numerology:['Тест жауаптарын оқимыз…','Күн санын салыстырамыз…','Мансап профилін жинаймыз…'],
    dreams:['Түс детальдерін біріктіреміз…','Үш дәстүрді салыстырамыз…','Жеке жоруды жинаймыз…'],
    compatibility:['Зодиак белгілерін салыстырамыз…','Сюцай сандарының үйлесімін тексереміз…','Үйлесімділік талдауын жинаймыз…']
  },
  en: {
    title:'Assembling your reading', local:'The calculation runs on this device',
    horoscope:['Reading the astrological matrix…','Matching the sky-chart coordinates…','Assembling your personal forecast…'],
    syutsai:['Matching the Syutsai number codes…','Checking your weekly cycles…','Assembling a clear reading…'],
    numerology:['Reading your quiz answers…','Matching the birth-date number…','Assembling your career profile…'],
    dreams:['Connecting the dream details…','Comparing three traditions…','Assembling your personal interpretation…'],
    compatibility:['Matching your zodiac signs…','Checking your Syutsai number pairing…','Assembling your compatibility reading…']
  },
  fr: {
    title:'Création de votre analyse', local:'Le calcul s’effectue sur cet appareil',
    horoscope:['Lecture de la matrice astrologique…','Comparaison des coordonnées du ciel…','Création de votre prévision personnelle…'],
    syutsai:['Comparaison des codes numériques Syutsai…','Vérification de vos cycles de la semaine…','Création d’une analyse claire…'],
    numerology:['Lecture de vos réponses…','Comparaison du nombre de naissance…','Création de votre profil professionnel…'],
    dreams:['Connexion des détails du rêve…','Comparaison de trois traditions…','Création de votre interprétation personnelle…'],
    compatibility:['Comparaison de vos signes du zodiaque…','Vérification des nombres Syutsai…','Création de votre analyse de compatibilité…']
  }
};

let activeLoader = null;

function installStyles() {
  if (document.getElementById('calculation-loader-styles')) return;
  const style = document.createElement('style');
  style.id = 'calculation-loader-styles';
  style.textContent = `
    .calculation-overlay{position:fixed;z-index:9999;inset:0;display:grid;place-items:center;padding:20px;background:radial-gradient(circle at 50% 30%,#372274 0,#111027 46%,#080712 100%);color:#fff;text-align:center;opacity:1;transition:opacity .28s;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.calculation-overlay.closing{opacity:0}.calculation-loader-card{width:min(520px,100%);padding:26px 20px;border:1px solid #ffffff20;border-radius:30px;background:#17142bd9;box-shadow:0 35px 100px #000b;backdrop-filter:blur(18px)}.calculation-canvas{display:block;width:min(320px,78vw);height:min(320px,78vw);margin:auto}.calculation-loader-card h2{margin:4px 0 8px;font-size:clamp(1.65rem,6vw,2.35rem);letter-spacing:-.04em}.calculation-status{min-height:48px;margin:0;color:#d8d0ec;font-size:1rem;line-height:1.5}.calculation-local{display:inline-flex;margin-top:12px;padding:7px 10px;border-radius:999px;background:#ffffff0d;color:#aaa2c2;font-size:.76rem;font-weight:800}.calculation-dots{display:flex;justify-content:center;gap:7px;margin:13px 0 0}.calculation-dots i{width:7px;height:7px;border-radius:50%;background:#6655aa}.calculation-dots i.active{background:#f1c86f;box-shadow:0 0 18px #f1c86f}.calculation-reveal>*{animation:calculation-rise .55s both}.calculation-reveal>*:nth-child(2){animation-delay:.08s}.calculation-reveal>*:nth-child(3){animation-delay:.16s}.calculation-reveal>*:nth-child(4){animation-delay:.24s}.calculation-typewriter::after{content:'▍';color:#735cff;animation:calculation-caret .7s step-end infinite}@keyframes calculation-rise{from{opacity:0;transform:translateY(14px);filter:blur(5px)}to{opacity:1;transform:none;filter:none}}@keyframes calculation-caret{50%{opacity:0}}@media(prefers-reduced-motion:reduce){.calculation-reveal>*{animation:none}.calculation-typewriter::after{display:none}}
  `;
  document.head.appendChild(style);
}

function makeOverlay(copy) {
  const overlay = document.createElement('div');
  overlay.className = 'calculation-overlay';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.innerHTML = `<section class="calculation-loader-card"><canvas class="calculation-canvas" aria-hidden="true"></canvas><h2>${copy.title}</h2><p class="calculation-status"></p><div class="calculation-dots"><i class="active"></i><i></i><i></i></div><span class="calculation-local">🔒 ${copy.local}</span></section>`;
  return overlay;
}

function rotate4([x,y,z,w], angle) {
  let c = Math.cos(angle), s = Math.sin(angle);
  [x,w] = [x*c-w*s, x*s+w*c];
  c = Math.cos(angle*.73); s = Math.sin(angle*.73);
  [y,z] = [y*c-z*s, y*s+z*c];
  c = Math.cos(angle*.41); s = Math.sin(angle*.41);
  [x,y] = [x*c-y*s, x*s+y*c];
  return [x,y,z,w];
}

function animateScanner(canvas) {
  const context = canvas.getContext('2d');
  const vertices = Array.from({length:16},(_,index)=>[index&1?1:-1,index&2?1:-1,index&4?1:-1,index&8?1:-1]);
  const edges = [];
  for (let a=0;a<16;a++) for(let b=a+1;b<16;b++) if(((a^b)&((a^b)-1))===0) edges.push([a,b]);
  const particles = Array.from({length:42},(_,index)=>({a:index*2.399,r:65+(index%7)*13,s:.25+(index%5)*.08,o:.18+(index%4)*.1}));
  let frame = 0, stopped = false;
  const draw = time => {
    if (stopped) return;
    const size = Math.min(360, innerWidth*.78), dpr = Math.min(devicePixelRatio||1,2);
    if (canvas.width !== Math.round(size*dpr)) { canvas.width=Math.round(size*dpr); canvas.height=Math.round(size*dpr); canvas.style.width=`${size}px`; canvas.style.height=`${size}px`; }
    context.setTransform(dpr,0,0,dpr,0,0); context.clearRect(0,0,size,size);
    const center=size/2, t=time/1000;
    for(const particle of particles){const a=particle.a+t*particle.s,x=center+Math.cos(a)*particle.r,y=center+Math.sin(a*1.19)*particle.r*.72;context.fillStyle=`rgba(164,133,255,${particle.o})`;context.beginPath();context.arc(x,y,1.1+(particle.r%3),0,Math.PI*2);context.fill();}
    const points=vertices.map(point=>{const [x,y,z,w]=rotate4(point,t*.8);const p4=2.7/(3.5-w);const X=x*p4,Y=y*p4,Z=z*p4;const p3=3.8/(5-Z);return [center+X*p3*66,center+Y*p3*66,Z];});
    context.lineWidth=1.5; context.shadowBlur=15; context.shadowColor='#9d7cff';
    edges.forEach(([a,b],index)=>{const alpha=.25+((index+frame)%9)/16;const gradient=context.createLinearGradient(points[a][0],points[a][1],points[b][0],points[b][1]);gradient.addColorStop(0,`rgba(112,91,255,${alpha})`);gradient.addColorStop(1,`rgba(242,184,219,${alpha})`);context.strokeStyle=gradient;context.beginPath();context.moveTo(points[a][0],points[a][1]);context.lineTo(points[b][0],points[b][1]);context.stroke();});
    context.shadowBlur=10; points.forEach((point,index)=>{context.fillStyle=index%3?'#b7a5ff':'#f2ca72';context.beginPath();context.arc(point[0],point[1],2.2,0,Math.PI*2);context.fill();});
    context.shadowBlur=0; frame++; requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
  return () => { stopped = true; };
}

async function runCalculationLoader({ kind='horoscope', lang='ru', duration=3000 } = {}) {
  installStyles();
  document.querySelector('.calculation-overlay')?.remove();
  const code = COPY[lang] ? lang : 'ru', copy = COPY[code], statuses = copy[kind] ?? copy.horoscope;
  const overlay = makeOverlay(copy), status = overlay.querySelector('.calculation-status'), dots = [...overlay.querySelectorAll('.calculation-dots i')];
  document.body.appendChild(overlay);
  const stop = animateScanner(overlay.querySelector('canvas'));
  let index = 0;
  status.textContent = statuses[index];
  const timer = setInterval(() => { index = Math.min(index+1,statuses.length-1); status.textContent=statuses[index]; dots.forEach((dot,i)=>dot.classList.toggle('active',i===index)); },800);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  await new Promise(resolve => setTimeout(resolve, reduced ? 450 : duration));
  clearInterval(timer); stop(); overlay.classList.add('closing');
  await new Promise(resolve => setTimeout(resolve, reduced ? 0 : 280));
  overlay.remove();
}

export function showCalculationLoader(options = {}) {
  if (activeLoader) return activeLoader;
  activeLoader = runCalculationLoader(options).finally(() => { activeLoader = null; });
  return activeLoader;
}

export function revealCalculatedResult(root) {
  if (!root) return;
  installStyles();
  root.classList.add('calculation-reveal');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target = root.querySelector('[data-typewriter], h1');
  if (!target || target.dataset.typed === '1') return;
  const value = target.textContent.trim();
  if (!value) return;
  target.dataset.typed = '1';
  target.setAttribute('aria-label', value);
  target.textContent = '';
  target.classList.add('calculation-typewriter');
  let index = 0;
  const step = () => {
    index = Math.min(value.length,index+Math.max(1,Math.ceil(value.length/28)));
    target.textContent = value.slice(0,index);
    if(index<value.length) setTimeout(step,24); else setTimeout(()=>target.classList.remove('calculation-typewriter'),350);
  };
  step();
}
