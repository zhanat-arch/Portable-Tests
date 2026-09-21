// Package only public files. In particular, Worker code, credentials, and drafts
// never enter the Pages artifact, even if present in the developer's checkout.
import {execFileSync} from 'node:child_process';
import {readFile,stat,copyFile,mkdir,readdir,mkdtemp} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {ROOT,buildBlog} from './build-blog.mjs';
await buildBlog();
const target=process.argv.includes('--temp')?await mkdtemp(path.join(os.tmpdir(),'porthub-release-')):path.join(ROOT,'_site');
await mkdir(target,{recursive:true});
if((await readdir(target)).length)throw Error('_site must be empty; use a fresh staging directory before packaging');
const generated=JSON.parse(await readFile(path.join(ROOT,'blog/development/.generated.json'),'utf8'));
const tracked=execFileSync('git',['ls-files','-z'],{cwd:ROOT,encoding:'utf8'}).split('\0').filter(Boolean);
const extra=['blog/development/app.js','blog/development/styles.css','blog/app.js','blog/styles.css','sitemap-pages.xml','robots.txt'];
const files=[...new Set([...tracked,...generated,...extra])];
let count=0;
for(const rel of files){
 if(rel.includes('..')||path.isAbsolute(rel)||rel.includes('\\'))throw Error('Unsafe public path');
 if(/^(\.git|\.github|workers|scripts|docs|_site)(\/|$)/.test(rel)||/(^|\/)node_modules\//.test(rel))continue;
 if(/(^|\/)\./.test(rel)&&rel!=='.nojekyll')continue;
 if(/\.(?:md|toml|sql|map)$/i.test(rel))continue;
 if(/^blog\/development\/(posts\/|template\.html$|ui\.mjs$|features\.mjs$)/.test(rel))continue;
 const source=path.join(ROOT,rel),info=await stat(source).catch(e=>{if(e.code==='ENOENT')return null;throw e});
 if(!info?.isFile())continue;
 const out=path.join(target,rel);await mkdir(path.dirname(out),{recursive:true});await copyFile(source,out);count++;
}
console.log('Public Pages artifact: '+count+' files in '+target+' (no posts sources, drafts, or Worker files).');
