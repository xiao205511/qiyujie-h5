/* Positions are in the original atlas cells, in right / left / front order. */
(function(root){
 const facings=['right','left','front'];
 const spatulaPivots=[[243,116],[201,117],[229,118]];
 const nozzles=[[175,21],[171,24],[180,21]];
 const kinds={paper:'tissue',kitchen:'spatula',face:'foam'};
 // Anchors follow the props in the source art, in right / left / front order.
 const accents={
  snack:{points:[[[227,29],[253,30]],[[205,26],[232,28]],[[214,25],[239,26]]],color:'#fff5e1',kind:'steam'},
  trend:{points:[[[344,73],[207,34]],[[330,73],[217,33]],[[339,75],[200,34]]],color:'#fbf0ff',kind:'sheen'},
  makeup:{points:[[[274,86],[211,108]],[[251,81],[188,102]],[[252,86],[186,106]]],color:'#fff3cf',kind:'sheen'},
  skin:{points:[[[291,54],[168,28]],[[266,53],[146,28]],[[271,51],[142,34]]],color:'#fff9ca',kind:'sheen'},
  winter:{points:[[[107,46],[355,30]],[[103,45],[352,33]],[[104,45],[352,32]]],color:'#fffefd',kind:'snow'},
  laundry:{points:[[[321,46],[336,29]],[[286,43],[302,29]],[[284,42],[300,25]]],color:'#f2fbff',kind:'bubble'},
  baby:{points:[[[186,41],[281,55]],[[129,41],[233,56]],[[145,39],[244,57]]],color:'#fff2d8',kind:'sheen'},
  accessories:{points:[[[298,38],[327,77]],[[253,40],[234,82]],[[261,38],[270,83]]],color:'#fff6dc',kind:'sheen'}
 };
 const accentShapes={
  steam:'<path d="M1 9C-6 4-6 0-1-4C3-8 3-11 0-14" fill="none" stroke="currentColor" stroke-width="3.9" stroke-linecap="round"/>',
  sheen:'<ellipse rx="7" ry="2.2" fill="currentColor" transform="rotate(-24)"/><ellipse cx="-1.6" cy="-1" rx="2.8" ry="1.1" fill="white" transform="rotate(-24)"/>',
  snow:'<path d="M0-5V5M-4.4-2.5L4.4 2.5M-4.4 2.5L4.4-2.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  bubble:'<circle r="5.8" fill="currentColor" fill-opacity=".27" stroke="currentColor" stroke-width="1.35"/><path d="M-2.6.2Q-2.8-2.8.3-3.35" fill="none" stroke="white" stroke-width="1.1" stroke-linecap="round"/>'
 };
 function accentMarkup(shop,angle,x,y){
  const {points,color,kind}=accents[shop];
  return `<g class="shop-roof-effect" data-roof-effect="${kind}" style="color:${color}">${points[angle].map(([dx,dy],index)=>`<g transform="translate(${x+dx} ${y+dy})"><g class="shop-roof-accent" style="--accent-delay:${index*.46}s">${accentShapes[kind]}</g></g>`).join('')}</g>`;
 }
 function loadRoofImage(stripId,source,kind){
  // The decorator returns markup. Bind the SVG load event after insertion,
  // before setting href, so the original roof stays visible until it loads.
  if(root.document)queueMicrotask(()=>{
   const strip=root.document.getElementById(stripId);
   if(!strip)return;
   strip.addEventListener('load',()=>strip.ownerSVGElement?.setAttribute(`data-${kind}-ready`,''),{once:true});
   strip.setAttribute('href',source);
  });
 }
 function lowerRoofMask(id,viewX,viewY,side,cutY){
  return `<mask id="${id}-roof-mask" maskUnits="userSpaceOnUse" x="${viewX}" y="${viewY}" width="${side}" height="${side}"><rect x="${viewX}" y="${cutY}" width="${side}" height="${viewY+side-cutY}" fill="white"/></mask>`;
 }
 function tissueMarkup(facing,{id,x,y,viewX,viewY,side}){
  // The generated strip replaces the entire upper silhouette. The last rows
  // stay in their original position and overlap the stationary green roof.
  const stripX=x+42,stripY=y-12,width=362,frameHeight=122,frames=32;
  const stripId=`${id}-tissue-strip`;
  loadRoofImage(stripId,`assets/mobile-shops/paper-roof-wave-${facing}-v3.webp`,'tissue');
  return {
   cut:'tissue',
   defs:`<clipPath id="${id}-tissue-window"><rect x="${stripX}" y="${stripY}" width="${width}" height="${frameHeight}"/></clipPath>`+lowerRoofMask(id,viewX,viewY,side,y+103),
   content:`<g class="shop-roof-effect" data-roof-effect="tissue" clip-path="url(#${id}-tissue-window)"><image id="${stripId}" class="shop-tissue-strip" x="${stripX}" y="${stripY}" width="${width}" height="${frames*frameHeight}" style="--tissue-strip-shift:-${(frames-1)*frameHeight}px"/></g>`
  };
 }
 function spatulaMarkup(facing,angle,{id,x,y,viewX,viewY,side}){
  // One cached image contains a clean stationary roof above a transparent tool.
  const width=444,plateHeight=146,propHeight=126,stripId=`${id}-spatula-layers`;
  const [pivotX,pivotY]=spatulaPivots[angle];
  const clip=(name,height)=>`<clipPath id="${id}-${name}"><rect x="${x}" y="${y}" width="${width}" height="${height}"/></clipPath>`;
  loadRoofImage(stripId,`assets/mobile-shops/kitchen-roof-layers-${facing}-v1.webp`,'spatula');
  return {
   cut:'spatula',
   defs:clip('clean-roof',plateHeight)+clip('tool-window',propHeight)+lowerRoofMask(id,viewX,viewY,side,y+134),
   content:`<g class="shop-roof-effect" data-roof-effect="spatula"><g clip-path="url(#${id}-clean-roof)"><image id="${stripId}" x="${x}" y="${y}" width="${width}" height="${plateHeight+propHeight}"/></g><g class="shop-roof-piece" style="--roof-origin:${x+pivotX}px ${y+pivotY}px"><g clip-path="url(#${id}-tool-window)"><use href="#${stripId}" transform="translate(0,-${plateHeight})"/></g></g></g>`
  };
 }
 function decorate(shop,facing){
  if(!Object.hasOwn(kinds,shop)&&!Object.hasOwn(accents,shop))return undefined;
  const angle=facings.indexOf(facing),kind=kinds[shop];
  if(angle<0)return undefined;
  return frame=>{
   const {id,x,y}=frame;
   if(!kind)return {content:accentMarkup(shop,angle,x,y)};
   if(kind==='tissue')return tissueMarkup(facing,frame);
   if(kind==='spatula')return spatulaMarkup(facing,angle,frame);
   if(kind==='foam'){
    const [nx,ny]=nozzles[angle];
    const bubbles=[[-16,-13,3.8,0],[-27,-21,7.2,185],[-35,-34,5.9,345],[-47,-29,6.3,525]];
    return {
     defs:`<radialGradient id="${id}-foam" cx="32%" cy="25%" r="75%"><stop stop-color="white"/><stop offset=".64" stop-color="#fffdf4"/><stop offset="1" stop-color="#c8ebef"/></radialGradient>`,
     content:`<g class="shop-roof-effect" data-roof-effect="foam" transform="translate(${x+nx} ${y+ny})">${bubbles.map(([dx,dy,r,delay])=>`<circle class="shop-foam-bubble" r="${r}" fill="url(#${id}-foam)" style="--bubble-x:${dx}px;--bubble-y:${dy}px;--bubble-delay:${delay}ms"/>`).join('')}</g>`
    };
   }
  };
 }
 root.QiyuShopRoofs={decorate};
})(typeof window==='undefined'?globalThis:window);
