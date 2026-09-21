import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const cards={
  'index.html':{
    title:'PortHub — your port to entertainment',
    description:'Tests, games and interactive entertainment in four languages.',
    url:'https://porthub.fyi/',image:'porthub-home-v2.jpg'
  },
  'ru/index.html':{image:'porthub-home-v2.jpg'},
  'kk/index.html':{image:'porthub-home-v2.jpg'},
  'en/index.html':{image:'porthub-home-v2.jpg'},
  'fr/index.html':{image:'porthub-home-v2.jpg'},
  'games/index.html':{image:'porthub-games-v1.jpg'},
  'games/2048/index.html':{image:'porthub-2048-v1.jpg'},
  'tests/matrix-iq/index.html':{image:'porthub-iq-matrix-v1.jpg'}
};

const escaped=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;');
function meta(html,attribute,key,content){
  const tag=`<meta ${attribute}="${key}" content="${escaped(content)}">`;
  const pattern=new RegExp(`<meta\\s+${attribute}="${key.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}"\\s+content="[^"]*"\\s*\\/?`+'>','i');
  return pattern.test(html)?html.replace(pattern,tag):html.replace('</head>',`${tag}</head>`);
}

for(const [relative,card] of Object.entries(cards)){
  const file=path.join(root,...relative.split('/'));
  let html=await readFile(file,'utf8');
  if(card.title)html=meta(html,'property','og:title',card.title);
  if(card.description)html=meta(html,'property','og:description',card.description);
  if(card.url)html=meta(html,'property','og:url',card.url);
  html=meta(html,'property','og:type','website');
  const image=`https://porthub.fyi/assets/og/${card.image}`;
  html=meta(html,'property','og:image',image);
  html=meta(html,'property','og:image:width','1200');
  html=meta(html,'property','og:image:height','630');
  html=meta(html,'name','twitter:card','summary_large_image');
  html=meta(html,'name','twitter:image',image);
  await writeFile(file,html);
}

console.log(`Applied social previews to ${Object.keys(cards).length} source pages.`);
