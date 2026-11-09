/* Shared world-space ground model: route, planted feet and camera projection. */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.QiyuWalking=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>t*t*(3-2*t);
  function create(config={}){
  const stops=config.stops||{
    paper:{point:[278,548],scale:1,screen:[278,548],facing:1},
    snack:{point:[353,443],scale:1.7,screen:[332,540],facing:1},
    kitchen:{point:[280,350],scale:2.1,screen:[270,535],facing:1}
  };
  const paperSnack=[stops.paper.point,[306,541],[334,527],[357,506],[368,485],[363,464],stops.snack.point];
  const snackKitchen=[stops.snack.point,[330,438],[306,430],[286,420],[273,407],[267,395],[270,380],[271,363],stops.kitchen.point];
  const paperKitchen=[...paperSnack.slice(0,-1),[347,450],...snackKitchen.slice(1)];
  const pairs=config.paths||{'paper:snack':paperSnack,'snack:kitchen':snackKitchen,'paper:kitchen':paperKitchen};
  const sizeAt=config.sizeAt||(y=>clamp(.56+.44*(y-328)/220,.56,1));
  function catmull(a,b,c,d,t){
    return [0,1].map(k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t));
  }
  function route(from,to){
    let points=pairs[from+':'+to];
    if(!points){const back=pairs[to+':'+from];if(!back)throw Error('Unknown walking route');points=[...back].reverse();}
    const samples=[{point:[...points[0]],distance:0,gait:0}];
    for(let i=0;i<points.length-1;i++)for(let n=1;n<=28;n++){
      const p=catmull(points[Math.max(0,i-1)],points[i],points[i+1],points[Math.min(points.length-1,i+2)],n/28);
      const previous=samples.at(-1),delta=Math.hypot(p[0]-previous.point[0],p[1]-previous.point[1]);
      const middle=[(p[0]+previous.point[0])/2,(p[1]+previous.point[1])/2];
      const heading=[(p[0]-previous.point[0])/(delta||1),(p[1]-previous.point[1])/(delta||1)];
      const stride=config.gaitStride?config.gaitStride(middle,heading):36*sizeAt(middle[1]);
      samples.push({point:p,distance:previous.distance+delta,gait:previous.gait+delta/Math.max(1,stride)});
    }
    samples[0].point=[...stops[from].point];samples.at(-1).point=[...stops[to].point];
    return {from,to,samples,length:samples.at(-1).distance,gaitLength:samples.at(-1).gait};
  }
  function bracket(samples,key,value){let low=0,high=samples.length-1;while(high-low>1){const mid=(low+high)>>1;if(samples[mid][key]<=value)low=mid;else high=mid;}return [samples[low],samples[high]];}
  function sample(path,distance){
    const d=clamp(distance,0,path.length),[a,b]=bracket(path.samples,'distance',d),t=(d-a.distance)/(b.distance-a.distance||1);
    const dx=b.point[0]-a.point[0],dy=b.point[1]-a.point[1],length=Math.hypot(dx,dy)||1;
    return {point:d===0?[...stops[path.from].point]:d===path.length?[...stops[path.to].point]:[mix(a.point[0],b.point[0],t),mix(a.point[1],b.point[1],t)],gait:mix(a.gait,b.gait,t),heading:[dx/length,dy/length]};
  }
  function distanceAtGait(path,gait){const g=clamp(gait,0,path.gaitLength),[a,b]=bracket(path.samples,'gait',g);return mix(a.distance,b.distance,(g-a.gait)/(b.gait-a.gait||1));}
  function contact(path,gait,side){const p=sample(path,distanceAtGait(path,gait)).point,scale=sizeAt(p[1]);return {x:p[0]+side*10.8*scale,y:p[1]+.6*scale};}
  function foot(path,distance,body,side){
    const offset=side===-1?0:.5,g=body.gait+offset,cycle=Math.floor(g),phase=g-cycle,base=cycle-offset;
    const a=contact(path,base+.3,side),b=contact(path,base+1.3,side);
    const swinging=phase>=.6,t=swinging?(phase-.6)/.4:0;
    let x=swinging?mix(a.x,b.x,smooth(t)):a.x,y=swinging?mix(a.y,b.y,smooth(t)):a.y;
    const scale=sizeAt(body.point[1]);
    const blend=smooth(clamp(Math.min(distance,path.length-distance)/10,0,1));
    x=mix(body.point[0]+side*10.8*scale,x,blend);y=mix(body.point[1]+.6*scale,y,blend);
    const lift=swinging?Math.sin(Math.PI*t)*7*scale*blend:0;
    return {x,y,lift,phase,planted:lift<.01,contact:base+.3};
  }
  function project(point,camera){return {x:point[0]*camera.scale+camera.x,y:point[1]*camera.scale+camera.y};}
  function cameraFor(point,from,to,progress){
    if(config.cameraFor)return config.cameraFor(point,from,to,progress,stops);
    const a=stops[from],b=stops[to],t=smooth(progress),scale=mix(a.scale,b.scale,t);
    const x=clamp(mix(a.screen[0],b.screen[0],t)-point[0]*scale,414*(1-scale),0);
    const y=clamp(mix(a.screen[1],b.screen[1],t)-point[1]*scale,646*(1-scale),0);
    return {x,y,scale};
  }
  function pose(path,distance){
    const d=clamp(distance,0,path.length),body=sample(path,d),camera=cameraFor(body.point,path.from,path.to,d/path.length);
    const facing=Math.abs(body.heading[0])>.15?Math.sign(body.heading[0]):stops[path.to].facing;
    return {...body,camera,screen:project(body.point,camera),size:sizeAt(body.point[1]),facing,feet:{left:foot(path,d,body,-1),right:foot(path,d,body,1)}};
  }
  function rest(key){const point=[...stops[key].point],size=sizeAt(point[1]),camera=cameraFor(point,key,key,1);return {point,camera,screen:project(point,camera),gait:0,size,facing:stops[key].facing,arrivalHeading:stops[key].arrivalHeading,feet:{left:{x:point[0]-10.8*size,y:point[1]+.6*size,lift:0,phase:0,planted:true},right:{x:point[0]+10.8*size,y:point[1]+.6*size,lift:0,phase:.5,planted:true}}};}
  return {stops,route,sample,pose,rest,project,sizeAt,distanceAtGait};
  }
  return {...create(),create};
});
