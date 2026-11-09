/* Native HTML prototype. No account, payment, tracking or external services. */
const $ = selector => document.querySelector(selector);
const icon = name => `<i data-lucide="${name}"></i>`;
const Flow = window.QiyuRewards;
const params = new URLSearchParams(location.search), demo = ['first','seventh','wallet'].includes(params.get('demo')) ? params.get('demo') : null;
const KEY = 'qiyu-street-interactive-v1' + (demo ? '-demo-' + demo : '');
const storage = demo ? sessionStorage : localStorage;
const Walking = window.QiyuWalking, ShopViews = window.QiyuShopViews;
const characterEnabled = $('#app')?.dataset.character !== 'off';
const riggedEnabled = $('#app')?.dataset.character === 'rigged';
const restPose = key => ShopViews ? ShopViews.restFor(key,Walking) : Walking.rest(key);
const todayKey = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
function fresh(){
 const base=Flow.enter(null,todayKey());
 if(demo!=='wallet')return {...base,visits:demo==='seventh'?7:1};
 const dateBefore=days=>{const d=new Date();d.setDate(d.getDate()-days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
 const coupons=[{date:todayKey(),value:8,min:59,used:false},{date:dateBefore(2),value:6,min:39,used:false},{date:dateBefore(4),value:5,min:29,used:true},{date:dateBefore(5),value:3,min:9.9,used:false}];
 return {...base,visits:6,coupon:coupons[0],coupons,rewardClaims:{[todayKey()]:true},promptedDate:todayKey()};
}
let saved;try {saved=JSON.parse(storage.getItem(KEY));} catch {}
let state = saved ? Flow.enter(saved,todayKey()) : fresh();
let focusShop='paper', moving=false, reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let currentModal=null, lastFocus=null, motionFinish=null, walkingFrame=0, toastTimer, orderSubmitting=false;
let orderProduct=null, orderQuantity=1, checkoutOrigin=null, browsingShop='paper';
const paperProducts=[
 ['维达手帕纸24包',9.9,0],['漫花悬挂抽纸',13.9,1],['桔子姑娘大包抽纸',15.9,2],
 ['洁柔油画软抽',16.9,3],['心相印花语抽纸',19.9,4],['心相印茶语联名抽纸',21.9,5],
 ['漫花无芯卷纸48卷',22.9,6],['备家洁20大包抽纸',24.9,7],['清风挂式抽纸10提',29.9,8]
].map(([name,price,art],i)=>({id:'paper-'+i,name,price,art,shop:'paper',eligible:i<3}));
const snackProducts=[['焦糖瓜子500g',9.9,0],['每日坚果350g',12.9,1],['山楂小零食',14.9,2]].map(([name,price,art],i)=>({id:'snack-'+i,name,price,art,shop:'snack',other:true,eligible:true}));
const kitchenProducts=[['厨房清洁湿巾',9.9,3],['洗碗海绵套装',12.9,4],['厨房垃圾袋套装',15.9,5]].map(([name,price,art],i)=>({id:'kitchen-'+i,name,price,art,shop:'kitchen',other:true,eligible:true}));
const shops={paper:{name:'纸巾补货铺',short:'纸巾铺',desc:'家里常用的，顺手补齐。',products:paperProducts},snack:{name:'零食小铺',short:'零食铺',desc:'给今天，添一点好滋味。',products:snackProducts},kitchen:{name:'厨房帮手铺',short:'厨房铺',desc:'实用小帮手，厨房更顺手。',products:kitchenProducts}};
const allProducts=[...paperProducts,...snackProducts,...kitchenProducts], dailyRewards=Flow.rewards;
const recentProducts=[paperProducts[0],snackProducts[0],paperProducts[1],kitchenProducts[0],snackProducts[1],paperProducts[2],kitchenProducts[1],snackProducts[2],paperProducts[3],kitchenProducts[2],paperProducts[4],paperProducts[6]];
const money=value=>Number(value).toFixed(1), exact=value=>Number(value).toFixed(2);
function save(){try{storage.setItem(KEY,JSON.stringify(state));}catch{}}
function icons(){lucide.createIcons({attrs:{'aria-hidden':'true'}});}
function art(p,extra=''){const x=p.art%3*50,row=Math.floor(p.art/3);return `<div class="product-art ${p.other?'other-art':''} ${extra}" role="img" aria-label="${p.name}商品图" style="--art-row:${row};background-position-x:${x}%"></div>`;}
function validCoupon(){return state.coupon&&!state.coupon.used&&state.coupon.date===todayKey();}
function couponFor(p,quantity=1){return Flow.quote(state,p,quantity,todayKey()).coupon;}
function priceHtml(p){const q=Flow.quote(state,p,1,todayKey());return `<span class="price"><small>${q.discount?'券后 ':''}</small><sup>¥</sup>${money(q.total)}</span>`;}
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,2300);}
function resize(){document.documentElement.style.setProperty('--s',String(Math.min(1,innerWidth/414)));}
function renderHome(){
 const reward=dailyRewards[state.visits-1],claimed=Flow.todayClaimed(state,todayKey()),tomorrow=dailyRewards[Math.min(state.visits,6)];
 const nextLabel=tomorrow.value?`明日<b>${tomorrow.value}</b>元券`:tomorrow.name;
 $('#daily').querySelector(':scope>span').innerHTML=`已来<b>${state.visits}</b>天 · ${state.visits===7?(state.drawn?'奖励已领取':'抽奖已解锁'):nextLabel}`;
 $('#progressFill').style.width=state.visits/7*100+'%';
 $('#claimText').textContent=claimed?(state.coupon?.date===todayKey()&&state.coupon.used?'券已使用':'我的奖励'):(reward.value?`领${reward.value}元券`:state.visits===7?'去抽奖':'查看奖励');
 $('#claim').classList.toggle('claimed',!!(state.coupon?.date===todayKey()&&state.coupon.used));
 $('#couponCondition').textContent=state.coupon?.date===todayKey()&&state.coupon.used?'今日券已使用 · 明天来逛有新奖励':reward.value?`满${reward.min}减${reward.value} · 限指定商品 · 今日有效`:'每天来逛，都有新奖励';
 const atStore=ShopViews&&focusShop!=='paper';
 $('#enter').innerHTML=`${atStore?'进店逛逛':'逛'+shops[focusShop].short}`;
 if(ShopViews){$('#switch').innerHTML=atStore?`${icon('corner-up-left')}<span>返回街道</span>`:`${icon('refresh-cw')}<span>换家店</span>`;$('#back').setAttribute('aria-label',atStore?'返回街道':params.get('from')==='mall'?'返回商城':'返回主推店');}
 const homeScroll=$('#homeScroll'),homeOffset=homeScroll.scrollTop;
 $('#recentGrid').innerHTML=recentProducts.map(p=>`<article class="recent-card"><button class="recent-detail" data-detail="${p.id}" aria-label="查看${p.name}详情">${art(p)}<h3>${p.name}</h3></button><div class="recent-price-row">${priceHtml(p)}<button class="recent-buy" data-buy="${p.id}" aria-label="购买${p.name}">购买</button></div></article>`).join('');
 homeScroll.scrollTop=homeOffset;
 document.querySelectorAll('[data-shop]').forEach(el=>{const key=el.dataset.shop;el.setAttribute('aria-label',(key===focusShop?'进入':characterEnabled?'走到':'查看')+shops[key].name);el.querySelector('span').textContent=(key===focusShop?'进入':'去')+shops[key].short;});
 $('#app').dataset.focusShop=focusShop;icons();save();
}
function closeModal(){if(!currentModal)return;$('#overlay').hidden=true;$('#modal').innerHTML='';currentModal=null;$('#homeScroll').inert=false;$('.topbar').inert=false;$('#app').classList.remove('has-modal');if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});}
function attachPortrait(){if(window.QiyuIPPortrait)document.querySelectorAll('[data-ip-portrait]').forEach(img=>{img.src=window.QiyuIPPortrait;img.hidden=false;img.parentElement.classList.add('portrait-ready');});}
window.addEventListener('qiyu-ip-ready',attachPortrait);
function layoutBottomSheet(modal){
 if(!modal.classList.contains('sheet'))return;
 let header=modal.querySelector(':scope > header');
 if(!header){
  header=document.createElement('header');
  const title=modal.querySelector('#modalTitle'),intro=modal.querySelector(':scope > .intro'),close=modal.querySelector(':scope > .modal-close');
  for(const node of [close,title,intro])if(node)header.append(node);
  modal.prepend(header);
 }
 header.classList.add('bottom-sheet-header');
 header.querySelector('#modalTitle')?.classList.add('bottom-sheet-title');
 let content=modal.querySelector(':scope > .shop-products-scroll, :scope > .daily-rewards-scroll, :scope > .rewards-sheet-scroll');
 if(!content){
  content=document.createElement('div');
  for(const node of [...modal.children])if(node!==header)content.append(node);
  modal.append(content);
 }
 content.classList.add('bottom-sheet-scroll');
 content.setAttribute('role','region');
 if(!content.hasAttribute('aria-label'))content.setAttribute('aria-label',`${header.querySelector('#modalTitle')?.textContent||'弹窗'}内容，可上下滚动`);
 content.tabIndex=0;
}
function openModal(kind,html,classes='sheet simple-sheet'){
 if(!currentModal)lastFocus=document.activeElement;
 const sameStyle=!$('#overlay').hidden&&$('#modal').className==='modal '+classes;
 currentModal=kind;$('#modal').dataset.kind=kind;$('#modal').dataset.settled=sameStyle?'true':'false';$('#modal').className='modal '+classes;$('#modal').innerHTML=html;$('#homeScroll').inert=true;$('.topbar').inert=true;
 layoutBottomSheet($('#modal'));
 $('#overlay').hidden=false;$('#app').classList.add('has-modal');icons();attachPortrait();$('#modal').focus({preventScroll:true});$('#modal').scrollTop=0;
}
const closeButton=()=>`<button class="modal-close" data-dismiss aria-label="关闭弹窗">${icon('x')}</button>`;
let ticketSequence=0;
function ticket(c,{offered=false}={}){
 const date=c.date||todayKey(),dateText=/^\d{4}-\d{2}-\d{2}$/.test(date)?date.replaceAll('-','.'):'领取当日';
 const status=offered?'待领取':c.used?'已使用':date<todayKey()?'已过期':date>todayKey()?'未生效':'待使用';
 const inactive=!offered&&status!=='待使用',gradientId=`coupon-fill-${++ticketSequence}`;
 return `<article class="coupon-ticket ${inactive?'is-unavailable':''}" aria-label="${c.value}元券，满${c.min}减${c.value}，${status}"><svg class="coupon-shape" viewBox="0 0 320 144" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${inactive?'#fcf8f1':'#fff3e5'}"/><stop offset="1" stop-color="${inactive?'#f3ece1':'#ffe7cb'}"/></linearGradient></defs><path d="M18 .5H302A17.5 17.5 0 0 1 319.5 18V64A8 8 0 0 0 319.5 80V126A17.5 17.5 0 0 1 302 143.5H18A17.5 17.5 0 0 1 .5 126V80A8 8 0 0 0 .5 64V18A17.5 17.5 0 0 1 18 .5Z" fill="url(#${gradientId})" stroke="${inactive?'#e4d8c8':'#ffc68f'}" stroke-width="1" vector-effect="non-scaling-stroke"/></svg><div class="coupon-main"><div class="coupon-amount"><small>¥</small>${c.value}</div><div class="coupon-copy"><strong>满${c.min}减${c.value}</strong><span class="coupon-label">${c.value===3?'新人见面礼':'逛街专属券'} · 限指定商品</span></div></div><div class="coupon-footer"><span class="coupon-validity">有效期至 ${dateText} 23:59</span><b class="coupon-status">${status}</b></div></article>`;
}
function showOffer(){
 if(Flow.todayClaimed(state,todayKey()))return showRewards();
 if(state.visits===7)return showLottery();
 state=Flow.markPrompted(state,todayKey());save();
 const r=dailyRewards[state.visits-1];
 openModal('offer',`<div class="popup-mascot" aria-hidden="true"><span class="portrait-fallback">${icon('gift')}</span><img data-ip-portrait hidden alt=""><span class="hello-rays"></span></div>${closeButton()}<p class="eyebrow">第 ${state.visits} 天 · 已为你签到</p><h2 id="modalTitle">今天逛街，先${r.value?'领券':'收好礼'}</h2>${r.value?ticket(r,{offered:true}):`<div class="benefit-ticket">${icon(r.icon)}<strong>${r.name}</strong><span>${r.condition}</span></div>`}${r.value?'':'<p class="ticket-terms">今日专属权益 · 领取后可查看</p>'}<button class="wide-cta" data-claim-today>${r.value?'领取今日券':'领取今日奖励'}</button><button class="secondary-cta" data-close>先逛逛</button>`,'center reward-popup offer-popup');
}
function maybeOfferReward(){if(Flow.shouldPrompt(state,todayKey())&&!currentModal&&!moving)showOffer();}
function claim(){
 if(Flow.todayClaimed(state,todayKey()))return showRewards();
 if(state.visits===7)return showLottery();
 state=Flow.claim(state,todayKey());save();renderHome();showClaimSuccess();
}
function showClaimSuccess(){
 const r=dailyRewards[state.visits-1];
 openModal('coupon',`<div class="reward-success-badge" aria-hidden="true">${icon('check')}</div>${closeButton()}<h2 id="modalTitle">${r.value?'领券成功':'好礼已解锁'}</h2><p class="success-sub">已放入「我的奖励」</p>${r.value?ticket(state.coupon):`<div class="benefit-ticket">${icon(r.icon)}<strong>${r.name}</strong><span>${r.condition}</span></div>`}${r.value?'':'<p class="ticket-terms">在我的奖励中随时查看</p>'}<button class="wide-cta" data-use-coupon>去逛街${r.value?'用券':''}</button><p class="popup-footnote">回到街上，自由挑选喜欢的小店</p>`,'center reward-popup claim-success-popup');
}
function productRow(p){const q=Flow.quote(state,p,1,todayKey());return `<article class="shop-product-row"><button class="row-art" data-detail="${p.id}" aria-label="查看${p.name}详情">${art(p)}</button><div class="row-product-copy"><button class="product-name" data-detail="${p.id}">${p.name}</button><span class="original-price ${q.discount?'':'product-price-hint'}">${q.discount?`¥${money(p.price)}`:'标准装 · 好物精选'}</span><div class="row-price-action">${priceHtml(p)}<button class="product-buy" data-buy="${p.id}" aria-label="直接下单${p.name}">直接下单</button></div></div></article>`;}
function bindShopSheet(){
 const sheet=$('#modal'),scroll=sheet.querySelector('.shop-products-scroll'),header=sheet.querySelector('.sheet-head');
 sheet.style.removeProperty('--shop-sheet-height');
 sheet.style.setProperty('--shop-sheet-height',sheet.offsetHeight+'px');
 const expand=()=>{
  if(currentModal!=='shop'||!scroll.isConnected||sheet.classList.contains('is-expanded'))return false;
  sheet.classList.add('is-expanded');return true;
 };
 for(const area of [header,scroll]){
  area.addEventListener('wheel',event=>{if(event.deltaY>2&&expand())event.preventDefault();},{passive:false});
  let touchStartY=null;
  area.addEventListener('touchstart',event=>{touchStartY=event.touches[0]?.clientY??null;},{passive:true});
  area.addEventListener('touchmove',event=>{
   if(touchStartY!==null&&touchStartY-(event.touches[0]?.clientY??touchStartY)>10&&expand()&&event.cancelable)event.preventDefault();
  },{passive:false});
 }
 scroll.addEventListener('scroll',()=>{if(scroll.scrollTop>8)expand();},{passive:true});
}
function showShop(key=focusShop){
 browsingShop=key;const shop=shops[key],r=dailyRewards[state.visits-1],canClaim=!Flow.todayClaimed(state,todayKey());
 const copy=validCoupon()?`已领 ${state.coupon.value}元券 · 满${state.coupon.min}减${state.coupon.value}`:state.coupon?.date===todayKey()&&state.coupon.used?'今日券已使用 · 明天再来领好礼':canClaim&&r.value?`今日可领 ${r.value}元券 · 满${r.min}减${r.value}`:'今日好物，慢慢挑';
 openModal('shop',`<header class="sheet-head"><div><h2 id="modalTitle">${shop.name}</h2><p>${shop.desc}</p></div><div class="sheet-actions"><button data-toggle-favorite="${key}" aria-label="${state.favorites.includes(key)?'取消收藏':'收藏'}${shop.name}">${icon('heart')}</button><button data-dismiss aria-label="关闭店铺">${icon('x')}</button></div></header><div class="shop-products-scroll" role="region" aria-label="${shop.name}商品，可上下滚动" tabindex="0"><div class="coupon-strip">${icon(validCoupon()?'circle-check':'ticket-percent')}<div><strong>${copy}</strong><small>${key==='paper'?'下方首排好物可用':'指定商品可用'} · 结算时自动抵扣</small></div>${canClaim&&r.value?'<button data-open-offer>领取</button>':''}</div><div class="shop-product-list">${shop.products.slice(0,3).map(productRow).join('')}</div>${shop.products.length>3?`<h3 class="more-products-title">更多日常好物 <span>这些商品暂不参与今日券</span></h3><div class="more-products-grid">${shop.products.slice(3).map(p=>`<button class="more-product" data-detail="${p.id}">${art(p)}<strong>${p.name}</strong>${priceHtml(p)}</button>`).join('')}</div>`:''}<p class="simulation-note">商品、价格与交易均为模拟</p></div>`,'sheet shop-sheet');
 bindShopSheet();
 if(state.favorites.includes(key))$('[data-toggle-favorite] .lucide').classList.add('is-favorite');
}
function showDetail(id){
 const p=allProducts.find(p=>p.id===id);if(!p)return;browsingShop=p.shop;const q=Flow.quote(state,p,1,todayKey());
 openModal('detail',`<header class="sheet-head"><h2 id="modalTitle">商品详情</h2><button class="detail-close" data-dismiss aria-label="关闭商品详情">${icon('x')}</button></header><div class="detail-hero">${art(p)}</div><div class="detail-copy">${priceHtml(p)}${q.discount?`<del class="detail-original">原价 ¥${money(p.price)}</del>`:''}<h3>${p.name}</h3><p>标准装 · 来自${shops[p.shop].name}</p></div><div class="detail-coupon ${q.discount?'is-usable':''}">${icon('ticket-percent')}<div><strong>${q.discount?`${q.discount}元券已可用，到手 ¥${money(q.total)}`:couponReason(q,p)}</strong><span>${p.eligible?'指定商品 · 今日有效 · 每单限一张':'可按当前商品价购买'}</span></div></div><div class="detail-footer"><button class="wide-cta" data-buy="${p.id}">去确认订单</button><button class="quiet-action" data-return-shop="${p.shop}">再看看</button><p class="simulation-note">商品与价格为模拟</p></div>`,'sheet detail-sheet');
}
function couponReason(q,p){return ({unclaimed:'未领取今日券，本单按原价结算',expired:'优惠券已过期，本单按原价结算',used:'今日券已使用，本单按原价结算',ineligible:'该商品不适用今日券',minimum:`还差 ¥${exact(Math.max(0,(state.coupon?.min||0)-q.subtotal))} 达到用券门槛`,applied:`${q.discount}元优惠券已自动抵扣`})[q.reason];}
function showCheckout(id,quantity=1,preserveOrigin=false){
 const p=allProducts.find(p=>p.id===id);if(!p)return;
 if(!preserveOrigin)checkoutOrigin=currentModal==='detail'?{type:'detail',product:p.id}:{type:'shop',shop:p.shop};
 orderProduct=p;orderQuantity=Math.min(9,Math.max(1,quantity));orderSubmitting=false;const q=Flow.quote(state,p,orderQuantity,todayKey());
 openModal('checkout',`${closeButton()}<h2 id="modalTitle">确认订单</h2><div class="checkout-product">${art(p)}<div><h3>${p.name}</h3><p>标准装 · ${shops[p.shop].short}</p></div></div><div class="order-row quantity-row"><span>购买数量</span><div class="quantity"><button data-quantity="-1" aria-label="减少数量" ${orderQuantity===1?'disabled':''}>${icon('minus')}</button><strong aria-live="polite">${orderQuantity}</strong><button data-quantity="1" aria-label="增加数量" ${orderQuantity===9?'disabled':''}>${icon('plus')}</button></div></div><div class="order-row"><span>商品金额</span><strong>¥${exact(q.subtotal)}</strong></div><div class="order-row discount"><span>${q.discount?'今日优惠券':'优惠券'}</span><strong>${q.discount?'-¥'+exact(q.discount):'暂无可用'}</strong></div>${!q.discount?`<p class="coupon-unavailable">${icon('info')}${couponReason(q,p)}</p>`:''}<div class="total-row"><strong>实付</strong><span class="price"><sup>¥</sup>${exact(q.total)}</span></div><button class="wide-cta" data-submit-order>提交模拟订单</button><button class="quiet-action" data-checkout-back>返回${checkoutOrigin.type==='detail'?'商品详情':'店铺'}</button><p class="order-notice">仅演示交互，无实际支付或发货</p>`,'sheet checkout-popup');
}
function returnFromCheckout(){if(checkoutOrigin?.type==='detail')showDetail(checkoutOrigin.product);else showShop(checkoutOrigin?.shop||focusShop);}
function dismissModal(){if(currentModal==='detail')return showShop(browsingShop);if(currentModal==='checkout')return returnFromCheckout();closeModal();}
function submitOrder(){
 if(orderSubmitting||!orderProduct||currentModal!=='checkout')return;
 orderSubmitting=true;const button=$('[data-submit-order]');button.disabled=true;
 const p=orderProduct,id=crypto.randomUUID();state=Flow.placeOrder(state,p,orderQuantity,todayKey(),id);const order=state.orders.at(-1);save();renderHome();
 const next=dailyRewards[Math.min(state.visits,6)];
 openModal('order-success',`${closeButton()}<h2 id="modalTitle"><span class="celebrate-rays">✦</span> 下单成功 <span class="celebrate-rays">✦</span></h2><p class="success-sub">好物已选好，今天也逛得开心</p><div class="order-success-art">${art(p)}</div><p class="success-paid">实付 <span>¥${money(order.amount)}</span></p><div class="used-coupon-chip">${order.discount?`本单已用${order.discount}元券`:'本单按商品原价结算'}</div><p class="tomorrow-reward">${icon('gift')}${state.visits===7?'7天好礼，记得去我的奖励查看':`明天再来，${next.value?`领<b>${next.value}元券</b>`:`解锁<b>${next.name}</b>`}`}</p><button class="wide-cta" data-close>继续逛街</button><p class="order-notice">模拟订单 · 无实际交易</p>`,'center order-success-popup');
}
function toggleFavorite(key){state.favorites=state.favorites.includes(key)?state.favorites.filter(x=>x!==key):[...state.favorites,key];save();if(currentModal==='shop')showShop(key);else showFavorites();toast(state.favorites.includes(key)?'已收藏这家店':'已取消收藏');}
function showFavorites(){openModal('favorites',`${closeButton()}<h2 id="modalTitle">收藏的小店</h2><p class="intro">喜欢的小店，下次接着逛。</p>${state.favorites.length?state.favorites.filter(key=>shops[key]).map(key=>`<div class="daily-row"><div class="reward-desc"><strong>${shops[key].name}</strong><small>${shops[key].desc}</small></div><button class="product-buy" style="width:65px" data-favorite-go="${key}">去逛逛</button></div>`).join(''):'<div class="empty-state">还没有收藏的小店<br><br>进店后点爱心，就能留在这里。</div>'}`);}
function showDaily(){
 const claimed=Flow.todayClaimed(state,todayKey());
 const rows=dailyRewards.map((reward,index)=>{
  const current=index===state.visits-1;
  const status=index<state.visits-1?'已解锁':current?(claimed?'已领取':'今日可领'):index===state.visits?'明日解锁':'待解锁';
  return `<li class="reward-day-card ${current?'is-today':''}" ${current?'aria-current="step"':''}><span class="reward-day-icon" aria-hidden="true">${icon(reward.icon)}</span><div class="reward-day-copy"><span class="reward-day-label">第 ${index+1} 天</span><strong>${reward.name}</strong><small>${reward.condition}</small></div><span class="reward-day-status ${current?'is-current':''}">${status}</span></li>`;
 }).join('');
 openModal('daily',`<header class="daily-sheet-header">${closeButton()}<h2 id="modalTitle">每天来逛，都有新奖励</h2><p>已累计到访 <b>${state.visits}</b> / 7 天<span>同一天只记一次</span></p></header><div class="daily-rewards-scroll" role="region" aria-label="七天每日奖励，可上下滚动" tabindex="0"><ol class="daily-reward-list">${rows}</ol></div><footer class="daily-sheet-footer"><button class="wide-cta" data-open-offer>${claimed?'查看我的奖励':state.visits===7?'去抽奖':'领取今日好礼'}</button><p class="simulation-note">累计进度保留 · 奖励为演示数据</p></footer>`,'sheet daily-sheet');
 if(state.visits>3){const scroll=$('.daily-rewards-scroll'),today=$('.reward-day-card.is-today');scroll.scrollTop=Math.max(0,today.offsetTop-scroll.offsetTop-14);}
}
function showRewards(){
 const coupons=Flow.couponList(state),r=dailyRewards[state.visits-1],claimed=Flow.todayClaimed(state,todayKey());
 const cards=coupons.length?`<div class="reward-coupon-list" role="list" aria-label="已领取的优惠券">${coupons.map(c=>`<div role="listitem">${ticket(c)}</div>`).join('')}</div>`:'';
 const benefit=claimed&&!r.value&&state.visits<7?`<div class="reward-card"><strong>${r.name}</strong><p>${r.condition}</p></div>`:'';
 const prize=state.prize?`<div class="reward-card"><strong>${state.prize.name}</strong><p>第7天抽奖所得 · 模拟奖励，无实际兑奖</p></div>`:'';
 const empty=!coupons.length&&!claimed&&state.visits<7?'<div class="empty-state">今日奖励还没领，收下再去逛吧。</div>':'';
 const action=state.visits===7&&!state.prize?'<button class="wide-cta" data-open-lottery>第7天好礼 · 去抽奖</button>':empty?'<button class="wide-cta" data-open-offer>领取今日奖励</button>':validCoupon()?'<button class="wide-cta" data-use-coupon>去逛街用券</button>':'';
 openModal('rewards',`<header class="rewards-sheet-header">${closeButton()}<h2 id="modalTitle">我的奖励</h2><p>领到的优惠，都在这里。</p></header><div class="rewards-sheet-scroll" role="region" aria-label="我的奖励列表，可上下滚动" tabindex="0">${cards}${benefit}${prize}${empty}<div class="rule-block"><h3>已完成模拟订单 ${state.orders.length} 笔</h3><p>仅在当前浏览器记录，无实际支付或发货。</p></div></div>${action?`<footer class="rewards-sheet-footer">${action}</footer>`:''}`,'sheet rewards-sheet');
}
function showRules(){openModal('rules',`${closeButton()}<h2 id="modalTitle">奇遇街怎么玩</h2><p class="intro">逛喜欢的小店，领每日好礼。</p><div class="rule-block"><h3>进街自动签到，奖励手动领</h3><p>每天首次进街记录一次到访，累计进度保留。可以先逛逛，再从领券入口补领。领券成功后回到街景，自行挑店。</p></div><div class="rule-block"><h3>选好商品，结算时用券</h3><p>今日券限指定商品，当日有效，每单限一张。确认订单时自动校验门槛；没有可用券也可按原价提交。仅下单成功后核销。</p></div><div class="rule-block"><h3>逛满7天，解锁抽奖</h3><p>累计到访7天可抽一次，奖励概率在抽奖页公示。演示奖励无实际兑奖。</p></div><div class="rule-block"><h3>关于本次体验</h3><p>商品、价格、优惠、收藏和订单均为模拟，不连接账户与支付服务。</p></div>`);}
function giftBox(){return '<div class="popup-gift" aria-hidden="true"><span class="gift-bow"></span><span class="gift-lid"></span><span class="gift-box"></span><i>✦</i></div>';}
function showLottery(){
 state=Flow.markPrompted(state,todayKey());save();if(state.drawn)return showLotteryResult();
 openModal('lottery',`${closeButton()}<p class="lottery-kicker">✦ 累计逛满 7 天</p><h2 id="modalTitle">今日抽奖已解锁</h2>${giftBox()}<div class="lottery-card"><h3><em>100%</em> 中奖</h3><p>最高可得100元免单券</p><div class="prize-grid">${Flow.prizes.map(p=>`<div><strong>${p.name}</strong><b>${p.chance}%</b></div>`).join('')}</div></div><button class="wide-cta" data-draw>立即抽奖</button><p class="popup-footnote">每人一次 · 模拟奖励，无实际兑奖</p>`,'center lottery-popup');
}
function drawPrize(){
 if(state.visits<7||state.drawn||currentModal!=='lottery')return;
 const button=$('[data-draw]');button.disabled=true;button.textContent='好礼正在揭晓…';
 state=Flow.draw(state,crypto.getRandomValues(new Uint32Array(1))[0]/4294967296);save();renderHome();
 setTimeout(()=>{if(currentModal==='lottery')showLotteryResult();},650);
}
function showLotteryResult(){openModal('lottery-result',`${closeButton()}${giftBox()}<p class="eyebrow">第7天专属好礼</p><h2 id="modalTitle">恭喜，抽中好礼！</h2><div class="lottery-result-card"><span>¥<b>${state.prize?.value||10}</b></span><strong>${state.prize?.name||'10元券包'}</strong><small>已放入我的奖励</small></div><button class="wide-cta" data-show-rewards>查看我的奖励</button><button class="quiet-action" data-close>继续逛街</button><p class="order-notice">模拟奖励，无实际兑奖</p>`,'center reward-popup lottery-result-popup');}

