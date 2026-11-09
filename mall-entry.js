(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else api.init();
})(typeof window!=='undefined'?window:this,function(){
  function rewardFor(state,today){
    let visits=Number.isInteger(state?.visits)&&state.visits>=1&&state.visits<=7?state.visits:1;
    if(state?.lastVisit&&state.lastVisit!==today)visits=Math.min(7,visits+1);
    const value=[3,5,null,6,null,8,null][visits-1];
    return {value,label:value?(state?.coupon?.date===today?'已领':'可领'):'福利'};
  }
  function init(){
    const entry=document.querySelector('.qiyujie-entry');if(!entry)return;
    const preference=matchMedia('(prefers-reduced-motion: reduce)');let timers=[];
    const stop=()=>{timers.forEach(clearTimeout);timers=[];entry.dataset.phase='icon';};
    const start=()=>{
      stop();
      if(preference.matches)return;
      for(const [delay,phase] of [[1600,'coupon'],[3400,'icon'],[5000,'coupon'],[7200,'icon']]){
        timers.push(setTimeout(()=>{entry.dataset.phase=phase;},delay));
      }
    };
    window.addEventListener('pageshow',start);
    window.addEventListener('pagehide',stop);
    preference.addEventListener('change',()=>{if(preference.matches)stop();});
  }
  return {rewardFor,init};
});
