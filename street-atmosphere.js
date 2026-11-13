/* Small, independent street ambience. No tracking or external audio service. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.QiyuStreetAtmosphere=api;})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 function createDialogue({schedule=setTimeout,cancel=clearTimeout,now=()=>performance.now(),onLine,delay=4000}){
  let lines=[],index=0,timer=null,visible=false,remaining=delay,startedAt=0;
  function paint(){if(lines.length)onLine(lines[index]);}
  function clear(){
   if(timer!==null)cancel(timer);
   timer=null;
  }
  function arm(){
   if(!visible||index>=lines.length-1)return;
   startedAt=now();
   timer=schedule(()=>{
    timer=null;
    index++;
    remaining=delay;
    paint();
    arm();
   },remaining);
  }
  return {
   start(next){
    clear();
    lines=next;
    index=0;
    remaining=delay;
    paint();
    arm();
   },
   active(value){
    if(visible===value)return;
    visible=value;
    if(visible)arm();
    else if(timer!==null){
     remaining=Math.max(0,remaining-(now()-startedAt));
     clear();
    }
   },
   paint
  };
 }
 function createMusic({audio}){
  let visible=false;
  async function play(){
   if(!visible||!audio.paused)return;
   try{
    await audio.play();
    if(!visible)audio.pause();
   }catch{} // Some browsers allow audible playback only after a gesture.
  }
  return {
   gesture:play,
   visible(value){
    visible=value;
    if(visible)return play();
    audio.pause();
   }
  };
 }
 const invitations={paper:'日常用纸，补一点～',snack:'嘴馋啦？挑点零食～',kitchen:'厨房帮手，挑一挑～',face:'清爽护理，慢慢挑～',trend:'新喜欢，进店看看～',makeup:'挑点美妆，好心情～',skin:'护肤心意，慢慢挑～',winter:'暖暖好物，挑一挑～',baby:'宝宝好物，慢慢挑～',laundry:'洗护好物，补一点～',accessories:'小小配饰，新喜欢～'};
 function dialogueLines(scene,arrival=false){
  if(scene.overview)return [arrival?'回来啦，再逛逛～':'一起逛小店～','前面有家小店～',`去${scene.targetName}逛逛？`];
  return [`${scene.shopName}，欢迎来逛～`,'来看看有什么～',invitations[scene.shop]||'好物在店里，看看～'];
 }
 function mount({document:doc,greet,reduced=()=>false}){
  const app=doc.querySelector('#app'),guide=doc.querySelector('#guide'),scroll=doc.querySelector('#homeScroll'),audio=doc.querySelector('#streetMusic');
  if(!app||!scroll||!audio)return null;
  let context=null,blocked=false,pageHidden=false,welcomeTimer=null;
  const dialogue=createDialogue({onLine(line){
   const copy=guide?.querySelector('.guide-copy');
   if(copy&&copy.textContent!==line)copy.textContent=line;
  }});
  const music=createMusic({audio});
  audio.volume=.22;
  function active(){const visible=!pageHidden&&!doc.hidden&&!blocked&&scroll.scrollTop<360;dialogue.active(visible);app.classList.toggle('atmosphere-paused',!visible);}
  doc.addEventListener('touchend',music.gesture,{capture:true,passive:true});
  doc.addEventListener('click',music.gesture,true);
  doc.addEventListener('keydown',event=>{if(!event.repeat)music.gesture();},true);
  scroll.addEventListener('scroll',active,{passive:true});
  function syncVisibility(){active();music.visible(!pageHidden&&!doc.hidden);}
  doc.addEventListener('visibilitychange',syncVisibility);
  doc.defaultView?.addEventListener('pagehide',()=>{pageHidden=true;syncVisibility();});
  doc.defaultView?.addEventListener('pageshow',()=>{pageHidden=false;syncVisibility();});
  syncVisibility();
  return {
   scene(next){
    const changed=context?.key!==next.key;
    context=next;
    if(changed)dialogue.start(dialogueLines(next));
    else dialogue.paint();
    active();
   },
   setBlocked(value){blocked=value;active();},
   arrive(){
    if(!context)return;clearTimeout(welcomeTimer);app.classList.remove('shop-welcoming');
    // Reflow only on arrival, so a second visit can replay the brief welcome.
    void app.offsetWidth;app.classList.add('shop-welcoming');
    dialogue.start(dialogueLines(context,true));
    if(!reduced())greet();welcomeTimer=setTimeout(()=>app.classList.remove('shop-welcoming'),1500);
   }
  };
 }
 return {createDialogue,createMusic,mount};
});
