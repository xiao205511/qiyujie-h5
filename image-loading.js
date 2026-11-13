/* Image readiness is shared by every clipped sprite that uses the same atlas. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else api.init(root,document);
})(typeof window!=='undefined'?window:this,function(){
 function createCache(ImageClass){
  const records=new Map(),attempts=new Map();
  function load(url,{retry=false,priority='auto'}={}){
   if(!retry&&records.has(url))return records.get(url);
   const attempt=retry?(attempts.get(url)||0)+1:attempts.get(url)||0;
   attempts.set(url,attempt);
   const source=attempt?url+(url.includes('?')?'&':'?')+'imageRetry='+attempt:url;
   const promise=new Promise((resolve,reject)=>{
    const image=new ImageClass();image.fetchPriority=priority;image.decoding='async';
    image.onload=()=>resolve(source);
    image.onerror=()=>reject(new Error('Image unavailable: '+url));
    image.src=source;
   });
   records.set(url,promise);return promise;
  }
  return {load};
 }
 function init(win,doc){
  const cache=createCache(win.Image),bindings=new Map();let notice;
  const root=doc.querySelector('#app')||doc.querySelector('main');if(!root)return;
  function refreshNotice(){
   const shops=[...root.querySelectorAll('.shop-hotspot>.storefront-sprite')];
   if(shops.length&&shops.every(node=>node.dataset.artState==='ready')&&root.dataset.streetReady!=='true'){
    root.dataset.streetReady='true';doc.dispatchEvent(new win.Event('qiyu-street-ready'));
   }
   const failed=[...bindings.values()].some(b=>b.element.isConnected&&b.host.dataset.artState==='error');
   if(!failed&&!notice)return;
   if(!notice){
    notice=doc.createElement('div');notice.className='image-retry-notice';notice.setAttribute('role','status');
    const text=doc.createElement('span');text.textContent='部分图片暂未加载';
    const button=doc.createElement('button');button.type='button';button.textContent='重试图片';
    button.addEventListener('click',()=>{
     const urls=new Set([...bindings.values()].filter(b=>b.element.isConnected&&b.host.dataset.artState==='error').map(b=>b.url));
     urls.forEach(url=>cache.load(url,{retry:true}).catch(()=>{}));
     for(const binding of bindings.values())if(binding.element.isConnected&&urls.has(binding.url))watch(binding);
    });
    notice.append(text,button);root.append(notice);
   }
   const modal=doc.querySelector('#modal'),overlay=doc.querySelector('#overlay');
   const mount=modal&&overlay&&!overlay.hidden?modal:root;
   if(notice.parentElement!==mount)mount.append(notice);
   notice.hidden=!failed;
  }
  function watch(binding){
   const {element,host,url,message}=binding,token={};binding.token=token;
   host.dataset.artState='loading';message.textContent=binding.label+'加载中';message.hidden=false;
   const slow=win.setTimeout(()=>{
    if(binding.token===token&&host.dataset.artState==='loading'){
     host.dataset.artState='error';message.textContent='图片加载较慢';refreshNotice();
    }
   },20000);
   refreshNotice();
   cache.load(url,{priority:binding.label==='商品图'?'low':'high'}).then(source=>{
    if(binding.token!==token)return;
    win.clearTimeout(slow);
    if(element.tagName.toLowerCase()==='image')element.setAttribute('href',source);
    else if(element.getAttribute('src')!==source)element.setAttribute('src',source);
    host.dataset.artState='ready';message.hidden=true;refreshNotice();
   },()=>{
    if(binding.token!==token)return;
    win.clearTimeout(slow);host.dataset.artState='error';message.textContent='图片暂未加载';refreshNotice();
   });
  }
  function scan(){
   for(const [element] of bindings)if(!element.isConnected)bindings.delete(element);
   root.querySelectorAll('img.product-image,.sprite-image>image,img.street-art,.popup-mascot>img,img.mall-reference').forEach(element=>{
    if(bindings.has(element))return;
    const svg=element.closest('.sprite-image'),host=svg?svg.parentElement:element.parentElement;
    const url=element.getAttribute(svg?'href':'src');if(!url)return;
    const message=doc.createElement('span');message.className='image-loading-message';message.setAttribute('aria-hidden','true');
    host.classList.add('image-loading-surface');host.append(message);
    const binding={element,host,url,message,label:host.classList.contains('product-art')?'商品图':element.classList.contains('mall-reference')?'商城':'街景'};
    bindings.set(element,binding);watch(binding);
   });
   refreshNotice();
  }
  scan();new win.MutationObserver(scan).observe(root,{childList:true,subtree:true});
  const boot=doc.querySelector('#streetLoading');if(boot)boot.hidden=true;
 }
 return {createCache,init};
});
