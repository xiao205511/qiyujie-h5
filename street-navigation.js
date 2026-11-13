/* Navigation calibration for the 3D street preview. */
(function(root){
  'use strict';
  const base=root.QiyuWalking;
  const rigged=Boolean(root.QiyuRigStreetMotion);
  // Match the short-step rig in ip-walk-3d/gait.mjs (covered by the stride test).
  const motion={reach:.15,stance:.66,period:.96};
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t,smooth=t=>t*t*(3-2*t);
  const stops={
    paper:{point:rigged?[282,534]:[278,548],scale:1,screen:rigged?[282,534]:[278,548],facing:1,arrivalHeading:[-.7,-.7]},
    // Stand on the approach pavement beside the nearby shop's left doorstep.
    snack:{point:rigged?[310,434]:[353,443],scale:rigged?1.3:1.7,screen:rigged?[280,512]:[332,540],facing:1,arrivalHeading:[.35,-.94]},
    kitchen:{point:[292,327],scale:2,screen:[224,510],facing:1,arrivalHeading:[0,-1]},
  };
  // Follow the pavement around the terrace; the inside curb needs foot clearance.
  const paperSnack=rigged
    ?[stops.paper.point,[311,528],[334,511],[344,491],[334,470],[321,451],stops.snack.point]
    :[stops.paper.point,[306,541],[334,527],[357,506],[368,485],[363,464],stops.snack.point];
  const snackKitchen=[stops.snack.point,[330,438],[306,430],[286,420],[273,407],[267,395],[270,380],[274,360],[282,343],stops.kitchen.point];
  const paperKitchen=[...paperSnack.slice(0,-1),[347,450],...snackKitchen.slice(1)];
  const sizeAt=y=>root.QiyuRigStreetMotion?root.QiyuRigStreetMotion.perspectiveFor({point:[0,y]}):y>=443?mix(1/1.7,1,clamp((y-443)/105,0,1)):mix(.5,1/1.7,clamp((y-327)/116,0,1));
  function cameraFor(point,from,to,progress){
    const a=stops[from],b=stops[to],t=smooth(progress),scale=mix(a.scale,b.scale,t);
    const ax=a.screen[0]-a.point[0]*a.scale,ay=a.screen[1]-a.point[1]*a.scale;
    const bx=b.screen[0]-b.point[0]*b.scale,by=b.screen[1]-b.point[1]*b.scale;
    const halfWidth=root.QiyuRigStreetMotion?52*sizeAt(point[1])*scale:48;
    let x=clamp(mix(ax,bx,t),10+halfWidth-point[0]*scale,404-halfWidth-point[0]*scale);
    let y=clamp(mix(ay,by,t),470-point[1]*scale,548-point[1]*scale);
    return {x:clamp(x,414*(1-scale),0),y:clamp(y,646*(1-scale),0),scale};
  }
  const nav=base.create({stops,paths:{'paper:snack':paperSnack,'snack:kitchen':snackKitchen,'paper:kitchen':paperKitchen},sizeAt,cameraFor,
    gaitStride:(point,heading)=>{
      const yaw=Math.atan2(heading[0],heading[1]/Math.sin(.5));
      const projected=Math.hypot(Math.sin(yaw),Math.cos(yaw)*Math.sin(.5));
      return root.QiyuRigStreetMotion?root.QiyuRigStreetMotion.strideFor(point,heading):60*(2*motion.reach*1.3/motion.stance)*sizeAt(point[1])*projected;
    },
  });
  nav.durationFor=path=>rigged?clamp(2.35+path.length/500,2.4,3):clamp(path.gaitLength*motion.period,2.4,8.8);
  // Keep clip cadence gentle while allowing controlled sliding along the route.
  nav.gaitForProgress=(path,progress)=>{
    const cycles=Math.min(path.gaitLength,nav.durationFor(path)/(root.QiyuRigStreetMotion?.period||motion.period)*.78);
    return cycles*smooth(clamp(progress,0,1));
  };
  nav.distanceForProgress=(path,progress)=>{
    const p=clamp(progress,0,1),r=.12;
    const travel=p<r?p*p/(2*r*(1-r)):p>1-r?1-(1-p)*(1-p)/(2*r*(1-r)):(p-r/2)/(1-r);
    return nav.distanceAtGait(path,path.gaitLength*travel);
  };
  root.QiyuWalking=nav;
})(window);
