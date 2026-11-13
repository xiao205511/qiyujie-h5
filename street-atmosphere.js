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
 function createMusic({audio,read=()=>null,write=()=>{},onChange=()=>{}}){
  let enabled=true;try{enabled=read()!=='off';}catch{}
  let unlocked=false,visible=true,playing=false,request=0;
  const publish=()=>onChange({enabled,playing});
  const wanted=()=>enabled&&unlocked&&visible;
  async function sync(){
   const token=++request;
   if(!wanted()){audio.pause();playing=false;publish();return;}
   try{await audio.play();if(token===request&&wanted()){playing=true;publish();}else if(!wanted())audio.pause();}
   catch{if(token===request){playing=false;unlocked=false;publish();}}
  }
  publish();return {
   gesture(){if(unlocked||!enabled)return;unlocked=true;return sync();},
   toggle(){enabled=!(enabled&&unlocked);unlocked=true;try{write(enabled?'on':'off');}catch{}return sync();},
   visible(value){visible=value;return sync();},
   failed(){request++;audio.pause();playing=false;unlocked=false;publish();}
  };
 }
 const invitations={paper:'日常用纸，补一点～',snack:'嘴馋啦？挑点零食～',kitchen:'厨房帮手，挑一挑～',face:'清爽护理，慢慢挑～',trend:'新喜欢，进店看看～',makeup:'挑点美妆，好心情～',skin:'护肤心意，慢慢挑～',winter:'暖暖好物，挑一挑～',baby:'宝宝好物，慢慢挑～',laundry:'洗护好物，补一点～',accessories:'小小配饰，新喜欢～'};
 function dialogueLines(scene,arrival=false){
  if(scene.overview)return [arrival?'回来啦，再逛逛～':'一起逛小店～','前面有家小店～',`去${scene.targetName}逛逛？`];
  return [`${scene.shopName}，欢迎来逛～`,'来看看有什么～',invitations[scene.shop]||'好物在店里，看看～'];
 }
 function mount({document:doc,storage,greet,reduced=()=>false}){
  const app=doc.querySelector('#app'),guide=doc.querySelector('#guide'),scroll=doc.querySelector('#homeScroll'),button=doc.querySelector('#musicToggle'),audio=doc.querySelector('#streetMusic');
  if(!app||!button||!audio)return null;
  let context=null,blocked=false,pageHidden=false,welcomeTimer=null;
  const dialogue=createDialogue({onLine(line){
   const copy=guide?.querySelector('.guide-copy');
   if(copy&&copy.textContent!==line)copy.textContent=line;
  }});
  const music=createMusic({audio,read:()=>storage.getItem('qiyu-street-music-v1'),write:v=>storage.setItem('qiyu-street-music-v1',v),onChange({playing}){button.setAttribute('aria-pressed',String(playing));button.setAttribute('aria-label',playing?'关闭背景音乐':'开启背景音乐');button.title=playing?'关闭背景音乐':'开启背景音乐';button.dataset.playing=String(playing);}});
  audio.volume=.22;
  function active(){const visible=!pageHidden&&!doc.hidden&&!blocked&&scroll.scrollTop<360;dialogue.active(visible);app.classList.toggle('atmosphere-paused',!visible);}
  const interact=event=>{if(!event.target.closest?.('#musicToggle'))music.gesture();};
  doc.addEventListener('click',interact);doc.addEventListener('keydown',event=>{if(!event.repeat)interact(event);});
  scroll.addEventListener('scroll',active,{passive:true});
  button.addEventListener('click',()=>music.toggle());audio.addEventListener('error',()=>music.failed());
  function syncVisibility(){active();music.visible(!pageHidden&&!doc.hidden);}
  doc.addEventListener('visibilitychange',syncVisibility);
  doc.defaultView?.addEventListener('pagehide',()=>{pageHidden=true;syncVisibility();});
  doc.defaultView?.addEventListener('pageshow',()=>{pageHidden=false;syncVisibility();});
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
