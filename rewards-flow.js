(function(root,factory){
 const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.QiyuRewards=api;
})(typeof window==='undefined'?globalThis:window,function(){
 const rewards=[
  {name:'3元券',value:3,min:9.9,condition:'满9.9减3 · 限指定商品',icon:'ticket-percent'},
  {name:'5元券',value:5,min:29,condition:'满29减5 · 限指定商品',icon:'ticket-percent'},
  {name:'新品预览资格',condition:'可提前浏览上新商品',icon:'eye'},
  {name:'6元券',value:6,min:39,condition:'满39减6 · 限指定商品',icon:'ticket-percent'},
  {name:'兴趣专享价',condition:'精选商品专属优惠',icon:'tag'},
  {name:'8元券',value:8,min:59,condition:'满59减8 · 限指定商品',icon:'ticket-percent'},
  {name:'抽奖机会',condition:'累计到访7天解锁',icon:'gift'}
 ];
 const prizes=[{name:'10元券包',value:10,chance:85},{name:'20元券包',value:20,chance:12},{name:'50元免单券',value:50,chance:2.5},{name:'100元免单券',value:100,chance:.5}];
 const couponKey=c=>c.id||`${c.date}:${c.value}:${c.min}`;
 function couponList(s){
  const entries=new Map();
  for(const c of [...(Array.isArray(s.coupons)?s.coupons:[]),s.coupon]){
   if(!c||typeof c.date!=='string'||!Number.isFinite(c.value)||c.value<=0||!Number.isFinite(c.min))continue;
   const key=couponKey(c),previous=entries.get(key);
   entries.set(key,{...previous,...c,used:Boolean(previous?.used||c.used)});
  }
  return [...entries.values()].sort((a,b)=>b.date.localeCompare(a.date));
 }
 function enter(saved,today){
  const valid=saved&&Number.isFinite(saved.visits)&&Array.isArray(saved.orders)&&Array.isArray(saved.favorites);
  if(!valid)return {visits:1,lastVisit:today,coupon:null,coupons:[],favorites:[],orders:[],drawn:false,rewardClaims:{},promptedDate:null};
  const coupons=couponList(saved),coupon=saved.coupon?coupons.find(c=>couponKey(c)===couponKey(saved.coupon))||coupons[0]||null:coupons[0]||null;
  return {...saved,coupon,coupons,visits:Math.max(1,Math.min(7,Math.floor(saved.visits)+(saved.lastVisit!==today?1:0))),lastVisit:today,rewardClaims:saved.rewardClaims||{}};
 }
 const todayClaimed=(s,today)=>couponList(s).some(c=>c.date===today)||Boolean(s.rewardClaims?.[today])||s.visits===7&&s.drawn;
 const shouldPrompt=(s,today)=>s.promptedDate!==today&&!todayClaimed(s,today);
 const markPrompted=(s,today)=>({...s,promptedDate:today});
 function claim(s,today){
  if(todayClaimed(s,today))return s;
  const r=rewards[s.visits-1];
  if(s.visits===7)return s;
  const coupon=r.value?{date:today,value:r.value,min:r.min,used:false}:s.coupon;
  return {...s,rewardClaims:{...s.rewardClaims,[today]:true},coupon,coupons:couponList({...s,coupon})};
 }
 function quote(s,p,quantity,today){
  const count=Math.max(1,Math.min(9,Math.floor(Number(quantity)||1))),subtotalCents=Math.round(p.price*100)*count,c=s.coupon;
  let reason=!c?'unclaimed':c.date!==today?'expired':c.used?'used':!p.eligible?'ineligible':subtotalCents<Math.round(c.min*100)?'minimum':'applied';
  const discountCents=reason==='applied'?Math.min(subtotalCents,Math.round(c.value*100)):0;
  return {quantity:count,subtotal:subtotalCents/100,discount:discountCents/100,total:(subtotalCents-discountCents)/100,reason,coupon:discountCents?c:null};
 }
 function placeOrder(s,p,quantity,today,id){
  if(s.orders.some(o=>o.id===id))return s;
  const q=quote(s,p,quantity,today),order={id,product:p.id,shop:p.shop,quantity:q.quantity,subtotal:q.subtotal,discount:q.discount,amount:q.total,date:today};
  const coupon=q.coupon?{...s.coupon,used:true}:s.coupon;
  return {...s,coupon,coupons:couponList({...s,coupon}),orders:[...s.orders,order]};
 }
 function draw(s,random){
  if(s.visits<7||s.drawn)return s;
  const roll=Math.max(0,Math.min(.999999,random))*100;let total=0;
  const prize=prizes.find(p=>{total+=p.chance;return roll<total;});
  return {...s,drawn:true,prize:{...prize}};
 }
 return {rewards,prizes,enter,claim,quote,placeOrder,draw,shouldPrompt,markPrompted,todayClaimed,couponList};
});
