'use strict';
const {BY_ID,CATALOG,BOOKS,roomAt,pathBetween,fresh}=require('./world');
const clone=structuredClone;
const Calendar=require('./calendar');
function cap(n){return Math.min(100,Math.max(0,n))}
function receipt(state,events,kind,description,extra={}){
 const record={id:`EV-${String(state.nextReceipt++).padStart(7,'0')}`,tick:state.tick,day:state.day,minute:state.minute,calendarDate:Calendar.dateForDay(state.day),kind,description,room:roomAt(state.position.x,state.position.y),position:clone(state.position),goalId:state.goal?.id||null,details:extra};events.push(record);state.lastAction=description;return record;
}
function pending(state,type){return state.orders.some(o=>o.type===type&&!o.collected)}
function choose(state,evidence={}){
 const n=state.needs,p=state.stock,g=state.garden,options=[];
 const add=(kind,score,reason,target,detail={})=>options.push({kind,score,reason,target,detail,memoryIds:(evidence[kind]||[]).slice(-3)});
 // Survival pressure is defined over needs, not the text generated about those needs.
 if(n.thirst>=38)add('drink',(n.thirst>=87?350:50)+n.thirst*1.5,`Thirst pressure ${n.thirst.toFixed(1)}`,'sink');
 if(n.hunger>=44&&p.meals>0)add('eat',(n.hunger>=91?345:46)+n.hunger*1.5,`Hunger ${n.hunger.toFixed(1)}; prepared food exists`,'table');
 if(n.hunger>=40&&p.meals<1&&(p.vegetables>0||p.milk>0&&p.grain>0))add('cook',(n.hunger>=91?340:47)+n.hunger*1.4,`No prepared meal; ingredients stored in pantry`,'stove');
 if(n.fatigue>=66)add('sleep',40+n.fatigue,`Physical fatigue ${n.fatigue.toFixed(1)}`,'bed');
 if(n.bladder>=66)add('toilet',46+n.bladder,`Water closet needed`,'toilet');
 if(state.carried)add('put_away',230,'A package or harvest must be placed in the appropriate store','pantry');
 if(!state.carried&&state.orders.some(o=>o.arrived&&!o.collected))add('collect',195,'A real delivery is at the letter box','mailbox');
 if(g.vegetables.stage==='ripe')add('harvest_vegetables',130+n.hunger*.25,'Ripe vegetables in the garden','vegetable_plot');
 if(g.tea.stage==='ripe')add('harvest_tea',76,'Ripe leaves on the tea bushes','tea_plot');
 if(g.vegetables.stage==='growing'&&!g.vegetables.watered)add('water_vegetables',80,'Vegetable soil needs watering','vegetable_plot');
 if(g.tea.stage==='growing'&&!g.tea.watered)add('water_tea',65,'Tea bushes need watering','tea_plot');
 if(g.vegetables.stage==='empty'&&p.vegetable_seeds>0)add('plant_vegetables',67,'Unused vegetable seeds and a free plot','vegetable_plot');
 if(g.tea.stage==='empty'&&p.tea_seeds>0)add('plant_tea',72,'Unused tea seeds and a free plot','tea_plot');
 if(p.meals<2&&p.vegetables<2&&!pending(state,'groceries')&&state.wallet>=CATALOG.groceries.price)add('order_groceries',86+n.hunger*.32,'Fresh food stock below reserve; order groceries','catalog');
 if(p.vegetable_seeds<1&&p.tea_seeds<1&&!pending(state,'seeds')&&state.wallet>=CATALOG.seeds.price)add('order_seeds',40,'Garden seeds nearly exhausted','catalog');
 if(p.tea_leaves<1&&g.tea.stage==='empty'&&!pending(state,'tea')&&state.wallet>=CATALOG.tea.price)add('order_tea',23,'Tea merchant can replace finite dried leaves','catalog');
 if(p.reagents<1&&p.spares<1&&!pending(state,'science')&&state.wallet>=CATALOG.science.price)add('order_science',42,'Workbench supplies exhausted','catalog');
 if(state.researchReports>0)add('post_report',55,'An independently completed experiment has a report to mail','mailbox');
 if(p.tea_cups>0&&n.thirst>=16)add('sip_tea',75+n.thirst*.8,'Freshly brewed tea','table');
 if(p.tea_leaves>0&&p.tea_cups<1&&n.thirst>=12&&n.thirst<48)add('brew_tea',54+n.thirst,'Dried tea leaves and a working kitchen range','stove');
 if(state.booksRead.length<BOOKS.length&&n.boredom>=34)add('read',36+n.boredom*.9,'Curiosity and an unread book on the shelf','bookshelf');
 if((evidence.__pendingJournal||[]).length>0&&(state.journal?.lastWriteTick??-999)<state.tick-20)add('write_journal',43+n.boredom*.18,'There is a source-backed event I have yet to enter in my notebook','journal',{sourceEventId:evidence.__pendingJournal[0]});
 if((evidence.__historyCount||0)>0&&(state.journal?.lastReadTick??-999)<state.tick-70&&n.boredom>=35)add('read_journal',35+n.boredom*.45,'My earlier notes may help order my thoughts','journal');
 if((state.lab.damage>0&&p.spares>0)||(p.reagents>0))add('work',46+n.boredom*.35,'A verifiable physical repair or experiment is possible','bench');
 if(n.boredom>50&&state.booksRead.length===BOOKS.length)add('reflect',20+n.boredom*.2,'Unhurried thought about verified experiences','table');
 if(!options.length)add('wait',1,'No currently workable intention','bed');
 // Source-attributed preferences remain modest; no fabricated memory can change physics.
 for(const opt of options){if(opt.memoryIds.length)opt.score+=Math.min(2,opt.memoryIds.length*.5);if(state.recentKinds.slice(-2).includes(opt.kind))opt.score-=4;if(opt.score<120)opt.score+=stableChoiceNoise(state.seed,state.tick,opt.kind)}
 options.sort((a,b)=>b.score-a.score||a.kind.localeCompare(b.kind));return options;
}
function stableChoiceNoise(seed,tick,kind){
 let n=((seed|0)^(Math.imul(tick+1,0x9e3779b1)))>>>0;for(const ch of kind)n=(Math.imul(n^ch.charCodeAt(0),16777619))>>>0;n^=n>>>16;n=Math.imul(n,0x7feb352d);n^=n>>>15;return ((n>>>0)/4294967296-.5)*22;
}
function stockChange(state,delta){for(const [key,value] of Object.entries(delta)){if(!(key in state.stock))throw Error(`Unknown stock ${key}`);const after=state.stock[key]+value;if(after<0)throw Error(`Insufficient ${key}`);state.stock[key]=after}}
function action(state,events,goal){const n=state.needs,p=state.stock,lab=state.lab,garden=state.garden,kind=goal.kind;
 switch(kind){
 case 'drink':n.thirst=cap(n.thirst-78);n.bladder=cap(n.bladder+9);state.counters.drinks++;receipt(state,events,'drink_sink','Drank potable water from the kitchen water point',{source:'scenario water service; historical mechanism unverified',finiteBottledStock:false});break;
 case 'eat':stockChange(state,{meals:-1});n.hunger=cap(n.hunger-75);state.counters.meals++;receipt(state,events,'eat_meal','Sat at the table and ate a cooked meal',{mealsRemaining:p.meals});break;
 case 'cook':{let recipe;if(p.vegetables>=1){stockChange(state,{vegetables:-1});recipe='vegetable soup'}else if(p.milk>=1&&p.grain>=1){stockChange(state,{milk:-1,grain:-1});recipe='milk porridge'}else throw Error('No recipe available');stockChange(state,{meals:1});receipt(state,events,'cook',`Cooked ${recipe} on the kitchen range`,{recipe,mealsPrepared:1});break}
 case 'sip_tea':stockChange(state,{tea_cups:-1});n.thirst=cap(n.thirst-43);n.bladder=cap(n.bladder+8);state.counters.tea++;receipt(state,events,'drink_tea','Drank a freshly brewed cup of tea',{source:'prepared tea'});break;
 case 'brew_tea':stockChange(state,{tea_leaves:-1,tea_cups:1});receipt(state,events,'brew_tea','Boiled tap water and steeped dried tea leaves',{teaLeavesRemaining:p.tea_leaves});break;
 case 'sleep':n.fatigue=cap(n.fatigue-76);receipt(state,events,'sleep','Slept on the iron bedstead',{energyRestored:true});break;
 case 'toilet':n.bladder=cap(n.bladder-90);receipt(state,events,'toilet','Used the plumbed water closet');break;
 case 'write_journal':{const sourceEventId=goal.detail?.sourceEventId;if(!sourceEventId)throw Error('No grounded journal entry to write');state.journal??={lastReadTick:-999,lastWriteTick:-999,folioCursor:0,entries:0};state.journal.lastWriteTick=state.tick;state.journal.entries++;receipt(state,events,'journal_write','Wrote a page in the private scientific diary',{sourceEventId});break;}
 case 'read_journal':{state.journal??={lastReadTick:-999,lastWriteTick:-999,folioCursor:0,entries:0};const folioIndex=state.journal.folioCursor;state.journal.folioCursor++;state.journal.lastReadTick=state.tick;n.boredom=cap(n.boredom-21);receipt(state,events,'journal_read','Consulted an older passage in the private notebook',{folioIndex});break;}
 case 'read':{const title=BOOKS.find(x=>!state.booksRead.includes(x));if(!title){receipt(state,events,'read_unavailable','No unread books remain');break;}const page=(state.bookProgress[title]||0)+1;state.bookProgress[title]=page;n.boredom=cap(n.boredom-33);receipt(state,events,'read_section',`Read section ${page} of ${title}`,{title,page});if(page>=2){state.booksRead.push(title);receipt(state,events,'book_completed',`Finished ${title}`,{title,sections:2});}break}
 case 'work':{if(!lab.lampLit){if(p.lamp_oil<1)throw Error('Lamp has no oil');stockChange(state,{lamp_oil:-1});lab.lampLit=true;receipt(state,events,'light_lamp','Lit the Laboratory oil lamp',{oilRemaining:p.lamp_oil});return false}
 if(lab.clutter>0){lab.clutter--;receipt(state,events,'clean_bench','Cleared clutter from the physical workbench',{remainingClutter:lab.clutter});return false}
 if(lab.damage>0&&p.spares>0){stockChange(state,{spares:-1});lab.damage--;lab.repairs++;state.counters.work++;receipt(state,events,'repair','Repaired the Laboratory instrument',{damageRemaining:lab.damage,sparesRemaining:p.spares});}
 else if(p.reagents>0){stockChange(state,{reagents:-1});lab.experiments++;state.counters.work++;state.researchReports++;receipt(state,events,'experiment','Completed a documented chemical observation',{experiments:lab.experiments,reportsToPost:state.researchReports});}else throw Error('No work materials remain');n.boredom=cap(n.boredom-31);n.fatigue=cap(n.fatigue+11);break}
 case 'plant_vegetables':stockChange(state,{vegetable_seeds:-1});garden.vegetables={stage:'growing',plantedTick:state.tick,watered:false};receipt(state,events,'plant','Planted vegetable seeds in garden plot',{crop:'vegetables'});break;
 case 'plant_tea':stockChange(state,{tea_seeds:-1});garden.tea={stage:'growing',plantedTick:state.tick,watered:false};receipt(state,events,'plant','Planted tea seedlings in garden plot',{crop:'tea'});break;
 case 'water_vegetables':garden.vegetables.watered=true;receipt(state,events,'water_garden','Watered the vegetable plot using tap water',{crop:'vegetables'});break;
 case 'water_tea':garden.tea.watered=true;receipt(state,events,'water_garden','Watered the tea bushes using tap water',{crop:'tea'});break;
 case 'harvest_vegetables':if(garden.vegetables.stage!=='ripe')throw Error('Vegetables not ripe');state.carried={vegetables:3};garden.vegetables={stage:'empty',plantedTick:null,watered:false};state.counters.harvests++;receipt(state,events,'harvest','Harvested three homegrown vegetables',{carried:{vegetables:3}});break;
 case 'harvest_tea':if(garden.tea.stage!=='ripe')throw Error('Tea not ripe');state.carried={tea_leaves:3};garden.tea={stage:'empty',plantedTick:null,watered:false};state.counters.harvests++;receipt(state,events,'harvest','Picked and dried three portions of tea leaves',{carried:{tea_leaves:3}});break;
 case 'put_away':if(!state.carried)throw Error('Nothing to put away');stockChange(state,state.carried);receipt(state,events,'put_away','Put a physical parcel or harvest into pantry storage',{goods:state.carried});state.carried=null;break;
 case 'order_groceries':case 'order_seeds':case 'order_science':case 'order_tea':{const type=kind.replace('order_','');const catalog=CATALOG[type];if(!catalog||state.wallet<catalog.price)throw Error('Catalog order is not affordable');state.wallet-=catalog.price;const order={id:`O-${String(state.nextOrder++).padStart(4,'0')}`,type,source:catalog.source,paid:catalog.price,goods:clone(catalog.goods),placedTick:state.tick,dueTick:state.tick+catalog.delay,arrived:false,collected:false};state.orders.push(order);state.counters.orders++;receipt(state,events,'catalog_order',`Posted paid order to ${catalog.source}`,{orderId:order.id,price:catalog.price,goods:order.goods,etaTick:order.dueTick});break}
 case 'collect':{const order=state.orders.find(o=>o.arrived&&!o.collected);if(!order||state.carried)throw Error('No collectable parcel or hands full');order.collected=true;state.counters.deliveries++;if(order.type==='research_payment'){state.wallet+=order.payment;receipt(state,events,'collect_payment','Collected a scientific society payment by post',{orderId:order.id,amount:order.payment,wallet:state.wallet});}
 else {state.carried=clone(order.goods);receipt(state,events,'collect_parcel','Collected a physical parcel from the letter box',{orderId:order.id,goods:order.goods});}break}
 case 'post_report':{if(state.researchReports<=0)throw Error('No verified research report');state.researchReports--;const due=state.tick+22;const order={id:`O-${String(state.nextOrder++).padStart(4,'0')}`,type:'research_payment',source:'scientific society',placedTick:state.tick,dueTick:due,arrived:false,collected:false,payment:25};state.orders.push(order);receipt(state,events,'report_posted','Mailed an earned research report to the scientific society',{report:true,paymentPending:25,etaTick:due});break}
 case 'reflect':n.boredom=cap(n.boredom-22);receipt(state,events,'reflection','Reflected on verified experiences without changing world facts');break;
 case 'wait':receipt(state,events,'wait','Waited for something worth doing');break;
 default:throw Error(`Unknown action ${kind}`);
 }
 return true;
}
function goalStillPossible(state,goal){
 const k=goal.kind,p=state.stock,g=state.garden;
 if(k==='collect')return !state.carried&&state.orders.some(o=>o.arrived&&!o.collected);
 if(k==='put_away')return Boolean(state.carried);
 if(k==='eat')return p.meals>0;
 if(k==='cook')return p.vegetables>0||(p.milk>0&&p.grain>0);
 if(k==='brew_tea')return p.tea_leaves>0;
 if(k==='sip_tea')return p.tea_cups>0;
 if(k==='harvest_vegetables')return g.vegetables.stage==='ripe';
 if(k==='harvest_tea')return g.tea.stage==='ripe';
 if(k==='plant_vegetables')return g.vegetables.stage==='empty'&&p.vegetable_seeds>0;
 if(k==='plant_tea')return g.tea.stage==='empty'&&p.tea_seeds>0;
 if(k==='water_vegetables')return g.vegetables.stage==='growing'&&!g.vegetables.watered;
 if(k==='water_tea')return g.tea.stage==='growing'&&!g.tea.watered;
 if(k==='post_report')return state.researchReports>0;
 if(k.startsWith('order_')){const c=CATALOG[k.slice(6)];return Boolean(c)&&state.wallet>=c.price}
 if(k==='read')return state.booksRead.length<BOOKS.length;
 if(k==='write_journal')return Boolean(goal.detail?.sourceEventId);
 if(k==='read_journal')return true;
 if(k==='work')return (state.lab.damage>0&&p.spares>0)||p.reagents>0;
 return true;
}
function step(state,evidence={}){
 if(!state.alive)return {state,events:[],decision:null};
 const s=clone(state),events=[];
 s.tick++;s.minute+=10;if(s.minute>=1440){s.minute-=1440;s.day++}
 for(const key of ['hunger','thirst','fatigue','bladder','boredom']){const rate={hunger:.9,thirst:1.17,fatigue:.78,bladder:1.04,boredom:.56}[key];s.needs[key]=cap(s.needs[key]+rate)}
 for(const [crop,plot] of Object.entries(s.garden)){if(plot.stage==='growing'&&plot.watered&&s.tick-plot.plantedTick>=(crop==='tea'?84:50)){plot.stage='ripe';receipt(s,events,'crop_ripened',`The ${crop} plot is ready to harvest`,{crop})}}
 for(const o of s.orders){if(!o.arrived&&s.tick>=o.dueTick){o.arrived=true;receipt(s,events,'delivery_arrived',o.type==='research_payment'?'The scientific society sent a payment':'A parcel arrived at the physical letter box',{orderId:o.id,type:o.type,source:o.source})}}
 const past=clone(s.goal);const crisis=s.needs.thirst>=87?'drink':s.needs.hunger>=91?(s.stock.meals>0?'eat':'cook'):null;
 if(s.goal&&crisis&&s.goal.kind!==crisis){if(!s.suspendedGoal){s.suspendedGoal=s.goal;receipt(s,events,'goal_suspended',`Suspended ${s.goal.kind} for an urgent bodily need`,{suspendedGoalId:s.goal.id})}s.goal=null}
 if(!s.goal&&s.suspendedGoal&&s.needs.thirst<60&&s.needs.hunger<74){s.goal=s.suspendedGoal;s.suspendedGoal=null;receipt(s,events,'goal_resumed',`Resumed unfinished intention ${s.goal.kind}`,{goalId:s.goal.id})}
 if(s.goal&&!goalStillPossible(s,s.goal)){receipt(s,events,'goal_obsolete',`The original opportunity for ${s.goal.kind} is no longer physically available`,{oldGoalId:s.goal.id});s.goal=null}
 let candidates=null;if(!s.goal){candidates=choose(s,evidence);const c=candidates[0];s.goal={id:`G-${String(s.nextGoal++).padStart(5,'0')}`,kind:c.kind,target:c.target,detail:c.detail||{},selectedTick:s.tick,phase:'active',reason:c.reason,memoryIds:c.memoryIds,score:c.score};s.lastDecision={goalId:s.goal.id,kind:c.kind,score:c.score,reason:c.reason,memoryIds:c.memoryIds,options:candidates.slice(0,8).map(x=>({kind:x.kind,score:x.score}))};receipt(s,events,'goal_selected',`Intended to ${c.kind}: ${c.reason}`,{score:c.score,memoryIds:c.memoryIds});}
 const target=BY_ID[s.goal.target];if(!target)throw Error(`Target missing ${s.goal.target}`);
 const route=pathBetween(s.position,target);if(route===null)throw Error(`Unreachable object ${target.id}`);
 if(route.length){const prior=clone(s.position);s.position=route[0];receipt(s,events,'walk',`Walked toward ${target.name}`,{from:prior,to:s.position,objectId:target.id,remainingRoute:route.length-1});s.goal.phase='travelling';}
 else {const completed=action(s,events,s.goal);if(completed){s.completed.push({id:s.goal.id,kind:s.goal.kind,completedTick:s.tick});s.recentKinds.push(s.goal.kind);s.recentKinds=s.recentKinds.slice(-8);s.goal=null}}
 if(s.needs.hunger>=100)s.health-=5;if(s.needs.thirst>=100)s.health-=13;if(s.health<=0){s.alive=false;s.health=0;s.deathCause=s.needs.thirst>=100?'dehydration':'starvation';receipt(s,events,'death',`Septimus died from ${s.deathCause}`,{irreversible:true});s.goal=null;}

 return {state:s,events,decision:s.lastDecision,pastGoalId:past?.id||null};
}
module.exports={step,choose,receipt};