function drawWalker(pose,walking=false){
  const camera=pose.camera;
  $('#world').style.transform=`translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`;
  if(!characterEnabled)return;
  const rig=$('#walkerPosition'),scale=(window.QiyuIP3D?.perspectiveFor(pose)??pose.size)*camera.scale;
  rig.style.transform=`translate(${pose.screen.x}px, ${pose.screen.y}px) scale(${scale})`;
  // The optional 3D preview consumes exactly the same ground pose and camera.
  window.QiyuIPFrame={pose,walking};
  if(window.QiyuIP3D){
    rig.dataset.worldX=pose.point[0].toFixed(3);rig.dataset.worldY=pose.point[1].toFixed(3);
    rig.dataset.screenGroundY=pose.screen.y.toFixed(3);rig.dataset.gait=pose.gait.toFixed(3);
    window.QiyuIP3D.setPose(pose,walking);
    return;
  }
  if(riggedEnabled)return; // Keep the latest ground pose while the GLB loads.
  rig.style.setProperty('--facing',pose.facing);
  rig.dataset.worldX=pose.point[0].toFixed(3);rig.dataset.worldY=pose.point[1].toFixed(3);
  rig.dataset.screenGroundY=pose.screen.y.toFixed(3);rig.dataset.gait=pose.gait.toFixed(3);
  const bob=walking?-1.1*Math.sin(pose.gait*Math.PI*2)**2:0;
  $('#walker').style.transform=`translateY(${bob}px) rotate(${walking?.45*Math.sin(pose.gait*Math.PI*2):0}deg)`;
  for(const [side,sign] of [['left',-1],['right',1]]){
    const foot=pose.feet[side],leg=$('#'+side+'Leg'),hipX=sign*10.5,hipY=-21+bob;
    const footX=(foot.x-pose.point[0])/pose.size,footY=(foot.y-pose.point[1]-foot.lift)/pose.size;
    const anchorX=32*(pose.facing===1?.32:.68),sourceX=32*(pose.facing===1?.23:-.23);
    const dx=footX-hipX,dy=footY-hipY;
    const angle=(Math.atan2(dy,dx)-Math.atan2(26,sourceX))*180/Math.PI;
    const length=Math.hypot(dx,dy)/Math.hypot(sourceX,26);
    leg.style.transformOrigin=`${anchorX}px 0`;
    leg.style.transform=`translate(${hipX-anchorX}px, ${hipY}px) rotate(${angle}deg) scale(${length})`;
    leg.dataset.worldX=foot.x.toFixed(3);leg.dataset.worldY=foot.y.toFixed(3);
    leg.dataset.lift=foot.lift.toFixed(3);leg.dataset.planted=String(foot.planted);
    leg.dataset.contact=String(foot.contact??'rest');
    const shadow=$('#'+side+'FootShadow');
    shadow.style.transform=`translate(${footX}px, ${(foot.y-pose.point[1])/pose.size}px) scale(${1-foot.lift/pose.size/20})`;
    shadow.style.opacity=String(.7-foot.lift/pose.size/18);
  }
}
function refreshGuide(key){
  const guide=$('#guide');
  if(riggedEnabled){
    guide.innerHTML=`<span class="guide-copy">${key==='paper'?'一起逛小店～':'到啦，进店逛逛～'}</span>`;
    guide.setAttribute('aria-label',key==='paper'?'跟我去零食小铺':'跟我进入'+shops[key].name);
  }else guide.innerHTML=key==='paper'?`点店铺，<br>我带你去`:ShopViews?`进店看看`:`到啦，逛${shops[key].short}`;
}
function positionGuide(key){
  if(!characterEnabled)return;
  const pose=restPose(key),size=window.QiyuIP3D?.perspectiveFor(pose)??pose.size,guide=$('#guide');
  if(riggedEnabled){
    const scale=size*pose.camera.scale;
    guide.dataset.side=key==='paper'?'right':'left';
    if(key==='paper'){
      // Keep the first-shop callout on the right without covering the face
      // or letting its compact shape run past the edge of the street.
      guide.style.left=`${Math.max(16,Math.min(254,pose.screen.x-28))}px`;
      guide.style.top=`${Math.max(145,pose.screen.y-112*scale-38)}px`;
      return;
    }
    // The bubble sits beside the face; its right-side tail points at the IP.
    guide.style.left=`${Math.max(16,Math.min(218,pose.screen.x-48*scale-188))}px`;
    guide.style.top=`${Math.max(145,pose.screen.y-56*scale-35)}px`;
    return;
  }
  guide.style.left=`${Math.max(18,Math.min(282,pose.screen.x-(pose.screen.x>310?120:-20)))}px`;
  guide.style.top=`${Math.max(145,pose.screen.y-138*size*pose.camera.scale-40)}px`;
}
function changeShopView(key){
  closeModal();moving=true;$('#app').classList.add('moving');$('#app').dataset.walking='true';$('#app').dataset.navigation='cut';$('#guide').hidden=true;
  $('#enter').disabled=true;$('#switch').disabled=true;$('#skipWalk').hidden=true;
  $('#walkStatus').textContent=key==='paper'?'返回街道':'正在前往'+shops[key].name;
  const finish=ShopViews.transition(()=>{
    ShopViews.setView(key);focusShop=key;drawWalker(restPose(key));window.QiyuIP3D?.stand([0,1],{immediate:true});
    moving=false;$('#app').classList.remove('moving');$('#app').dataset.walking='false';$('#app').dataset.navigation='idle';
    $('#enter').disabled=false;$('#switch').disabled=false;renderHome();
    refreshGuide(key);
    positionGuide(key);$('#guide').hidden=false;icons();
    $('#walkStatus').textContent=key==='paper'?'已返回街道总览':'已到'+shops[key].name+'门口，点击进店';motionFinish=null;
  },reduced);
  motionFinish=moving?finish:null;
}
function goTo(key,options={}){
  if(moving)return;
  $('#homeScroll').scrollTo({top:0,behavior:reduced?'auto':'smooth'});
  if(key===focusShop&&!options.replay){showShop(key);return;}
  const target=shops[key];if(!target)return;
  if(ShopViews&&(!characterEnabled||ShopViews.travelKind(focusShop,key)==='cut'))return changeShopView(key);
  closeModal();moving=true;$('#app').classList.add('moving');$('#app').dataset.walking='true';$('#guide').hidden=true;
  $('#skipWalk').hidden=reduced;$('#enter').disabled=true;$('#switch').disabled=true;
  $('#walkStatus').textContent='正在前往'+target.name;
  const path=Walking.route(focusShop,key);
  const finalise=()=>{if(!moving)return;moving=false;cancelAnimationFrame(walkingFrame);ShopViews?.setView(key);drawWalker(restPose(key));focusShop=key;if(ShopViews)window.QiyuIP3D?.stand([-.25,1]);$('#app').classList.remove('moving');$('#app').dataset.walking='false';$('#skipWalk').hidden=true;$('#enter').disabled=false;$('#switch').disabled=false;$('#walkTrail').innerHTML='';renderHome();refreshGuide(key);positionGuide(key);$('#guide').hidden=false;icons();$('#walkStatus').textContent='已到达'+target.name+'，点击进店';motionFinish=null;};
  motionFinish=finalise;
  if(reduced){finalise();return;}
  const duration=riggedEnabled?Walking.durationFor(path)*1000:ShopViews?2600:Walking.durationFor?Walking.durationFor(path)*1000:Math.max(1900,path.length/72*1000),started=performance.now();
  function frame(now){
    if(!moving)return;
    const progress=Math.min(1,(now-started)/duration),distance=Walking.distanceForProgress?Walking.distanceForProgress(path,progress):path.length*(progress*progress*(3-2*progress));
    drawWalker(Walking.pose(path,distance),true);
    if(progress>=1)finalise();else walkingFrame=requestAnimationFrame(frame);
  }
  walkingFrame=requestAnimationFrame(frame);
}
function useCoupon(){closeModal();toast('奖励已收好，选家小店逛逛吧');}
document.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button||button.disabled)return;
 if(button.hasAttribute('data-dismiss'))return dismissModal();
 if(button.hasAttribute('data-close'))return closeModal();
 if(button.id==='storeDoorHit')return showShop(focusShop);
 if(button.dataset.shop)return goTo(button.dataset.shop);
 if(button.dataset.detail)return showDetail(button.dataset.detail);
 if(button.dataset.buy)return showCheckout(button.dataset.buy);
 if(button.hasAttribute('data-use-coupon'))return useCoupon();
 if(button.hasAttribute('data-open-offer'))return showOffer();
 if(button.hasAttribute('data-claim-today'))return claim();
 if(button.hasAttribute('data-open-lottery'))return showLottery();
 if(button.hasAttribute('data-draw'))return drawPrize();
 if(button.hasAttribute('data-show-rewards'))return showRewards();
 if(button.dataset.toggleFavorite)return toggleFavorite(button.dataset.toggleFavorite);
 if(button.dataset.favoriteGo){const key=button.dataset.favoriteGo;closeModal();if(key===focusShop)showShop(key);else goTo(key);return;}
 if(button.dataset.returnShop)return showShop(button.dataset.returnShop);
 if(button.hasAttribute('data-checkout-back'))return returnFromCheckout();
 if(button.dataset.quantity)return showCheckout(orderProduct.id,orderQuantity+Number(button.dataset.quantity),true);
 if(button.hasAttribute('data-submit-order'))return submitOrder();
});
$('#homeScroll').addEventListener('scroll',()=>$('#app').classList.toggle('home-scrolled',$('#homeScroll').scrollTop>24),{passive:true});
$('#claim').addEventListener('click',showOffer);$('#enter').addEventListener('click',()=>showShop(focusShop));
$('#switch').addEventListener('click',()=>{if(ShopViews&&focusShop!=='paper')return goTo('paper');const keys=Object.keys(shops);goTo(keys[(keys.indexOf(focusShop)+1)%keys.length]);});
$('#back').addEventListener('click',()=>{if(currentModal)dismissModal();else if(moving)motionFinish?.();else if(focusShop!=='paper')goTo('paper');else if(ShopViews&&params.get('from')==='mall')location.href='mall.html';else toast('已经在为你推荐的主推店');});
$('#guide').addEventListener('click',()=>focusShop==='paper'?goTo('snack'):showShop(focusShop));
$('#skipWalk').addEventListener('click',()=>motionFinish?.());
$('#daily').addEventListener('click',showDaily);$('#rules').addEventListener('click',showRules);$('#rewards').addEventListener('click',showRewards);$('#favorites').addEventListener('click',showFavorites);
$('#overlay').addEventListener('click',event=>{if(event.target===$('#overlay'))dismissModal();});
$('#modal').addEventListener('animationend',event=>{if(event.target===$('#modal'))$('#modal').dataset.settled='true';});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'){if(currentModal)dismissModal();else motionFinish?.();}
 if(event.key==='Tab'&&currentModal){const nodes=[...$('#modal').querySelectorAll('button:not(:disabled),input,a[href]')];const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&(document.activeElement===first||document.activeElement===$('#modal'))){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
});
$('#motionToggle').checked=reduced;$('#motionToggle').addEventListener('change',event=>{reduced=event.target.checked;$('#app').classList.toggle('reduce-motion',reduced);if(reduced)motionFinish?.();});
$('#replay').addEventListener('click',()=>{if(moving)return;closeModal();if(focusShop==='paper')goTo('snack');else goTo('paper');});
$('#reset').addEventListener('click',()=>{motionFinish?.();closeModal();state=fresh();focusShop='paper';ShopViews?.setView('paper');drawWalker(restPose('paper'));window.QiyuIP3D?.greet();refreshGuide('paper');positionGuide('paper');$('#guide').hidden=false;renderHome();if(demo==='wallet')showRewards();else maybeOfferReward();});
window.addEventListener('resize',resize);resize();$('#app').classList.toggle('reduce-motion',reduced);ShopViews?.setView('paper');drawWalker(restPose('paper'));if(riggedEnabled)refreshGuide('paper');positionGuide('paper');renderHome();
setTimeout(demo==='wallet'?showRewards:maybeOfferReward,450);
