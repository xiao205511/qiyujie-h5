(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else {root.QiyuShopViews=api;api.init(document);}
})(typeof window!=='undefined'?window:this,function(){
  const travelKind=(from,to)=>from===to?'enter':from==='paper'&&to==='snack'?'walk':'cut';
  const modeFor=key=>key==='paper'?'street':'store';
  function restFor(key,walking){
    if(key!=='kitchen')return walking.rest(key);
    const base=walking.rest('paper'),dx=302-base.point[0],dy=548-base.point[1];
    const feet=Object.fromEntries(Object.entries(base.feet).map(([side,foot])=>[side,{...foot,x:foot.x+dx,y:foot.y+dy}]));
    return {...base,point:[302,548],screen:{x:302,y:548},camera:{x:0,y:0,scale:1},size:1,scene:'kitchen-front',feet,arrivalHeading:[0,1]};
  }
  let doc,art,curtain,originalArt,endCurrent=null;
  function init(document){
    doc=document;art=doc.querySelector('#world .street-art');originalArt=art.getAttribute('src');
    curtain=doc.createElement('div');curtain.className='scene-curtain';curtain.hidden=true;curtain.setAttribute('aria-hidden','true');doc.querySelector('.street').append(curtain);
  }
  function setView(key){
    const front=key==='kitchen';
    art.src=front?'assets/kitchen-front.png':originalArt;
    art.alt=front?'厨房帮手铺独立门口近景，台阶前是开阔空地': '纸巾铺、零食铺和厨房铺沿街排列';
    const app=doc.querySelector('#app');app.dataset.sceneMode=modeFor(key);app.dataset.sceneAsset=front?'kitchen-front':'street';
    // Shared street views keep their image-aligned shop targets clickable.
    // A screen-wide door target would swallow clicks on the distant kitchen.
    const door=doc.querySelector('#storeDoorHit');door.hidden=!front;door.setAttribute('aria-label','进入厨房帮手铺');
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
  return {travelKind,modeFor,restFor,init,setView,transition};
});
