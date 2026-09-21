// One source HTML per episode; only this build step enumerates the directory.
import {readFile,readdir,mkdir,writeFile,unlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {UI} from '../blog/development/ui.mjs';
import {FEATURES,POST_UI} from '../blog/development/features.mjs';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const LANGS=['ru','kk','en','fr'];
const SIZE=10,BASE='blog/development',ORIGIN='https://porthub.fyi';
const COPY={
 ru:{blogs:'Блоги',intro:'Истории и заметки из жизни PortHub.',open:'Читать хроники →',back:'← Все выпуски',page:'Страница',empty:'Выпуски скоро появятся.',order:'Для последовательного чтения выпуски идут от старых к новым. Можно выбрать другой порядок.',previous:'← Предыдущие',next:'Следующие →'},
 kk:{blogs:'Блогтар',intro:'PortHub өмірінен әңгімелер мен жазбалар.',open:'Хрониканы оқу →',back:'← Барлық шығарылым',page:'Бет',empty:'Шығарылымдар жақында шығады.',order:'Ретімен оқу үшін шығарылымдар ескісінен жаңасына қарай берілген. Қаласаңыз, ретін өзгертіңіз.',previous:'← Алдыңғы',next:'Келесі →'},
 en:{blogs:'Blogs',intro:'Stories and notes from life at PortHub.',open:'Read the chronicles →',back:'← All issues',page:'Page',empty:'New issues are on their way.',order:'Episodes run from oldest to newest so you can follow the story. Switch the order whenever you prefer.',previous:'← Previous',next:'Next →'},
 fr:{blogs:'Blogs',intro:'Histoires et notes sur la vie de PortHub.',open:'Lire les chroniques →',back:'← Tous les épisodes',page:'Page',empty:'Les épisodes arrivent bientôt.',order:'Les épisodes vont du plus ancien au plus récent pour suivre le récit. Changez l’ordre selon vos préférences.',previous:'← Précédents',next:'Suivants →'}
};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain=s=>s.replace(/<[^>]*>/g,' ').replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g,c=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&nbsp;':' '}[c])).replace(/\s+/g,' ').trim();
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,16);
const exists=async p=>readFile(p,'utf8').catch(e=>{if(e.code==='ENOENT')return null;throw e});
function attrs(text,file){
 const out={},re=/\s+([a-z][a-z0-9-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/gy;
 let pos=0;
 while(pos<text.length){
  if(!text.slice(pos).trim())break;
  re.lastIndex=pos;const m=re.exec(text);
  if(!m||Object.hasOwn(out,m[1]))throw Error(file+': malformed or duplicate attribute');
  out[m[1]]=m[2]??m[3];pos=re.lastIndex;
 }
 return out;
}
// Deliberately small authoring format, not executable HTML from an AI response.
function validateBody(body,file){
 const allowed=new Set(['h2','h3','p','blockquote','ul','ol','li','strong','em','br','a','img','figure','figcaption','footer','code']);
 const voids=new Set(['br','img']),stack=[];
 for(const m of body.matchAll(/<([^>]+)>/g)){
  const closing=m[1].startsWith('/'),tag=/^\/?([a-z][a-z0-9]*)\b/.exec(m[1])?.[1];
  if(!allowed.has(tag))throw Error(file+': forbidden HTML tag '+m[1]);
  const tail=m[1].slice(tag.length+(closing?1:0)).replace(/\/$/,'');
  if(closing){if(tail.trim()||stack.pop()!==tag)throw Error(file+': unbalanced '+tag);continue}
  const a=attrs(tail,file);
  for(const [key,value] of Object.entries(a)){
   const valid=key==='class'&&/^(quote|post-image)$/.test(value)
    ||['title','alt'].includes(key)
    ||tag==='a'&&key==='href'&&(/^(https:\/\/|\/[^/]|#)/.test(value))&&!/[\s\\&]/.test(value)
    ||tag==='img'&&key==='src'&&/^\/blog\/development\/assets\/[a-zA-Z0-9_./-]+$/.test(value)&&!value.includes('..')
    ||tag==='img'&&['width','height'].includes(key)&&/^[1-9]\d*$/.test(value)
    ||tag==='img'&&key==='loading'&&value==='lazy';
   if(!valid)throw Error(file+': unsupported '+key+' on '+tag);
  }
  if(tag==='img'&&(!a.src||!a.alt))throw Error(file+': image requires src and meaningful alt');
  if(!voids.has(tag))stack.push(tag);
 }
 if(stack.length)throw Error(file+': unclosed HTML tag');
 if((body.match(/<h2>/g)||[]).length!==1||!/^\s*<h2>[^<]+<\/h2>/.test(body))throw Error(file+': start with one plain-text h2 title');
 if(!/<p\b/.test(body))throw Error(file+': missing article text');
 return body.replace(/<img\b([^>]*)>/g,(_,a)=>'<img'+a.replace(/\s+loading="lazy"/g,'')+' loading="lazy">');
}
export function parsePost(source,filename){
 const name=path.basename(filename),idText=name.replace(/\.html$/,'');
 if(!/^[1-9]\d*\.html$/.test(name)||!Number.isSafeInteger(Number(idText)))throw Error(name+': use a positive safe integer filename, no leading zeroes');
 const metadata={};
 for(const m of source.matchAll(/<meta\b([^>]*)>/g)){
  const a=attrs(m[1],name);
  if(a.name?.startsWith('post-')){
   if(Object.hasOwn(metadata,a.name))throw Error(name+': duplicate '+a.name);
   metadata[a.name]=a.content;
  }
 }
 if(metadata['post-id']!==idText)throw Error(name+': post-id must match filename');
 const date=metadata['post-date'],status=metadata['post-status']||'published';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error(name+': invalid date');
 if(!['published','draft'].includes(status))throw Error(name+': invalid post-status');
 const versions={};
 for(const m of source.matchAll(/<template\b([^>]*)>([\s\S]*?)<\/template>/g)){
  const a=attrs(m[1],name),lang=a['data-lang'];
  if(!LANGS.includes(lang)||versions[lang]||Object.keys(a).length!==1)throw Error(name+': invalid/duplicate language block');
  const html=validateBody(m[2].trim(),name+' ['+lang+']');
  const title=plain(html.match(/^<h2>([\s\S]*?)<\/h2>/)[1]);
  const fullSummary=plain(html.match(/<p>([\s\S]*?)<\/p>/)?.[1]||'');
  const summary=fullSummary.length>190?fullSummary.slice(0,187).replace(/\s+\S*$/,'')+'…':fullSummary;
  versions[lang]={title,summary,html};
 }
 if(LANGS.some(l=>!versions[l]))throw Error(name+': all four languages are required');
 return {id:Number(idText),date,status,versions};
}
const catalogPath=(lang,order='oldest',page=1)=>lang+'/'+BASE+'/'+(order==='newest'?'newest/':'')+(page>1?'page/'+page+'/':'');
const postPath=(lang,id)=>lang+'/'+BASE+'/'+id+'/';
function safeGenerated(p){
 if(typeof p!=='string'||p.includes('..')||p.includes('\\')||path.posix.isAbsolute(p))return false;
 return /^((ru|kk|en|fr)\/blog\/(development\/((newest\/)?(page\/\d+\/)?|\d+\/))?index\.html|blog\/index\.html|blog\/development\/(index\.html|index\.json|sitemap-\d+\.xml|index\/(ru|kk|en|fr)\/(oldest|newest)\/\d+\.json)|sitemap\.xml)$/.test(p);
}
export async function buildBlog({sourceRoot=ROOT,outRoot=ROOT,features=FEATURES}={}){
 if(!['off','latest','popular'].includes(features.comments.preview||'off'))throw Error('Invalid comments preview mode');
 if(!Number.isInteger(features.comments.previewLimit)||features.comments.previewLimit<1||features.comments.previewLimit>5)throw Error('Preview limit must be 1–5');
 if(features.comments.enabled&&!/^\/blog\/development\/[a-zA-Z0-9_-]+\.js$/.test(features.comments.adapter||''))throw Error('Comments require a local /blog/development/<adapter>.js');
 if(features.comments.enabled)await readFile(path.join(sourceRoot,features.comments.adapter.slice(1)));
 const folder=path.join(sourceRoot,BASE,'posts'),names=(await readdir(folder)).filter(n=>n.endsWith('.html'));
 const posts=[];
 for(const name of names){
  const p=parsePost(await readFile(path.join(folder,name),'utf8'),name);
  // Catch broken local images before publication, without fetching external sites.
  for(const v of Object.values(p.versions))for(const m of v.html.matchAll(/<img[^>]*src="([^"]+)"/g)){
   await readFile(path.join(sourceRoot,m[1].slice(1)));
  }
  if(p.status==='published')posts.push(p);
 }
 posts.sort((a,b)=>a.id-b.id);
 const template=await readFile(path.join(sourceRoot,BASE,'template.html'),'utf8'),outputs=new Map(),urls=[];
 const revision=hash(JSON.stringify(posts)+template+JSON.stringify(UI)+JSON.stringify(features)+JSON.stringify(POST_UI));
 const set=(rel,body)=>{if(!safeGenerated(rel))throw Error('Unsafe output: '+rel);outputs.set(rel,body.endsWith('\n')?body:body+'\n')};
 const disclaimer=l=>'<aside class="disclaimer"><span class="disclaimer-icon">🎭</span><div><strong>'+esc(UI[l].disclaimerTitle)+'</strong><p>'+esc(UI[l].disclaimer)+'</p></div></aside>';
 const article=(p,l,single=false)=>'<article class="post" id="post-'+p.id+'"><div class="post-meta"><a href="/'+postPath(l,p.id)+'">'+esc(UI[l].issue)+' '+p.id+'</a><time datetime="'+p.date+'">'+esc(new Intl.DateTimeFormat(l,{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(p.date+'T12:00:00Z')))+'</time></div>'+p.versions[l].html.replace(/^<h2>([\s\S]*?)<\/h2>/,(_,title)=>single?'<h1>'+title+'</h1>':'<h2><a href="/'+postPath(l,p.id)+'">'+title+'</a></h2>')+(single?'':postTools(p,l,true))+'</article>';

 function postTools(p,l,compact){
  const t=POST_UI[l],url=ORIGIN+'/'+postPath(l,p.id),key='development/'+p.id;
  const soon={ru:'Комментарии пока не подключены',kk:'Пікірлер әзірге қосылмаған',en:'Comments are not connected yet',fr:'Les commentaires ne sont pas encore disponibles'}[l];
  const commentLink=features.comments.enabled?'<a class="post-icon" href="'+url+'#post-comments" aria-label="'+esc(t.comments)+'" title="'+esc(t.comments)+'">💬</a>':'<span title="'+esc(soon)+'"><button type="button" class="post-icon" disabled aria-label="'+esc(soon)+'">💬</button></span>';
  const share=features.share?'<button type="button" data-post-share title="'+esc(t.share)+'" aria-label="'+esc(t.share)+'">↗'+(compact?'':' '+esc(t.share))+'</button>':'';
  const copy=features.share&&!compact?'<button type="button" data-post-copy>'+esc(t.copy)+'</button>':'';
  const buttons='<div class="post-share">'+share+copy+(compact?commentLink:'')+'</div><p class="post-feedback" role="status" aria-live="polite"></p><input class="post-link" readonly hidden aria-label="'+esc(t.link)+'" value="'+url+'">';
  const preview=features.comments.enabled&&['latest','popular'].includes(features.comments.preview);
  const comments=compact?'<div data-comments-preview data-preview-mode="'+esc(features.comments.preview||'off')+'" data-preview-limit="'+features.comments.previewLimit+'" data-comments-adapter="'+esc(preview?features.comments.adapter:'')+'"'+(preview?'':' hidden')+'></div>':'<section id="post-comments" data-thread-key="'+key+'" data-comments-adapter="'+esc(features.comments.enabled?features.comments.adapter:'')+'"'+(features.comments.enabled?'':' hidden')+'><h2>'+esc(t.comments)+'</h2><button type="button" data-comments-load>'+esc(t.load)+'</button><p class="comments-feedback" role="status"></p><div data-comments-mount></div></section>';
  return '<section class="post-tools'+(compact?' compact':'')+'" data-post-id="'+p.id+'" data-post-language="'+l+'" data-post-title="'+esc(p.versions[l].title)+'" data-post-url="'+url+'" data-thread-key="'+key+'" data-copied="'+esc(t.copied)+'" data-manual="'+esc(t.manual)+'" data-loading="'+esc(t.loading)+'" data-comments-error="'+esc(t.error)+'">'+buttons+comments+'</section>';
 }
 function page(rel,l,{title,description,content,kind='catalog',order='',schema=null,alternate}){
  const root=path.posix.relative(path.posix.dirname(rel+'index.html'),'.')+'/';
  const data={lang:l,title:esc(title),description:esc(description),type:kind==='post'?'article':'website',canonical:ORIGIN+'/'+rel,root,kind,order,home:'/'+l+'/',homeLabel:esc(UI[l].home),languages:LANGS.map(x=>'<option value="'+x+'"'+(x===l?' selected':'')+'>'+x.toUpperCase()+'</option>').join(''),alternates:LANGS.map(x=>'<link rel="alternate" hreflang="'+x+'" href="'+ORIGIN+'/'+alternate(x)+'">').join('\n'),schema:schema?'<script type="application/ld+json" data-pt-schema>'+JSON.stringify(schema).replace(/</g,'\\u003c')+'</script>':'',content};
  set(rel+'index.html',template.replace(/{{([a-zA-Z]+)}}/g,(_,key)=>{if(!(key in data))throw Error('Unknown template key '+key);return data[key]}).replace(/[ \t]+$/gm,''));
  urls.push({path:rel});
 }
 function pager(l,order,n,total){
  const c=COPY[l],link=(k,label)=>'<a href="/'+catalogPath(l,order,k)+'">'+esc(label)+'</a>';
  return '<nav class="blog-pagination" aria-label="'+esc(c.page)+'">'+(n>1?link(n-1,c.previous):'<span></span>')+'<span>'+esc(c.page)+' '+n+' / '+total+'</span>'+(n<total?link(n+1,c.next):'<span></span>')+'</nav>';
 }
 const pages=Math.max(1,Math.ceil(posts.length/SIZE));
 set(BASE+'/index.json',JSON.stringify({schema:1,revision,total:posts.length,pageSize:SIZE,pages,firstId:posts[0]?.id??null,lastId:posts.at(-1)?.id??null,languages:LANGS,pagePattern:'index/{lang}/{order}/{page}.json'},null,2));
 for(const l of LANGS){
  const ui=UI[l],c=COPY[l];
  page(l+'/blog/',l,{kind:'portal',title:c.blogs+' · PortHub',description:c.intro,alternate:x=>x+'/blog/',content:'<section class="hero"><p class="eyebrow">PORTHUB</p><h1>'+esc(c.blogs)+'</h1><p class="lead">'+esc(c.intro)+'</p></section><article class="post"><h2><a href="/'+catalogPath(l)+'">'+plain(ui.title)+'</a></h2><p>'+esc(ui.description)+'</p><a class="back" href="/'+catalogPath(l)+'">'+esc(c.open)+'</a></article>'});
  for(const order of ['oldest','newest']){
   const ordered=order==='oldest'?posts:[...posts].reverse();
   for(let n=1;n<=pages;n++){
    const slice=ordered.slice((n-1)*SIZE,n*SIZE);
    set(BASE+'/index/'+l+'/'+order+'/'+n+'.json',JSON.stringify({schema:1,revision,page:n,pages,items:slice.map(p=>({id:p.id,date:p.date,title:p.versions[l].title,summary:p.versions[l].summary,url:'/'+postPath(l,p.id)}))}));
    const intro='<section class="hero"><p class="eyebrow">'+esc(ui.eyebrow)+'</p><h1>'+ui.title+'</h1><p class="lead">'+esc(ui.lead)+'</p><div class="authors">'+ui.authors+'</div></section>';
    const controls='<p class="order-explanation">'+esc(c.order)+'</p><nav class="reading-order" aria-label="'+esc(ui.order)+'"><span>'+esc(ui.order)+'</span><div>'+['oldest','newest'].map(o=>'<a data-order="'+o+'" href="/'+catalogPath(l,o)+'"'+(o===order?' aria-current="page"':'')+'>'+esc(ui[o])+'</a>').join('')+'</div></nav>';
    const nav='<nav class="contents" aria-label="'+esc(ui.issues)+'">'+slice.map(p=>'<a href="#post-'+p.id+'">'+p.id+'</a>').join('')+'</nav>';
    page(catalogPath(l,order,n),l,{title:ui.pageTitle+(n>1?' · '+c.page+' '+n:''),description:ui.description,order,alternate:x=>catalogPath(x,order,n),content:intro+disclaimer(l)+controls+nav+'<section class="chronicles">'+(slice.map(p=>article(p,l)).join('')||'<p>'+esc(c.empty)+'</p>')+'</section>'+pager(l,order,n,pages)});
   }
  }
  for(let i=0;i<posts.length;i++){
   const p=posts[i],v=p.versions[l];
   const tools=postTools(p,l,false);
   const returnOldest='/'+catalogPath(l,'oldest',Math.floor(i/SIZE)+1)+'#post-'+p.id;
   const returnNewest='/'+catalogPath(l,'newest',Math.floor((posts.length-1-i)/SIZE)+1)+'#post-'+p.id;
   const backAttrs=' data-post-back data-return-oldest="'+returnOldest+'" data-return-newest="'+returnNewest+'" href="'+returnOldest+'"';
   const nav='<nav class="blog-pagination">'+(i?'<a href="/'+postPath(l,posts[i-1].id)+'">'+esc(POST_UI[l].previous)+'</a>':'<span></span>')+'<a'+backAttrs+'>'+esc(POST_UI[l].back)+'</a>'+(i+1<posts.length?'<a href="/'+postPath(l,posts[i+1].id)+'">'+esc(POST_UI[l].next)+'</a>':'<span></span>')+'</nav>';
   page(postPath(l,p.id),l,{kind:'post',title:v.title+' · PortHub',description:v.summary,alternate:x=>postPath(x,p.id),content:'<a class="back"'+backAttrs+'>'+esc(c.back)+'</a>'+disclaimer(l)+article(p,l,true)+tools+nav,schema:{'@context':'https://schema.org','@type':'BlogPosting',headline:v.title,datePublished:p.date,inLanguage:l,description:v.summary,url:ORIGIN+'/'+postPath(l,p.id),author:{'@type':'Organization',name:'PortHub'}}});
  }
 }
 // Unprefixed URLs retain browser-language detection and old #post-N bookmarks.
 for(const rel of ['blog/',BASE+'/']){
  const links=LANGS.map(l=>'<a href="/'+l+'/'+rel+'">'+l.toUpperCase()+'</a>').join(' · ');
  set(rel+'index.html','<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="canonical" href="'+ORIGIN+'/ru/'+rel+'"><title>PortHub · Blog</title></head><body data-blog-page="redirect"><nav>'+links+'</nav><script src="/'+BASE+'/app.js?v=11713"></script></body></html>');
 }
 // Keep all non-blog sitemap entries intact; split the blog at the sitemap limit.
 const core=await readFile(path.join(sourceRoot,'sitemap-pages.xml'),'utf8');
 if(!core.includes('<urlset'))throw Error('Missing base sitemap');
 const sitemapFiles=[];
 for(let i=0;i<urls.length;i+=45000){
  const rel=BASE+'/sitemap-'+(i/45000+1)+'.xml';sitemapFiles.push(rel);
  set(rel,'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.slice(i,i+45000).map(u=>'  <url><loc>'+ORIGIN+'/'+u.path+'</loc>'+(u.date?'<lastmod>'+u.date+'</lastmod>':'')+'</url>').join('\n')+'\n</urlset>');
 }
 set('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+['sitemap-pages.xml',...sitemapFiles].map(p=>'  <sitemap><loc>'+ORIGIN+'/'+p+'</loc></sitemap>').join('\n')+'\n</sitemapindex>');
 const manifestRel=BASE+'/.generated.json',previous=JSON.parse(await exists(path.join(outRoot,manifestRel))||'[]');
 if(!Array.isArray(previous)||previous.some(p=>!safeGenerated(p)))throw Error('Unsafe generated-file manifest');
 // Nothing is written until every source and output has passed validation.
 for(const [rel,body] of outputs){const target=path.join(outRoot,rel);await mkdir(path.dirname(target),{recursive:true});if(await exists(target)!==body)await writeFile(target,body)}
 for(const rel of previous)if(!outputs.has(rel))await unlink(path.join(outRoot,rel)).catch(e=>{if(e.code!=='ENOENT')throw e});
 await writeFile(path.join(outRoot,manifestRel),JSON.stringify([...outputs.keys()].sort(),null,2)+'\n');
 return {posts:posts.length,pages,files:outputs.size,revision};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const at=process.argv.indexOf('--out');
 console.log(await buildBlog({outRoot:at>=0?path.resolve(process.argv[at+1]):ROOT}));
}
