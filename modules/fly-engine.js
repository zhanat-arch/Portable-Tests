const FLY_ASSET=globalThis.PORTABLE_FLY_ASSET||(location.pathname.includes('/modules/')?'../assets/fly-meme.webp':'../../assets/fly-meme.webp');
const FUN_TESTS=new Set(['battery','tabs','animal','lifeAnimal','gamer']);
const FLY_COPY={
  ru:{phrase:'Ля ты крыса… меня так никто не обманывал))',caught:'Вот теперь попалась!',hint:'Она устала — жмите!',toggle:'Мемная муха'},
  kk:{phrase:'Әй, қусың ғой… әдемі алдап кеттің))',caught:'Енді ұсталды!',hint:'Шаршады — басыңыз!',toggle:'Мем шыбын'},
  en:{phrase:'You little rat… you got me good 😂',caught:'Got you this time!',hint:'It is tired — tap now!',toggle:'Meme fly'},
  fr:{phrase:'Eh, petit filou… tu m’as bien eu 😂',caught:'Cette fois, je t’ai !',hint:'Elle est fatiguée — touchez !',toggle:'Mouche mème'}
};

export function flyLanguage(){
  const saved=localStorage.getItem('pt.lang'),browser=(navigator.language||'ru').slice(0,2).toLowerCase();
  return ['ru','kk','en','fr'].includes(saved)?saved:(['ru','kk','en','fr'].includes(browser)?browser:'ru');
}
export function flyCopy(){return FLY_COPY[flyLanguage()]||FLY_COPY.ru}

export function playSlap(){
  try{
    const Audio=window.AudioContext||window.webkitAudioContext,ctx=new Audio(),length=Math.floor(ctx.sampleRate*.11),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/length,3);
    const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();filter.type='lowpass';filter.frequency.value=1100;gain.gain.setValueAtTime(.7,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.01,ctx.currentTime+.12);source.buffer=buffer;source.connect(filter).connect(gain).connect(ctx.destination);source.start();setTimeout(()=>ctx.close(),250);
  }catch{}
  navigator.vibrate?.([28,35,45]);
}

function installStyles(){
  if(document.getElementById('pt-fly-styles'))return;
  const style=document.createElement('style');style.id='pt-fly-styles';style.textContent=`
    .pt-meme-fly{position:fixed;z-index:9998;display:grid;place-items:center;width:50px;height:50px;padding:0;border:0;border-radius:50%;background:#fff0;filter:drop-shadow(0 5px 6px #0008);font-size:37px;line-height:1;cursor:crosshair;will-change:transform;touch-action:manipulation;user-select:none}.pt-meme-fly::after{content:"";position:absolute;inset:5px;border:2px solid #f7cd73;border-radius:50%;opacity:0;transform:scale(.7)}.pt-meme-fly.tired{animation:ptFlyPant .22s infinite alternate;filter:drop-shadow(0 0 11px #f7cd73)}.pt-meme-fly.tired::after{opacity:1;animation:ptFlyTarget .65s infinite alternate}.pt-fly-hint{position:fixed;z-index:9997;max-width:170px;padding:8px 10px;border-radius:12px;background:#171321;color:#fff;font:800 12px/1.25 system-ui;text-align:center;pointer-events:none;box-shadow:0 10px 30px #0005}.pt-fly-overlay{position:fixed;z-index:999999;inset:0;display:grid;place-items:center;padding:18px;background:#090711e8;backdrop-filter:blur(9px);animation:ptFlyIn .18s ease-out}.pt-fly-meme{width:min(560px,100%);max-height:calc(100vh - 24px);overflow:auto;border:1px solid #ffffff2c;border-radius:27px;background:#171229;color:#fff;box-shadow:0 30px 100px #000b;text-align:center}.pt-fly-meme.video{width:min(390px,100%)}.pt-fly-media{padding:0!important;aspect-ratio:1.3;background:#0b0914}.pt-fly-meme.video .pt-fly-media{height:min(61vh,610px);aspect-ratio:9/16}.pt-fly-meme img,.pt-fly-meme iframe{display:block;width:100%;height:100%;border:0;object-fit:cover}.pt-fly-copy{padding:18px 22px}.pt-fly-meme strong{display:block;color:#f5cf76;font:900 clamp(1.35rem,5vw,2.2rem)/1.05 system-ui;letter-spacing:-.035em}.pt-fly-meme span{display:block;margin-top:8px;color:#d8d1e3;font:700 .95rem/1.4 system-ui}.pt-fly-close{margin-top:13px;min-height:44px;padding:10px 18px;border:0;border-radius:13px;background:#f5cf76;color:#21172d;font-weight:900;cursor:pointer}@keyframes ptFlyPant{to{transform:scale(.9) rotate(7deg)}}@keyframes ptFlyTarget{to{transform:scale(1.18);opacity:.35}}@keyframes ptFlyIn{from{opacity:0;transform:scale(.96)}}@media(prefers-reduced-motion:reduce){.pt-meme-fly.tired,.pt-meme-fly.tired::after,.pt-fly-overlay{animation:none}}
  `;document.head.appendChild(style);
}

