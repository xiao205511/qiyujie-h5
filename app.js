/* Native HTML prototype. No account, payment, tracking or external services. */
const $ = selector => document.querySelector(selector);
const icon = name => `<i data-lucide="${name}"></i>`;
const Flow = window.QiyuRewards, Basket = window.QiyuBasket, RewardGroups = window.QiyuRewardGroups, Catalog=window.QiyuCatalog, DailyStreet=window.QiyuDailyStreet;
const params = new URLSearchParams(location.search), demo = ['first','second','third','fourth','fifth','sixth','seventh','wallet','freeorder'].includes(params.get('demo')) ? params.get('demo') : null;
const shopProfile=demo&&['family','laundry','beauty','skin','baby','accessories'].includes(params.get('shopProfile'))?params.get('shopProfile'):'family';
const KEY = 'qiyu-street-interactive-v1' + (demo ? '-demo-' + demo+(shopProfile==='family'?'':'-'+shopProfile) : '');
const storage = demo ? sessionStorage : localStorage;
const Walking = window.QiyuWalking, ShopViews = window.QiyuShopViews;
const characterEnabled = $('#app')?.dataset.character !== 'off';
const riggedEnabled = $('#app')?.dataset.character === 'rigged';
const restPose = key => ShopViews ? ShopViews.restFor(key,Walking) : Walking.rest(key);
const demoDay=demo&&/^\d{4}-\d{2}-\d{2}$/.test(params.get('demoDay')||'')&&Number.isFinite(Date.parse(params.get('demoDay')+'T02:00:00Z'))?params.get('demoDay'):null;
const todayKey=()=>demoDay||Flow.activityDay();
const nextReward=()=>Flow.dailyReward(Flow.enter(state,Flow.addDays(todayKey(),1)));
const currentReward=()=>Flow.dailyReward(state);
function fresh(){
 const count={first:1,second:2,third:3,fourth:4,fifth:5,sixth:6,seventh:7,wallet:6,freeorder:7}[demo]||1;
 let base=Flow.enter(null,Flow.addDays(todayKey(),1-count));
 for(let n=1;n<count;n++)base=Flow.enter(base,Flow.addDays(todayKey(),n-count+1));
 if(shopProfile!=='family'){
  const firstDay=Flow.addDays(todayKey(),1-count),bought=shopProfile==='laundry'?'laundry':'paper';
  const interest={beauty:'makeup',skin:'skin',baby:'baby',accessories:'accessories'}[shopProfile];
  base={...base,orders:[{id:'profile-1',date:Flow.addDays(firstDay,-2),shop:bought},{id:'profile-2',date:Flow.addDays(firstDay,-1),shop:bought}],favorites:interest?[interest]:[],shopSignals:interest?[{shop:interest,type:'favorite',date:firstDay}]:[]};
 }
 if(demo==='freeorder')return Flow.draw(base,.999,todayKey());
 if(demo!=='wallet')return base;
 const coupons=[{date:todayKey(),value:8,min:59,used:false},{date:Flow.addDays(todayKey(),-2),value:6,min:39,used:false},{date:Flow.addDays(todayKey(),-4),value:5,min:29,used:true},{date:Flow.addDays(todayKey(),-5),value:3,min:9.9,used:false}];
 return Flow.enter({...base,coupon:coupons[0],coupons,rewardClaims:{[todayKey()]:true},promptedDate:todayKey()},todayKey());
}
let saved;try {saved=JSON.parse(storage.getItem(KEY));} catch {}
let state = saved ? Flow.enter(saved,todayKey()) : fresh();
let focusShop='paper', moving=false, reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let currentModal=null, lastFocus=null, motionFinish=null, walkingFrame=0, toastTimer, orderSubmitting=false;
let orderProduct=null, orderQuantity=1, checkoutOrigin=null, browsingShop='paper', detailProductId=null, activeBenefitId=null;
let renderedActivityDay=todayKey(), checkoutMode='single', basketReturnShop='paper', rewardsTab='available', rewardsHistoryFilter='all';
let cartScope=null,topupContext=null,discountChoice='auto',couponReturn='basket',editingCheckoutField=null;
let modalView=null,modalHistory=[],restoringModal=false,activeCouponId=null;
const shops=Catalog.shops,allProducts=Catalog.allProducts,dailyRewards=Flow.rewards;
const paperProducts=shops.paper.products,snackProducts=shops.snack.products,kitchenProducts=shops.kitchen.products;
let streetSlots=[],streetSignature='';
const primaryShop=()=>streetSlots[0]?.shop||'paper';
const secondaryShop=()=>streetSlots[1]?.shop||'face';
function syncStreet({preserveStreet=false}={}){
 const result=DailyStreet.resolve(state,todayKey());state=result.state;
 if(preserveStreet&&streetSignature)return;
 streetSlots=result.slots;
 const signature=streetSlots.map(s=>s.shop).join(':');
 if(signature===streetSignature)return;
 const firstLayout=!streetSignature;streetSignature=signature;motionFinish?.();ShopViews?.configure(streetSlots,shops);
 if(firstLayout||!streetSlots.some(s=>s.shop===focusShop))focusShop=primaryShop();
 ShopViews?.setView(focusShop);drawWalker(restPose(focusShop));refreshGuide(focusShop);positionGuide(focusShop);
}
const money=value=>Number(value).toFixed(1), exact=value=>Number(value).toFixed(2);
function save(){try{storage.setItem(KEY,JSON.stringify(state));}catch{}}
function icons(){lucide.createIcons({attrs:{'aria-hidden':'true'}});}
function art(p,extra=''){const sheet=Catalog.sheets[p.sheet||'paper'];return `<div class="product-art ${extra}" role="img" aria-label="${p.name}商品图">${window.QiyuSpriteArt.render(sheet.url,p.art,{padding:.025})}</div>`;}
function validCoupon(){return Flow.availableCoupons(state,todayKey()).length>0;}
function couponFor(p,quantity=1){return Flow.quote(state,p,quantity,todayKey()).coupon;}
function recommendationProducts(c){
 const currentIds=new Set(Catalog.shelfProducts.map(p=>p.id));
 return allProducts.filter(p=>currentIds.has(p.id)||c.productIds?.includes(p.id)||(shops[p.shop]?.archived&&c.shopIds?.includes(p.shop)));
}
function priceHtml(p){const q=Flow.quote(state,p,1,todayKey());return `<span class="price"><small>${q.discount?(q.discountKind==='benefit'?'专享 ':'券后 '):''}</small><sup>¥</sup>${money(q.total)}</span>`;}
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,2300);}
function resize(){
 const scale=Math.min(1,innerWidth/414);
 const previewBar=$('#dayPreviewBar');if(previewBar)previewBar.hidden=!demo;
 document.body.classList.toggle('has-day-preview',!!demo);
 const previewHeight=previewBar&&!previewBar.hidden?previewBar.getBoundingClientRect().height:0;
 document.documentElement.style.setProperty('--preview-bar-height',previewHeight+'px');
 document.documentElement.style.setProperty('--s',String(scale));
 document.documentElement.style.setProperty('--preview-scale',String(Math.min(1,Math.max(320,innerHeight-previewHeight-48)/896)));
 document.documentElement.style.setProperty('--app-height',(innerWidth<=800?Math.max(320,(innerHeight-previewHeight)/scale):896)+'px');
}
function updateCartEntry(){
 const button=$('#homeCart');if(!button)return;
 const lines=Basket.items(state,allProducts),count=lines.reduce((n,i)=>n+i.quantity,0);
 button.dataset.openBasket=focusShop;
 button.setAttribute('aria-label',`打开购物车，共${count}件`);
 $('#homeCartCount').textContent=count;$('#homeCartCount').hidden=!count;

}
function renderHome({preserveStreet=!!currentModal}={}){
 syncStreet({preserveStreet});
 const reward=currentReward(),claimed=Flow.todayClaimed(state,todayKey()),tomorrow=nextReward();
 const nextLabel=tomorrow.value?`明日<b>${tomorrow.value}</b>元券`:tomorrow.name;
 $('#daily').querySelector(':scope>span').innerHTML=`已来<b>${state.visits}</b>天 · ${state.visits===7?(state.drawn?'奖励已领取':'抽奖已解锁'):nextLabel}`;
 $('#progressFill').style.width=state.visits/7*100+'%';
 $('#claimText').textContent=claimed?(state.coupon?.date===todayKey()&&state.coupon.used&&!validCoupon()?'券已使用':'我的奖励'):(reward.value?`领${reward.value}元券`:state.visits===7?'去抽奖':'查看奖励');
 $('#claim').classList.toggle('claimed',!!(state.coupon?.date===todayKey()&&state.coupon.used&&!validCoupon()));
 $('#couponCondition').textContent=validCoupon()&&claimed?`有${Flow.availableCoupons(state,todayKey()).length}张券可用 · 进店自动选优惠`:(state.coupon?.date===todayKey()&&state.coupon.used?'今日券已使用 · 明天来逛有新奖励':reward.value?`满${reward.min}减${reward.value} · 限指定商品 · 今日有效`:'每天来逛，都有新奖励');
 const atStore=ShopViews&&focusShop!==primaryShop();
 $('#enter').innerHTML=`${atStore?'进店逛逛':'逛'+shops[focusShop].short}`;
 if(ShopViews){$('#switch').innerHTML=atStore?`${icon('corner-up-left')}<span>返回街道</span>`:`${icon('refresh-cw')}<span>换家店</span>`;$('#back').setAttribute('aria-label',atStore?'返回街道':params.get('from')==='mall'?'返回商城':'返回主推店');}
 const homeScroll=$('#homeScroll'),homeOffset=homeScroll.scrollTop;
 const recentIds=[...new Set([...(state.recentProductIds||[]),...streetSlots.flatMap(s=>shops[s.shop].products.slice(0,4).map(p=>p.id))])].slice(0,12);
 $('#recentGrid').innerHTML=recentIds.map(id=>allProducts.find(p=>p.id===id)).filter(Boolean).map(p=>`<article class="recent-card"><button class="recent-detail" data-detail="${p.id}" aria-label="查看${p.name}详情">${art(p)}<h3>${p.name}</h3><div class="recent-price-row">${priceHtml(p)}</div></button></article>`).join('');
 homeScroll.scrollTop=homeOffset;
 document.querySelectorAll('[data-shop]').forEach(el=>{const key=el.dataset.shop;el.setAttribute('aria-label',(key===focusShop?'进入':characterEnabled?'走到':'查看')+shops[key].name);});
 const dateLabel=$('#streetDate');if(dateLabel)dateLabel.textContent=todayKey().slice(5).replace('-','月')+'日 · 今日小街';
 const previewDay=$('#previewDay');if(previewDay)previewDay.value=['first','second','third','fourth','fifth','sixth','seventh'][state.visits-1]||'first';
 document.querySelectorAll('[data-preview-day]').forEach((link,i)=>{const url=new URL(location.href);url.searchParams.set('demo',link.dataset.previewDay);url.searchParams.set('demoDay',Flow.addDays(state.streetStartedOn||todayKey(),i));url.searchParams.set('v','unified-colors-2');link.href=url.href;if(i===state.visits-1)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
 const previewCaption=$('#previewDayCaption');if(previewCaption)previewCaption.textContent=`第${state.visits}天 · ${todayKey().slice(5).replace('-','月')}日`;
 const profileSelect=$('#previewProfile');if(profileSelect)profileSelect.value=shopProfile;
 $('#app').dataset.focusShop=focusShop;updateCartEntry();icons();save();
}
function closeModal(){modalHistory=[];modalView=null;if(!currentModal)return;$('#overlay').hidden=true;$('#modal').innerHTML='';currentModal=null;$('#homeScroll').inert=false;$('.topbar').inert=false;$('#app').classList.remove('has-modal');renderHome();if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});}
function describeModal(kind){
 const context={activeCouponId,browsingShop,detailProductId,activeBenefitId,orderProduct,orderQuantity,checkoutOrigin,checkoutMode,basketReturnShop,cartScope,topupContext,discountChoice,couponReturn,editingCheckoutField,rewardsTab,rewardsHistoryFilter};
 const identity=({shop:browsingShop,detail:detailProductId,benefit:activeBenefitId,basket:cartScope||'all','checkout-edit':editingCheckoutField,'coupon-detail':activeCouponId})[kind]||'';
 return {kind,key:kind+':'+identity,context};
}
function modalFocusables(){
 return [...$('#modal').querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href],summary,[tabindex]:not([tabindex="-1"])')].filter(node=>node.getClientRects().length&&!node.closest('[inert]'));
}
function captureModalUI(){
 const modal=$('#modal'),controls=[...modal.querySelectorAll('button,input,textarea,select,a[href]')];
 return {scroll:modal.scrollTop,expanded:modal.classList.contains('is-expanded'),focus:controls.indexOf(document.activeElement),
  regions:[...modal.querySelectorAll('.bottom-sheet-scroll,.atmosphere-content,.lottery-popup-scroll')].map(e=>e.scrollTop),
  fields:[...modal.querySelectorAll('input,textarea,select')].map(e=>({value:e.value,checked:e.checked}))};
}
function restoreModalView(target=null,overrides={}){
 const index=target===null?modalHistory.length-1:modalHistory.findLastIndex(v=>v.kind===target||v.key===target);
 if(index<0)return false;
 const view=modalHistory[index];modalHistory.length=index;
 ({activeCouponId,browsingShop,detailProductId,activeBenefitId,orderProduct,orderQuantity,checkoutOrigin,checkoutMode,basketReturnShop,cartScope,topupContext,discountChoice,couponReturn,editingCheckoutField,rewardsTab,rewardsHistoryFilter}={...view.context,...overrides});
 restoringModal=true;
 try{
  switch(view.kind){
   case 'shop':showShop(browsingShop);break;
   case 'detail':showDetail(detailProductId);break;
   case 'basket':showBasket(basketReturnShop,cartScope,true);break;
   case 'checkout':renderCheckout();break;
   case 'topup':showTopup();break;
   case 'coupon-picker':showCouponPicker(couponReturn);break;
   case 'coupon-detail':showCouponDetails(activeCouponId);break;
   case 'checkout-edit':editCheckout(editingCheckoutField);break;
   case 'rewards':showRewards(rewardsTab,rewardsHistoryFilter);break;
   case 'benefit':showBenefit(activeBenefitId);break;
   case 'favorites':showFavorites();break;
   case 'daily':showDaily();break;
   case 'rules':showRules();break;
   case 'offer':showOffer();break;
   case 'coupon':showClaimSuccess();break;
   case 'lottery':showLottery();break;
   case 'lottery-result':showLotteryResult();break;
  }
 }finally{restoringModal=false;}
 // Render from live commerce state, then restore the previous viewport and focus.
 if(view.ui){
  const modal=$('#modal');if(view.ui.expanded)modal.classList.add('is-expanded');modal.scrollTop=view.ui.scroll;
  [...modal.querySelectorAll('.bottom-sheet-scroll,.atmosphere-content,.lottery-popup-scroll')].forEach((e,i)=>e.scrollTop=view.ui.regions[i]||0);
  [...modal.querySelectorAll('input,textarea,select')].forEach((e,i)=>{const field=view.ui.fields[i];if(field){e.value=field.value;if(typeof field.checked==='boolean')e.checked=field.checked;}});
  const focus=modal.querySelectorAll('button,input,textarea,select,a[href]')[view.ui.focus];if(focus&&!focus.disabled)focus.focus({preventScroll:true});
 }
 return true;
}
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
function layoutAtmosphereModal(modal){
 if(!modal.classList.contains('center'))return;
 const close=modal.querySelector('.modal-close');
 if(!modal.querySelector('.lottery-popup-scroll')){
  const content=document.createElement('div');
  content.className='atmosphere-content';
  content.setAttribute('role','region');
  content.setAttribute('aria-label',`${modal.querySelector('#modalTitle')?.textContent||'好礼'}内容，可上下滚动`);
  content.tabIndex=0;
  for(const node of [...modal.children])if(node!==close&&!node.matches('.popup-mascot,.reward-success-badge'))content.append(node);
  modal.append(content);
 }
 if(close){close.classList.add('atmosphere-close');modal.append(close);}
}
function openModal(kind,html,classes='sheet simple-sheet',{replace=false,reset=false}={}){
 if(!currentModal)lastFocus=document.activeElement;
 const next=describeModal(kind);
 if(reset)modalHistory=[];
 else if(!restoringModal&&!replace&&modalView&&modalView.key!==next.key){modalView.ui=captureModalUI();modalHistory.push(modalView);}
 modalView=next;
 const sameStyle=!$('#overlay').hidden&&$('#modal').className==='modal '+classes;
 currentModal=kind;$('#modal').dataset.kind=kind;$('#modal').dataset.settled=sameStyle?'true':'false';$('#modal').className='modal '+classes;$('#modal').innerHTML=html;$('#homeScroll').inert=true;$('.topbar').inert=true;
 layoutAtmosphereModal($('#modal'));layoutBottomSheet($('#modal'));
 if(modalHistory.length){const close=$('#modal').querySelector('[data-dismiss]');if(close){close.setAttribute('aria-label','返回上一个弹窗');close.setAttribute('title','返回上一个弹窗');}}
 $('#overlay').hidden=false;$('#app').classList.add('has-modal');icons();$('#modal').focus({preventScroll:true});$('#modal').scrollTop=0;
}
const closeButton=()=>`<button class="modal-close" data-dismiss aria-label="关闭弹窗">${icon('x')}</button>`;
let ticketSequence=0;
function formatExpiry(c){
 const d=new Date(Flow.couponExpiry(c)),parts=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d);
 const get=t=>parts.find(p=>p.type===t)?.value;
 return `${get('year')}.${get('month')}.${get('day')} ${get('hour')}:${get('minute')}`;
}
function ticket(c,{offered=false,usable=false,claimable=false,statusText,count=1,showStatus=true,showDetails=false}={}){
 const normalized={...c,date:c.date||todayKey()},status=statusText||(offered?'待领取':({used:'已使用',expired:'已过期',future:'未生效',available:'待使用'})[Flow.couponStatus(normalized,todayKey())]);
 const inactive=!offered&&status!=='待使用',gradientId=`coupon-fill-${++ticketSequence}`,free=c.type==='free-order';
 const threshold=free?`最高抵${c.value}元`:`满${c.min}减${c.value}`;
 const label=free?'免单券 · 全街商品可用':c.source==='lottery'?'抽奖券包 · 全街商品可用':c.value===3?'新人见面礼 · 限指定商品':'逛街专属券 · 限指定商品';
 const action=claimable?'<button class="coupon-use-action" data-claim-in-rewards>去领取</button>':usable&&!offered&&!inactive?`<button class="coupon-use-action" data-browse-coupon="${c.id}" aria-label="去使用${c.value}元${free?'免单券':'券'}，${threshold}">去使用</button>`:showStatus?(['已使用','已过期'].includes(status)?`<button class="coupon-use-action" disabled>${status}</button>`:`<b class="coupon-status">${status}</b>`):'';
 const digits=c.value>=100?'is-three-digit':c.value>=10?'is-two-digit':'';
 return `<article class="coupon-ticket ${inactive?'is-unavailable':''} ${digits}" aria-label="${c.value}元${free?'免单券':'券'}，${threshold}，${status}${count>1?`，共${count}张`:``}"><svg class="coupon-shape" viewBox="0 0 320 104" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${inactive?'#fcf8f1':'#fff3e5'}"/><stop offset="1" stop-color="${inactive?'#f3ece1':'#ffe7cb'}"/></linearGradient></defs><path d="M18 .5H302A17.5 17.5 0 0 1 319.5 18V44A8 8 0 0 0 319.5 60V86A17.5 17.5 0 0 1 302 103.5H18A17.5 17.5 0 0 1 .5 86V60A8 8 0 0 0 .5 44V18A17.5 17.5 0 0 1 18 .5Z" fill="url(#${gradientId})" stroke="${inactive?'#e4d8c8':'#ffc68f'}" stroke-width="1" vector-effect="non-scaling-stroke"/></svg><div class="coupon-main"><div class="coupon-amount"><small>¥</small>${c.value}</div>${count>1?`<span class="coupon-stack-count">×${count}张</span>`:``}<div class="coupon-copy"><strong>${threshold}</strong><span class="coupon-label">${label}</span><span class="coupon-validity">有效期至 ${formatExpiry(normalized)}</span>${showDetails&&c.id?`<button class="coupon-details-link" data-coupon-detail="${c.id}">使用说明 ${icon('chevron-right')}</button>`:''}</div>${action}</div></article>`;
}
function benefitTicket(r){
 return `<div class="benefit-ticket">${icon(r.icon)}<div><strong>${r.name}</strong><span>${r.condition}</span><small>当活动日有效 · 每日10点更新</small></div></div>`;
}
function showOffer(){
 if(Flow.todayClaimed(state,todayKey()))return showRewards();
 if(state.visits===7)return showLottery();
 state=Flow.markPrompted(state,todayKey());save();
 const r=currentReward();
 openModal('offer',`<div class="popup-mascot" aria-hidden="true"><img src="assets/ip-popup-peek-v1.png" width="1254" height="1254" alt="" decoding="async"></div>${closeButton()}<p class="eyebrow">${state.returnedAfterGap?'欢迎回来 · 累计':'第'} ${state.visits} 天 · 已为你签到</p><h2 id="modalTitle">今天逛街，先${r.value?'领券':'收好礼'}</h2>${r.value?ticket(r,{offered:true,showStatus:false}):benefitTicket(r)}<button class="wide-cta" data-claim-today>${r.value?'领取今日券':r.type==='preview'?'解锁新品预览':'领取专享价'}</button><button class="secondary-cta" data-close>先逛逛</button>`,'center reward-popup offer-popup');
}
function maybeOfferReward(){if(Flow.shouldPrompt(state,todayKey())&&!currentModal&&!moving)showOffer();}
function claim({inShop=false,inRewards=false}={}){
 if(Flow.todayClaimed(state,todayKey()))return inShop||inRewards?toast('今日好礼已领取'):showRewards();
 if(state.visits===7)return showLottery();
 state=Flow.claim(state,todayKey());
 if(currentReward().value){const ids=DailyStreet.couponShopIds(state),coupon={...state.coupon,shopIds:ids};state={...state,coupon,coupons:Flow.couponList(state).map(c=>c.id===coupon.id?coupon:c)};}
 else {const benefit=state.benefits.at(-1);if(benefit){const productIds=DailyStreet.benefitProducts(state,todayKey(),benefit.type);state={...state,benefits:state.benefits.map(b=>b.id===benefit.id?{...b,productIds,streetVersion:1}:b)};}}
 save();renderHome();
 if(inShop||inRewards){preserveCommerceScroll(()=>inRewards?showRewards(rewardsTab,rewardsHistoryFilter):showShop(browsingShop));toast('领取成功');return;}
 showClaimSuccess();
}
function showClaimSuccess(){
 const r=currentReward();
 openModal('coupon',`<div class="reward-success-badge" aria-hidden="true">${icon('check')}</div>${closeButton()}<h2 id="modalTitle">${r.value?'领券成功':'好礼已解锁'}</h2><p class="success-sub">已放入「我的奖励」</p>${r.value?ticket(state.coupon,{showStatus:false}):benefitTicket(r)}<button class="wide-cta" ${r.value?'data-use-coupon':`data-open-benefit="${state.benefits.at(-1).id}"`}>${r.value?'去逛街用券':r.type==='preview'?'去看精选预览':'去逛专享好物'}</button>${r.value?'<p class="popup-footnote">回到街上，自由挑选喜欢的小店</p>':''}`,'center reward-popup claim-success-popup',{replace:currentModal==='offer'});
}
function basketQuantity(id){return Basket.items(state,allProducts).find(i=>i.product.id===id)?.quantity||0;}
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cartOptions=()=>({shop:cartScope||undefined,selectedOnly:!cartScope,couponId:discountChoice});
const cartQuote=()=>Basket.quote(state,allProducts,todayKey(),cartOptions());
function quantityPicker(p,n,{removable=true}={}){
 return `<div class="quantity basket-quantity"><button data-basket-delta="-1" data-product="${p.id}" aria-label="减少${p.name}数量" ${!removable&&n===1?'disabled':''}>${icon('minus')}</button><strong aria-label="${p.name}已选${n}件" aria-live="polite">${n}</strong><button data-basket-delta="1" data-product="${p.id}" aria-label="增加${p.name}数量" ${n>=9?'disabled':''}>${icon('plus')}</button></div>`;
}
function selectionControl(p,topup=false){
 const n=topup&&topupContext?.singleDraft?(topupContext.singleDraft[p.id]||0):basketQuantity(p.id);
 if(topup&&topupContext?.selectedOnly&&n&&state.basketSelection?.[p.id]===false)return `<button class="product-buy" data-topup-select="${p.id}">加入本单</button>`;
 return n?quantityPicker(p,n):`<button class="product-buy quick-add" data-add-basket="${p.id}" aria-label="将${p.name}加入购物车">${icon('plus')}</button>`;
}
function productRow(p,{topup=false,exclusive=false}={}){return `<article class="shop-product-row"><button class="row-art" data-detail="${p.id}" aria-label="查看${p.name}详情">${art(p)}</button><div class="row-product-copy"><button class="product-name" data-detail="${p.id}">${p.name}</button><span class="original-price product-price-hint">${topup&&topupContext?.selectedOnly&&state.basketSelection?.[p.id]===false?'已加购 · 未计入本单':'标准装'}</span><div class="row-price-action">${exclusive?`<span class="exclusive-product-prices">${priceHtml(p)}<del class="exclusive-original-price" aria-label="原价${money(p.price)}元">¥${money(p.price)}</del></span>`:`<span class="price"><sup>¥</sup>${exact(p.price)}</span>`}${selectionControl(p,topup)}</div></div></article>`;}
function moreProductCard(p){return `<article class="more-product"><button class="more-product-detail" data-detail="${p.id}" aria-label="查看${p.name}详情">${art(p)}<strong>${p.name}</strong></button><div class="more-product-footer">${priceHtml(p)}${selectionControl(p)}</div></article>`;}
function basketHint(q){
 if(!q.valid)return '选几件喜欢的好物';
 if(q.discount)return `已优惠 ¥${exact(q.discount)} · 已选${q.quantity}件`;
 return q.reason==='minimum'?`还差 ¥${exact(q.minimumShortfall)} 可用券`:`已选${q.quantity}件 · 仅本店商品`;
}
function basketFooter(key){
 const q=Basket.quote(state,allProducts,todayKey(),{shop:key,selectedOnly:false});
 return `<footer class="basket-footer shop-cart-footer"><button class="basket-summary" data-open-local-basket="${key}" aria-label="查看本店已选商品，共${q.quantity}件"><span class="basket-symbol">${icon('shopping-cart')}${q.quantity?`<b>${q.quantity}</b>`:''}</span><span><strong>${q.valid?`本店${q.discount?'优惠后':'合计'} <em>¥${exact(q.total)}</em>`:'还没有选好物'}</strong><small>${basketHint(q)}</small></span>${icon('chevron-up')}</button><button class="basket-checkout-cta" data-shop-checkout="${key}" ${!q.valid?'disabled':''}>去结算</button></footer>`;
}
function detailCartButton(key){return `<button class="detail-cart-entry" data-open-basket="${key}" aria-label="查看购物车">${icon('shopping-cart')}<span>购物车</span></button>`;}
function preserveCommerceScroll(render){
 const scroll=$('.bottom-sheet-scroll'),offset=scroll?.scrollTop||0,expanded=$('#modal').classList.contains('is-expanded');
 const active=document.activeElement,action=active?.matches('button')?[...active.attributes].find(a=>a.name.startsWith('data-')&&a.name!=='data-product'):null,product=active?.dataset.product;
 render();if(expanded&&currentModal==='shop')$('#modal').classList.add('is-expanded');
 if($('.bottom-sheet-scroll'))$('.bottom-sheet-scroll').scrollTop=offset;
 if(action){const match=[...$('#modal').querySelectorAll('button')].find(b=>b.getAttribute(action.name)===action.value&&(!product||b.dataset.product===product));match?.focus({preventScroll:true});}
}
function changeBasket(id,delta){
 const p=allProducts.find(p=>p.id===id);if(!p)return;
 if(currentModal==='topup'&&topupContext?.singleDraft){
  topupContext.singleDraft=Basket.setQuantity({basket:topupContext.singleDraft},id,(topupContext.singleDraft[id]||0)+delta,allProducts).basket;
  return preserveCommerceScroll(()=>showTopup(false));
 }
 state=Basket.setQuantity(state,id,basketQuantity(id)+delta,allProducts);
 if(delta>0)state=DailyStreet.record(state,p.shop,'cart',todayKey());
 if(currentModal==='topup'&&delta>0)state=Basket.setSelected(state,[id],true,allProducts);
 save();renderHome();
 preserveCommerceScroll(()=>{
  if(currentModal==='shop')showShop(browsingShop);
  else if(currentModal==='basket')showBasket(basketReturnShop,cartScope);
  else if(currentModal==='topup')showTopup(false);
  else if(currentModal==='benefit'){browsingShop=p.shop;showBenefit(activeBenefitId);}
  else if(currentModal==='detail'){showDetail(id);if(delta>0)toast('已加入购物车');}
 });
}
function toggleCartSelection(scope){
 const lines=Basket.items(state,allProducts),ids=scope==='all'?lines.map(i=>i.product.id):lines.filter(i=>i.product.id===scope||i.product.shop===scope).map(i=>i.product.id);
 const all=ids.every(id=>state.basketSelection?.[id]!==false);
 state=Basket.setSelected(state,ids,!all,allProducts);save();
 preserveCommerceScroll(()=>showBasket(basketReturnShop,cartScope));
}
function cartCheck(ids,label,scope){
 const n=ids.filter(id=>state.basketSelection?.[id]!==false).length,status=n===ids.length?'true':n?'mixed':'false';
 return `<button class="cart-check" role="checkbox" aria-checked="${status}" aria-label="${label}" data-cart-select="${scope}">${status!=='false'?icon(status==='mixed'?'minus':'check'):''}</button>`;
}
function couponCountdown(c){
 let now=Date.now();if(demoDay){const realDay=Flow.activityDay(now);now+=Date.parse(demoDay+'T02:00:00Z')-Date.parse(realDay+'T02:00:00Z');}
 const hours=Math.max(0,Math.floor((Date.parse(Flow.couponExpiry(c))-now)/3600000));return `${Math.floor(hours/24)}天${hours%24}小时`;
}
function cartCouponBanner(){
 const coupons=Flow.availableCoupons(state,todayKey()).sort((a,b)=>a.expiresOn.localeCompare(b.expiresOn));if(!coupons.length)return '';
 return `<div class="cart-coupon-banner">${icon('ticket')}<strong>您有${coupons.length===1?'一':coupons.length}张满减券，<span>仅剩${couponCountdown(coupons[0])}</span></strong><button data-cart-coupons>查看券</button></div>`;
}
function couponProgress(q,options,action='data-go-topup',sourceState=state){
 const goal=Basket.goal(sourceState,allProducts,todayKey(),options);if(!goal)return '';
 const c=goal.coupon,ready=!goal.shortfall,percent=c.min?Math.min(100,goal.eligibleSubtotal/c.min*100):100;
 return `<div class="cart-coupon-progress"><div><strong>${c.min?`满${c.min}减${c.value}`:`最高抵${c.value}元`}<span> · ${ready?'已满足用券门槛':`还差¥${exact(goal.shortfall)}`}</span></strong>${action?`<button ${action}>${ready?'继续选购':'去凑单'}${icon('chevron-right')}</button>`:''}</div><progress max="100" value="${percent}" aria-label="用券门槛进度">${Math.round(percent)}%</progress></div>`;
}
function cartDock(q,lines){
 const ids=lines.map(i=>i.product.id);
 return `<footer class="commerce-dock">${lines.length?couponProgress(q,cartOptions()):''}<div class="cart-settle-row">${!cartScope&&ids.length?`<div class="cart-select-all">${cartCheck(ids,'全选购物车商品','all')}<span>全选</span></div>`:''}<div class="cart-settle-total"><strong>合计 <em>¥${exact(q.total)}</em></strong><small>已选${q.quantity}件 · ${q.discount?`已优惠¥${exact(q.discount)}`:'暂未用券'}</small></div><button class="basket-checkout-cta" data-basket-checkout="${basketReturnShop}" ${!q.valid?'disabled':''}>结算${q.quantity?`(${q.quantity})`:''}</button></div></footer>`;
}
function showBasket(key=browsingShop,scope=null,preserveChoice=false){
 if(!shops[key])key='paper';basketReturnShop=key;cartScope=scope&&shops[scope]?scope:null;if(!preserveChoice)discountChoice='auto';
 const lines=Basket.items(state,allProducts,cartScope||undefined),q=cartQuote(),count=lines.reduce((n,i)=>n+i.quantity,0);
 const groups=Object.entries(shops).map(([shopId,shop])=>{
  const storeLines=lines.filter(i=>i.product.shop===shopId);if(!storeLines.length)return '';
  const rows=storeLines.map(({product:p,quantity:n})=>`<article class="cart-product">${!cartScope?cartCheck([p.id],`选择${p.name}`,p.id):''}<button class="cart-product-image" data-detail="${p.id}" aria-label="查看${p.name}详情">${art(p)}</button><div class="cart-product-copy"><div class="cart-product-heading"><button data-detail="${p.id}">${p.name}</button><button class="basket-remove" data-remove-basket="${p.id}" aria-label="移除${p.name}">移除</button></div><span>标准装</span><div class="cart-product-price"><strong>¥${exact(p.price)}</strong>${quantityPicker(p,n)}</div></div></article>`).join('');
  return `<section class="cart-store"><div class="cart-store-heading">${!cartScope?cartCheck(storeLines.map(i=>i.product.id),`选择${shop.name}全部商品`,shopId):icon('store')}<h3>${shop.name}</h3><button data-return-shop="${shopId}">进店${icon('chevron-right')}</button></div>${rows}</section>`;
 }).join('');
 openModal('basket',`<header class="sheet-head commerce-header"><h2 id="modalTitle">购物车 <span>(${count})</span></h2><button class="detail-close" data-dismiss aria-label="关闭购物车">${icon('x')}</button></header><div class="shop-products-scroll commerce-scroll cart-scroll">${cartScope?`<div class="local-cart-note">仅查看${shops[cartScope].name}<button data-open-basket="${key}">查看全部购物车</button></div>`:''}${cartCouponBanner()}${groups||`<div class="basket-empty">${icon('shopping-cart')}<strong>购物车还是空的</strong><p>选几件喜欢的商品，一起结算更方便。</p><button class="secondary-cta" data-return-shop="${key}">去店铺选购</button></div>`}</div>${cartDock(q,lines)}`,'sheet basket-sheet commerce-sheet');
}
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
 if(!shops[key])return;
 if(currentModal!=='shop'||browsingShop!==key){state=DailyStreet.record(state,key,'view',todayKey());renderHome({preserveStreet:true});}
 browsingShop=key;const shop=shops[key],r=currentReward(),claimed=Flow.todayClaimed(state,todayKey()),canClaim=!claimed&&DailyStreet.couponShopIds(state).includes(key);
 const shopCoupons=Flow.availableCoupons(state,todayKey()).filter(c=>shop.products.some(p=>Basket.applies(c,p))),hasShopCoupon=shopCoupons.length>0;
 const copy=hasShopCoupon?`有 ${shopCoupons.length} 张券可用 · 自动选最优优惠`:validCoupon()?'现有优惠券暂不适用于本店':state.coupon?.date===todayKey()&&state.coupon.used?'今日券已使用 · 明天再来领好礼':canClaim&&r.value?`今日可领 ${r.value}元券 · 满${r.min}减${r.value}`:!claimed&&r.value?'今日优惠券暂不适用于本店':'今日好物，慢慢挑';
 openModal('shop',`<header class="sheet-head"><div><h2 id="modalTitle">${shop.name}</h2><p>${shop.desc}</p></div><div class="sheet-actions"><button data-toggle-favorite="${key}" aria-label="${state.favorites.includes(key)?'取消收藏':'收藏'}${shop.name}">${icon('heart')}</button><button data-dismiss aria-label="关闭店铺">${icon('x')}</button></div></header><div class="shop-products-scroll" role="region" aria-label="${shop.name}商品，可上下滚动" tabindex="0"><div class="coupon-strip">${icon(hasShopCoupon?'circle-check':'ticket-percent')}<div><strong>${copy}</strong><small>适用范围、门槛与有效期以券面为准</small></div>${(hasShopCoupon||validCoupon())?'<button data-shop-coupons>去查看</button>':canClaim&&r.value?'<button data-claim-in-shop>领取</button>':''}</div><div class="shop-product-list">${shop.products.slice(0,3).map(productRow).join('')}</div>${shop.products.length>3?`<h3 class="more-products-title">更多日常好物 <span>点商品查看当前优惠</span></h3><div class="more-products-grid">${shop.products.slice(3).map(moreProductCard).join('')}</div>`:''}</div>${basketFooter(key)}`,'sheet shop-sheet');
 bindShopSheet();
 if(state.favorites.includes(key))$('[data-toggle-favorite] .lucide').classList.add('is-favorite');
}
function showDetail(id){
 const p=allProducts.find(p=>p.id===id);if(!p)return;browsingShop=p.shop;detailProductId=id;const q=Flow.quote(state,p,1,todayKey());
 state={...DailyStreet.record(state,p.shop,'view',todayKey()),recentProductIds:[p.id,...(state.recentProductIds||[]).filter(id=>id!==p.id)].slice(0,12)};renderHome({preserveStreet:true});
 openModal('detail',`<header class="sheet-head"><h2 id="modalTitle">商品详情</h2><div class="sheet-actions"><button class="detail-close" data-dismiss aria-label="关闭商品详情">${icon('x')}</button></div></header><div class="shop-products-scroll detail-scroll"><div class="detail-hero">${art(p)}</div><div class="detail-copy">${priceHtml(p)}${q.discount?`<del class="detail-original">原价 ¥${money(p.price)}</del>`:''}<h3>${p.name}</h3><p>标准装 · 来自${shops[p.shop].name}</p></div><div class="detail-coupon ${q.discount?'is-usable':''}">${icon('ticket-percent')}<div><strong>${q.discount?`${q.discountKind==='benefit'?'专享价已生效':'优惠券可用'}，到手 ¥${money(q.total)}`:couponReason(q,p)}</strong><span>${q.discountKind==='benefit'?'本活动日内有效 · 不与券叠加':q.coupon?`有效期至 ${formatExpiry(q.coupon)} · 每单限一张`:'适用范围、门槛与有效期以券面为准'}</span></div></div></div><footer class="detail-footer">${detailCartButton(p.shop)}<div class="detail-purchase-actions"><button class="wide-cta" data-add-basket="${p.id}">加入购物车</button><button class="secondary-cta" data-buy="${p.id}">立即购买</button></div></footer>`,'sheet detail-sheet');
}
function couponReason(q,p){return ({unclaimed:'未领取优惠，本单按原价结算',expired:'优惠已过期，本单按原价结算',used:'可用券已用完，本单按原价结算',ineligible:'该商品暂不适用现有优惠券',minimum:`还差 ¥${exact(q.minimumShortfall||0)} 达到用券门槛`,applied:`已自动选择${q.discount}元优惠券`,benefit:`已享专享价，每件立减1元`})[q.reason];}
function showCheckout(id,quantity=1,preserveOrigin=false){
 const p=allProducts.find(p=>p.id===id);if(!p)return;
 if(!preserveOrigin){checkoutOrigin=currentModal==='detail'?{type:'detail',product:p.id}:{type:'shop',shop:p.shop};discountChoice='auto';}
 checkoutMode='single';orderProduct=p;orderQuantity=Math.min(9,Math.max(1,quantity));orderSubmitting=false;renderCheckout();
}
function showBasketCheckout(key=basketReturnShop,scope=cartScope,preserveChoice=false){
 if(!shops[key])key=browsingShop;basketReturnShop=key;cartScope=scope||null;
 if(!preserveChoice)discountChoice='auto';
 const q=cartQuote();if(!q.valid){toast('请先选择要结算的商品');return showBasket(key,cartScope);}
 checkoutMode='basket';orderProduct=q.items[0].product;orderSubmitting=false;checkoutOrigin={type:'basket',shop:key,scope:cartScope};renderCheckout();
}
function currentOrderQuote(){return checkoutMode==='basket'?cartQuote():checkoutMode==='topup'?Basket.quoteDraft(state,allProducts,topupContext.singleDraft,todayKey(),{couponId:discountChoice}):Flow.quoteItems(state,[{product:orderProduct,quantity:orderQuantity}],todayKey(),{couponId:discountChoice});}
function checkoutPreferences(){return state.checkoutPreferences||{address:'幸福路18号3栋201室',name:'王女士',phone:'13800000628',invoice:'不开票',note:''};}
function renderCheckout(){
 const q=currentOrderQuote();if(!q.valid)return showBasket(basketReturnShop,cartScope);
 const prefs=checkoutPreferences(),phone=prefs.phone.replace(/(\d{3})\d{4}(\d{4})/,'$1****$2');
 const address=`<button class="checkout-address commerce-card" data-checkout-edit="address">${icon('map-pin')}<span><strong>${esc(prefs.address)}</strong><small>${esc(prefs.name)} ${esc(phone)}</small></span>${icon('chevron-right')}</button>`;
 const groups=q.shopIds.map(shopId=>`<section class="commerce-card checkout-store"><div class="checkout-store-heading"><h3>${shops[shopId].name}</h3><span>共${q.items.filter(i=>i.product.shop===shopId).reduce((n,i)=>n+i.quantity,0)}件</span></div>${q.items.filter(i=>i.product.shop===shopId).map(({product:p,quantity:n,subtotal})=>`<article class="checkout-line">${art(p)}<div><strong>${p.name}</strong><small>标准装</small><span>¥${exact(p.price)} × ${n}</span></div><b>¥${exact(subtotal)}</b></article>`).join('')}${checkoutMode==='single'?`<div class="checkout-quantity-row"><span>购买数量</span><div class="quantity"><button data-quantity="-1" aria-label="减少购买数量" ${orderQuantity===1?'disabled':''}>${icon('minus')}</button><strong>${orderQuantity}</strong><button data-quantity="1" aria-label="增加购买数量" ${orderQuantity===9?'disabled':''}>${icon('plus')}</button></div></div>`:''}</section>`).join('');
 const info=`<section class="commerce-card checkout-services"><div><span>配送</span><strong>普通快递 · 免运费</strong></div><button data-checkout-edit="invoice"><span>发票</span><strong>${esc(prefs.invoice)}</strong>${icon('chevron-right')}</button><button data-checkout-edit="note"><span>备注</span><strong>${esc(prefs.note||'选填')}</strong>${icon('chevron-right')}</button></section>`;
 const pricing=`<section class="commerce-card checkout-pricing"><h3>价格明细</h3><div><span>商品金额</span><strong>¥${exact(q.subtotal)}</strong></div><button data-checkout-coupons><span>${q.discountKind==='benefit'?'专享优惠':'优惠券'}</span><strong class="${q.discount?'has-discount':''}">${q.discount?`−¥${exact(q.discount)}`:discountChoice==='none'?'不使用优惠':q.reason==='minimum'?'未达门槛':'暂无可用'}</strong><span class="coupon-change">更换${icon('chevron-right')}</span></button>${q.reason==='minimum'&&discountChoice!=='none'?`<div class="checkout-shortfall"><span>${icon('info')}还差¥${exact(q.minimumShortfall)}可用券</span><button data-go-topup>去凑单</button></div>`:''}<div><span>运费</span><strong>¥0.00</strong></div><p>每单限用一张券，优惠不叠加</p></section>`;
 const summary=q.discountKind==='benefit'?'已享专享价':q.coupon?(q.coupon.min?`满${q.coupon.min}减${q.coupon.value}`:`免单券抵${exact(q.discount)}元`):discountChoice==='none'?'本单不使用优惠':'已选'+q.quantity+'件商品';
 openModal('checkout',`<header class="sheet-head commerce-header"><h2 id="modalTitle">确认订单</h2><button class="detail-close" data-dismiss aria-label="关闭确认订单">${icon('x')}</button></header><div class="shop-products-scroll commerce-scroll checkout-scroll">${address}${groups}${info}${pricing}</div><footer class="commerce-dock checkout-dock"><div class="checkout-pay-summary"><div><span>实付 <strong>¥${exact(q.total)}</strong></span><small>${summary}${q.discount?' · 已优惠¥'+exact(q.discount):''}</small></div></div><button class="wide-cta" data-submit-order aria-label="提交订单，实付${exact(q.total)}元">提交订单</button></footer>`,'sheet checkout-popup commerce-sheet');
}
function goTopup(couponId){
 let from=currentModal==='checkout'?'checkout':'basket';
 if(currentModal==='coupon-picker')from=couponReturn==='checkout'?'checkout':'basket';
 if(from==='checkout'&&checkoutMode==='topup')return showTopup();
 const single=from==='checkout'&&checkoutMode==='single',singleDraft=single?{[orderProduct.id]:orderQuantity}:null;
 const options=single?{shop:orderProduct.shop,selectedOnly:false,couponId:discountChoice}:cartOptions();
 const goal=Basket.goal(single?{...state,basket:singleDraft,basketSelection:{}}:state,allProducts,todayKey(),options);
 topupContext={...options,singleDraft,singleOrigin:single?{...checkoutOrigin}:null,returnType:from,returnMode:checkoutMode,couponId:typeof couponId==='string'?couponId:goal?.coupon.id||'auto'};
 showTopup();
}
function showTopup(resetScroll=true){
 if(!topupContext)return showBasket(basketReturnShop,cartScope);
 const options=topupContext,c=Flow.availableCoupons(state,todayKey()).find(c=>c.id===options.couponId);
 if(!c){toast('优惠已更新，请重新选择');return showBasket(basketReturnShop,cartScope);}
 const sourceState=options.singleDraft?{...state,basket:options.singleDraft,basketSelection:{}}:state;
 const q=Basket.quote(sourceState,allProducts,todayKey(),options),goal=Basket.goal(sourceState,allProducts,todayKey(),options);
 const candidates=recommendationProducts(c).filter(p=>(!options.shop||p.shop===options.shop)&&Basket.applies(c,p));
 const groups=Object.entries(shops).map(([key,shop])=>{
  const products=candidates.filter(p=>p.shop===key);return products.length?`<section class="topup-store"><h3>${shop.name}</h3><div class="shop-product-list">${products.map(p=>productRow(p,{topup:true})).join('')}</div></section>`:'';
 }).join('');
 openModal('topup',`<header class="sheet-head commerce-header"><div><h2 id="modalTitle">凑单好物</h2><p>${c.min?`满${c.min}减${c.value}`:`最高抵${c.value}元`} · 以下商品可用券</p></div><button class="detail-close" data-topup-back aria-label="返回凑单前页面">${icon('x')}</button></header><div class="shop-products-scroll commerce-scroll topup-scroll">${groups||'<div class="basket-empty"><p>暂时没有适用商品</p></div>'}</div><footer class="commerce-dock">${couponProgress(q,options,'',sourceState)}<div class="topup-settle-row"><div><strong>已选 <em>¥${exact(q.subtotal)}</em></strong><small>${q.discount?`用券后¥${exact(q.total)} · 已选${q.quantity}件`:`已选${q.quantity}件${goal?.shortfall?' · 继续添加适用商品':''}`}</small></div><button class="basket-checkout-cta" data-topup-checkout ${!q.valid?'disabled':''}>结算</button></div></footer>`,'sheet commerce-sheet topup-sheet');
}
function settleTopup(){
 if(topupContext.singleDraft){checkoutMode='topup';discountChoice=topupContext.couponId;checkoutOrigin={type:'topup'};return renderCheckout();}
 cartScope=topupContext.shop||null;discountChoice=topupContext.couponId;
 showBasketCheckout(basketReturnShop,cartScope,true);
}
function showCouponPicker(origin){
 couponReturn=origin;const lines=origin==='checkout'?currentOrderQuote().items:Basket.scopedItems(state,allProducts,cartOptions());
 const options=Flow.availableCoupons(state,todayKey());
 const rows=options.map(c=>{
  const q=Flow.quoteItems(state,lines,todayKey(),{couponId:c.id}),usable=q.coupon?.id===c.id;
  return `<div class="coupon-choice">${ticket(c,{showStatus:false,showDetails:true})}<div><span>${usable?'本单可抵¥'+exact(q.discount):q.reason==='minimum'?'还差¥'+exact(q.minimumShortfall)+'可用':'当前商品暂不适用'}</span>${usable?`<button data-coupon-choose="${c.id}">使用这张券</button>`:q.reason==='minimum'?`<button data-topup-coupon="${c.id}">去凑单</button>`:''}</div></div>`;
 }).join('');
 openModal('coupon-picker',`<header class="sheet-head commerce-header"><h2 id="modalTitle">优惠券</h2><button class="detail-close" data-coupon-back aria-label="返回${origin==='checkout'?'确认订单':'购物车'}">${icon('x')}</button></header><div class="shop-products-scroll commerce-scroll coupon-picker-scroll"><p class="coupon-picker-intro">每单限用一张，按适用商品金额计算门槛。</p><button class="discount-option" data-coupon-choose="auto">自动选择最优优惠${icon(discountChoice==='auto'?'circle-check':'circle')}</button>${rows||'<div class="basket-empty"><p>暂时没有可用优惠券</p></div>'}<button class="discount-option" data-coupon-choose="none">本单不使用优惠${icon(discountChoice==='none'?'circle-check':'circle')}</button></div>`,'sheet commerce-sheet coupon-picker-sheet');
}
function showCouponDetails(id){
 const c=Flow.couponList(state).find(c=>c.id===id);if(!c)return;activeCouponId=id;
 const products=recommendationProducts(c).filter(p=>Basket.applies(c,p));
 const storeIds=c.shopIds||[...new Set(products.map(p=>p.shop))];
 const groups=storeIds.filter(key=>shops[key]).map(key=>{
  const names=[...new Set(products.filter(p=>p.shop===key).map(p=>p.name))];
  return `<details class="coupon-scope-store"><summary>${shops[key].name}<span>${names.length}款适用商品</span></summary><ul>${names.map(name=>`<li>${esc(name)}</li>`).join('')||'<li>暂无在售商品</li>'}</ul></details>`;
 }).join('');
 openModal('coupon-detail',`<header class="sheet-head commerce-header"><h2 id="modalTitle">优惠券详情</h2><button class="detail-close" data-dismiss aria-label="返回上一个弹窗">${icon('x')}</button></header><div class="shop-products-scroll commerce-scroll coupon-detail-scroll">${ticket(c,{showStatus:false})}<section class="commerce-card coupon-terms"><h3>使用说明</h3><dl><div><dt>使用门槛</dt><dd>${c.type==='free-order'?`最高抵扣¥${exact(c.value)}`:`适用商品满¥${exact(c.min)}减¥${exact(c.value)}`}</dd></div><div><dt>有效期至</dt><dd>${formatExpiry(c)}</dd></div><div><dt>适用范围</dt><dd>${c.scope==='street'?'全街适用商品':storeIds.filter(key=>shops[key]).map(key=>shops[key].name).join('、')}</dd></div><div><dt>使用规则</dt><dd>每单限用一张，仅适用商品计入门槛，不与专享价叠加。</dd></div></dl></section><section class="commerce-card coupon-eligible"><h3>适用店铺与商品</h3><p>展开店铺可查看商品。券的范围以领取时为准。</p>${groups}</section></div>`,'sheet commerce-sheet coupon-detail-sheet');
}
function chooseCoupon(id){
 if(couponReturn==='basket'){if(!restoreModalView('basket',{discountChoice:id})){discountChoice=id;showBasket(basketReturnShop,cartScope,true);}return;}
 if(!restoreModalView('checkout',{discountChoice:id})){discountChoice=id;renderCheckout();}
}
function editCheckout(field){
 editingCheckoutField=field;const prefs=checkoutPreferences();
 const fields=field==='address'?`<label>收货人<input name="name" value="${esc(prefs.name)}" maxlength="20" autocomplete="name" aria-describedby="checkout-name-error" required><span class="field-error" id="checkout-name-error"></span></label><label>手机号码<input name="phone" value="${esc(prefs.phone)}" inputmode="tel" maxlength="11" autocomplete="tel" aria-describedby="checkout-phone-error" required><span class="field-error" id="checkout-phone-error"></span></label><label>详细地址<textarea name="address" maxlength="120" autocomplete="street-address" aria-describedby="checkout-address-error" required>${esc(prefs.address)}</textarea><span class="field-error" id="checkout-address-error"></span></label>`:field==='invoice'?`<label>发票类型<select name="invoice"><option${prefs.invoice==='不开票'?' selected':''}>不开票</option><option${prefs.invoice==='个人电子发票'?' selected':''}>个人电子发票</option></select></label>`:`<label>订单备注<textarea name="note" maxlength="100" placeholder="有需要交代的事，可以写在这里">${esc(prefs.note)}</textarea></label>`;
 openModal('checkout-edit',`<header class="sheet-head commerce-header"><h2 id="modalTitle">${{address:'收货地址',invoice:'发票信息',note:'订单备注'}[field]}</h2><button class="detail-close" data-edit-back aria-label="返回确认订单">${icon('x')}</button></header><div class="shop-products-scroll commerce-scroll"><form id="checkoutForm" class="checkout-form">${fields}<p id="checkoutFormError" class="sr-only" role="alert"></p></form></div><footer class="commerce-dock edit-dock"><button class="wide-cta" data-save-checkout>保存</button></footer>`,'sheet commerce-sheet checkout-edit-sheet edit-'+field);
}
function saveCheckoutDetails(){
 const form=$('#checkoutForm'),values=Object.fromEntries(new FormData(form)),prefs={...checkoutPreferences()};
 for(const [key,value] of Object.entries(values))prefs[key]=value.trim();
 if(editingCheckoutField==='address'){
  const errors={name:prefs.name?'':'请填写收货人姓名',phone:/^1\d{10}$/.test(prefs.phone)?'':'请填写11位手机号码',address:prefs.address?'':'请填写详细收货地址'};
  for(const [name,error] of Object.entries(errors)){
   const input=form.querySelector(`[name="${name}"]`);input.setAttribute('aria-invalid',String(!!error));
   $('#checkout-'+name+'-error').textContent=error;
  }
  const first=Object.keys(errors).find(name=>errors[name]);
  $('#checkoutFormError').textContent=first?errors[first]:'';
  if(first){form.querySelector(`[name="${first}"]`).focus();return;}
 }
 state={...state,checkoutPreferences:prefs};save();if(!restoreModalView('checkout'))renderCheckout();
}
function dismissModal(){
 if(!restoreModalView())closeModal();
}
function submitOrder(){
 if(orderSubmitting||!orderProduct||currentModal!=='checkout')return;
 orderSubmitting=true;const button=$('[data-submit-order]');button.disabled=true;
 const p=orderProduct,id=crypto.randomUUID(),before=state.orders.length;
 state=checkoutMode==='basket'?Basket.checkout(state,allProducts,todayKey(),id,cartOptions()):checkoutMode==='topup'?Basket.placeDraftOrder(state,allProducts,topupContext.singleDraft,todayKey(),id,{couponId:discountChoice}):Flow.placeItemsOrder(state,[{product:p,quantity:orderQuantity}],todayKey(),id,{couponId:discountChoice});
 if(state.orders.length===before){orderSubmitting=false;showBasket(basketReturnShop);toast('购物车已更新，请重新确认');return;}
 const order={...state.orders.at(-1),delivery:{...checkoutPreferences()}};state={...state,orders:[...state.orders.slice(0,-1),order]};state=DailyStreet.record(state,p.shop,'view',todayKey());save();renderHome();
 const next=nextReward(),multiple=order.items?.length>1;
 const productArt=multiple?`<div class="order-basket-art">${order.items.slice(0,3).map(i=>art(allProducts.find(p=>p.id===i.product))).join('')}</div><p class="order-basket-count">${shops[order.shop]?.name||'奇遇街'} · 共${order.quantity}件</p>`:`<div class="order-success-art">${art(p)}</div>`;
 openModal('order-success',`${closeButton()}<h2 id="modalTitle"><span class="celebrate-rays">✦</span> 下单成功 <span class="celebrate-rays">✦</span></h2><p class="success-sub">好物已选好，今天也逛得开心</p>${productArt}<p class="success-paid">实付 <span>¥${money(order.amount)}</span></p><div class="used-coupon-chip">${order.discount?`${order.discountKind==='benefit'?'已享专享价，优惠':'本单用券减'}${order.discount}元`:'本单按商品原价结算'}</div><p class="tomorrow-reward">${icon('gift')}${state.drawn?'本轮已完成，明天开启新一轮好礼':state.visits===7?'抽奖机会已解锁，快去我的奖励领取':`明天再来，${next.value?`领<b>${next.value}元券</b>`:`解锁<b>${next.name}</b>`}`}</p><button class="wide-cta" data-close>继续逛街</button>`,'center order-success-popup',{reset:true});
}
function toggleFavorite(key){state.favorites=state.favorites.includes(key)?state.favorites.filter(x=>x!==key):[...state.favorites,key];state=DailyStreet.record(state,key,state.favorites.includes(key)?'favorite':'unfavorite',todayKey());save();renderHome();if(currentModal==='shop')showShop(key);else showFavorites();toast(state.favorites.includes(key)?'已收藏这家店':'已取消收藏');}
function showFavorites(){openModal('favorites',`${closeButton()}<h2 id="modalTitle">收藏的小店</h2><p class="intro">喜欢的小店，下次接着逛。</p>${state.favorites.length?state.favorites.filter(key=>shops[key]).map(key=>`<div class="daily-row"><div class="reward-desc"><strong>${shops[key].name}</strong><small>${shops[key].desc}</small></div><button class="product-buy" style="width:65px" data-favorite-go="${key}">去逛逛</button></div>`).join(''):'<div class="empty-state">还没有收藏的小店<br><br>进店后点爱心，就能留在这里。</div>'}`);}
function showDaily(){
 const claimed=Flow.todayClaimed(state,todayKey());
 const rows=dailyRewards.map((baseReward,index)=>{
  let reward=state.unlockedRewards?.find(e=>e.cycleId===state.cycleId&&e.day===index+1)?.reward||baseReward;
  if(index===state.visits-1)reward=currentReward();
  else if(index>=state.visits){let forecast=state;for(let n=1;n<=index-state.visits+1;n++)forecast=Flow.enter(forecast,Flow.addDays(todayKey(),n));reward=Flow.dailyReward(forecast);}
  const current=index===state.visits-1;
  const status=index<state.visits-1?'已解锁':current?(claimed?'已领取':'今日可领'):index===state.visits?'明日解锁':'待解锁';
  return `<li class="reward-day-card ${current?'is-today':''}" ${current?'aria-current="step"':''}><span class="reward-day-icon" aria-hidden="true">${icon(reward.icon)}</span><div class="reward-day-copy"><span class="reward-day-label">第 ${index+1} 天</span><strong>${reward.name}</strong><small>${reward.condition}</small></div><span class="reward-day-status ${current?'is-current':''}">${status}</span></li>`;
 }).join('');
 openModal('daily',`<header class="daily-sheet-header">${closeButton()}<h2 id="modalTitle">每天来逛，都有新奖励</h2><p>已累计到访 <b>${state.visits}</b> / 7 天<span>同一天只记一次</span></p></header><div class="daily-rewards-scroll" role="region" aria-label="七天每日奖励，可上下滚动" tabindex="0"><ol class="daily-reward-list">${rows}</ol></div><footer class="daily-sheet-footer"><button class="wide-cta" data-open-offer>${claimed?'查看我的奖励':state.visits===7?'去抽奖':'领取今日好礼'}</button><p class="simulation-note">累计进度保留 · 每日上午10点更新</p></footer>`,'sheet daily-sheet');
 if(state.visits>3){const scroll=$('.daily-rewards-scroll'),today=$('.reward-day-card.is-today');scroll.scrollTop=Math.max(0,today.offsetTop-scroll.offsetTop-14);}
}
function walletRewardCard(entry){
 const status={available:'待使用',pending:'待领取',expired:'已过期',used:'已使用',future:'未生效',unavailable:'已领取'}[entry.status];
 if(entry.coupon)return ticket(entry.coupon,{usable:entry.status==='available',count:entry.count||1,showDetails:true});
 const r=entry.benefit||entry.unlock.reward;
 if(r.value)return ticket({...r,date:entry.date,expiresOn:entry.date},{offered:entry.status==='pending',claimable:entry.status==='pending',statusText:status});
 const available=entry.status==='available',pending=entry.status==='pending',inactive=!available&&!pending;
 const condition=r.type==='exclusive'?'精选商品每件立减1元，不与券叠加':r.type==='preview'?'提前查看明日精选好物':r.condition;
 const validity=r.type==='lottery'?'每轮一次 · 抽中好礼有效7个活动日':entry.date?`有效期至 ${formatExpiry({date:entry.date,expiresOn:r.expiresOn||entry.date})}`:'历史解锁 · 已超过使用期';
 const action=available?`<button class="coupon-use-action" data-open-benefit="${r.id}">去查看</button>`:pending?`<button class="coupon-use-action" ${r.type==='lottery'?'data-open-lottery':'data-claim-in-rewards'}>${r.type==='lottery'?'去抽奖':'去领取'}</button>`:['used','expired'].includes(entry.status)?`<button class="coupon-use-action" disabled>${status}</button>`:`<b class="wallet-reward-status">${status}</b>`;
 return `<article class="wallet-benefit ${inactive?'is-unavailable':''}" aria-label="${r.name}，${status}"><span class="wallet-benefit-icon" aria-hidden="true">${icon(r.icon||(r.type==='exclusive'?'tag':'eye'))}</span><div class="wallet-benefit-copy"><strong>${r.name}</strong><p>${condition}</p><small>${validity}</small></div>${action}</article>`;
}
function showRewards(tab='available',filter='all'){
 rewardsTab=tab==='history'?'history':'available';rewardsHistoryFilter=['used','expired'].includes(filter)?filter:'all';
 const groups=RewardGroups.partition(Flow.rewardWallet(state,todayKey())),historical=rewardsTab==='history';
 const rows=historical?groups.history.filter(e=>rewardsHistoryFilter==='all'||e.status===rewardsHistoryFilter):groups.available;
 const tabs=`<nav class="wallet-tabs" role="tablist" aria-label="奖励分类"><button id="walletAvailableTab" role="tab" data-rewards-tab="available" aria-selected="${!historical}" aria-controls="walletPanel" tabindex="${historical?-1:0}">待使用 <span>${groups.availableCount}</span></button><button id="walletHistoryTab" role="tab" data-rewards-tab="history" aria-selected="${historical}" aria-controls="walletPanel" tabindex="${historical?0:-1}">历史奖励 <span>${groups.historyCount}</span></button></nav>`;
 const filters=historical?`<div class="wallet-filters" aria-label="历史奖励筛选">${[['all','全部'],['used','已使用'],['expired','已过期']].map(([key,label])=>`<button data-history-filter="${key}" aria-pressed="${rewardsHistoryFilter===key}">${label}</button>`).join('')}</div>`:'';
 const pending=groups.pending.map(e=>{const r=e.unlock.reward;return `<div class="wallet-pending"><span class="wallet-pending-icon">${icon(r.icon||'gift')}</span><div><strong>${r.type==='lottery'?'第7天抽奖已解锁':'今日好礼待领取'}</strong><small>${r.type==='lottery'?'转出今天的小惊喜':r.name+' · 当活动日内有效'}</small></div><button ${r.type==='lottery'?'data-open-lottery':'data-claim-in-rewards'}>${r.type==='lottery'?'去抽奖':'去领取'}</button></div>`;}).join('');
 const empty=historical?(rewardsHistoryFilter==='used'?'还没有使用过的奖励':rewardsHistoryFilter==='expired'?'还没有过期的奖励':'还没有历史奖励'):(groups.pending.length?'领取今日好礼后，就能在这里使用':'暂时没有待使用的奖励，明天来逛还有新好礼');
 const cards=rows.length?`<div class="reward-coupon-list" role="list" aria-label="${historical?'历史':'待使用'}奖励">${rows.map(e=>`<div role="listitem" data-reward-status="${e.status}">${walletRewardCard(e)}</div>`).join('')}</div>`:`<div class="wallet-empty">${icon(historical?'history':'gift')}<p>${empty}</p></div>`;
 const records=historical&&rewardsHistoryFilter==='all'?`${(state.prizeHistory||[]).length?`<div class="rule-block prize-history"><h3>抽奖记录</h3>${state.prizeHistory.slice().reverse().map(p=>`<div><strong>${p.name}</strong><p>${p.date.replaceAll('-','.')} · 已发放${p.couponIds.length}张券</p></div>`).join('')}</div>`:''}<div class="rule-block wallet-order-record"><h3>已完成订单 ${state.orders.length} 笔</h3><p>日常券和权益当活动日有效；抽奖券有效7个活动日。</p></div>`:'';
 openModal('rewards',`<header class="rewards-sheet-header">${closeButton()}<h2 id="modalTitle">我的奖励</h2><p>${historical?'每一份已解锁的好礼，都为你保留。':'快到期的排在前面，结算自动选最优优惠。'}</p>${tabs}</header><div class="rewards-sheet-scroll" role="region" aria-label="我的奖励列表，可上下滚动" tabindex="0">${pending}${filters}<div id="walletPanel" role="tabpanel" aria-labelledby="${historical?'walletHistoryTab':'walletAvailableTab'}">${cards}${records}</div></div>`,'sheet rewards-sheet wallet-tabbed-sheet');
}
function showBenefit(id){
 const b=Flow.activeBenefits(state,todayKey()).find(x=>x.id===id);
 if(!b){toast('这项权益已过期，看看今天的新奖励吧');showRewards();return;}
 activeBenefitId=id;const preview=b.type==='preview',products=b.productIds.map(id=>allProducts.find(p=>p.id===id)).filter(Boolean),shop=shops[products[0]?.shop];
 if(!preview&&products[0])browsingShop=products[0].shop;
 const rows=preview?products.map(p=>`<article class="preview-product">${art(p)}<div><strong>${p.name}</strong><span>¥${money(p.price)}</span><small>明日10点，进店挑选</small></div></article>`).join(''):products.map(p=>productRow(p,{exclusive:true})).join('');
 openModal('benefit',`<header class="sheet-head"><div><h2 id="modalTitle">${preview?'明日精选预览':'今日专享好物'}</h2><p>${shop?.name||'精选小店'} · ${preview?'明日发现店，提前看一看':'精选商品每件立减1元'}</p></div><div class="sheet-actions"><button data-dismiss aria-label="关闭权益详情">${icon('x')}</button></div></header><div class="shop-products-scroll"><div class="benefit-note">${icon(preview?'eye':'tag')}${preview?'明日10点上街 · 今天先看看':'本活动日内有效 · 不与券叠加'}</div><div class="shop-product-list">${rows}</div></div>${preview?'<footer class="daily-sheet-footer"><button class="secondary-cta" data-show-rewards>返回我的奖励</button></footer>':basketFooter(browsingShop)}`,'sheet shop-sheet benefit-sheet');
}
function browseCoupon(id){
 const c=Flow.couponList(state).find(c=>c.id===id);
 if(!c||Flow.couponStatus(c,todayKey())!=='available'){showRewards();toast('这张券当前不可使用');return;}
 const candidates=recommendationProducts(c).filter(p=>(!c.shopIds||c.shopIds.includes(p.shop))&&(!c.productIds||c.productIds.includes(p.id))&&(c.scope==='street'||p.eligible));
 const p=candidates.find(p=>p.price>=c.min)||candidates.find(p=>p.price*9>=c.min);
 if(!p){toast('暂无适用商品，稍后再来看看');return;}
 showShop(p.shop);toast(c.min?`满${c.min}减${c.value}，可增加件数凑单`:`最高抵${c.value}元，结算自动用券`);
}
function showRules(){openModal('rules',`${closeButton()}<h2 id="modalTitle">奇遇街怎么玩</h2><p class="intro">逛喜欢的小店，领每日好礼。</p><div class="rule-block"><h3>每天上午10点，开启新一天</h3><p>以北京时间10:00到次日09:59:59为一个活动日。首次进街自动签到，同一活动日只记一次，奖励手动领取。</p></div><div class="rule-block"><h3>断签不清累计进度</h3><p>回来继续累计，普通券从3元基础档重新开始；第3、5天特权及第7天抽奖按累计到访天数解锁。</p></div><div class="rule-block"><h3>选好商品，结算时用优惠</h3><p>日常券限指定商品，当活动日有效；抽奖券全街可用，有效7个活动日。每单限一张券，专享价不与券叠加，系统自动选更优惠的方案，订单成功后核销。</p></div><div class="rule-block"><h3>7天抽奖，每轮一次</h3><p>10元券包85%（2张满39减5）；20元券包12%（2张满59减10）；50元免单券2.5%；100元免单券0.5%。免单券按实付前金额抵扣，最高不超过券面额。抽奖后下个活动日开启新一轮，未过期的旧券和历史记录保留。</p></div>`);}
function syncActivity(){
 const day=todayKey();if(day===renderedActivityDay)return false;
 renderedActivityDay=day;modalHistory=[];modalView=null;state=Flow.enter(state,day);save();renderHome();
 if(currentModal==='checkout'){if(checkoutMode==='topup')renderCheckout();else if(checkoutMode==='basket')showBasketCheckout(basketReturnShop,cartScope,true);else showCheckout(orderProduct.id,orderQuantity,true);}
 else if(currentModal==='detail')showDetail(detailProductId);
 else if(currentModal==='shop')showShop(browsingShop);
 else if(currentModal==='basket')showBasket(basketReturnShop,cartScope);
 else if(currentModal==='topup')showTopup();
 else if(currentModal==='coupon-picker')showCouponPicker(couponReturn);
 else if(currentModal==='checkout-edit')renderCheckout();
 else if(currentModal==='rewards')showRewards(rewardsTab,rewardsHistoryFilter);
 else if(currentModal==='benefit')showRewards();
 else if(currentModal)showRewards();
 else maybeOfferReward();
 toast('新活动日开始了，优惠已更新，请重新确认');return true;
}
function showLottery(){
 state=Flow.markPrompted(state,todayKey());save();if(state.drawn)return showLotteryResult();
 openModal('lottery',`<header class="lottery-popup-header">${closeButton()}<p class="eyebrow">累计到访 7 天 · 专属好礼</p><h2 id="modalTitle">转出今天的小惊喜</h2></header><div class="lottery-popup-scroll" role="region" aria-label="抽奖转盘与奖品概率" tabindex="0"><p class="wheel-intro"><strong>100%中奖</strong><span>最高可得100元免单券</span></p><div class="lottery-wheel" id="lotteryWheel">${Array.from({length:12},(_,i)=>`<i class="wheel-light" style="--light-angle:${i*30}deg" aria-hidden="true"></i>`).join('')}<div class="wheel-rotor" id="lotteryRotor">${Flow.prizes.map((p,i)=>`<div class="wheel-prize" style="--prize-angle:${i*90}deg" data-prize-value="${p.value}"><strong>${p.value}<small>元</small></strong><span>${p.value<50?'券包':'免单券'}</span><em>${p.chance}% 概率</em></div>`).join('')}</div><span class="wheel-pointer" aria-hidden="true"></span><button class="wheel-draw" data-draw aria-label="立即抽奖"><strong>立即</strong><span>抽奖</span></button></div><p class="wheel-prize-note">券包含2张券 · 抽中奖励有效7个活动日</p></div><footer class="lottery-popup-footer"><p class="wheel-status" id="lotteryStatus" role="status">点击转盘中心，抽取今日好礼</p><p class="popup-footnote">每轮一次</p></footer>`,'center lottery-popup lottery-wheel-popup');
}
function drawPrize(){
 if(state.visits<7||state.drawn||currentModal!=='lottery')return;
 const button=$('[data-draw]'),rotor=$('#lotteryRotor'),wheel=$('#lotteryWheel');
 button.disabled=true;button.innerHTML='<span>开奖中</span>';button.setAttribute('aria-label','好礼正在揭晓');
 const rolls=crypto.getRandomValues(new Uint32Array(2));
 state=Flow.draw(state,rolls[0]/4294967296,todayKey());save();renderHome();
 const index=Flow.prizes.findIndex(p=>p.value===state.prize.value),duration=reduced?100:2800;
 const rotation=window.QiyuLotteryWheel.rotationForPrize(index,Flow.prizes.length,rolls[1]/4294967296);
 wheel.classList.add('is-spinning');wheel.setAttribute('aria-busy','true');
 rotor.dataset.targetPrize=state.prize.name;rotor.style.setProperty('--spin-duration',duration+'ms');rotor.style.setProperty('--wheel-rotation',rotation+'deg');
 $('#lotteryStatus').textContent='转盘转动中，好礼即将揭晓…';
 setTimeout(()=>{
  if(currentModal!=='lottery'||!rotor.isConnected)return;
  wheel.classList.remove('is-spinning');wheel.setAttribute('aria-busy','false');
  button.innerHTML='<span>已中奖</span>';button.setAttribute('aria-label','已抽中'+state.prize.name);
  $('#lotteryStatus').textContent='恭喜，抽中'+state.prize.name+'！';
  setTimeout(()=>{if(currentModal==='lottery'&&rotor.isConnected)showLotteryResult();},reduced?100:400);
 },duration);
}
function showLotteryResult(){
 const prize=state.prize,groups=RewardGroups.group(Flow.rewardWallet(state,todayKey()).filter(e=>e.coupon&&prize?.couponIds?.includes(e.id)));
 openModal('lottery-result',`<header class="lottery-popup-header">${closeButton()}<p class="eyebrow">第7天专属好礼</p><h2 id="modalTitle">恭喜，抽中好礼！</h2></header><div class="lottery-popup-scroll" role="region" aria-label="已获得的抽奖奖励" tabindex="0"><div class="lottery-result-reward"><p class="lottery-result-summary">${prize?.name||'抽奖好礼'}<span>已放入「我的奖励」</span></p></div><div class="lottery-result-tickets">${groups.map(e=>ticket(e.coupon,{count:e.count,showStatus:false})).join('')}</div></div><footer class="lottery-popup-footer"><button class="wide-cta" data-show-rewards>查看并使用奖励</button><button class="quiet-action" data-close>继续逛街</button></footer>`,'center lottery-result-popup',{replace:currentModal==='lottery'});
}

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
    guide.innerHTML=`<span class="guide-copy">${key===primaryShop()?'一起逛小店～':'到啦，进店逛逛～'}</span>`;
    guide.setAttribute('aria-label',key===primaryShop()?'跟我去'+shops[secondaryShop()].name:'跟我进入'+shops[key].name);
  }else guide.innerHTML=key===primaryShop()?`点店铺，<br>我带你去`:ShopViews?`进店看看`:`到啦，逛${shops[key].short}`;
}
function positionGuide(key){
  if(!characterEnabled)return;
  const pose=restPose(key),size=window.QiyuIP3D?.perspectiveFor(pose)??pose.size,guide=$('#guide');
  if(riggedEnabled){
    const scale=size*pose.camera.scale;
    guide.dataset.side=key===primaryShop()?'right':'left';
    if(key===primaryShop()){
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
  $('#walkStatus').textContent=key===primaryShop()?'返回街道':'正在前往'+shops[key].name;
  const finish=ShopViews.transition(()=>{
    ShopViews.setView(key);focusShop=key;drawWalker(restPose(key));window.QiyuIP3D?.stand([0,1],{immediate:true});
    moving=false;$('#app').classList.remove('moving');$('#app').dataset.walking='false';$('#app').dataset.navigation='idle';
    $('#enter').disabled=false;$('#switch').disabled=false;renderHome();
    refreshGuide(key);
    positionGuide(key);$('#guide').hidden=false;icons();
    $('#walkStatus').textContent=key===primaryShop()?'已返回街道总览':'已到'+shops[key].name+'门口，点击进店';motionFinish=null;
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
  const path=Walking.route(ShopViews?ShopViews.positionFor(focusShop):focusShop,ShopViews?ShopViews.positionFor(key):key);
  const finalise=()=>{if(!moving)return;moving=false;cancelAnimationFrame(walkingFrame);ShopViews?.setView(key);drawWalker(restPose(key));focusShop=key;if(ShopViews)window.QiyuIP3D?.stand([-.25,1]);$('#app').classList.remove('moving');$('#app').dataset.walking='false';$('#skipWalk').hidden=true;$('#enter').disabled=false;$('#switch').disabled=false;$('#walkTrail').innerHTML='';renderHome();refreshGuide(key);positionGuide(key);$('#guide').hidden=false;icons();$('#walkStatus').textContent='已到达'+target.name+'，点击进店';motionFinish=null;};
  motionFinish=finalise;
  if(reduced){finalise();return;}
  const duration=riggedEnabled?Walking.durationFor(path)*1000:ShopViews?2600:Walking.durationFor?Walking.durationFor(path)*1000:Math.max(1900,path.length/72*1000),started=performance.now();
  function frame(now){
    if(!moving)return;
    const progress=Math.min(1,(now-started)/duration),distance=Walking.distanceForProgress?Walking.distanceForProgress(path,progress):path.length*(progress*progress*(3-2*progress));
    const pose=Walking.pose(path,distance);
    if(riggedEnabled)pose.gait=Walking.gaitForProgress(path,progress);
    drawWalker(pose,true);
    if(progress>=1)finalise();else walkingFrame=requestAnimationFrame(frame);
  }
  walkingFrame=requestAnimationFrame(frame);
}
function useCoupon(){closeModal();toast('奖励已收好，选家小店逛逛吧');}
document.addEventListener('submit',event=>{if(event.target.id==='checkoutForm'){event.preventDefault();saveCheckoutDetails();}});
document.addEventListener('click',event=>{if(event.target.closest('button')&&syncActivity()){event.preventDefault();event.stopImmediatePropagation();}},true);
document.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button||button.disabled)return;
 if(button.hasAttribute('data-dismiss'))return dismissModal();
 if(button.hasAttribute('data-close'))return closeModal();
 if(button.id==='storeDoorHit')return showShop(focusShop);
 if(button.dataset.shop)return goTo(button.dataset.shop);
 if(button.dataset.detail)return showDetail(button.dataset.detail);
 if(button.dataset.buy)return showCheckout(button.dataset.buy);
 if(button.dataset.addBasket)return changeBasket(button.dataset.addBasket,1);
 if(button.dataset.basketDelta)return changeBasket(button.dataset.product,Number(button.dataset.basketDelta));
 if(button.dataset.removeBasket)return changeBasket(button.dataset.removeBasket,-basketQuantity(button.dataset.removeBasket));
 if(button.dataset.openBasket)return showBasket(button.dataset.openBasket);
 if(button.dataset.basketCheckout)return showBasketCheckout(button.dataset.basketCheckout,cartScope);
 if(button.dataset.shopCheckout)return showBasketCheckout(button.dataset.shopCheckout,button.dataset.shopCheckout);
 if(button.dataset.openLocalBasket)return showBasket(button.dataset.openLocalBasket,button.dataset.openLocalBasket);
 if(button.dataset.cartSelect)return toggleCartSelection(button.dataset.cartSelect);
 if(button.dataset.topupSelect){state=Basket.setSelected(state,[button.dataset.topupSelect],true,allProducts);save();return preserveCommerceScroll(()=>showTopup(false));}
 if(button.hasAttribute('data-topup-back'))return dismissModal();
 if(button.hasAttribute('data-topup-checkout'))return settleTopup();
 if(button.hasAttribute('data-cart-coupons'))return showCouponPicker('basket');
 if(button.hasAttribute('data-checkout-coupons'))return showCouponPicker('checkout');
 if(button.hasAttribute('data-coupon-back'))return dismissModal();
 if(button.dataset.couponDetail)return showCouponDetails(button.dataset.couponDetail);
 if(button.dataset.couponChoose)return chooseCoupon(button.dataset.couponChoose);
 if(button.dataset.topupCoupon)return goTopup(button.dataset.topupCoupon);
 if(button.dataset.checkoutEdit)return editCheckout(button.dataset.checkoutEdit);
 if(button.hasAttribute('data-edit-back'))return dismissModal();
 if(button.hasAttribute('data-save-checkout'))return saveCheckoutDetails();
 if(button.hasAttribute('data-go-topup'))return goTopup();
 if(button.dataset.rewardsTab)return showRewards(button.dataset.rewardsTab);
 if(button.dataset.historyFilter)return showRewards('history',button.dataset.historyFilter);
 if(button.hasAttribute('data-use-coupon'))return useCoupon();
 if(button.dataset.openBenefit)return showBenefit(button.dataset.openBenefit);
 if(button.dataset.browseCoupon)return browseCoupon(button.dataset.browseCoupon);
 if(button.hasAttribute('data-shop-coupons'))return showRewards();
 if(button.hasAttribute('data-claim-in-shop'))return claim({inShop:true});
 if(button.hasAttribute('data-claim-in-rewards'))return claim({inRewards:true});
 if(button.hasAttribute('data-open-offer'))return showOffer();
 if(button.hasAttribute('data-claim-today'))return claim();
 if(button.hasAttribute('data-open-lottery'))return showLottery();
 if(button.hasAttribute('data-draw'))return drawPrize();
 if(button.hasAttribute('data-show-rewards'))return restoreModalView('rewards')||showRewards();
 if(button.dataset.toggleFavorite)return toggleFavorite(button.dataset.toggleFavorite);
 if(button.dataset.favoriteGo)return showShop(button.dataset.favoriteGo);
 if(button.dataset.returnShop)return restoreModalView('shop:'+button.dataset.returnShop)||showShop(button.dataset.returnShop);
 if(button.dataset.quantity)return showCheckout(orderProduct.id,orderQuantity+Number(button.dataset.quantity),true);
 if(button.hasAttribute('data-submit-order'))return submitOrder();
});
$('#homeScroll').addEventListener('scroll',()=>$('#app').classList.toggle('home-scrolled',$('#homeScroll').scrollTop>24),{passive:true});
$('#claim').addEventListener('click',showOffer);$('#enter').addEventListener('click',()=>showShop(focusShop));
$('#switch').addEventListener('click',()=>goTo(focusShop===primaryShop()?secondaryShop():primaryShop()));
$('#back').addEventListener('click',()=>{if(currentModal)dismissModal();else if(moving)motionFinish?.();else if(focusShop!==primaryShop())goTo(primaryShop());else if(ShopViews&&params.get('from')==='mall')location.href='mall.html';else toast('已经在为你推荐的主推店');});
$('#guide').addEventListener('click',()=>focusShop===primaryShop()?goTo(secondaryShop()):showShop(focusShop));
$('#skipWalk').addEventListener('click',()=>motionFinish?.());
$('#daily').addEventListener('click',showDaily);$('#rules').addEventListener('click',showRules);$('#rewards').addEventListener('click',()=>showRewards());$('#favorites').addEventListener('click',showFavorites);
$('#overlay').addEventListener('click',event=>{if(event.target===$('#overlay'))dismissModal();});
$('#modal').addEventListener('animationend',event=>{if(event.target===$('#modal'))$('#modal').dataset.settled='true';});
document.addEventListener('keydown',event=>{
 if(event.target.closest?.('.wallet-tabs')&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const tab=event.key==='Home'?'available':event.key==='End'?'history':rewardsTab==='available'?'history':'available';showRewards(tab);$(`[data-rewards-tab="${tab}"]`).focus({preventScroll:true});return;}
 if(event.key==='Escape'){if(currentModal)dismissModal();else motionFinish?.();}
 if(event.key===' '&&event.target.matches?.('[role=checkbox]')){event.preventDefault();event.target.click();return;}
 if(event.key==='Tab'&&currentModal){const nodes=modalFocusables();const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&(document.activeElement===first||document.activeElement===$('#modal'))){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
});
$('#motionToggle').checked=reduced;$('#motionToggle').addEventListener('change',event=>{reduced=event.target.checked;$('#app').classList.toggle('reduce-motion',reduced);if(reduced)motionFinish?.();});
$('#replay').addEventListener('click',()=>{if(moving)return;closeModal();goTo(focusShop===primaryShop()?secondaryShop():primaryShop());});
$('#reset').addEventListener('click',()=>{motionFinish?.();closeModal();state=fresh();streetSignature='';renderHome();window.QiyuIP3D?.greet();$('#guide').hidden=false;if(demo==='wallet')showRewards();else maybeOfferReward();});
$('#previewDay')?.addEventListener('change',event=>{const scenarios=['first','second','third','fourth','fifth','sixth','seventh'],url=new URL(location.href);url.searchParams.set('demo',event.target.value);url.searchParams.set('demoDay',Flow.addDays(state.streetStartedOn||todayKey(),scenarios.indexOf(event.target.value)));url.searchParams.set('v','unified-colors-2');location.href=url.href;});
$('#previewProfile')?.addEventListener('change',event=>{const url=new URL(location.href);url.searchParams.set('shopProfile',event.target.value);url.searchParams.set('v','unified-colors-2');location.href=url.href;});
window.addEventListener('resize',resize);resize();$('#app').classList.toggle('reduce-motion',reduced);renderHome();
setTimeout(demo==='wallet'?showRewards:maybeOfferReward,450);

window.addEventListener('pageshow',syncActivity);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncActivity();});
setInterval(syncActivity,15000);
