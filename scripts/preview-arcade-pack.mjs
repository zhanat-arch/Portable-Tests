// Build a review copy from a pinned upstream checkout, outside the public artifact.
import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';

const commit='2770860c6e2b3ab8144a56462d8178fe7e3445c7';
if(!process.argv[2]) throw Error('Usage: node scripts/preview-arcade-pack.mjs <upstream checkout>');
const upstream=path.resolve(process.argv[2]);
const out=path.resolve(import.meta.dirname,'../_site/arcade-review');
const read=file=>execFileSync('git',['-C',upstream,'show',commit+':'+file],{encoding:'utf8',maxBuffer:2_000_000});
const files=execFileSync('git',['-C',upstream,'ls-tree','-r','--name-only',commit],{encoding:'utf8'}).trim().split(/\r?\n/);
const catalog=read('index.html');
const ids=[...catalog.matchAll(/\{ id: '([a-z0-9-]+)',/g)].map(m=>m[1]).filter(id=>id!=='2048');
if(ids.length!==47||new Set(ids).size!==ids.length)throw Error('Unexpected upstream catalog');
const license=read('LICENSE');
if(!license.startsWith('MIT License')||!license.includes('mashukui'))throw Error('Missing upstream license');
const i18n=read('i18n.js');
const analyticsStart=i18n.indexOf('  /* Analytics — GoatCounter');
if(analyticsStart<0||!i18n.includes('var GC_SITE ='))throw Error('Review changed analytics code before importing');
const cleanI18n=i18n.slice(0,analyticsStart)+'})(window);\n';
const stripPromo=html=>html.replace(/^.*href="https:\/\/saveone\.pro".*\r?\n/gm,'');
const allowedUrls=new Set(['http://www.w3.org/2000/svg','https://schema.org','https://github.com/mashukui','https://github.com/mashukui/web-games','https://github.com/mashukui/web-games#add-a-game']);
const pages=new Map([['LICENSE',license],['i18n.js',cleanI18n],['index.html',stripPromo(catalog).replace(/^.*\{ id: '2048',.*\r?\n/m,'')]]);
for(const id of ids){
 const file=id+'/index.html';
 if(!files.includes(file))throw Error('Missing '+file);
 const html=stripPromo(read(file));
 if([...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/gi)].some(m=>m[1]!=='../i18n.js'))throw Error('Unexpected script in '+file);
 pages.set(file,html);
}
for(const [file,html] of pages){
 if(file==='LICENSE')continue;
 if(/saveone\.pro|goatcounter|sendBeacon|XMLHttpRequest|serviceWorker|document\.cookie/i.test(html))throw Error('Review external behavior in '+file);
 for(const m of html.matchAll(/https?:\/\/[^\s"'<>]+/g))if(!allowedUrls.has(m[0]))throw Error('Review URL '+m[0]+' in '+file);
}
for(const [file,html] of pages){
 const dest=path.join(out,file);
 await mkdir(path.dirname(dest),{recursive:true});
 if(await readFile(dest,'utf8').catch(()=>null)!==html)await writeFile(dest,html);
}
console.log(`Prepared ${ids.length} games (original English/French UI among upstream locales) in ${out}`);
