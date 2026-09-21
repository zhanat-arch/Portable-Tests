// Optional local browser smoke test. Set PLAYWRIGHT_MODULE and EDGE_PATH outside
// the bundled Codex runtime; the pure Node tests run in GitHub Actions.
const assert=require('node:assert/strict');
const path=require('node:path'),os=require('node:os');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/Zhanat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
 for(const lang of ['ru','kk','en','fr']){
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.route('https://**/*',r=>r.abort());
  const base='http://localhost:8765/'+lang+'/blog/development/';
  await page.goto(base);await page.locator('header.pt-site-header').waitFor();
  assert.equal(await page.locator('#lang').inputValue(),lang);
  assert.equal(await page.locator('.post').count(),10);
  assert.equal(await page.locator('.post').first().getAttribute('id'),'post-1');
  assert.equal(await page.locator('.post-tools.compact [data-post-share]').count(),10);
  assert.equal(await page.locator('.post-tools.compact button:disabled').count(),10);
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.sharedPost=data}});
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.copiedPost=value}}});
  });
  await page.locator('.post-tools.compact [data-post-share]').first().click();
  assert.equal(await page.evaluate(()=>window.sharedPost.url),'https://porthub.fyi/'+lang+'/blog/development/1/');
  await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Cancelled','AbortError')}}));
  await page.locator('.post-tools.compact [data-post-share]').first().click();
  assert.equal(await page.evaluate(()=>window.copiedPost),undefined);
  await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:undefined}));
  await page.locator('.post-tools.compact [data-post-share]').nth(1).click();
  assert.equal(await page.evaluate(()=>window.copiedPost),'https://porthub.fyi/'+lang+'/blog/development/2/');
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined}));
  await page.locator('.post-tools.compact [data-post-share]').first().click();
  assert(await page.locator('.post-tools.compact .post-link').first().isVisible());
  assert.equal(await page.locator('.pt-global-footer').count(),1);
  await page.locator('.blog-pagination a').last().click();await page.waitForURL('**/page/2/');
  assert.equal(await page.locator('.post').count(),2);
  await page.locator('[data-order="newest"]').click();await page.waitForURL('**/newest/');
  assert.equal(await page.locator('.post').first().getAttribute('id'),'post-12');
  await page.locator('[data-order="oldest"]').click();await page.waitForURL(base);
  assert.equal(await page.locator('.post').first().getAttribute('id'),'post-1');
  await page.goto('http://localhost:8765/'+lang+'/blog/#post-12');await page.waitForURL('**/development/12/');
  assert.equal(await page.locator('.post').count(),1);
  assert.equal(await page.locator('.post h1').count(),1);
  assert.equal(await page.locator('[data-post-copy]').count(),1);
  assert(await page.locator('#post-comments').isHidden());
  const nextLang=lang==='ru'?'en':'ru';await page.locator('#lang').selectOption(nextLang);await page.waitForURL('**/'+nextLang+'/blog/development/12/');
  assert.equal(await page.locator('#lang').inputValue(),nextLang);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert(!requests.some(u=>u.includes('/posts/')),'Reader must not fetch source files or every episode');
  assert.deepEqual(errors,[]);
  console.log(lang+': pagination, sorting, old links, languages, post sharing/copy/manual fallback, comments disabled OK');
  await context.close();
 }
 const p=await browser.newPage({viewport:{width:1440,height:1000},serviceWorkers:'block'});
 await p.route('https://**/*',r=>r.abort());
 await p.goto('http://localhost:8765/ru/blog/development/');
 await p.locator('header.pt-site-header').waitFor();
 await p.screenshot({path:path.join(os.tmpdir(),'porthub-blog-desktop.png')});
 await p.setViewportSize({width:390,height:844});
 await p.goto('http://localhost:8765/kk/blog/development/12/');
 await p.screenshot({path:path.join(os.tmpdir(),'porthub-blog-mobile.png')});
 const noJS=await browser.newContext({javaScriptEnabled:false});
 const staticPage=await noJS.newPage();await staticPage.goto('http://localhost:8765/en/blog/development/12/');
 assert.equal(await staticPage.locator('.post h1').count(),1);
 assert.equal(await staticPage.locator('link[rel="alternate"]').count(),4);
 console.log('Standalone article works without JavaScript; hreflang present.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
