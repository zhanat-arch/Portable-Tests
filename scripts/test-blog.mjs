import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,copyFile,rm,stat} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {buildBlog,parsePost,ROOT,LANGS} from './build-blog.mjs';
const source='<html><head><meta name="post-id" content="1"><meta name="post-date" content="2026-08-21"><meta name="post-status" content="published"></head><body>'+LANGS.map(lang=>'<template data-lang="'+lang+'"><h2>Test episode</h2><p>Example content.</p><footer>PortHub</footer></template>').join('')+'</body></html>';
const fixture=(id,status='published')=>source.replace('name="post-id" content="1"','name="post-id" content="'+id+'"').replace('content="published"','content="'+status+'"');
async function temporary(fn){
 const dir=await mkdtemp(path.join(os.tmpdir(),'porthub-blog-test-'));
 try{return await fn(dir)}finally{await rm(dir,{recursive:true,force:true})}
}
test('source format: four languages, numeric IDs, dates, safe author HTML',()=>{
 assert.equal(parsePost(source,'1.html').versions.en.title,'Test episode');
 assert.throws(()=>parsePost(source,'01.html'));
 assert.throws(()=>parsePost(source,'2.html'));
 assert.throws(()=>parsePost(source.replace('2026-08-21','2026-02-31'),'1.html'));
 assert.throws(()=>parsePost(source.replace('data-lang="fr"','data-lang="ru"'),'1.html'));
 assert.throws(()=>parsePost(source.replace('<p>','<p onclick="alert(1)">'),'1.html'));
 assert.throws(()=>parsePost(source.replace('<p>','<script>alert(1)</script><p>'),'1.html'));
 assert.throws(()=>parsePost(source.replace('<p>','<a href="javascript:alert(1)">X</a><p>'),'1.html'));
});
test('build creates bounded indexes and complete standalone localized pages',()=>temporary(async outRoot=>{
 const sourceRoot=path.join(outRoot,'fixture'),postDir=path.join(sourceRoot,'blog/development/posts');
 await mkdir(postDir,{recursive:true});
 await copyFile(path.join(ROOT,'blog/development/template.html'),path.join(sourceRoot,'blog/development/template.html'));
 await copyFile(path.join(ROOT,'sitemap-pages.xml'),path.join(sourceRoot,'sitemap-pages.xml'));
 for(let id=1;id<=12;id++)await writeFile(path.join(postDir,id+'.html'),fixture(id));
 const result=await buildBlog({sourceRoot,outRoot});assert.equal(result.posts,12);assert.equal(result.pages,2);
 const manifest=JSON.parse(await readFile(path.join(outRoot,'blog/development/index.json')));
 assert.equal(manifest.lastId,12);assert.equal(manifest.pageSize,10);
 for(const lang of LANGS){
  const first=JSON.parse(await readFile(path.join(outRoot,'blog/development/index',lang,'oldest/1.json')));
  const last=JSON.parse(await readFile(path.join(outRoot,'blog/development/index',lang,'newest/1.json')));
  assert.equal(first.items.length,10);assert.equal(first.items[0].id,1);assert.equal(last.items[0].id,12);
  const listing=await readFile(path.join(outRoot,lang,'blog/development/index.html'),'utf8');
  assert.equal((listing.match(/class="post" id=/g)||[]).length,10);
  assert(!listing.includes('id="post-11"'));assert(!listing.includes('<template'));
  const episode=await readFile(path.join(outRoot,lang,'blog/development/12/index.html'),'utf8');
  assert(episode.includes('<html lang="'+lang+'">'));
  assert.equal((episode.match(/hreflang=/g)||[]).length,4);
  assert(episode.includes('BlogPosting'));assert(episode.includes('site-ui.js'));
  assert(episode.includes('/'+lang+'/blog/development/12/'));
  assert.equal((episode.match(/class="post" id=/g)||[]).length,1);
  assert(episode.includes('data-thread-key="development/12"'));
  assert(episode.includes('data-post-url="https://porthub.fyi/'+lang+'/blog/development/12/"'));
  assert(episode.includes('data-post-share'));assert(episode.includes('data-post-copy'));
  assert(episode.includes('data-comments-adapter="" hidden'));
  assert.equal((listing.match(/data-comments-preview/g)||[]).length,10);
 }
 const file=path.join(outRoot,'ru/blog/development/12/index.html'),before=(await stat(file)).mtimeMs;
 await buildBlog({sourceRoot,outRoot});assert.equal((await stat(file)).mtimeMs,before);
 const sitemap=await readFile(path.join(outRoot,'blog/development/sitemap-1.xml'),'utf8');
 assert(sitemap.includes('/fr/blog/development/12/'));assert(!sitemap.includes('/posts/'));
 assert((await readFile(path.join(outRoot,'sitemap.xml'),'utf8')).includes('sitemap-pages.xml'));
}));
test('drop a file: new ID appears; gaps and drafts work; removed generated pages are cleaned',()=>temporary(async dir=>{
 const src=path.join(dir,'source'),outRoot=path.join(dir,'output'),postDir=path.join(src,'blog/development/posts');
 await mkdir(postDir,{recursive:true});await mkdir(outRoot);
 await copyFile(path.join(ROOT,'blog/development/template.html'),path.join(src,'blog/development/template.html'));
 await copyFile(path.join(ROOT,'sitemap-pages.xml'),path.join(src,'sitemap-pages.xml'));
 for(const id of [1,2,10])await writeFile(path.join(postDir,id+'.html'),fixture(id));
 await writeFile(path.join(postDir,'11.html'),fixture(11,'draft'));
 let result=await buildBlog({sourceRoot:src,outRoot});assert.equal(result.posts,3);
 await writeFile(path.join(postDir,'25.html'),fixture(25));
 await rm(path.join(postDir,'2.html'));
 result=await buildBlog({sourceRoot:src,outRoot});assert.equal(result.posts,3);
 const index=JSON.parse(await readFile(path.join(outRoot,'blog/development/index/en/newest/1.json')));
 assert.deepEqual(index.items.map(x=>x.id),[25,10,1]);
 await assert.rejects(readFile(path.join(outRoot,'en/blog/development/2/index.html')));
 await assert.rejects(readFile(path.join(outRoot,'en/blog/development/11/index.html')));
 const before=await readFile(path.join(outRoot,'blog/development/index.json'),'utf8');
 await writeFile(path.join(postDir,'26.html'),fixture(26).replace('data-lang="fr"','data-lang="xx"'));
 await assert.rejects(buildBlog({sourceRoot:src,outRoot}));
 assert.equal(await readFile(path.join(outRoot,'blog/development/index.json'),'utf8'),before);
}));
