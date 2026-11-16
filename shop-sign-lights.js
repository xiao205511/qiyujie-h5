/* Outer plaque contours in atlas coordinates, ordered right, left, front. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.QiyuShopSignLights=api;
})(typeof window==='undefined'?globalThis:window,function(){
 const shapes={
  paper:[[167,383,149,143,201,194],[101,295,138,153,190,205],[97,354,145,145,201,201]],
  snack:[[130,377,125,120,189,183],[77,288,122,132,180,194],[85,358,128,128,192,192]],
  kitchen:[[149,384,138,132,195,189],[77,285,130,144,186,200],[84,359,140,140,197,197]],
  face:[[133,362,144,138,201,193],[77,286,134,148,188,205],[89,356,142,142,200,200]],
  laundry:[[166,365,138,128,193,179],[65,265,127,137,178,191],[81,319,134,134,185,185]],
  baby:[[156,365,137,124,190,174],[56,276,126,137,177,191],[76,320,136,136,186,187]],
  accessories:[[163,366,121,109,174,159],[57,268,107,121,158,175],[78,321,118,118,171,171]],
  trend:[[150,408,137,131,201,193],[76,305,133,149,193,210],[97,372,139,139,200,200]],
  makeup:[[153,388,158,152,217,210],[71,291,147,159,205,219],[85,360,151,151,210,210]],
  skin:[[136,383,148,143,206,201],[64,296,146,159,203,218],[81,359,148,148,207,207]],
  winter:[[133,378,172,168,230,224],[68,296,161,175,217,233],[85,361,167,167,225,225]]
 };
 const angles=['right','left','front'];
 function render(shop,facing,{id,x,y}){
  const shape=shapes[shop]?.[angles.indexOf(facing)];
  if(!shape)return '';
  const [left,right,topLeft,topRight,bottomLeft,bottomRight]=shape;
  const halfLeft=(bottomLeft-topLeft)/2,halfRight=(bottomRight-topRight)/2;
  const centerLeft=topLeft+halfLeft,centerRight=topRight+halfRight;
  const leftBend=Math.round(halfLeft*.9),rightBend=Math.round(halfRight*.9);
  const leftTangent=left+leftBend,rightTangent=right-rightBend;
  const leftControl=leftTangent-Math.round(leftBend*.55),rightControl=rightTangent+Math.round(rightBend*.55);
  const leftLift=Math.round(halfLeft*.55),rightLift=Math.round(halfRight*.55);
  const path=`M${leftTangent},${topLeft} L${rightTangent},${topRight}
   C${rightControl},${topRight} ${right},${centerRight-rightLift} ${right},${centerRight}
   C${right},${centerRight+rightLift} ${rightControl},${bottomRight} ${rightTangent},${bottomRight}
   L${leftTangent},${bottomLeft}
   C${leftControl},${bottomLeft} ${left},${centerLeft+leftLift} ${left},${centerLeft}
   C${left},${centerLeft-leftLift} ${leftControl},${topLeft} ${leftTangent},${topLeft} Z`;
  const tube=`${id}-sign-tube`;
  return `<g transform="translate(${x} ${y})" data-sign-tube="" fill="none" stroke-linejoin="round" pointer-events="none">
   <defs>
    <path id="${tube}" d="${path}"/>
    <linearGradient id="${tube}-matte" x2="0" y2="1">
     <stop stop-color="#ffe6b7"/><stop offset=".52" stop-color="#f7d49f"/><stop offset="1" stop-color="#e9b371"/>
    </linearGradient>
    <linearGradient id="${tube}-lit" x2="0" y2="1">
     <stop stop-color="#fffbdc"/><stop offset=".54" stop-color="#fff29b"/><stop offset="1" stop-color="#ffe36b"/>
    </linearGradient>
    <filter id="${tube}-round" x="-8%" y="-24%" width="116%" height="148%" color-interpolation-filters="sRGB">
     <feDropShadow in="SourceGraphic" dx=".45" dy="1.55" stdDeviation="1.1" flood-color="#865231" flood-opacity=".21" result="body"/>
     <feOffset in="SourceAlpha" dx=".55" dy="1.55" result="low"/>
     <feComposite in="SourceAlpha" in2="low" operator="out" result="upper-edge"/>
     <feFlood flood-color="#fffbef" flood-opacity=".58"/>
     <feComposite in2="upper-edge" operator="in" result="rim-light"/>
     <feGaussianBlur in="rim-light" stdDeviation=".68" result="soft-light"/>
     <feComposite in="soft-light" in2="SourceAlpha" operator="in" result="highlight"/>
     <feOffset in="SourceAlpha" dx="-.5" dy="-1.3" result="high"/>
     <feComposite in="SourceAlpha" in2="high" operator="out" result="lower-edge"/>
     <feFlood flood-color="#a15c33" flood-opacity=".25"/>
     <feComposite in2="lower-edge" operator="in" result="underside"/>
     <feMerge><feMergeNode in="body"/><feMergeNode in="highlight"/><feMergeNode in="underside"/></feMerge>
    </filter>
    <filter id="${tube}-glow" x="-9%" y="-33%" width="118%" height="166%" color-interpolation-filters="sRGB">
     <feDropShadow dx="0" dy="0" stdDeviation="3.7" flood-color="#ffe047" flood-opacity=".72"/>
    </filter>
   </defs>
   <use href="#${tube}" stroke="url(#${tube}-matte)" stroke-width="11" filter="url(#${tube}-round)"/>
   <g data-sign-tube-light="" opacity="0" filter="url(#${tube}-glow)">
    <use href="#${tube}" stroke="url(#${tube}-lit)" stroke-width="11" filter="url(#${tube}-round)"/>
   </g>
  </g>`;
 }
 return {render};
});
