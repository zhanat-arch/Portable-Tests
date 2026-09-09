// Generates thin 200-status language pages while keeping one source implementation.
import {readdir,rm,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),langs=['ru','kk','en','fr'],skip=new Set([...langs,'downloads','.git','node_modules']);
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
    const html=`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow"><title>PortHub</title></head><body><script src="${loader}" data-lang="${lang}" data-source="${target}"></script></body></html>\n`;
    await writeFile(out,html);
  }
}
console.log(`Generated localized routes for ${(await walk()).length} pages × ${langs.length} languages.`);
