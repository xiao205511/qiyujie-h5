(function(root,factory){
 const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.QiyuCatalog=api;
})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const product=(shop,id,name,price,art,sheet='paper')=>({id:`${shop}-${id}`,shop,name,price,art,sheet,eligible:true,other:sheet==='other'});
 const paper=[
  product('paper',0,'维达手帕纸24包',9.9,0),product('paper',1,'漫花悬挂抽纸',9.9,1),product('paper',2,'桔子姑娘大包抽纸',12.9,2),
  product('paper',3,'洁柔油画软抽',13.9,3),product('paper',9,'植护悬挂式洗脸巾',14.9,6,'daily-a'),product('paper',4,'心相印花语抽纸',19.9,4),
  product('paper',5,'心相印茶语联名抽纸',21.9,5),product('paper',6,'漫花无芯卷纸48卷',22.9,6),product('paper',7,'备家洁20大包抽纸',24.9,7),product('paper',8,'清风挂式抽纸10提',29.9,8)
 ];
 const snack=[
  product('snack',3,'辣条大礼包20包',8.9,10,'daily-c'),product('snack',0,'焦糖瓜子500g',9.9,0,'other'),product('snack',4,'蛋黄酥6枚',12.9,11,'daily-c'),
  product('snack',5,'小包装坚果混合7日装',14.9,12,'daily-c'),product('snack',6,'酸辣粉3桶装',15.9,13,'daily-c'),product('snack',7,'螺蛳粉3包装',19.9,14,'daily-c'),
  product('snack',8,'每日坚果30包',29.9,15,'daily-c'),product('snack',9,'牛肉干250g',29.9,16,'daily-c'),product('snack',10,'坚果礼盒8罐装',39.9,17,'daily-c'),product('snack',11,'糕点礼盒12枚',42.9,18,'daily-c')
 ];
 const kitchen=[
  product('kitchen',2,'加厚垃圾袋50只',9.9,5,'other'),product('kitchen',3,'柠檬洗洁精500g',9.9,19,'daily-c'),product('kitchen',4,'钢丝球与抹布套装',9.9,20,'daily-c'),
  product('kitchen',0,'厨房清洁湿巾80抽',12.9,3,'other'),product('kitchen',5,'洗碗布10条',13.9,21,'daily-c'),product('kitchen',6,'洁厕灵2瓶装',15.9,22,'daily-c'),
  product('kitchen',7,'一次性手套200只',19.9,23,'daily-c'),product('kitchen',8,'油污净3瓶组合',29.9,24,'daily-c'),product('kitchen',9,'厨房收纳置物架',35.9,25,'daily-c'),product('kitchen',10,'洗洁精1kg与500g组合',39.9,26,'daily-c')
 ];
 const from=(key,sheet,offset,rows)=>rows.map(([name,price],i)=>product(key,i,name,price,offset+i,sheet));
 const face=from('face','daily-a',0,[['德佑小包湿巾20抽',9.9],['植护三面牙刷2支',9.9],['女士专用刮毛刀',11.9],['德佑75度酒精湿巾40抽',12.9],['植护秘觉卫生巾',14.9],['漫花小包湿巾20包',15.9],['植护悬挂式洗脸巾',16.9],['德佑加厚洗脸巾',19.9],['德佑绵柔巾200抽',24.9],['毛巾浴巾2条装',29.9]]);
 const trend=from('trend','daily-a',10,[['透明防摔手机壳',9.9],['发夹12件套',9.9],['桌面收纳盒3件套',12.9],['卡通钥匙扣2个',13.9],['折叠手机支架',14.9],['蘑菇小夜灯',19.9],['混色发圈30根',19.9],['便携折叠化妆镜',22.9],['便携蓝牙小音箱',35.9],['惊喜文具盲盒',39.9]]);
 const makeup=from('makeup','daily-b',0,[['唯资双头眼线胶笔',9.9],['化妆棉200片',9.9],['芭贝拉遮瑕液',11.9],['珂拉琪唇釉小样',14.9],['美妆蛋3个装',15.9],['AKF定妆散粉',29.9],['唯资三色遮瑕膏',32.9],['滋色定妆膏14g',35.9],['柏瑞美定妆喷雾',39.9],['兰芝草莓味唇膜',59.9]]);
 const skin=from('skin','daily-b',10,[['雪玲妃金盏花爽肤水',29.9],['保湿喷雾150ml',32.9],['补水面膜10片',35.9],['谷雨奶皮面膜',39.9],['RNW美白精华35粒',39.9],['高姿防晒喷雾',45.9],['雪花秀睡眠面膜3支',45.9],['阿芙油敷膜',49.9],['高姿防晒霜',49.9],['欧莱雅紫熨斗眼霜',69.9]]);
 const winter=from('winter','daily-c',0,[['李宁运动袜3双',29.9],['猫力踩屎感棉拖鞋',29.9],['触屏保暖手套',32.9],['猫力羽绒防水棉鞋',49.9],['SW弯刀暖绒裤',59.9],['老爷车直筒休闲裤',79.9],['牛奶绒床垫软垫',79.9],['啄木鸟加绒加厚开衫',89.9],['俞兆林水洗四件套',89.9],['雅鹿三合一夹克',129.9]]);
 // Active shelves follow selection PRD V1.0 + V1.1 (§4, §8.4–8.6).
 // Preserve original variants below for saved carts and issued benefits.
 const originalProducts=[...paper,...snack,...kitchen,...face,...trend,...makeup,...skin,...winter];
 const extra=(shop,id,name,price,art)=>product(shop,id,name,price,art,'prd-v1');
 const select=(rows,ids,changes={})=>ids.map(id=>({...rows.find(p=>p.id.endsWith('-'+id)),...(changes[id]||{})}));
 const laundry=[
  extra('laundry',0,'植护增香液小袋装',9.9,0),extra('laundry',1,'植护婴儿洗衣皂',11.9,1),extra('laundry',2,'植护防串染吸色片50片',12.9,2),
  extra('laundry',3,'植护隔色洗衣纸',12.9,3),extra('laundry',4,'植护大容量增香液',16.9,4),extra('laundry',5,'植护衣物柔顺剂',19.9,5),
  extra('laundry',6,'植护内衣除菌清洗液',19.9,6),extra('laundry',7,'植护绿恐龙洗衣皂液1.5kg',22.9,7),extra('laundry',8,'植护香水洗衣液',25.9,8)
 ];
 const baby=[
  extra('baby',0,'德佑小包婴儿湿巾',9.9,9),extra('baby',1,'植护婴儿洗衣皂',11.9,1),extra('baby',2,'德佑湿厕纸单片',12.9,10),
  extra('baby',3,'漫花婴儿手口湿巾20包',15.9,11),extra('baby',4,'德佑婴儿纯水湿巾70抽',15.9,12),extra('baby',5,'植护绿恐龙皂液1.5kg',22.9,7),
  extra('baby',6,'德佑婴幼儿隔尿垫',29.9,13),extra('baby',7,'德佑沁氧隔尿垫',32.9,14),extra('baby',8,'袋鼠妈妈补水擦脸霜',39.9,15)
 ];
 // No accessory SKU table was supplied: retain three existing accessory examples.
 const accessories=[product('accessories',0,'发夹12件套',9.9,11,'daily-a'),product('accessories',1,'卡通钥匙扣2个',13.9,13,'daily-a'),product('accessories',2,'混色发圈30根',19.9,16,'daily-a')];
 const additionalHitAreas=[{"right":"polygon(11.24% 83.97%,12.44% 35.89%,12.68% 34.45%,12.92% 33.73%,13.64% 32.30%,14.11% 31.58%,16.27% 29.43%,34.45% 12.20%,35.41% 11.48%,37.32% 10.77%,67.46% 2.15%,72.97% 2.15%,79.19% 10.05%,79.67% 10.77%,89.47% 31.58%,90.43% 34.45%,95.22% 86.84%,95.22% 89.00%,94.98% 90.43%,94.26% 91.15%,91.87% 91.87%,86.84% 92.58%,64.35% 95.45%,51.67% 96.89%,44.50% 97.61%,36.60% 97.61%,32.54% 96.89%,30.14% 96.17%,27.99% 95.45%,20.33% 92.58%,15.07% 90.43%,13.40% 89.71%,12.20% 89.00%,11.48% 88.28%,11.24% 87.56%)","left":"polygon(6.70% 86.84%,12.20% 34.45%,12.44% 33.01%,12.68% 32.30%,13.40% 30.86%,13.88% 30.14%,27.99% 12.20%,28.95% 11.48%,30.62% 10.77%,32.78% 10.05%,58.37% 2.15%,64.59% 2.15%,86.84% 30.86%,87.80% 32.30%,88.52% 34.45%,88.76% 35.89%,89.71% 83.25%,89.71% 85.41%,89.47% 86.84%,89.00% 87.56%,88.04% 88.28%,85.41% 89.71%,83.97% 90.43%,76.56% 94.02%,73.44% 95.45%,71.77% 96.17%,69.62% 96.89%,66.27% 97.61%,57.66% 97.61%,38.28% 95.45%,13.88% 92.58%,8.85% 91.87%,7.42% 91.15%,6.94% 90.43%,6.70% 89.00%)","front":"polygon(7.89% 83.25%,11.24% 35.17%,11.48% 33.73%,11.96% 32.30%,12.68% 30.86%,14.11% 28.71%,25.84% 11.48%,26.56% 10.77%,27.75% 10.05%,59.33% 2.15%,61.24% 2.15%,62.68% 2.87%,69.62% 10.77%,71.05% 12.92%,83.25% 31.58%,84.21% 34.45%,84.45% 35.89%,87.08% 84.69%,87.08% 93.30%,86.84% 94.74%,86.36% 95.45%,85.65% 96.17%,83.49% 96.89%,11.48% 96.89%,9.33% 96.17%,8.37% 95.45%,7.89% 94.02%)"},{"right":"polygon(11.24% 81.10%,12.20% 34.45%,12.44% 33.01%,12.92% 31.58%,14.35% 29.43%,15.55% 27.99%,42.34% 6.46%,43.30% 5.74%,51.44% 1.44%,54.31% 1.44%,76.08% 11.48%,77.27% 12.20%,78.23% 12.92%,79.67% 14.35%,80.62% 15.79%,88.76% 29.43%,89.71% 31.58%,89.95% 33.01%,94.74% 83.97%,94.74% 87.56%,94.50% 88.28%,93.78% 89.00%,91.87% 89.71%,87.32% 90.43%,82.54% 91.15%,52.87% 95.45%,47.37% 96.17%,41.15% 96.89%,37.08% 96.89%,32.54% 96.17%,30.38% 95.45%,28.47% 94.74%,20.10% 91.15%,13.64% 88.28%,12.20% 87.56%,11.48% 86.84%,11.24% 86.12%)","left":"polygon(5.26% 86.12%,10.53% 33.01%,11.24% 30.86%,11.96% 29.43%,12.44% 28.71%,28.23% 5.74%,37.56% 0.72%,39.47% 0.72%,67.22% 12.20%,68.18% 12.92%,83.73% 27.27%,85.17% 28.71%,86.60% 30.86%,87.56% 33.73%,88.04% 80.38%,88.04% 84.69%,87.56% 86.12%,86.84% 86.84%,78.95% 91.15%,71.77% 94.74%,70.10% 95.45%,68.18% 96.17%,62.68% 96.89%,58.85% 96.89%,46.17% 95.45%,17.94% 91.87%,12.92% 91.15%,8.37% 90.43%,6.46% 89.71%,5.74% 89.00%,5.26% 87.56%)","front":"polygon(7.18% 89.00%,7.42% 81.82%,10.05% 35.89%,10.53% 33.01%,11.00% 31.58%,11.72% 30.14%,12.68% 28.71%,30.38% 6.46%,38.52% 1.44%,41.39% 1.44%,66.03% 12.20%,67.22% 12.92%,68.18% 13.64%,80.38% 27.27%,81.58% 28.71%,83.01% 30.86%,83.73% 32.30%,84.21% 34.45%,86.84% 82.54%,87.08% 89.71%,87.08% 92.58%,86.60% 94.02%,85.89% 94.74%,84.21% 95.45%,10.05% 95.45%,8.37% 94.74%,7.66% 94.02%,7.42% 93.30%,7.18% 91.87%)"},{"right":"polygon(11.24% 81.82%,11.96% 30.14%,12.20% 28.71%,12.92% 27.27%,14.35% 25.12%,15.07% 24.40%,16.75% 22.97%,33.73% 9.33%,52.39% 2.15%,55.74% 2.15%,72.25% 6.46%,77.75% 8.61%,81.58% 12.20%,90.67% 27.27%,91.39% 29.43%,96.41% 83.25%,96.41% 86.12%,95.93% 87.56%,94.74% 88.28%,91.87% 89.00%,78.95% 91.15%,51.44% 95.45%,46.17% 96.17%,33.49% 96.17%,30.86% 95.45%,27.51% 94.02%,24.40% 92.58%,16.75% 89.00%,12.44% 86.84%,11.72% 86.12%,11.24% 84.69%)","left":"polygon(5.02% 83.25%,9.81% 29.43%,10.53% 27.27%,11.72% 25.12%,22.25% 8.61%,22.73% 7.89%,23.44% 7.18%,24.88% 6.46%,41.39% 2.15%,46.17% 2.15%,62.20% 7.18%,66.99% 9.33%,67.94% 10.05%,83.25% 22.97%,86.12% 25.84%,86.60% 26.56%,87.32% 27.99%,87.80% 30.86%,88.28% 80.38%,88.28% 83.97%,87.80% 85.41%,86.84% 86.12%,83.25% 88.28%,79.43% 90.43%,76.79% 91.87%,72.73% 94.02%,71.29% 94.74%,69.62% 95.45%,65.79% 96.17%,59.81% 96.17%,53.35% 95.45%,43.06% 94.02%,27.75% 91.87%,12.68% 89.71%,8.37% 89.00%,5.98% 88.28%,5.50% 87.56%,5.02% 86.12%)","front":"polygon(6.46% 88.28%,6.70% 82.54%,8.85% 31.58%,9.81% 28.71%,10.53% 27.27%,11.96% 25.12%,22.73% 9.33%,23.92% 8.61%,42.82% 2.87%,46.89% 2.87%,64.35% 7.89%,69.14% 9.33%,70.33% 10.05%,82.78% 25.12%,84.21% 27.27%,84.93% 28.71%,85.89% 31.58%,87.80% 88.28%,87.80% 91.87%,87.56% 92.58%,87.08% 93.30%,86.12% 94.02%,83.25% 94.74%,11.00% 94.74%,8.37% 94.02%,7.18% 93.30%,6.70% 92.58%,6.46% 91.15%)"}];
 const newArt=row=>({url:'assets/shops-prd-v1.png',columns:3,rows:3,row,hitAreas:additionalHitAreas[row]});
 const shops={
  paper:{name:'纸巾补货铺',short:'纸巾铺',desc:'家里常用的，顺手补齐。',art:0,products:paper},
  snack:{name:'零食小铺',short:'零食铺',desc:'给今天，添一点好滋味。',art:1,products:snack},
  kitchen:{name:'厨房帮手铺',short:'厨房铺',desc:'实用小帮手，厨房更顺手。',art:2,products:kitchen},
  face:{name:'洁面个护',short:'个护店',desc:'每天的小清爽，从这里开始。',art:3,products:face},
  laundry:{name:'衣物洗护',short:'洗护店',desc:'衣物洗干净，留一点好闻的香。',artSheet:newArt(0),products:laundry},
  baby:{name:'宝宝和妈妈',short:'母婴店',desc:'温柔照顾，陪伴每一天。',candidate:true,artSheet:newArt(1),products:baby},
  accessories:{name:'饰品小铺',short:'饰品铺',desc:'小小点缀，留住好心情。',candidate:true,artSheet:newArt(2),products:accessories},
  trend:{name:'潮流小铺',short:'潮流铺',desc:'之前看过的好物，继续为你保留。',art:4,archived:true,products:trend},
  makeup:{name:'美妆小铺',short:'美妆铺',desc:'简单打扮，也有好气色。',art:5,products:makeup},
  skin:{name:'护肤防晒铺',short:'护肤铺',desc:'好好照顾自己，每天都算数。',art:6,products:skin},
  winter:{name:'暖暖过冬铺',short:'过冬铺',desc:'把暖意带回家，安心过个冬。',art:7,products:winter}
 };
 shops.paper.products=select(paper,[0,1,2,3,4,5,6,7,8],{1:{price:13.9},2:{price:15.9},3:{price:16.9}});
 shops.snack.products=[...select(snack,[3,0,4,7,8,9,10],{3:{price:9.9},0:{price:12.9},4:{price:14.9}}),product('snack',12,'酸辣粉整箱6桶',35.9,13,'daily-c'),...select(snack,[11])];
 shops.kitchen.products=[product('kitchen',11,'加厚垃圾袋100只',9.9,5,'other'),product('kitchen',12,'柠檬去油洗洁精1kg',10.9,0,'dishsoap-kg'),...select(kitchen,[4,0,6,5,7,8,9],{5:{price:16.9}})];
 shops.face.products=select(face,[0,1,2,3,4,5,6,7,8]);
 shops.makeup.products=[...select(makeup,[0,2,5,6,7],{0:{price:19.9},2:{price:26.9}}),extra('makeup',10,'唯资四色修容盘',36.9,16),...select(makeup,[8]),extra('makeup',11,'珂拉琪水雾唇露',39.9,17),...select(makeup,[9])];
 shops.skin.products=[...select(skin,[0,3,4,5,6,7,8,9]),extra('skin',10,'欧莱雅复颜水乳套装',89.9,18)];
 shops.winter.products=[...select(winter,[1,3,4,5,6,7,8]),extra('winter',10,'啄木鸟防风软壳裤',99.9,19),...select(winter,[9])];
 const coreShopIds=['paper','kitchen','laundry','face','snack','makeup','skin','winter'],candidateShopIds=['baby','accessories'];
 // Keep old prototype SKUs resolvable for carts and issued benefits already stored.
 const legacy=[product('snack',1,'每日坚果350g',12.9,1,'other'),product('snack',2,'山楂小零食',14.9,2,'other'),product('kitchen',1,'洗碗海绵套装',12.9,4,'other')].map(p=>({...p,legacy:true}));
 const activeProducts=Object.values(shops).flatMap(s=>s.products),activeIds=new Set(activeProducts.map(p=>p.id));
 const allProducts=[...activeProducts,...originalProducts.filter(p=>!activeIds.has(p.id)).map(p=>({...p,legacy:true})),...legacy];
 const sheets={paper:{url:'assets/products.png',columns:3,rows:3},other:{url:'assets/other-products.png',columns:3,rows:2},'daily-a':{url:'assets/products-care-trend-v1.png',columns:5,rows:4},'daily-b':{url:'assets/products-beauty-skin-v2.png',columns:5,rows:4},'daily-c':{url:'assets/products-winter-home-snack-v1.png',columns:6,rows:5}};
 sheets['dishsoap-kg']={url:'assets/product-dishsoap-1kg-v2.png',columns:1,rows:1};
 sheets['prd-v1']={url:'assets/products-prd-v1-2.png',columns:5,rows:4};
 const shelfProducts=[...coreShopIds,...candidateShopIds].flatMap(key=>shops[key].products);
 return {shops,coreShopIds,candidateShopIds,shelfProducts,allProducts,sheets};
});
