(function(root,factory){
 const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.QiyuRewards=api;
})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const DAY=86400000,cashDays=[1,2,4,6],cashValues=[3,5,6,8],cashMinimums=[9.9,29,39,59];
 const rewards=[
  {name:'3元券',value:3,min:9.9,condition:'满9.9减3 · 适用店铺全店可用',icon:'ticket-percent'},
  {name:'5元券',value:5,min:29,condition:'满29减5 · 适用店铺全店可用',icon:'ticket-percent'},
  {name:'新品预览资格',type:'preview',condition:'提前查看明日精选好物',icon:'eye'},
  {name:'6元券',value:6,min:39,condition:'满39减6 · 适用店铺全店可用',icon:'ticket-percent'},
  {name:'兴趣专享价',type:'exclusive',condition:'精选商品每件立减1元',icon:'tag'},
  {name:'8元券',value:8,min:59,condition:'满59减8 · 适用店铺全店可用',icon:'ticket-percent'},
  {name:'抽奖机会',type:'lottery',condition:'累计到访7天解锁',icon:'gift'}
 ];
 const prizes=[{name:'10元券包',value:10,chance:85},{name:'20元券包',value:20,chance:12},{name:'50元免单券',value:50,chance:2.5},{name:'100元免单券',value:100,chance:.5}];
 const isDay=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d+'T00:00:00Z'));
 const addDays=(day,n)=>new Date(Date.parse(day+'T00:00:00Z')+n*DAY).toISOString().slice(0,10);
 // Beijing 10:00 is UTC 02:00. This calculation never depends on device timezone.
 const activityDay=(now=Date.now())=>new Date(new Date(now).getTime()-2*3600000).toISOString().slice(0,10);
 const couponKey=c=>c.id||`legacy:${c.date}:${c.value}:${c.min}`;
 function couponList(s){
  const entries=new Map();
  for(const raw of [...(Array.isArray(s.coupons)?s.coupons:[]),s.coupon]){
   if(!raw||!isDay(raw.date)||!Number.isFinite(raw.value)||raw.value<=0||!Number.isFinite(raw.min)||raw.min<0)continue;
   const c={...raw,id:couponKey(raw),source:raw.source||'daily',expiresOn:raw.expiresOn||addDays(raw.date,(raw.validDays||1)-1)};
   const previous=entries.get(c.id);entries.set(c.id,{...previous,...c,used:Boolean(previous?.used||c.used)});
  }
  return [...entries.values()].sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
 }
 function couponStatus(c,today){
  if(c.used)return 'used';if(c.date>today)return 'future';
  return today>(c.expiresOn||addDays(c.date,(c.validDays||1)-1))?'expired':'available';
 }
 const couponExpiry=c=>new Date(Date.parse(addDays(c.expiresOn||addDays(c.date,(c.validDays||1)-1),1)+'T02:00:00Z')-1).toISOString();
 const activeBenefits=(s,today)=>(s.benefits||[]).filter(b=>b.date<=today&&(b.expiresOn||b.date)>=today);
 const availableCoupons=(s,today)=>couponList(s).filter(c=>couponStatus(c,today)==='available');
 function dailyReward(s){
  const r=rewards[Math.max(0,Math.min(6,s.visits-1))];if(!r.value)return {...r};
  const tier=Math.max(1,Math.min(4,s.cashTier||cashDays.filter(d=>d<=s.visits).length)),value=cashValues[tier-1],min=cashMinimums[tier-1];
  return {...r,name:`${value}元券`,value,min,condition:`满${min}减${value} · 适用店铺全店可用`};
 }
 const unlockId=s=>`${s.cycleId}:unlock:${s.visits}`;
 function rememberUnlock(s){
  const history=s.unlockedRewards||[],id=unlockId(s);
  if(history.some(e=>e.id===id))return s;
  return {...s,unlockedRewards:[...history,{id,cycleId:s.cycleId,day:s.visits,date:s.lastVisit,reward:dailyReward(s)}]};
 }
 function restoreUnlocks(s){
  if(Array.isArray(s.unlockedRewards))return rememberUnlock(s);
  const start=s.cycleId.startsWith('cycle:')?s.cycleId.slice(6):null;
  const consecutive=isDay(start)&&addDays(start,s.visits-1)===s.lastVisit;
  const unlockedRewards=Array.from({length:s.visits},(_,i)=>{
   const day=i+1,current=day===s.visits,date=consecutive?addDays(start,i):current?s.lastVisit:null;
   let reward=current?dailyReward(s):dailyReward({visits:day,cashTier:cashDays.filter(d=>d<=day).length});
   if(!date&&reward.value){const {value,min,...rest}=reward;reward={...rest,name:'逛街优惠券',condition:'当活动日内有效 · 适用店铺全店可用'};}
   return {id:`${s.cycleId}:unlock:${day}`,cycleId:s.cycleId,day,date,reward};
  });
  return {...s,unlockedRewards};
 }
 function initial(today){return rememberUnlock({version:3,cycleId:`cycle:${today}`,visits:1,streak:1,cashTier:1,lastVisit:today,coupon:null,coupons:[],benefits:[],unlockedRewards:[],favorites:[],orders:[],drawn:false,prize:null,prizeHistory:[],rewardClaims:{},promptedDate:null,returnedAfterGap:false});}
 function restoreStreak(s){
  if(Number.isInteger(s.streak)&&s.streak>=1&&s.streak<=7)return s.streak;
  const dates=new Set(s.unlockedRewards.filter(entry=>entry.cycleId===s.cycleId).map(entry=>entry.date));
  let streak=1;
  while(streak<7&&dates.has(addDays(s.lastVisit,-streak)))streak++;
  return streak;
 }
 const benefitFor=(s,r,date)=>({id:`${s.cycleId}:${r.type}:${date}`,cycleId:s.cycleId,rewardDay:s.visits,unlockId:unlockId(s),type:r.type,name:r.name,date,expiresOn:date,productIds:r.type==='exclusive'?['snack-0','paper-1','kitchen-0']:['paper-5','paper-7','paper-8'],unitDiscount:1});
 function issuePrize(s,raw,date){
  const cycleId=s.cycleId||`legacy:${date}`,id=`${cycleId}:prize`,existing=(s.prizeHistory||[]).find(p=>p.id===id);
  if(raw.couponIds){return {...s,prize:raw,prizeHistory:existing?s.prizeHistory:[...(s.prizeHistory||[]),raw]};}
  const base={date,expiresOn:addDays(date,6),validDays:7,source:'lottery',scope:'street',used:false,cycleId};
  const specs=raw.value===10?[[5,39],[5,39]]:raw.value===20?[[10,59],[10,59]]:[[raw.value,0]];
  const issued=specs.map(([value,min],i)=>({...base,id:`${id}:coupon:${i}`,value,min,type:raw.value>=50?'free-order':'coupon'}));
  const prize={...raw,id,cycleId,date,expiresOn:base.expiresOn,couponIds:issued.map(c=>c.id)};
  return {...s,prize,coupons:couponList({...s,coupons:[...couponList(s),...issued]}),prizeHistory:existing?s.prizeHistory:[...(s.prizeHistory||[]),prize]};
 }
 function enter(saved,today){
  const valid=saved&&Number.isFinite(saved.visits)&&isDay(saved.lastVisit)&&Array.isArray(saved.orders)&&Array.isArray(saved.favorites);
  if(!valid)return initial(today);
  let s={...saved,version:3,cycleId:saved.cycleId||`legacy:${saved.lastVisit}`,visits:Math.max(1,Math.min(7,Math.floor(saved.visits))),cashTier:saved.cashTier??cashDays.filter(d=>d<=saved.visits).length,benefits:saved.benefits||[],prizeHistory:saved.prizeHistory||[],rewardClaims:saved.rewardClaims||{},prize:saved.prize||null};
  s.coupons=couponList(s);s.coupon=s.coupon?s.coupons.find(c=>c.id===couponKey(s.coupon))||null:null;
  s=restoreUnlocks(s);
  s.streak=restoreStreak(s);
  for(const entry of s.unlockedRewards){
   if(!entry.date||!s.rewardClaims[entry.date]||!['preview','exclusive'].includes(entry.reward.type))continue;
   if(!s.benefits.some(b=>b.date===entry.date&&b.type===entry.reward.type))s.benefits=[...s.benefits,benefitFor({...s,cycleId:entry.cycleId,visits:entry.day},entry.reward,entry.date)];
  }
  if(s.drawn&&s.prize)s=issuePrize(s,s.prize,s.prize.date||s.lastVisit);
  if(today<=s.lastVisit)return s;
  if(s.drawn){return rememberUnlock({...s,cycleId:`cycle:${today}`,visits:1,streak:1,cashTier:1,lastVisit:today,drawn:false,prize:null,promptedDate:null,returnedAfterGap:false});}
  const consecutive=addDays(s.lastVisit,1)===today,visits=Math.min(7,s.visits+1);
  const cashTier=Math.min(4,(consecutive?s.cashTier:0)+(cashDays.includes(visits)?1:0));
  const streak=consecutive?Math.min(7,s.streak+1):1;
  return rememberUnlock({...s,visits,streak,cashTier,lastVisit:today,returnedAfterGap:!consecutive});
 }
 const todayClaimed=(s,today)=>Boolean(s.rewardClaims?.[today])||couponList(s).some(c=>c.source==='daily'&&c.date===today)||s.visits===7&&s.drawn&&s.lastVisit===today;
 const shouldPrompt=(s,today)=>s.promptedDate!==today&&!todayClaimed(s,today);
 const markPrompted=(s,today)=>({...s,promptedDate:today});
 function claim(s,today){
  if(todayClaimed(s,today)||s.lastVisit!==today||s.visits===7)return s;
  const r=dailyReward(s),base={...s,rewardClaims:{...s.rewardClaims,[today]:true}};
  if(r.value){
   const coupon={id:`${s.cycleId}:daily:${today}`,cycleId:s.cycleId,rewardDay:s.visits,unlockId:unlockId(s),date:today,expiresOn:today,value:r.value,min:r.min,source:'daily',used:false};
   return {...base,coupon,coupons:couponList({...s,coupon})};
  }
  const benefit=benefitFor(s,r,today);
  return {...base,benefits:[...(s.benefits||[]),benefit]};
 }
 const applies=(c,p)=>(!c.shopIds||c.shopIds.includes(p.shop))&&(!c.productIds||c.productIds.includes(p.id))&&(c.scope==='street'||p.eligible);
 const cents=amount=>Math.round(amount*100);
 function allocateCoupon(items,coupon){
  const shares=items.filter(i=>applies(coupon.c,i.product)).map(i=>{
   const weighted=coupon.discount*cents(i.subtotal);
   return {id:i.product.id,discount:Math.floor(weighted/coupon.cents),remainder:weighted%coupon.cents};
  });
  // Give leftover cents to the largest remainders so line totals match checkout.
  const remaining=coupon.discount-shares.reduce((sum,share)=>sum+share.discount,0);
  shares.sort((a,b)=>b.remainder-a.remainder).slice(0,remaining).forEach(share=>share.discount++);
  return new Map(shares.map(share=>[share.id,share.discount]));
 }
 function benefitDiscountFor(item,benefit){
  return benefit.productIds.includes(item.product.id)?Math.min(cents(item.product.price),cents(benefit.unitDiscount))*item.quantity:0;
 }
 function quoteItems(s,lines,today,{couponId='auto'}={}){
  const invalid=reason=>({valid:false,reason,items:[],quantity:0,subtotal:0,discount:0,total:0,minimumShortfall:0,discountKind:null,coupon:null,benefit:null});
  if(!Array.isArray(lines)||!lines.length)return invalid('empty');
  const merged=new Map();
  for(const line of lines){
   const p=line?.product,n=Number(line?.quantity);
   if(!p?.id||!p.shop||!Number.isFinite(p.price)||p.price<0||!Number.isFinite(n)||n<1)return invalid('invalid-items');
   const count=Math.min(9,Math.floor(n)+(merged.get(p.id)?.quantity||0));
   merged.set(p.id,{product:p,quantity:count,subtotal:Math.round(p.price*100)*count/100});
  }
  const items=[...merged.values()],shopIds=[...new Set(items.map(i=>i.product.shop))],shop=shopIds.length===1?shopIds[0]:'street';
  const subtotalCents=items.reduce((sum,i)=>sum+Math.round(i.subtotal*100),0),all=couponList(s);
  const eligible=availableCoupons(s,today).filter(c=>couponId==='auto'||c.id===couponId).map(c=>({c,cents:items.filter(i=>applies(c,i.product)).reduce((sum,i)=>sum+Math.round(i.subtotal*100),0)})).filter(x=>x.cents>0);
  const candidates=eligible.filter(x=>x.cents>=Math.round(x.c.min*100)).map(x=>({...x,discount:Math.min(x.cents,Math.round(x.c.value*100))})).sort((a,b)=>b.discount-a.discount||a.c.expiresOn.localeCompare(b.c.expiresOn)||a.c.id.localeCompare(b.c.id));
  const selected=candidates[0]||null,couponDiscount=selected?.discount||0;
  const benefits=activeBenefits(s,today).filter(b=>couponId==='auto'&&b.type==='exclusive').map(b=>({b,discount:items.reduce((sum,i)=>sum+benefitDiscountFor(i,b),0)})).sort((a,b)=>b.discount-a.discount);
  const bestBenefit=benefits[0],benefitDiscount=bestBenefit?.discount||0,useBenefit=benefitDiscount>couponDiscount,discountCents=useBenefit?benefitDiscount:couponDiscount;
  const couponShares=!useBenefit&&couponDiscount?allocateCoupon(items,selected):null;
  for(const item of items){
   const share=useBenefit?benefitDiscountFor(item,bestBenefit.b):(couponShares?.get(item.product.id)||0);
   item.discount=share/100;
   item.total=(cents(item.subtotal)-share)/100;
  }
  const reason=discountCents?(useBenefit?'benefit':'applied'):eligible.length?'minimum':availableCoupons(s,today).length?'ineligible':all.some(c=>couponStatus(c,today)==='used')?'used':all.length?'expired':'unclaimed';
  const minimumShortfall=eligible.length?Math.max(0,Math.min(...eligible.map(x=>Math.round(x.c.min*100)-x.cents)))/100:0;
  return {valid:true,items,shop,shopIds,quantity:items.reduce((sum,i)=>sum+i.quantity,0),subtotal:subtotalCents/100,discount:discountCents/100,total:(subtotalCents-discountCents)/100,reason,minimumShortfall,discountKind:discountCents?(useBenefit?'benefit':'coupon'):null,coupon:!useBenefit&&discountCents?selected.c:null,benefit:useBenefit?bestBenefit.b:null};
 }
 function quote(s,p,quantity,today){
  return quoteItems(s,[{product:p,quantity:Math.max(1,Math.min(9,Math.floor(Number(quantity)||1)))}],today);
 }
 function placeItemsOrder(s,lines,today,id,options){
  if(s.orders.some(o=>o.id===id))return s;
  const q=quoteItems(s,lines,today,options);if(!q.valid)return s;
  const order={id,product:q.items[0].product.id,shop:q.shop,shopIds:q.shopIds,items:q.items.map(i=>({product:i.product.id,shop:i.product.shop,name:i.product.name,price:i.product.price,quantity:i.quantity,subtotal:i.subtotal})),quantity:q.quantity,subtotal:q.subtotal,discount:q.discount,amount:q.total,date:today,discountKind:q.discountKind,couponId:q.coupon?.id||null,benefitId:q.benefit?.id||null};
  const coupons=couponList(s).map(c=>q.coupon?.id===c.id?{...c,used:true,usedAt:today}:c);
  const coupon=s.coupon?coupons.find(c=>c.id===couponKey(s.coupon))||s.coupon:null;
  return {...s,coupon,coupons,orders:[...s.orders,order]};
 }
 function placeOrder(s,p,quantity,today,id){return placeItemsOrder(s,[{product:p,quantity:Math.max(1,Math.min(9,Math.floor(Number(quantity)||1)))}],today,id);}
 function draw(s,random,today=s.lastVisit){
  if(s.visits<7||s.drawn||today!==s.lastVisit)return s;
  const roll=Math.max(0,Math.min(.999999,random))*100;let total=0;
  const prize=prizes.find(p=>{total+=p.chance;return roll<total;});
  return issuePrize({...s,drawn:true,rewardClaims:{...s.rewardClaims,[today]:true}},prize,today);
 }
 function rewardWallet(s,today){
  const coupons=couponList(s),benefits=s.benefits||[],seenCoupons=new Set(),seenBenefits=new Set(),entries=[];
  const benefitStatus=b=>b.date>today?'future':(b.expiresOn||b.date)<today?'expired':'available';
  for(const unlock of s.unlockedRewards||[]){
   const r=unlock.reward;
   if(r.type==='lottery'&&(s.prizeHistory||[]).some(p=>p.cycleId===unlock.cycleId))continue;
   const coupon=r.value&&unlock.date?coupons.find(c=>c.source==='daily'&&c.date===unlock.date):null;
   // Each privilege occurs once per cycle, even when legacy visit dates are missing.
   const benefit=benefits.find(b=>!seenBenefits.has(b.id)&&b.type===r.type&&(unlock.date?b.date===unlock.date:b.cycleId===unlock.cycleId));
   if(coupon){seenCoupons.add(coupon.id);entries.push({id:coupon.id,kind:'coupon',status:couponStatus(coupon,today),claimed:true,date:coupon.date,coupon,unlock});continue;}
   if(benefit){seenBenefits.add(benefit.id);entries.push({id:benefit.id,kind:'benefit',status:benefitStatus(benefit),claimed:true,date:benefit.date,benefit,unlock});continue;}
   const claimed=unlock.date?Boolean(s.rewardClaims?.[unlock.date]):null;
   const lotteryPending=r.type==='lottery'&&unlock.cycleId===s.cycleId&&s.visits===7&&!s.drawn;
   const claimable=lotteryPending||unlock.date===today&&s.lastVisit===today&&!claimed;
   const status=claimable?'pending':unlock.date>today?'future':unlock.date===today&&claimed?'unavailable':'expired';
   entries.push({id:unlock.id,kind:'unlock',status,claimed,date:unlock.date,unlock});
  }
  for(const coupon of coupons)if(!seenCoupons.has(coupon.id)){
   // A known daily issue replaces one unknown cash unlock in its own cycle.
   // Keep the ledger undated: the coupon proves an issue, not its cumulative visit number.
   if(coupon.source==='daily'&&coupon.cycleId&&coupon.date<s.lastVisit){
    const placeholder=entries.findIndex(e=>e.kind==='unlock'&&!e.date&&e.unlock.cycleId===coupon.cycleId&&cashDays.includes(e.unlock.day));
    if(placeholder!==-1)entries.splice(placeholder,1);
   }
   entries.push({id:coupon.id,kind:'coupon',status:couponStatus(coupon,today),claimed:true,date:coupon.date,coupon});
  }
  for(const benefit of benefits)if(!seenBenefits.has(benefit.id))entries.push({id:benefit.id,kind:'benefit',status:benefitStatus(benefit),claimed:true,date:benefit.date,benefit});
  return entries.sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.unlock?.day||0)-(a.unlock?.day||0)||a.id.localeCompare(b.id));
 }
 return {rewards,prizes,activityDay,addDays,enter,claim,quote,quoteItems,placeOrder,placeItemsOrder,draw,dailyReward,activeBenefits,availableCoupons,couponStatus,couponExpiry,shouldPrompt,markPrompted,todayClaimed,couponList,rewardWallet};
});
