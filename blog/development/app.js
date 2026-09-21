// Shared navigation and post tools. No article text or provider credentials here.
(() => {
  const languages=['ru','kk','en','fr'];
  const parts=location.pathname.split('/').filter(Boolean);
  let saved='';try{saved=localStorage.getItem('pt.lang')||''}catch{}
  const browser=(navigator.language||'').slice(0,2).toLowerCase();
  const lang=languages.includes(parts[0])?parts[0]:languages.includes(saved)?saved:languages.includes(browser)?browser:'ru';
  const base='/'+lang+'/blog/development/';
  const oldPost=/^#post-([1-9]\d*)$/.exec(location.hash);
  // Do not disturb in-page issue links in an already loaded catalog page.
  if(oldPost&&!document.getElementById('post-'+oldPost[1])){
    location.replace(base+oldPost[1]+'/');return;
  }
  if(document.body.dataset.blogPage==='redirect'){
    location.replace('/'+lang+(location.pathname.includes('/development/')?'/blog/development/':'/blog/')+location.search+location.hash);return;
  }
  document.querySelectorAll('[data-order]').forEach(link=>link.addEventListener('click',()=>{
    try{localStorage.setItem('pt.blog.order',link.dataset.order)}catch{}
  }));
  // A remembered order applies only at the catalog entrance, never to a deep link.
  if(location.pathname===base&&!location.hash){
    try{if(localStorage.getItem('pt.blog.order')==='newest'){location.replace(base+'newest/');return}}catch{}
  }
  document.getElementById('lang')?.setAttribute('value',lang);
  // Return to this episode's anchor on the correct archive page, in this tab's order.
  let returnOrder='oldest';
  try{
    if(document.body.dataset.blogPage==='catalog')sessionStorage.setItem('pt.blog.returnOrder',document.body.dataset.blogOrder);
    returnOrder=sessionStorage.getItem('pt.blog.returnOrder')||localStorage.getItem('pt.blog.order')||'oldest';
  }catch{}
  document.querySelectorAll('[data-post-back]').forEach(link=>{
    link.href=returnOrder==='newest'?link.dataset.returnNewest:link.dataset.returnOldest;
  });
  let adapter=null,pending=null;
  const posts=[];
  globalThis.PortHubDevelopment=Object.freeze({posts,registerComments(value){
    if(typeof value?.mount!=='function')throw TypeError('Comments adapter must expose mount()');
    adapter=value;
  }});
  async function getAdapter(src){
    if(adapter)return adapter;
    if(!/^\/blog\/development\/[a-zA-Z0-9_-]+\.js$/.test(src))throw Error('Invalid adapter');
    if(!pending)pending=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src=src;
      script.onload=()=>adapter?resolve(adapter):reject(Error('Adapter did not register'));
      script.onerror=()=>{script.remove();reject(Error('Adapter unavailable'))};
      document.head.append(script);
    }).catch(error=>{pending=null;throw error});
    return pending;
  }
  for(const tools of document.querySelectorAll('.post-tools')){
    const post=Object.freeze({id:tools.dataset.postId,threadKey:tools.dataset.threadKey,lang:tools.dataset.postLanguage,title:tools.dataset.postTitle,url:tools.dataset.postUrl});
    posts.push(post);
    const feedback=tools.querySelector('.post-feedback'),link=tools.querySelector('.post-link');
    async function copyLink(){
      try{
        if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
        await navigator.clipboard.writeText(post.url);link.hidden=true;feedback.textContent=tools.dataset.copied;
      }catch{link.hidden=false;feedback.textContent=tools.dataset.manual;link.focus();link.select()}
    }
    tools.querySelector('[data-post-copy]')?.addEventListener('click',copyLink);
    tools.querySelector('[data-post-share]')?.addEventListener('click',async()=>{
      feedback.textContent='';
      if(navigator.share){
        try{await navigator.share({title:post.title,url:post.url});return}
        catch(error){if(error.name==='AbortError')return}
      }
      await copyLink();
    });
    const comments=tools.querySelector('#post-comments');
    if(comments&&!comments.hidden){
      const button=comments.querySelector('[data-comments-load]'),status=comments.querySelector('.comments-feedback'),element=comments.querySelector('[data-comments-mount]');
      button.addEventListener('click',async()=>{
        button.disabled=true;status.textContent=tools.dataset.loading;
        try{await (await getAdapter(comments.dataset.commentsAdapter)).mount({element,post});status.textContent='';button.hidden=true}
        catch{element.replaceChildren();status.textContent=tools.dataset.commentsError;button.disabled=false}
      });
    }
    const preview=tools.querySelector('[data-comments-preview]:not([hidden])');
    if(preview){
      const show=async()=>{
        try{
          const provider=await getAdapter(preview.dataset.commentsAdapter);
          if(!provider.mountPreview){preview.hidden=true;return}
          await provider.mountPreview({element:preview,post,mode:preview.dataset.previewMode,limit:Number(preview.dataset.previewLimit)});
        }catch{preview.hidden=true}
      };
      if('IntersectionObserver' in window){
        const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();show()}});
        observer.observe(preview);
      }else show();
    }
  }
  Object.freeze(posts);
})();
