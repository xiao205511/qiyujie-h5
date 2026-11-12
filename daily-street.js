(function(root,factory){
 const catalog=typeof module!=='undefined'&&module.exports?require('./catalog.js'):root.QiyuCatalog;
 const api=factory(catalog);if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.QiyuDailyStreet=api;
})(typeof window==='undefined'?globalThis:window,function(Catalog){
 'use strict';
 const policy='selection-v1.1',core=Catalog.coreShopIds,candidates=Catalog.candidateShopIds,keys=[...core,...candidates];
 const positions=['paper','snack','kitchen'],roles=['repurchase','interest','discovery'],labels=['常逛','心动','NEW'];
 const dayValue=day=>Date.parse(day+'T00:00:00Z');
 const validDay=day=>typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(dayValue(day));
 const addDays=(day,n)=>new Date(dayValue(day)+n*86400000).toISOString().slice(0,10);
 const known=key=>keys.includes(key);
 function startDay(state,day){
  const dates=[state.streetStartedOn,...(state.unlockedRewards||[]).map(e=>e.date),state.cycleId?.replace(/^cycle:/,'')].filter(d=>validDay(d)&&d<=day).sort();
  return dates[0]||day;
 }
 function purchaseScores(state,day){
  const scores=new Map(),since=addDays(day,-90);
  for(const order of state.orders||[]){
   if(!validDay(order.date)||order.date<since||order.date>day)continue;
   const stores=new Set((order.items||[]).map(i=>Catalog.allProducts.find(p=>p.id===i.product)?.shop));
   if(known(order.shop))stores.add(order.shop);
   for(const shop of stores){if(!known(shop))continue;const old=scores.get(shop)||{count:0,date:''};scores.set(shop,{count:old.count+1,date:order.date>old.date?order.date:old.date});}
  }
  return scores;
 }
 function interestScores(state,day){
  const since=addDays(day,-30),signals=(state.shopSignals||[]).filter(e=>known(e.shop)&&validDay(e.date)&&e.date>=since&&e.date<=day),scores=new Map();
  for(const signal of signals){
   const weight=signal.type==='view'?1:signal.type==='cart'?20:0;if(!weight)continue;
   const old=scores.get(signal.shop)||{score:0,date:''};scores.set(signal.shop,{score:old.score+weight,date:signal.date>old.date?signal.date:old.date});
  }
  for(const shop of state.favorites||[]){
   if(!known(shop))continue;
   const last=signals.filter(e=>e.shop===shop&&e.type==='favorite').at(-1),hasOlder=(state.shopSignals||[]).some(e=>e.shop===shop&&e.type==='favorite');
   if(!last&&hasOlder)continue;
   const old=scores.get(shop)||{score:0,date:''};scores.set(shop,{score:old.score+100,date:last?.date||day});
  }
  return scores;
 }
 function derive(state,day){
  const bought=purchaseScores(state,day),ranked=[...bought].filter(([key])=>core.includes(key)).sort((a,b)=>b[1].count-a[1].count||b[1].date.localeCompare(a[1].date)||core.indexOf(a[0])-core.indexOf(b[0]));
  const first=ranked[0]?.[0]||'paper',scores=interestScores(state,day);
  const interested=[...scores].filter(([key])=>core.includes(key)&&key!==first&&!bought.has(key)).sort((a,b)=>b[1].score-a[1].score||b[1].date.localeCompare(a[1].date)||core.indexOf(a[0])-core.indexOf(b[0]));
  const second=interested[0]?.[0]||['face','paper','laundry','kitchen','snack','makeup','skin','winter'].find(key=>key!==first&&!bought.has(key))||core.find(key=>key!==first);
  // §8.6 defines a pool, not a fixed seven-day schedule. Candidates need interest.
  const month=Number(day.slice(5,7)),seasonal=month>=11||month<=2,personal=candidates.filter(key=>scores.has(key)||bought.has(key));
  const pool=seasonal?['winter',...personal,'kitchen','snack']:['kitchen',...personal,'snack','winter'];
  const offset=Math.floor((dayValue(day)-dayValue(startDay(state,day)))/86400000),index=((offset%pool.length)+pool.length)%pool.length;
  const rotated=[...pool.slice(index),...pool.slice(0,index)].filter(key=>key!==first&&key!==second);
  const previous=state.streetSnapshot?.date===addDays(day,-1)?state.streetSnapshot?.slots?.[2]?.shop:null;
  const available=rotated.filter(key=>key!==previous);
  // If the other slots occupy the whole pool, use another configured core store.
  const choices=available.length?available:core.filter(key=>key!==first&&key!==second&&key!==previous),touched=new Set([...bought.keys(),...scores.keys()]);
  const third=choices.find(key=>!touched.has(key)||personal.includes(key))||choices[0];
  return [first,second,third].map((shop,i)=>({shop,position:positions[i],role:roles[i],label:labels[i]}));
 }
 const validSnapshot=(snapshot,day)=>snapshot?.policy===policy&&snapshot.date===day&&snapshot.slots?.length===3&&new Set(snapshot.slots.map(s=>s.shop)).size===3&&snapshot.slots.every((s,i)=>known(s.shop)&&s.position===positions[i]&&s.role===roles[i]&&(i===2||core.includes(s.shop)));
 function resolve(state,day){
  const started=startDay(state,day),slots=validSnapshot(state.streetSnapshot,day)?state.streetSnapshot.slots:derive(state,day);
  return {state:{...state,streetStartedOn:started,streetSnapshot:{policy,date:day,slots}},slots};
 }
 function record(state,shop,type,day){
  if(!known(shop)||!['view','favorite','unfavorite','cart'].includes(type)||!validDay(day))return state;
  const signals=[...(state.shopSignals||[])];
  if(!signals.some(s=>s.shop===shop&&s.type===type&&s.date===day))signals.push({shop,type,date:day});
  const next={...state,shopSignals:signals.filter(e=>validDay(e.date)&&e.date>=addDays(day,-90)).slice(-300)};
  if(startDay(state,day)===day)delete next.streetSnapshot;
  return next;
 }
 const preview=(state,day)=>derive(state,day);
 function benefitProducts(state,day,type){
  const slots=type==='preview'?preview(state,addDays(day,1)):resolve(state,day).slots,shop=slots[type==='preview'?2:1].shop;
  return Catalog.shops[shop].products.slice(0,3).map(p=>p.id);
 }
 function couponShopIds(state){
  const tier=Math.max(1,Math.min(4,state.cashTier||1));
  return [[...core,...candidates],['paper','laundry','makeup'],['skin','makeup'],['winter','skin']][tier-1];
 }
 return {resolve,record,preview,benefitProducts,couponShopIds,positions};
});
