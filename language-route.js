// Loads the original page under a real /ru/, /kk/, /en/ or /fr/ address.
(async()=>{
  const script=document.currentScript,lang=script?.dataset.lang,sourcePath=script?.dataset.source;
  if(!sourcePath||!['ru','kk','en','fr'].includes(lang))return;
  try{localStorage.setItem('pt.lang',lang)}catch{}
  const source=new URL(sourcePath,location.href);source.search=location.search;
  try{
    const response=await fetch(source,{cache:'no-store'});
    if(!response.ok)throw new Error(String(response.status));
    let html=await response.text();
    const base=new URL('./',source).href;
    const suffix=location.pathname.replace(/^.*?\/(?:ru|kk|en|fr)\//,'');
    const root=location.pathname.slice(0,location.pathname.length-suffix.length-lang.length-2);
    const canonical=`${location.origin}${location.pathname}`;
    const alternates=['ru','kk','en','fr'].map(code=>`<link rel="alternate" hreflang="${code}" href="${location.origin}${root}${code}/${suffix}">`).join('');
    html=html.replace(/<html(?:\s[^>]*)?>/i,`<html lang="${lang}">`);
    html=html.replace(/<head(?:\s[^>]*)?>/i,match=>`${match}<base href="${base}"><link rel="canonical" href="${canonical}">${alternates}<style id="pt-language-boot">html{visibility:hidden}</style>`);
    html=html.replace(/<\/body>/i,`<script>addEventListener('load',()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{document.documentElement.style.visibility='visible'})),{once:true});setTimeout(()=>{document.documentElement.style.visibility='visible'},1500)<\/script></body>`);
    document.open();document.write(html);document.close();
  }catch{location.replace(source.href)}
})();
