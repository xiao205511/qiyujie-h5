/* Projection and travel calibration for the exported stage-2 skeleton. */
(function(root){
  const pixelsPerUnit=48,elevation=.5,period=1.12,travelSpeed=1.5;
  // The planted hip chain moves 0.31 model units during 62% of a cycle.
  const stride=(.56*(Math.sin(.34)+Math.sin(.22)))/.62;
  function perspectiveFor(pose){
    // Street artwork and avatar share the same camera zoom. Applying the old
    // reciprocal depth curve here cancelled that zoom and kept the IP tiny.
    return pose.scene==='kitchen-front'?1.5:1;
  }
  const yawFor=heading=>Math.atan2(heading[0],heading[1]/Math.sin(elevation));
  // Keep the face out of view while allowing a small lean into the street bend.
  const walkingHeading=([x])=>[x*.7,-1];
  const strideFor=(point,heading)=>{
    const yaw=yawFor(heading),projection=Math.hypot(Math.sin(yaw),Math.cos(yaw)*Math.sin(elevation));
    return pixelsPerUnit*stride*perspectiveFor({point})*projection;
  };
  root.QiyuRigStreetMotion={pixelsPerUnit,elevation,period,travelSpeed,stride,perspectiveFor,yawFor,strideFor,walkingHeading};
})(typeof window==='undefined'?globalThis:window);
