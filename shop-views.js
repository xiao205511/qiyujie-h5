(function(root,factory){
  const api=factory(typeof module!=='undefined'&&module.exports?require('./shop-hit-areas.js'):root.QiyuShopHitAreas);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else {root.QiyuShopViews=api;api.init(document);}
})(typeof window!=='undefined'?window:this,function(hitAreas){
  let slots=[{position:'paper',shop:'paper'},{position:'snack',shop:'snack'},{position:'kitchen',shop:'kitchen'}],shops={},configured=false;
  const positionFor=key=>slots.find(slot=>slot.shop===key)?.position||'front';
  const facingFor=position=>position==='paper'?'right':position==='snack'?'left':'front';
  const travelKind=(from,to)=>from===to?'enter':positionFor(from)==='paper'&&positionFor(to)==='snack'?'walk':'cut';
  const modeFor=key=>positionFor(key)==='paper'?'street':'store';
  function restFor(key,walking){
    const position=positionFor(key);
    if(position==='paper'||position==='snack')return walking.rest(position);
    const base=walking.rest('paper'),dx=302-base.point[0],dy=548-base.point[1];
    const feet=Object.fromEntries(Object.entries(base.feet).map(([side,foot])=>[side,{...foot,x:foot.x+dx,y:foot.y+dy}]));
    return {...base,point:[302,548],screen:{x:302,y:548},camera:{x:0,y:0,scale:1},size:1,scene:configured?'shop-front':'kitchen-front',feet,arrivalHeading:[0,1]};
  }
  let doc,art,curtain,originalArt,endCurrent=null;
  function init(document){
    doc=document;art=doc.querySelector('#world .street-art');originalArt=art.getAttribute('src');
    curtain=doc.createElement('div');curtain.className='scene-curtain';curtain.hidden=true;curtain.setAttribute('aria-hidden','true');doc.querySelector('.street').append(curtain);
  }
  function hitAreaFor(shop,position){return shops[shop]?.artSheet?.hitAreas?.[facingFor(position)]||hitAreas[facingFor(position)][shops[shop]?.art||0];}
  function spriteStyle(shop,position='front'){
    const art=shops[shop]?.art||0;
    const sheet=shops[shop]?.artSheet;
    if(sheet){
      const column={right:0,left:1,front:2}[facingFor(position)];
      return `--shop-art:url('${sheet.url}');--shop-size:${sheet.columns*100}% ${sheet.rows*100}%;--shop-x:${column/(sheet.columns-1)*100}%;--shop-y:${sheet.row/(sheet.rows-1)*100}%;--shop-hit:${hitAreaFor(shop,position)}`;
    }
    // The top atlas row contains a few pixels from the next row's roof props.
    // Its complete shop bases end above 97%; clip only that trailing gutter.
    return `--shop-x:${art%4/3*100}%;--shop-y:${Math.floor(art/4)*100}%;--shop-crop:${art<4?'0 0 3% 0':'0'};--shop-hit:${hitAreaFor(shop,position)}`;
  }
  function configure(nextSlots,nextShops){
    slots=nextSlots;shops=nextShops;configured=true;
    if(!doc)return;
    for(const slot of slots){
      const target=doc.querySelector(`[data-slot="${slot.position}"]`);if(!target)continue;
      target.dataset.shop=slot.shop;target.dataset.role=slot.role||'';
      target.dataset.facing=facingFor(slot.position);
      target.style.cssText=spriteStyle(slot.shop,slot.position);
      target.innerHTML='<span class="storefront-sprite" aria-hidden="true"></span>';
    }
    doc.querySelector('#app').classList.add('has-daily-shops');
  }
  function setView(key){
    const position=positionFor(key),front=position==='kitchen'||position==='front';
    art.src=configured?originalArt:front?'assets/kitchen-front.png':originalArt;
    art.alt=configured?(front?`${shops[key]?.name||'小店'}门前街景`:slots.map(s=>shops[s.shop]?.name).join('、')+'沿街排列'):front?'厨房帮手铺独立门口近景，台阶前是开阔空地':'纸巾铺、零食铺和厨房铺沿街排列';
    const app=doc.querySelector('#app');app.dataset.sceneMode=modeFor(key);app.dataset.sceneAsset=front?(configured?'shop-front':'kitchen-front'):'street';
    const storefront=doc.querySelector('#storefrontFront');
    if(storefront){storefront.hidden=!front;storefront.style.cssText=spriteStyle(key);storefront.dataset.facing=facingFor(position);storefront.setAttribute('aria-label',shops[key]?.name||'当前店铺');}
    // Shared street views keep their image-aligned shop targets clickable.
    // A screen-wide door target would swallow clicks on the distant kitchen.
    const door=doc.querySelector('#storeDoorHit');door.hidden=!front;door.setAttribute('aria-label','进入'+(shops[key]?.name||'厨房帮手铺'));
    doc.querySelector('#guide').hidden=false;
  }
  function transition(commit,reduced){
    endCurrent?.();let applied=false,coverTimer,revealTimer;
    const apply=()=>{if(applied)return;applied=true;commit();};
    const finish=()=>{
      clearTimeout(coverTimer);clearTimeout(revealTimer);apply();curtain.hidden=true;curtain.style.opacity='0';endCurrent=null;
    };
    if(reduced){finish();return finish;}
    endCurrent=finish;curtain.hidden=false;curtain.style.transition='none';curtain.style.opacity='0';
    // Force the initial transparent state before the short scene cut.
    void curtain.offsetWidth;curtain.style.transition='opacity 140ms ease';curtain.style.opacity='1';
    coverTimer=setTimeout(()=>{apply();curtain.style.opacity='0';revealTimer=setTimeout(()=>{curtain.hidden=true;endCurrent=null;},150);},150);
    return finish;
  }
  return {travelKind,modeFor,positionFor,restFor,init,configure,setView,transition,hitAreaFor};
});
