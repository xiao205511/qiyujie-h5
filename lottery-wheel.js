(function(root,factory){
 const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.QiyuLotteryWheel=api;
})(typeof window==='undefined'?globalThis:window,function(){
 const rotationForPrize=(index,count,random=.5)=>{
  const jitter=(Math.max(0,Math.min(1,random))-.5)*24;
  const offset=(-index*360/count+jitter+360)%360;
  return 5*360+offset;
 };
 return {rotationForPrize};
});
