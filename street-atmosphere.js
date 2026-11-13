/* Small, independent street ambience. No tracking or external audio service. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.QiyuStreetAtmosphere=api;})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 function createIdle({schedule=setTimeout,cancel=clearTimeout,onIdle,delay=5000}){
  let timer=null,key=null,active=false,shown=false,destroyed=false;
  function clear(){if(timer!==null)cancel(timer);timer=null;}
  function arm(){clear();if(!destroyed&&active&&key!==null&&!shown)timer=schedule(()=>{timer=null;shown=true;onIdle();},delay);}
  return {visit(next){if(destroyed||key===next)return;key=next;shown=false;arm();},active(value){if(active===value)return;active=value;arm();},touch:arm,destroy(){destroyed=true;clear();}};
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
 const invitations={paper:'日常用纸，进店补一点～',snack:'嘴馋啦？挑点小零食～',kitchen:'厨房小帮手，进店看看～',face:'清爽护理，进店慢慢挑～',trend:'发现新喜欢，进店看看～',makeup:'挑点美妆，添一点好心情～',skin:'护肤小心意，进店看看～',winter:'暖暖好物，进店挑一挑～',baby:'宝宝好物，进店慢慢挑～',laundry:'洗护好物，进店补一点～',accessories:'小小配饰，挑点新喜欢～'};
 function mount({document:doc,storage,greet,reduced=()=>false}){
  const app=doc.querySelector('#app'),guide=doc.querySelector('#guide'),scroll=doc.querySelector('#homeScroll'),button=doc.querySelector('#musicToggle'),audio=doc.querySelector('#streetMusic');
  if(!app||!button||!audio)return null;
  let context=null,blocked=false,welcomeTimer=null;
  const idle=createIdle({onIdle(){if(!context)return;const target=context.overview?context.target:context.shop;const copy=guide.querySelector('.guide-copy');if(copy){copy.textContent=context.overview?`去${context.targetName}逛逛？`:(invitations[target]||'好物在店里，进去看看～');guide.dataset.hint='idle';}}});
  const music=createMusic({audio,read:()=>storage.getItem('qiyu-street-music-v1'),write:v=>storage.setItem('qiyu-street-music-v1',v),onChange({playing}){button.setAttribute('aria-pressed',String(playing));button.setAttribute('aria-label',playing?'关闭背景音乐':'开启背景音乐');button.title=playing?'关闭背景音乐':'开启背景音乐';button.dataset.playing=String(playing);}});
  audio.volume=.22;
  function active(){const visible=!doc.hidden&&!blocked&&scroll.scrollTop<360;idle.active(visible);app.classList.toggle('atmosphere-paused',!visible);}
  const interact=event=>{idle.touch();if(!event.target.closest?.('#musicToggle'))music.gesture();};
  doc.addEventListener('pointerdown',()=>idle.touch(),{passive:true});doc.addEventListener('click',interact);doc.addEventListener('keydown',event=>{if(!event.repeat)interact(event);});
  scroll.addEventListener('scroll',()=>{idle.touch();active();},{passive:true});
  button.addEventListener('click',()=>music.toggle());audio.addEventListener('error',()=>music.failed());
  doc.addEventListener('visibilitychange',()=>{active();music.visible(!doc.hidden);});
  doc.defaultView?.addEventListener('pagehide',()=>{idle.active(false);music.visible(false);});
  doc.defaultView?.addEventListener('pageshow',()=>{active();music.visible(!doc.hidden);});
  return {
   scene(next){context=next;idle.visit(next.key);active();},
   setBlocked(value){blocked=value;active();},
   arrive(){
    if(!context)return;clearTimeout(welcomeTimer);app.classList.remove('shop-welcoming');
    // Reflow only on arrival, so a second visit can replay the brief welcome.
    void app.offsetWidth;app.classList.add('shop-welcoming');guide.dataset.hint='arrival';
    const copy=guide.querySelector('.guide-copy');if(copy)copy.textContent=context.overview?'回来啦，再逛逛～':`${context.shopName}，欢迎来逛～`;
    if(!reduced())greet();welcomeTimer=setTimeout(()=>app.classList.remove('shop-welcoming'),1500);
   }
  };
 }
 return {createIdle,createMusic,mount};
});
