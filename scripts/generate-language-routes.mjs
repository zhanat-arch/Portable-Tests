// Generates thin 200-status language pages while keeping one source implementation.
import {readdir,rm,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),langs=['ru','kk','en','fr'],skip=new Set([...langs,'blog','downloads','.git','.github','_site','workers','node_modules']);
const generic={
  ru:{title:'PortHub — твой порт в мир развлечений',description:'Тесты, игры и интерактивные развлечения PortHub.'},
  kk:{title:'PortHub — ойын-сауық әлеміне апарар портыңыз',description:'PortHub тесттері, ойындары және интерактивті ойын-сауықтары.'},
  en:{title:'PortHub — your port to entertainment',description:'Tests, games and interactive entertainment from PortHub.'},
  fr:{title:'PortHub — votre porte vers le divertissement',description:'Tests, jeux et divertissements interactifs par PortHub.'}
};
const social={
  'games/index.html':{
    image:'porthub-games-v1.jpg',
    ru:['Игры PortHub','Браузерные игры для компьютера и телефона.'],
    kk:['PortHub ойындары','Компьютер мен телефонға арналған браузерлік ойындар.'],
    en:['PortHub Games','Browser games for desktop and mobile.'],
    fr:['Jeux PortHub','Des jeux sur navigateur pour ordinateur et mobile.']
  },
  'games/2048/index.html':{
    image:'porthub-2048-v1.jpg',
    ru:['2048 PortHub','Три жизни, сохранение прогресса и комнаты друзей.'],
    kk:['2048 PortHub','Үш өмір, прогресті сақтау және достар бөлмелері.'],
    en:['2048 PortHub','Three lives, saved progress and friend rooms.'],
    fr:['2048 PortHub','Trois vies, progression sauvegardée et salons entre amis.']
  },
  'tests/matrix-iq/index.html':{
    image:'porthub-iq-matrix-v1.jpg',
    ru:['IQ Matrix Test · PortHub','12 визуальных матриц и 12 минут на поиск закономерностей.'],
    kk:['IQ Matrix Test · PortHub','Заңдылықтарды табуға арналған 12 көрнекі матрица және 12 минут.'],
    en:['IQ Matrix Test · PortHub','12 visual matrices and 12 minutes to find the patterns.'],
    fr:['IQ Matrix Test · PortHub','12 matrices visuelles et 12 minutes pour trouver les régularités.']
  }
};
const escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
async function walk(dir=''){
  const entries=await readdir(path.join(root,dir),{withFileTypes:true}),files=[];
  for(const entry of entries){
    const rel=path.posix.join(dir,entry.name);
    if(entry.isDirectory()&&!skip.has(entry.name))files.push(...await walk(rel));
    else if(entry.isFile()&&entry.name.endsWith('.html')&&rel!=='index.html')files.push(rel);
  }
  return files;
}
for(const lang of langs){
  const home=path.join(root,lang,'index.html'),pages=await walk();
  for(const source of pages){
    const out=path.join(root,lang,...source.split('/'));
    await mkdir(path.dirname(out),{recursive:true});
    const from=path.posix.join(lang,path.posix.dirname(source));
    const loader=path.posix.relative(from,'language-route.js');
    const target=path.posix.relative(from,source);
    const card=social[source],copy=card?.[lang]??[generic[lang].title,generic[lang].description];
    const route=source.replace(/index\.html$/,'').replace(/\.html$/, '/');
    const canonical=`https://porthub.fyi/${lang}/${route}`;
    const image=`https://porthub.fyi/assets/og/${card?.image??'porthub-home-v2.jpg'}`;
    const html=`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow"><meta name="description" content="${escapeHtml(copy[1])}"><meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(copy[0])}"><meta property="og:description" content="${escapeHtml(copy[1])}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${image}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${image}"><link rel="canonical" href="${canonical}"><title>${escapeHtml(copy[0])}</title></head><body><script src="${loader}" data-lang="${lang}" data-source="${target}"></script></body></html>\n`;
    await writeFile(out,html);
  }
}
console.log(`Generated localized routes for ${(await walk()).length} pages × ${langs.length} languages.`);
