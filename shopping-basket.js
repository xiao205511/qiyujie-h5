(function(root,factory){
 if(typeof module!=='undefined'&&module.exports)module.exports=factory(require('./rewards-flow.js'));else root.QiyuBasket=factory(root.QiyuRewards);
})(typeof window==='undefined'?globalThis:window,function(Flow){
 'use strict';
 function items(s,catalog,shop){
  return catalog.filter(p=>!shop||p.shop===shop).map(product=>({product,quantity:Math.min(9,Math.max(0,Math.floor(Number(s.basket?.[product.id])||0)))})).filter(i=>i.quantity>0);
 }
 function setQuantity(s,id,quantity,catalog){
  if(!catalog.some(p=>p.id===id)||!Number.isFinite(Number(quantity)))return s;
  const basket={...s.basket},basketSelection={...s.basketSelection},count=Math.min(9,Math.max(0,Math.floor(Number(quantity))));
  if(count){if(!basket[id])delete basketSelection[id];basket[id]=count;}else{delete basket[id];delete basketSelection[id];}
  return {...s,basket,basketSelection};
 }
 const selectedItems=(s,catalog,shop)=>items(s,catalog,shop).filter(i=>s.basketSelection?.[i.product.id]!==false);
 function setSelected(s,ids,selected,catalog){
  const basketSelection={...s.basketSelection},known=new Set(items(s,catalog).map(i=>i.product.id));
  for(const id of ids)if(known.has(id)){if(selected)delete basketSelection[id];else basketSelection[id]=false;}
  return {...s,basketSelection};
 }
 const scopedItems=(s,catalog,{shop,selectedOnly=true}={})=>(selectedOnly?selectedItems:items)(s,catalog,shop);
 const quote=(s,catalog,today,options={})=>Flow.quoteItems(s,scopedItems(s,catalog,options),today,options);
 const quoteDraft=(s,catalog,draft,today,options={})=>Flow.quoteItems(s,items({basket:draft},catalog),today,options);
 const placeDraftOrder=(s,catalog,draft,today,id,options={})=>Flow.placeItemsOrder(s,items({basket:draft},catalog),today,id,options);
 function checkout(s,catalog,today,id,options={}){
  if(s.orders.some(o=>o.id===id))return s;
  const lines=scopedItems(s,catalog,options),next=Flow.placeItemsOrder(s,lines,today,id,options);
  if(next===s)return s;
  const basket={...s.basket},basketSelection={...s.basketSelection};
  for(const i of lines){delete basket[i.product.id];delete basketSelection[i.product.id];}
  return {...next,basket,basketSelection};
 }
 const applies=(c,p)=>(!c.shopIds||c.shopIds.includes(p.shop))&&(!c.productIds||c.productIds.includes(p.id))&&(c.scope==='street'||p.eligible);
 function goal(s,catalog,today,options={}){
  const lines=scopedItems(s,catalog,options),q=quote(s,catalog,today,options);
  const candidates=Flow.availableCoupons(s,today).filter(c=>catalog.some(p=>(!options.shop||p.shop===options.shop)&&applies(c,p))).map(c=>{
   const cents=lines.filter(i=>applies(c,i.product)).reduce((sum,i)=>sum+Math.round(i.product.price*100)*i.quantity,0);
   return {coupon:c,eligibleSubtotal:cents/100,shortfall:Math.max(0,Math.round(c.min*100)-cents)/100};
  }).sort((a,b)=>a.shortfall-b.shortfall||b.coupon.value-a.coupon.value||a.coupon.expiresOn.localeCompare(b.coupon.expiresOn));
  return candidates.find(g=>g.coupon.id===options.couponId)||candidates.find(g=>g.coupon.id===q.coupon?.id)||candidates[0]||null;
 }
 return {items,selectedItems,scopedItems,setQuantity,setSelected,quote,checkout,quoteDraft,placeDraftOrder,goal,applies};
});