export function showFlyMeme({duration=2500,onClose}={}){
  installStyles();const isRu=flyLanguage()==='ru';if(!isRu)playSlap();
  document.querySelector('.pt-fly-overlay')?.remove();
  const copy=flyCopy(),media=isRu?'<iframe src="https://www.youtube-nocookie.com/embed/XXs4cNBSW_M?autoplay=1&playsinline=1&rel=0&start=3" title="Оригинальный прикол" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>':`<img src="${FLY_ASSET}" alt="">`,overlay=document.createElement('div');overlay.className='pt-fly-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.innerHTML=`<section class="pt-fly-meme ${isRu?'video':''}"><div class="pt-fly-media">${media}</div><div class="pt-fly-copy"><strong>${copy.phrase}</strong><span>${copy.caught}</span><button class="pt-fly-close" type="button">OK</button></div></section>`;
  let closed=false,timer;const close=()=>{if(closed)return;closed=true;clearTimeout(timer);overlay.remove();onClose?.()};overlay.querySelector('.pt-fly-close').onclick=close;overlay.onclick=event=>{if(event.target===overlay)close()};document.body.appendChild(overlay);overlay.querySelector('.pt-fly-close').focus();if(isRu)window.ptAnalytics?.track('fly_original_video_open');timer=setTimeout(close,duration);return close;
}

export class FlyMemeEngine{
  constructor(){this.fly=null;this.hint=null;this.frame=0;this.attempts=0;this.tired=false;this.enabled=localStorage.getItem('fly_enabled')!=='false';this.position={x:80,y:120,vx:2.1,vy:1.7};this.onSetting=event=>this.toggleFlySetting(event.detail);addEventListener('pt:fly-setting',this.onSetting)}
  maybeSpawn({step,testId}){
    if(!this.enabled||!FUN_TESTS.has(testId)||this.fly||document.querySelector('.pt-fly-overlay'))return;
    const key=`pt.fly.spawn.${testId}`,spawn=Number(sessionStorage.getItem(key))||2+Math.floor(Math.random()*2);sessionStorage.setItem(key,String(spawn));
    if(step!==spawn||sessionStorage.getItem(`${key}.seen`))return;sessionStorage.setItem(`${key}.seen`,'1');this.spawn();
  }
  spawn(){
    installStyles();this.attempts=0;this.tired=false;this.position={x:Math.max(12,innerWidth*.65),y:Math.max(90,innerHeight*.22),vx:2+Math.random()*1.8,vy:1.5+Math.random()*1.5};
    const fly=document.createElement('button');fly.type='button';fly.className='pt-meme-fly';fly.setAttribute('aria-label',flyCopy().toggle);fly.textContent='🪰';fly.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation();this.hit()});document.body.appendChild(fly);this.fly=fly;this.animate();window.ptAnalytics?.track('fly_easter_egg_spawn');
  }
  animate=()=>{
    if(!this.fly)return;if(!this.tired){const p=this.position,w=innerWidth-58,h=innerHeight-70;p.x+=p.vx;p.y+=p.vy;if(p.x<6||p.x>w){p.vx*=-1;p.x=Math.max(6,Math.min(w,p.x))}if(p.y<64||p.y>h){p.vy*=-1;p.y=Math.max(64,Math.min(h,p.y))}this.fly.style.transform=`translate3d(${p.x}px,${p.y}px,0) rotate(${p.vx*4}deg)`}this.frame=requestAnimationFrame(this.animate)
  };
  dodge(){const p=this.position;p.vx=(2.8+Math.random()*3.8)*(Math.random()>.5?1:-1);p.vy=(2.3+Math.random()*3.4)*(Math.random()>.5?1:-1);p.x=Math.max(8,Math.min(innerWidth-64,p.x+(Math.random()-.5)*150));p.y=Math.max(70,Math.min(innerHeight-76,p.y+(Math.random()-.5)*130))}
  hit(){
    if(this.tired){window.ptAnalytics?.track('fly_easter_egg_caught',{attempts:this.attempts});this.remove();showFlyMeme();return}
    this.attempts++;if(this.attempts<5){this.dodge();return}
    this.tired=true;this.fly.classList.add('tired');this.hint=document.createElement('div');this.hint.className='pt-fly-hint';this.hint.textContent=flyCopy().hint;document.body.appendChild(this.hint);const p=this.position;this.hint.style.left=`${Math.max(8,Math.min(innerWidth-180,p.x-55))}px`;this.hint.style.top=`${Math.max(55,p.y-48)}px`;setTimeout(()=>{if(!this.fly)return;this.tired=false;this.fly.classList.remove('tired');this.hint?.remove();this.hint=null;this.attempts=3;this.dodge()},1500)
  }
  remove(){cancelAnimationFrame(this.frame);this.fly?.remove();this.hint?.remove();this.fly=null;this.hint=null}
  toggleFlySetting(status){this.enabled=Boolean(status);localStorage.setItem('fly_enabled',String(this.enabled));if(!this.enabled)this.remove()}
}

export const flyEngine=new FlyMemeEngine();
