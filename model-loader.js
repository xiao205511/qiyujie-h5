/* Deliver the exact existing rig with lossless compression, after visible shops. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.QiyuModelLoader=api;})(typeof window==='object'?window:globalThis,function(root){
 'use strict';
 function waitForStreet(){
  const doc=root.document,app=doc?.querySelector('#app');
  if(!app||app.dataset.streetReady==='true')return Promise.resolve();
  return new Promise(resolve=>{
   const done=()=>{clearTimeout(timer);doc.removeEventListener('qiyu-street-ready',done);resolve();};
   const timer=setTimeout(done,1500);doc.addEventListener('qiyu-street-ready',done,{once:true});
  });
 }
 async function load(loader,{fetch=root.fetch,Decompression=root.DecompressionStream,wait=waitForStreet}={}){
  await wait();
  const report=kind=>root.document?.querySelector('#app')?.setAttribute('data-model-transport',kind);
  if(typeof Decompression==='function'){
   try{
    const response=await fetch('ip-rig-stage2/assets/qiyu-rigged-v1.glb.gz',{priority:'low',cache:'force-cache'});
    if(!response.ok)throw Error('Compressed rig unavailable');
    let bytes=await response.arrayBuffer();
    const head=new Uint8Array(bytes,0,Math.min(4,bytes.byteLength));
    if(String.fromCharCode(...head)!=='glTF')bytes=await new Response(new Response(bytes).body.pipeThrough(new Decompression('gzip'))).arrayBuffer();
    const result=await loader.parseAsync(bytes,'ip-rig-stage2/assets/');report('gzip');return result;
   }catch{/* Older browsers or a failed transfer keep the original compatible rig. */}
  }
  report('original');return loader.loadAsync('ip-rig-stage2/assets/qiyu-rigged.glb?v=video2-legs1');
 }
 return {load};
});
