(function(root,factory){
 if(typeof module!=='undefined'&&module.exports)module.exports=factory(require('./rewards-flow.js'));else root.QiyuRewardGroups=factory(root.QiyuRewards);
})(typeof window==='undefined'?globalThis:window,function(Flow){
 'use strict';
 const setKey=ids=>ids?[...new Set(ids)].sort():null;
 const expiry=e=>{const r=e.coupon||e.benefit;return r?.date?Flow.couponExpiry(r):'9999';};
 function group(entries){
  const groups=[],keys=new Map();
  for(const entry of entries.flatMap(e=>e.members||[e])){
   const c=entry.coupon,key=c?JSON.stringify([entry.status,c.value,c.min,c.source||'daily',c.type||'coupon',c.scope||'designated',setKey(c.shopIds),setKey(c.productIds),c.date,Flow.couponExpiry(c)]):null;
   const existing=key&&keys.get(key);
   if(existing){existing.members.push(entry);existing.ids.push(entry.id);existing.count++;}
   else {const row={...entry,count:1,ids:[entry.id],members:[entry]};groups.push(row);if(key)keys.set(key,row);}
  }
  return groups;
 }
 function partition(entries){
  const rows=group(entries),available=rows.filter(e=>e.status==='available').sort((a,b)=>expiry(a).localeCompare(expiry(b))),pending=rows.filter(e=>e.status==='pending'),history=rows.filter(e=>!['available','pending'].includes(e.status));
  return {available,pending,history,availableCount:available.reduce((n,e)=>n+e.count,0),historyCount:history.reduce((n,e)=>n+e.count,0)};
 }
 return {group,partition};
});
