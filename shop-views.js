(function(root,factory){
  const api=factory(typeof module!=='undefined'&&module.exports?require('./shop-hit-areas.js'):root.QiyuShopHitAreas,typeof module!=='undefined'&&module.exports?require('./sprite-art.js'):root.QiyuSpriteArt);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else {root.QiyuShopViews=api;api.init(document);}
})(typeof window!=='undefined'?window:this,function(hitAreas,Art){
  let slots=[{position:'paper',shop:'paper'},{position:'snack',shop:'snack'},{position:'kitchen',shop:'kitchen'}],shops={},configured=false;
  const positionFor=key=>slots.find(slot=>slot.shop===key)?.position||'front';
  const facingFor=position=>position==='paper'?'right':position==='snack'?'left':'front';
  const travelKind=(from,to)=>from===to?'enter':positionFor(from)==='paper'&&positionFor(to)==='snack'?'walk':'cut';
  const modeFor=key=>positionFor(key)==='paper'?'street':'store';
  function restFor(key,walking){
    const position=positionFor(key);
    if(position==='paper'||position==='snack'&&!configured)return walking.rest(position);
    const base=walking.rest('paper'),dx=302-base.point[0],dy=548-base.point[1];
    const feet=Object.fromEntries(Object.entries(base.feet).map(([side,foot])=>[side,{...foot,x:foot.x+dx,y:foot.y+dy}]));
    return {...base,point:[302,548],screen:{x:302,y:548},camera:{x:0,y:0,scale:1},size:1,scene:configured?'shop-front':'kitchen-front',feet,arrivalHeading:[0,1]};
  }
  let doc,art,originalArt;
  function init(document){
    doc=document;art=doc.querySelector('#world .street-art');originalArt=art.getAttribute('src');
  }
  function hitAreaFor(shop,position){return shops[shop]?.artSheet?.hitAreas?.[facingFor(position)]||hitAreas[facingFor(position)][shops[shop]?.art||0];}
  function spriteStyle(shop,position='front'){
    return `--shop-hit:${hitAreaFor(shop,position)}`;
  }
  function sprite(shop,position='front'){
    const sheet=shops[shop]?.artSheet,facing=facingFor(position);
    return sheet?Art.render(sheet.url,sheet.row*sheet.columns+{right:0,left:1,front:2}[facing]):Art.render('assets/shops-hue-'+facing+'-v1.png',shops[shop]?.art||0);
  }
  function configure(nextSlots,nextShops){
    slots=nextSlots;shops=nextShops;configured=true;
    if(!doc)return;
    for(const slot of slots){
      const target=doc.querySelector(`[data-slot="${slot.position}"]`);if(!target)continue;
      target.dataset.shop=slot.shop;target.dataset.role=slot.role||'';
      target.dataset.facing=facingFor(slot.position);
      target.style.cssText=spriteStyle(slot.shop,slot.position);
      target.innerHTML='<span class="storefront-sprite" aria-hidden="true">'+sprite(slot.shop,slot.position)+'</span>';
      const neighbor=doc.querySelector(`[data-front-neighbor="${slot.position}"]`);
      if(neighbor){neighbor.style.cssText=spriteStyle(slot.shop,slot.position);neighbor.dataset.facing=facingFor(slot.position);neighbor.innerHTML=sprite(slot.shop,slot.position);}
    }
    doc.querySelector('#app').classList.add('has-daily-shops');
  }
  function setView(key){
    const position=positionFor(key),front=position==='kitchen'||position==='front'||configured&&position==='snack';
    art.alt=configured?slots.map(s=>shops[s.shop]?.name).join('、')+'沿街排列':'纸巾铺、零食铺和厨房铺沿街排列';
    const backdrop=doc.querySelector('#storefrontBackdrop'),source=configured?originalArt:'assets/kitchen-front.png';
    if(backdrop.getAttribute('src')!==source)backdrop.src=source;
    backdrop.alt=(shops[key]?.name||'小店')+'门前街景';
    const app=doc.querySelector('#app');app.dataset.sceneMode=modeFor(key);app.dataset.sceneAsset=front?(configured?'shop-front':'kitchen-front'):'street';
    const storefront=doc.querySelector('#storefrontFront');
    if(storefront){storefront.hidden=!front;storefront.style.cssText=spriteStyle(key);storefront.dataset.facing='front';storefront.setAttribute('aria-label',shops[key]?.name||'当前店铺');storefront.innerHTML=sprite(key);}
    // Keep the neighboring stores as context, without duplicating the current shop.
    if(front){
      const neighbors=slots.filter(slot=>slot.shop!==key);
      ['paper','snack'].forEach((side,i)=>{
        const node=doc.querySelector(`[data-front-neighbor="${side}"]`),neighbor=neighbors[i];
        if(!node)return;node.hidden=!neighbor;
        if(neighbor){node.style.cssText=spriteStyle(neighbor.shop,side);node.dataset.facing=facingFor(side);node.innerHTML=sprite(neighbor.shop,side);}
      });
    }
    // Shared street views keep their image-aligned shop targets clickable.
    // A screen-wide door target would swallow clicks on the distant kitchen.
    const door=doc.querySelector('#storeDoorHit');door.hidden=!front;door.setAttribute('aria-label','进入'+(shops[key]?.name||'厨房帮手铺'));
    // Switch complete scene groups in this paint: the overview background and all
    // its shops leave together, without an outgoing layer lingering over the door.
    doc.querySelector('#world').hidden=front;
    doc.querySelector('#storefrontScene').hidden=!front;
    doc.querySelector('#guide').hidden=false;
  }
  function transition(commit){
    // Background, storefront and character pose commit before the next browser paint.
    commit();
    return ()=>{};
  }
  return {travelKind,modeFor,positionFor,restFor,init,configure,setView,transition,hitAreaFor};
});
