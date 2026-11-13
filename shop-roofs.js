/* Positions are in the original atlas cells, in right / left / front order. */
(function(root){
 const tissue=[
  {outline:'137,27 218,4 276,3 337,23 299,85 176,86',pivot:[237,85]},
  {outline:'159,25 218,4 261,5 342,34 304,86 278,92 190,85',pivot:[246,87]},
  {outline:'126,27 211,2 264,1 333,25 294,87 165,88',pivot:[227,86]}
 ];
 const spatula=[
  {outline:'231,119 233,110 268,68 257,60 261,46 285,10 292,6 305,8 336,24 345,34 344,46 334,59 314,81 302,85 286,84 265,113 253,121',pivot:[243,113],roof:'230,121 247,100 271,77 286,75 304,80 321,83 325,124'},
  {outline:'187,119 195,103 228,72 232,68 230,60 234,46 266,7 277,3 286,4 318,20 330,32 332,42 322,57 293,85 280,90 267,89 239,114 222,123',pivot:[201,115],roof:'185,121 213,96 235,79 254,74 273,75 297,84 305,126'},
  {outline:'217,120 219,106 249,68 254,67 239,59 237,48 266,7 275,1 287,2 322,20 331,30 332,41 323,58 297,82 285,86 272,84 247,116 233,123',pivot:[229,115],roof:'216,123 237,97 254,74 270,70 295,75 311,81 318,128'}
 ];
 const nozzles=[[177,23],[173,25],[180,21]];
 const kinds={paper:'tissue',kitchen:'spatula',face:'foam'};
 // Anchors are percentages of each storefront frame, in right / left / front order.
 const accents={
  snack:{points:[[76,12],[72,12],[75,12]],color:'#fff1b7',kind:'steam'},
  trend:{points:[[77,12],[71,13],[75,12]],color:'#f3e5ff',kind:'spark'},
  makeup:{points:[[65,9],[64,9],[66,9]],color:'#ffebec',kind:'spark'},
  skin:{points:[[74,12],[72,13],[70,13]],color:'#fff1a6',kind:'sun'},
  winter:{points:[[62,12],[63,13],[61,12]],color:'#fff9ee',kind:'snow'},
  laundry:{points:[[72,11],[66,11],[66,11]],color:'#edf7ff',kind:'bubble'},
  baby:{points:[[55,11],[40,11],[51,11]],color:'#ffe7ea',kind:'heart'},
  accessories:{points:[[75,15],[69,15],[68,15]],color:'#fff1ba',kind:'spark'}
 };
 const accentShapes={
  steam:'<path d="M-2 6C4 2-4-2 2-7" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round"/>',
  spark:'<path d="M0-7Q1-1 7 0Q1 1 0 7Q-1 1-7 0Q-1-1 0-7Z" fill="currentColor"/>',
  sun:'<path d="M0-5V-9M4-3L7-6M5 1L9 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  snow:'<path d="M0-6V6M-5-3L5 3M-5 3L5-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  bubble:'<circle r="5.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="-1.8" cy="-1.8" r="1.2" fill="currentColor"/>',
  heart:'<path d="M0 5C-2 3-7 0-6-3Q-5-7 0-3Q5-7 6-3C7 0 2 3 0 5Z" fill="currentColor"/>'
 };
 function accentMarkup(shop,angle,viewX,viewY,side){
  const {points,color,kind}=accents[shop],[px,py]=points[angle];
  const x=viewX+px*side/100,y=viewY+py*side/100;
  return `<g class="shop-roof-effect" data-roof-effect="${kind}" style="color:${color}" transform="translate(${x} ${y}) scale(${side/360})">${[[-11,-4,0],[9,-13,-.6],[22,1,-1.15]].map(([dx,dy,delay])=>`<g transform="translate(${dx} ${dy})"><g class="shop-roof-accent" style="--accent-delay:${delay}s">${accentShapes[kind]}</g></g>`).join('')}</g>`;
 }
 function decorate(shop,facing){
  if(!Object.hasOwn(kinds,shop)&&!Object.hasOwn(accents,shop))return undefined;
  const angle=['right','left','front'].indexOf(facing),kind=kinds[shop];
  return ({id,x,y,viewX,viewY,side})=>{
   if(!kind)return {content:accentMarkup(shop,angle,viewX,viewY,side)};
   if(kind==='foam'){
    const [nx,ny]=nozzles[angle];
    const bubbles=[[-25,-21,7,0],[-37,-35,10,105],[-54,-20,7,200],[-45,-53,5,270]];
    return {
     defs:`<radialGradient id="${id}-foam" cx="34%" cy="27%" r="72%"><stop stop-color="white"/><stop offset=".67" stop-color="#fffdf4"/><stop offset="1" stop-color="#caedf1"/></radialGradient>`,
     content:`<g class="shop-roof-effect" data-roof-effect="foam" transform="translate(${x+nx} ${y+ny})">${bubbles.map(([dx,dy,r,delay])=>`<circle class="shop-foam-bubble" r="${r}" fill="url(#${id}-foam)" style="--bubble-x:${dx}px;--bubble-y:${dy}px;--bubble-delay:${delay}ms"/>`).join('')}</g>`
    };
   }
   const {outline,pivot:[px,py],roof}=(kind==='tissue'?tissue:spatula)[angle];
   const points=outline.split(' ').map(pair=>{
    const [a,b]=pair.split(',').map(Number);
    return `${a+x},${b+y}`;
   }).join(' ');
   const roofClip=`<polygon points="${points}"/>`;
   const origin=`${x+px}px ${y+py}px`;
   const gradient=roof
    ?`<linearGradient id="${id}-blue" x2=".18" y2="1"><stop stop-color="#42b5f3"/><stop offset="1" stop-color="#078add"/></linearGradient>`
    :'';
   const repair=roof?`<g clip-path="url(#${id}-roof-piece)"><polygon transform="translate(${x} ${y})" points="${roof}" fill="url(#${id}-blue)"/></g>`:'';
   return {
    cut:true,
    defs:`${gradient}<clipPath id="${id}-roof-piece">${roofClip}</clipPath><mask id="${id}-roof-mask" maskUnits="userSpaceOnUse" x="${viewX}" y="${viewY}" width="${side}" height="${side}"><rect x="${viewX}" y="${viewY}" width="${side}" height="${side}" fill="white"/><polygon points="${points}" fill="black"/></mask>`,
    content:`<g class="shop-roof-effect" data-roof-effect="${kind}">${repair}<g class="shop-roof-piece" style="--roof-origin:${origin}"><g clip-path="url(#${id}-roof-piece)"><use href="#${id}-art"/></g></g></g>`
   };
  };
 }
 root.QiyuShopRoofs={decorate};
})(typeof window==='undefined'?globalThis:window);
