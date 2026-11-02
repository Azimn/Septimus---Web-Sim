'use strict';
const {BY_ID,CATALOG,BOOKS,roomAt,pathBetween,fresh}=require('./world');
const clone=structuredClone;
const Calendar=require('./calendar');
const Household=require('./household');
const Knowledge=require('./knowledge');
const Pantry=require('./pantry');
function cap(n){return Math.min(100,Math.max(0,n))}
function receipt(state,events,kind,description,extra={},perceived=true){
 const record={id:`EV-${String(state.nextReceipt++).padStart(7,'0')}`,tick:state.tick,day:state.day,minute:state.minute,calendarDate:Calendar.dateForDay(state.day),kind,description,perceived,room:roomAt(state.position.x,state.position.y),position:clone(state.position),goalId:state.goal?.id||null,details:extra};events.push(record);state.lastAction=description;return record;
}
function pending(state,type){return state.orders.some(o=>o.type===type&&!o.collected)}
// Only perceived surfaces and published metadata may drive lookup. No folio text here.
function consult(s){return s.consultation??={windows:[],unanswered:[],seenKinds:[],readIndices:[]}}
function surfaceTags(e){
 if(e.perceived===false)return [];
 const d=e.details||{},v=[];
 const add=(type,value)=>{if(value)v.push({type,value:String(value).toLowerCase()})};
 if(['coal_collected','catalog_order','delivery_arrived'].includes(e.kind)&&d.supplierId==='rosa_brandl')add('person','Rosa Brandl');
 if(e.kind==='coal_collected'&&d.wet||e.kind==='burn_coal'&&d.wet||e.kind==='inspect_coal'&&d.wet>0)add('object','wet coal');
 if(e.kind==='catalog_order'&&d.supplierId==='rosa_brandl'&&d.price>9)add('anomaly','coal price');
 if(e.kind==='garden_tended'||e.kind==='walk'&&d.objectId==='garden_path')add('place','garden path');
 if(e.kind==='garden_tended'||e.kind==='garden_path_seen'){add('object','nettles');add('place','garden path');}
 if(e.kind==='floor_hazard')add('anomaly','floorboards');
 if(e.kind==='inspect_fabric'&&d.subject==='floor')add('object','stair boards');
 if(e.kind==='inspect_fabric'&&d.subject==='roof')add('object','roof');
 if(e.kind==='burn_coal')add('object','stove gauge');
 return v;
}
function matchSurface(f,t){
 const field=t.type==='person'?'participants':t.type==='place'?'locations':'recall_cues';
 return (f[field]||[]).some(v=>String(v).toLowerCase().includes(t.value))||
  (t.type==='place'&&(f.recall_cues||[]).some(v=>String(v).toLowerCase().includes(t.value)));
}
function ingestConsultation(s,events,evidence){
 const c=consult(s),catalog=evidence.__folioCatalog||[];
 c.windows=c.windows.filter(x=>s.tick-x.raisedTick<96);
 c.unanswered=c.unanswered.filter(x=>s.tick-x[1]<144);
 for(const e of events){
  if(e.perceived===false)continue;
  const tags=surfaceTags(e);if(!tags.length)continue;
  for(const t of tags){
   let any=false;
   for(const f of catalog)if(matchSurface(f,t)){
    any=true;
    if(!c.windows.some(x=>x.index===f.index&&x.type===t.type&&x.value===t.value))c.windows.push({index:f.index,id:f.id,type:t.type,value:t.value,raisedTick:s.tick});
   }
   if(any&&['inspect_fabric','coal_collected','floor_hazard','garden_tended','garden_path_seen','catalog_order'].includes(e.kind)){
    const key=e.kind+':'+t.type+':'+t.value;
    if(!c.seenKinds.includes(key)){
     c.seenKinds.push(key);
     if(!c.readIndices.some(index=>catalog.some(f=>f.index===index&&matchSurface(f,t))))c.unanswered.push([t.type+':'+t.value,s.tick]);
    }
   }
  }
 }
 c.windows=c.windows.slice(-200);c.unanswered=c.unanswered.slice(-30);c.seenKinds=c.seenKinds.slice(-200);
}
function notebookChoice(s,evidence){
 const c=consult(s),count=evidence.__historyCount||0;
 if(!count||(s.journal?.lastReadTick??-999)>=s.tick-70)return null;
 const windows=c.windows.filter(x=>x.index<count&&s.tick-x.raisedTick<96).map(x=>({...x,bonus:32*(1-(s.tick-x.raisedTick)/96)}));
 const question=c.unanswered.some(x=>s.tick-x[1]<144);
 if(s.needs.boredom<30&&!windows.length&&!question)return null;
 windows.sort((a,b)=>b.bonus-a.bonus||a.index-b.index);
 const evening=s.minute>=1080&&s.minute<1380;
 const score=35+.9*s.needs.boredom+(windows[0]?.bonus||0)+(question?16:0)+(evening?16:0);
 const groups=new Map();for(const w of windows)groups.set(w.index,(groups.get(w.index)||0)+w.bonus);
 const lead=[...groups.entries()].sort((a,b)=>b[1]-a[1]||a[0]-b[0])[0];
 let index=lead?.[0];
 if(index===undefined){
  const cursor=(s.journal?.folioCursor??0)%count,read=new Set(c.readIndices);index=cursor;
  for(let i=0;i<count;i++){const x=(cursor+i)%count;if(!read.has(x)){index=x;break}}
 }
 const match=windows.find(w=>w.index===index),mechanism=match?'cue':question?'question':'chair';
 return {score,reason:mechanism==='cue'?'A perceived detail prompted notebook consultation':mechanism==='question'?'An observed detail remains unanswered':'Idle time invites examination of an old folio',
  detail:{folioIndex:index,mechanism,cueType:match?.type||null,cueValue:match?.value||null}};
}
function choose(state,evidence={}){
 const n=state.needs,p=state.stock,g=state.garden,options=[],h=Household.migrate(state);
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
 const pantry=Pantry.plan(state);
 if(pantry.eligible)add('order_staples',174+10*(pantry.reserveTriggerPortions-pantry.onHand),
  'Standing pantry practice: order seven days of cookable staples before transit buffer expires','catalog',
  {habit:'weekly_pantry_stocking',onHand:pantry.onHand,reserveTriggerPortions:pantry.reserveTriggerPortions,quote:pantry.quote,mealEquivalents:pantry.weeklyPortions});
 // Small legacy basket remains an emergency fallback when the week batch is unaffordable.
 if(pantry.onHand<=2&&!pantry.pending&&!pantry.eligible&&
    state.wallet>=Household.price(CATALOG.groceries.price,state.day,'groceries'))
  add('order_groceries',86+n.hunger*.32,'Emergency small grocery basket when week batch cannot be funded','catalog');
 if(p.vegetable_seeds<1&&p.tea_seeds<1&&!pending(state,'seeds')&&state.wallet>=CATALOG.seeds.price)add('order_seeds',40,'Garden seeds nearly exhausted','catalog');
 if(p.tea_leaves<1&&g.tea.stage==='empty'&&!pending(state,'tea')&&state.wallet>=CATALOG.tea.price)add('order_tea',23,'Tea merchant can replace finite dried leaves','catalog');
 if(p.reagents<1&&p.spares<1&&!pending(state,'science')&&state.wallet>=CATALOG.science.price)add('order_science',42,'Workbench supplies exhausted','catalog');
 // E03-002, E22-012: the purse cannot buy heat, food, and equipment independently.
 if((Household.winter(state.day)||h.weather.rain)&&h.coal.dry+h.coal.wet>0&&h.heat.fuelledUntil<=state.tick)add('stoke_hearth',Household.winter(state.day)?116:47,'The kitchen is cold; there is fuel in the coal pile','hearth');
 if(h.coal.dry+h.coal.wet<3&&!pending(state,'coal')&&state.wallet>=Household.price(CATALOG.coal.price,state.day,'coal'))add('order_coal',Household.winter(state.day)?91:27,'Fuel reserve appears low; order from Rosa Brandl','catalog');
 if(h.fabric.roof<55||h.fabric.floor<55){
  if(!pending(state,'maintenance')&&state.stock.boards<1&&state.stock.roofing<1&&state.wallet>=Household.price(CATALOG.maintenance.price,state.day,'maintenance'))add('order_maintenance',25,'Old tower needs repair materials','catalog');
 }
 if(h.fabric.roof<49&&state.stock.roofing>0)add('repair_roof',h.fabric.leaking?144:55,'Observed water stains justify roof work','roof_access');
 if(h.fabric.floor<48&&state.stock.boards>0)add('repair_floor',h.fabric.floor<18?145:59,'Weak stair boards need replacement','floorboards');
 if(state.tick%144>=30&&state.tick%144<=120&&h.garden.nettles>12)add('tend_path',41+h.garden.nettles*.40,'Nettles obscure the garden path','garden_path');
 if(!h.observed.roof||state.day-h.observed.roof.day>=5)add('inspect_roof',h.fabric.leaking?70:20,'Look for damp or damaged slate at the roof access','roof_access');
 if(!h.observed.floor||state.day-h.observed.floor.day>=5)add('inspect_floor',h.fabric.floor<30?70:20,'Check the old stair boards','floorboards');
 if(!h.observed.coal||state.day-h.observed.coal.day>=5)add('inspect_coal',Household.winter(state.day)?49:12,'Check the coal store directly','coal_pile');
 if(state.researchReports>0)add('post_report',55,'An independently completed experiment has a report to mail','mailbox');
 if(p.tea_cups>0&&n.thirst>=16)add('sip_tea',75+n.thirst*.8,'Freshly brewed tea','table');
 if(p.tea_leaves>0&&p.tea_cups<1&&n.thirst>=12&&n.thirst<48)add('brew_tea',54+n.thirst,'Dried tea leaves and a working kitchen range','stove');
 if(state.booksRead.length<BOOKS.length&&n.boredom>=34)add('read',36+n.boredom*.9,'Curiosity and an unread book on the shelf','bookshelf');
 if((evidence.__pendingJournal||[]).length>0&&state.minute>=1080&&state.minute<1380&&(state.journal?.lastWrittenDay??0)<state.day)add('write_journal',125,'At evening I ought to examine the most consequential events of the day','journal',{sourceEventId:evidence.__pendingJournal[0],sourceEventIds:evidence.__pendingJournal.slice(0,5)});
 const notebook=notebookChoice(state,evidence);if(notebook)add('read_journal',notebook.score,notebook.reason,'journal',notebook.detail);
 if((state.lab.damage>0&&p.spares>0)||(p.reagents>0))add('work',46+n.boredom*.35,'A verifiable physical repair or experiment is possible','bench');
 if(n.boredom>50&&state.booksRead.length===BOOKS.length)add('reflect',20+n.boredom*.2,'Unhurried thought about verified experiences','table');
 if(!options.length)add('wait',1,'No currently workable intention','bed');
 // The explicit knowledge inventory changes priority only after an actual grant receipt.
 // No unread text and no pre-folio cues may stand in for held knowledge.
 const held=Knowledge.held;
 const factApplies=(opt,fact,amount)=>{const x=held(state,fact);if(x){opt.score+=amount;(opt.usedFacts??=[]).push({id:fact,grantTick:x.grantTick,provenance:x.provenance});}};
 for(const opt of options){
  if(opt.kind==='inspect_floor'){factApplies(opt,'floor_inspection_warranted',105);factApplies(opt,'floor_sound',-38);}
  if(opt.kind==='repair_floor'){factApplies(opt,'floor_east_rotten',125);factApplies(opt,'floor_sound',-48);}
  if(opt.kind==='order_maintenance')factApplies(opt,'floor_east_rotten',90);
  if(opt.kind==='order_coal'){
   const coal=h.coal.dry+h.coal.wet;
   if(coal>=3&&coal<=9&&state.wallet>=Household.price(CATALOG.coal.price,state.day,'coal')&&!pending(state,'coal')){
    // A learned reserve changes availability, not merely the ranking of an unavailable goal.
    factApplies(opt,'coal_unreliable',90);
   }else factApplies(opt,'coal_unreliable',coal<3?65:0);
   factApplies(opt,'coal_reliable',-55);
  }
  if(opt.kind==='tend_path'){factApplies(opt,'paths_nettle_untended',100);factApplies(opt,'paths_clear',-65);}
 }
 // Learned early-reserve intentions, enabled only by genuinely held facts.
 if(!options.some(x=>x.kind==='order_coal')&&held(state,'coal_unreliable')&&h.coal.dry+h.coal.wet<=9&&!pending(state,'coal')&&state.wallet>=Household.price(CATALOG.coal.price,state.day,'coal')){
  const fact=held(state,'coal_unreliable');options.push({kind:'order_coal',score:170,reason:'A consulted or experienced coal warning calls for a reserve',target:'catalog',detail:{},memoryIds:[],usedFacts:[{id:fact.id,grantTick:fact.grantTick,provenance:fact.provenance}]});
 }
 if(!options.some(x=>x.kind==='tend_path')&&held(state,'paths_nettle_untended')&&h.garden.nettles>=7){
  const fact=held(state,'paths_nettle_untended');options.push({kind:'tend_path',score:130,reason:'A learned nettle warning calls for early tending',target:'garden_path',detail:{},memoryIds:[],usedFacts:[{id:fact.id,grantTick:fact.grantTick,provenance:fact.provenance}]});
 }
 if(!options.some(x=>x.kind==='inspect_floor')&&held(state,'floor_inspection_warranted')){
  const fact=held(state,'floor_inspection_warranted');options.push({kind:'inspect_floor',score:150,reason:'A learned warning requires examining the stair floor',target:'floorboards',detail:{},memoryIds:[],usedFacts:[{id:fact.id,grantTick:fact.grantTick,provenance:fact.provenance}]});
 }
 // Critical bodily safety beats science, notebook work, leisure and comfort.
 const localWarmth=Household.comfort(state,roomAt(state.position.x,state.position.y)).warmth;
 const crisis={hunger:n.hunger>=80,thirst:n.thirst>=78,health:state.health<=35,cold:Household.winter(state.day)&&localWarmth<34};
 const acute=state.policyOptions?.survivalFloor!==false&&Object.values(crisis).some(Boolean);
 const priority={drink:crisis.thirst||crisis.health,eat:crisis.hunger||crisis.health,cook:crisis.hunger||crisis.health,
  order_groceries:crisis.hunger||crisis.health,order_staples:crisis.hunger||crisis.health,collect:crisis.hunger||crisis.health,put_away:crisis.hunger||crisis.health,
  stoke_hearth:crisis.cold||crisis.health,order_coal:crisis.cold||crisis.health};
 if(acute)for(const opt of options)if(priority[opt.kind]){opt.score+=500;opt.survivalFloor=true;}
 // Source-attributed preferences remain modest; no fabricated memory can change physics.
 for(const opt of options){if(opt.memoryIds.length)opt.score+=Math.min(2,opt.memoryIds.length*.5);
  // Pre-registered folio interventions are from actually read records, not the unconsulted archive.
  const cue=evidence.__folioCue,v=evidence.__verifiedFolioRead;if(cue&&v&&v.readingReceiptId===cue.readingReceiptId&&v.sourceEventId===cue.sourceEventId&&v.readTick<state.tick&&cue.target===opt.kind)opt.score+=cue.effect;if(state.recentKinds.slice(-2).includes(opt.kind))opt.score-=4;if(opt.score<120)opt.score+=stableChoiceNoise(state.seed,state.tick,opt.kind)}
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
 case 'sleep':{const c=Household.comfort(state,'bedroom');const relief=c.warmth<35?44:76; /* A03/E03: 159 cold rests/60d repay 116.6 >112.32 fatigue/day */n.fatigue=cap(n.fatigue-relief);state.health=cap(state.health+10); /* A07/E07: sleep is a bounded health recovery action */ if(c.warmth<35)state.health=cap(state.health-.8);receipt(state,events,'sleep','Slept on the iron bedstead',{energyRestored:true,restRelief:relief,coldRoom:c.warmth<35});break;}
 case 'toilet':n.bladder=cap(n.bladder-90);receipt(state,events,'toilet','Used the plumbed water closet');break;
 case 'write_journal':{const sourceEventId=goal.detail?.sourceEventId;if(!sourceEventId)throw Error('No grounded journal entry to write');state.journal??={lastReadTick:-999,lastWriteTick:-999,folioCursor:0,entries:0};state.journal.lastWriteTick=state.tick;state.journal.lastWrittenDay=state.day;state.journal.entries++;receipt(state,events,'journal_write','Wrote an evening retrospective in the private scientific diary',{sourceEventId,sourceEventIds:goal.detail.sourceEventIds||[sourceEventId]});break;}
 case 'read_journal':{state.journal??={lastReadTick:-999,lastWriteTick:-999,folioCursor:0,entries:0};
 const folioIndex=goal.detail?.folioIndex??state.journal.folioCursor,before=n.boredom;
 state.journal.folioCursor=folioIndex+1;state.journal.lastReadTick=state.tick;n.boredom=cap(n.boredom-21);
 const c=consult(state);c.readIndices.push(folioIndex);c.readIndices=c.readIndices.slice(-450);
 if(goal.detail?.cueType){c.unanswered=c.unanswered.filter(x=>x[0]!==goal.detail.cueType+':'+goal.detail.cueValue);c.windows=c.windows.filter(x=>x.index!==folioIndex)}
 receipt(state,events,'journal_read','Consulted an older passage in the private notebook',{folioIndex,mechanism:goal.detail?.mechanism||'chair',cueType:goal.detail?.cueType||null,cueValue:goal.detail?.cueValue||null,boredomBefore:before,boredomAfter:n.boredom});break;}
 case 'read':{const title=BOOKS.find(x=>!state.booksRead.includes(x));if(!title){receipt(state,events,'read_unavailable','No unread books remain');break;}const page=(state.bookProgress[title]||0)+1;state.bookProgress[title]=page;n.boredom=cap(n.boredom-33);receipt(state,events,'read_section',`Read section ${page} of ${title}`,{title,page});if(page>=2){state.booksRead.push(title);receipt(state,events,'book_completed',`Finished ${title}`,{title,sections:2});}break}
 case 'work':{if(!lab.lampLit){if(p.lamp_oil<1)throw Error('Lamp has no oil');stockChange(state,{lamp_oil:-1});lab.lampLit=true;receipt(state,events,'light_lamp','Lit the Laboratory oil lamp',{oilRemaining:p.lamp_oil});return false}
 if(lab.clutter>0){lab.clutter--;receipt(state,events,'clean_bench','Cleared clutter from the physical workbench',{remainingClutter:lab.clutter});return false}
 if(lab.damage>0&&p.spares>0){stockChange(state,{spares:-1});lab.damage--;lab.repairs++;state.counters.work++;receipt(state,events,'repair','Repaired the Laboratory instrument',{damageRemaining:lab.damage,sparesRemaining:p.spares});}
 else if(p.reagents>0){stockChange(state,{reagents:-1});lab.experiments++;state.counters.work++;state.researchReports++;receipt(state,events,'experiment','Completed a documented chemical observation',{experiments:lab.experiments,reportsToPost:state.researchReports});}else throw Error('No work materials remain');n.boredom=cap(n.boredom-31);n.fatigue=cap(n.fatigue+11);break}
 case 'plant_vegetables':stockChange(state,{vegetable_seeds:-1});garden.vegetables={stage:'growing',plantedTick:state.tick,watered:false};receipt(state,events,'plant','Planted vegetable seeds in garden plot',{crop:'vegetables'});break;
 case 'plant_tea':stockChange(state,{tea_seeds:-1});garden.tea={stage:'growing',plantedTick:state.tick,watered:false};receipt(state,events,'plant','Planted tea seedlings in garden plot',{crop:'tea'});break;
 case 'water_vegetables':garden.vegetables.watered=true;receipt(state,events,'water_garden','Watered the vegetable plot using tap water',{crop:'vegetables'});break;
 case 'water_tea':garden.tea.watered=true;receipt(state,events,'water_garden','Watered the tea bushes using tap water',{crop:'tea'});break;
 case 'harvest_vegetables':if(garden.vegetables.stage!=='ripe')throw Error('Vegetables not ripe');state.carried={vegetables:Math.max(1,3-Math.floor(Household.migrate(state).garden.nettles/34))};garden.vegetables={stage:'empty',plantedTick:null,watered:false};state.counters.harvests++;receipt(state,events,'harvest','Harvested homegrown vegetables',{carried:clone(state.carried),nettles:Household.migrate(state).garden.nettles});break;
 case 'harvest_tea':if(garden.tea.stage!=='ripe')throw Error('Tea not ripe');state.carried={tea_leaves:Math.max(1,3-Math.floor(Household.migrate(state).garden.nettles/34))};garden.tea={stage:'empty',plantedTick:null,watered:false};state.counters.harvests++;receipt(state,events,'harvest','Picked and dried homegrown tea leaves',{carried:clone(state.carried),nettles:Household.migrate(state).garden.nettles});break;
 case 'put_away':if(!state.carried)throw Error('Nothing to put away');stockChange(state,state.carried);receipt(state,events,'put_away','Put a physical parcel or harvest into pantry storage',{goods:state.carried});state.carried=null;break;
 case 'order_groceries':case 'order_staples':case 'order_seeds':case 'order_science':case 'order_tea':case 'order_coal':case 'order_maintenance':{const type=kind.replace('order_','');const catalog=CATALOG[type];if(!catalog||state.wallet<Household.price(catalog.price,state.day,type))throw Error('Catalog order is not affordable');const paid=Household.price(catalog.price,state.day,type);state.wallet-=paid;const variance=type==='coal'?(state.scenarioEncounters?.forcedLateWetCoal?{late:9,wet:true}:Household.transit(state.seed,state.nextOrder)):null;const order={id:`O-${String(state.nextOrder++).padStart(4,'0')}`,type,source:catalog.source,paid,goods:clone(catalog.goods),placedTick:state.tick,dueTick:state.tick+catalog.delay+(variance?.late||0),late:variance?.late||0,wet:variance?.wet||false,supplierId:catalog.supplierId||null,arrived:false,collected:false};state.orders.push(order);state.counters.orders++;receipt(state,events,'catalog_order',`Posted paid order to ${catalog.source}`,{orderId:order.id,price:paid,goods:order.goods,etaTick:order.dueTick,supplierId:order.supplierId});break}
 case 'collect':{const order=state.orders.find(o=>o.arrived&&!o.collected);if(!order||state.carried)throw Error('No collectable parcel or hands full');order.collected=true;state.counters.deliveries++;if(order.type==='research_payment'){state.wallet+=order.payment;receipt(state,events,'collect_payment','Collected a scientific society payment by post',{orderId:order.id,amount:order.payment,wallet:state.wallet});}
 else if(order.type==='coal'){const h=Household.migrate(state);if(order.wet)h.coal.wet+=order.goods.coal;else h.coal.dry+=order.goods.coal;h.observed.coal={day:state.day,count:h.coal.dry+h.coal.wet};receipt(state,events,'coal_collected','Moved Rosa Brandl firm coal from the porch cart into the visible coal pile',{orderId:order.id,supplierId:order.supplierId,quantity:order.goods.coal,wet:order.wet});}
 else {state.carried=clone(order.goods);receipt(state,events,'collect_parcel','Collected a physical parcel from the letter box',{orderId:order.id,goods:order.goods});}break}
 case 'inspect_roof':{const h=Household.migrate(state);h.observed.roof={day:state.day,description:h.fabric.leaking?'Water stains and drips':'Slate and joint wear'};receipt(state,events,'inspect_fabric','Inspected the tower roof',{subject:'roof',observation:h.observed.roof.description});break;}
 case 'inspect_floor':{const h=Household.migrate(state);h.observed.floor={day:state.day,description:h.fabric.floor<35?'The stair boards flex alarmingly':'The stair boards are worn'};receipt(state,events,'inspect_fabric','Inspected the stairs',{subject:'floor',observation:h.observed.floor.description});break;}
 case 'inspect_coal':{const h=Household.migrate(state);h.observed.coal={day:state.day,count:h.coal.dry+h.coal.wet};receipt(state,events,'inspect_coal','Counted coal baskets by the porch',{quantity:h.observed.coal.count,wet:h.coal.wet});break;}
 case 'stoke_hearth':{const h=Household.migrate(state),wet=h.coal.dry===0;if(wet&&h.coal.wet<=0||!wet&&h.coal.dry<=0)throw Error('No coal fuel');if(wet)h.coal.wet--;else h.coal.dry--;h.heat.fuelledUntil=state.tick+(wet?12:26);receipt(state,events,'burn_coal',wet?'Burned wet coal weakly in the hearth':'Fed dry coal into the kitchen hearth',{wet,efficiency:wet?.46:1,until:h.heat.fuelledUntil,quantity:h.coal.dry+h.coal.wet});break;}
 case 'repair_roof':{const h=Household.migrate(state);stockChange(state,{roofing:-1});h.fabric.roof=cap(h.fabric.roof+45);h.fabric.roofRepaired++;h.fabric.leaking=false;h.fabric.dryRooms.library=true;receipt(state,events,'roof_repair','Repaired the leaky tower roof',{roofingUsed:1,dryStatusRestored:true});break;}
 case 'repair_floor':{const h=Household.migrate(state);stockChange(state,{boards:-1});h.fabric.floor=cap(h.fabric.floor+40);h.fabric.floorRepaired++;receipt(state,events,'floor_repair','Replaced worn stair boards',{boardsUsed:1});break;}
 case 'tend_path':{const h=Household.migrate(state);h.garden.nettles=0;h.garden.pathTendedTick=state.tick;receipt(state,events,'garden_tended','Cut back nettles along the garden path',{plant:'nettles',pathClear:true});break;}
 case 'post_report':{if(state.researchReports<=0)throw Error('No verified research report');state.researchReports--;const due=state.tick+(state.scenarioEconomy?.reportPaymentDelay??22);const order={id:`O-${String(state.nextOrder++).padStart(4,'0')}`,type:'research_payment',source:'scientific society',placedTick:state.tick,dueTick:due,arrived:false,collected:false,payment:25};state.orders.push(order);receipt(state,events,'report_posted','Mailed an earned research report to the scientific society',{report:true,paymentPending:25,etaTick:due});break}
 case 'reflect':n.boredom=cap(n.boredom-23); /* A05/E05: 218 reflections/60d repay 83.567 >80.64 boredom/day */receipt(state,events,'reflection','Reflected on verified experiences without changing world facts');break;
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
 if(k.startsWith('order_')){const c=CATALOG[k.slice(6)];return Boolean(c)&&state.wallet>=Household.price(c.price,state.day,k.slice(6))}
 if(k==='read')return state.booksRead.length<BOOKS.length;
 if(k==='write_journal')return Boolean(goal.detail?.sourceEventId);
 if(k==='read_journal')return true;
 if(k==='repair_roof')return state.stock.roofing>0;
 if(k==='repair_floor')return state.stock.boards>0;
 if(k==='stoke_hearth')return Household.migrate(state).coal.dry+Household.migrate(state).coal.wet>0;
 if(k==='work')return (state.lab.damage>0&&p.spares>0)||p.reagents>0;
 return true;
}
function step(state,evidence={}){
 if(!state.alive)return {state,events:[],decision:null};
 const s=clone(state),events=[];consult(s);Knowledge.inventory(s);
 s.tick++;s.minute+=10;if(s.minute>=1440){s.minute-=1440;s.day++}
 const hh=Household.migrate(s);Household.applyDay(s,(kind,description,details,perceived)=>receipt(s,events,kind,description,details,perceived));
 if(s.tick>hh.heat.fuelledUntil)hh.heat.warmth=0;else hh.heat.warmth=Household.comfort(s,'kitchen').warmth;
 Household.exposure(s,roomAt(s.position.x,s.position.y),(kind,desc,details,perceived)=>receipt(s,events,kind,desc,details,perceived));
 for(const key of ['hunger','thirst','fatigue','bladder','boredom']){const rate={hunger:.9,thirst:1.17,fatigue:.78,bladder:1.04,boredom:.56}[key];s.needs[key]=cap(s.needs[key]+rate)}
 for(const [crop,plot] of Object.entries(s.garden)){if(plot.stage==='growing'&&plot.watered&&s.tick-plot.plantedTick>=(crop==='tea'?84:50)){plot.stage='ripe';receipt(s,events,'crop_ripened',`The ${crop} plot is ready to harvest`,{crop})}}
 for(const o of s.orders){if(!o.arrived&&s.tick>=o.dueTick){o.arrived=true;receipt(s,events,'delivery_arrived',o.type==='research_payment'?'The scientific society sent a payment':o.type==='coal'?'Rosa Brandl firm delivered a coal cart to the tower porch':'A parcel arrived at the physical letter box',{orderId:o.id,type:o.type,source:o.source,supplierId:o.supplierId||null,wet:o.wet||false,late:o.late||0},roomAt(s.position.x,s.position.y)==='porch')}}
 const past=clone(s.goal);const canCook=s.stock.vegetables>0||(s.stock.milk>0&&s.stock.grain>0);const crisis=s.needs.thirst>=87?'drink':s.needs.hunger>=91?(s.stock.meals>0?'eat':canCook?'cook':null):null; /* A16: never interrupt a supply trip for impossible cooking */
 if(s.goal&&crisis&&s.goal.kind!==crisis){if(!s.suspendedGoal){s.suspendedGoal=s.goal;receipt(s,events,'goal_suspended',`Suspended ${s.goal.kind} for an urgent bodily need`,{suspendedGoalId:s.goal.id})}s.goal=null}
 if(!s.goal&&s.suspendedGoal&&s.needs.thirst<60&&s.needs.hunger<74){s.goal=s.suspendedGoal;s.suspendedGoal=null;receipt(s,events,'goal_resumed',`Resumed unfinished intention ${s.goal.kind}`,{goalId:s.goal.id})}
 if(s.goal&&!goalStillPossible(s,s.goal)){receipt(s,events,'goal_obsolete',`The original opportunity for ${s.goal.kind} is no longer physically available`,{oldGoalId:s.goal.id});s.goal=null}
 let candidates=null;if(!s.goal){candidates=choose(s,evidence);const c=candidates[0];s.goal={id:`G-${String(s.nextGoal++).padStart(5,'0')}`,kind:c.kind,target:c.target,detail:c.detail||{},selectedTick:s.tick,phase:'active',reason:c.reason,memoryIds:c.memoryIds,score:c.score};s.lastDecision={goalId:s.goal.id,kind:c.kind,score:c.score,reason:c.reason,memoryIds:c.memoryIds,usedFacts:c.usedFacts||[],survivalFloor:!!c.survivalFloor,options:candidates.slice(0,8).map(x=>({kind:x.kind,score:x.score,usedFacts:x.usedFacts||[],survivalFloor:!!x.survivalFloor}))};receipt(s,events,'goal_selected',`Intended to ${c.kind}: ${c.reason}`,{score:c.score,memoryIds:c.memoryIds,usedFacts:c.usedFacts||[],survivalFloor:!!c.survivalFloor,consultation:c.kind==='read_journal'?c.detail:null,folioInfluence:evidence.__verifiedFolioRead?{postRead:evidence.__verifiedFolioRead.readTick<s.tick,sourceEventId:evidence.__verifiedFolioRead.sourceEventId,readingReceiptId:evidence.__verifiedFolioRead.readingReceiptId}:{postRead:false}});}
 const target=BY_ID[s.goal.target];if(!target)throw Error(`Target missing ${s.goal.target}`);
 const unsafeCarrying=!!s.carried&&!!Knowledge.held(s,'floor_east_rotten')&&hh.fabric.floor<30;
 const route=pathBetween(s.position,target,unsafeCarrying?[{x:3,y:4}]:[]);if(route===null){
  if(!unsafeCarrying)throw Error(`Unreachable object ${target.id}`);
  receipt(s,events,'unsafe_route_refused','Refused to carry a heavy parcel over the known unsafe stair',{goal:s.goal.kind,factId:'floor_east_rotten',provenance:Knowledge.held(s,'floor_east_rotten')?.provenance});
  s.goal=null;ingestConsultation(s,events,evidence);
  return {state:s,events,decision:s.lastDecision,pastGoalId:past?.id||null};
 }
 if(route.length){const prior=clone(s.position);s.position=route[0];if(roomAt(prior.x,prior.y)==='hall'){
  const oldFloor=hh.fabric.floor;
  Household.traffic(s,(k,d,ex,seen)=>receipt(s,events,k,d,ex,seen));
  if(s.scenarioEncounters?.floorStepOnce&&oldFloor>=12&&hh.fabric.floor<12){
   s.scenarioEncounters.floorStepOnce=false;s.health=cap(s.health-3);
   receipt(s,events,'floor_hazard','The worn hall board gave visibly underfoot',{floor:'hall',healthLost:3,scenarioAssumption:'floor_threshold_encounter'},true);
  }
 }
 if(roomAt(s.position.x,s.position.y)==='garden'&&roomAt(prior.x,prior.y)!=='garden'&&hh.garden.nettles>=40){
   receipt(s,events,'garden_path_seen','Saw the nettles gathering along the garden approach',{nettles:hh.garden.nettles,objectId:'garden_path'},true);
 }if(roomAt(prior.x,prior.y)==='garden'&&hh.garden.nettles>15){s.needs.fatigue=cap(s.needs.fatigue+hh.garden.nettles*.003);} receipt(s,events,'walk',`Walked toward ${target.name}`,{from:prior,to:s.position,objectId:target.id,remainingRoute:route.length-1});s.goal.phase='travelling';}
 else {const completed=action(s,events,s.goal);if(completed){s.completed.push({id:s.goal.id,kind:s.goal.kind,completedTick:s.tick});s.recentKinds.push(s.goal.kind);s.recentKinds=s.recentKinds.slice(-8);s.goal=null}}
 // Direct experience is an independently receipted, more costly learning route.
 for(const ev of [...events]){
  for(const fact of Knowledge.experiencedGrants(s,ev)){
   receipt(s,events,'knowledge_grant','Learned a practical fact from direct experience',{factId:fact.id,grantTick:fact.grantTick,sourceKind:'experienced',sourceReceiptId:ev.id,sourceEventKind:ev.kind},true);
  }
 }
 ingestConsultation(s,events,evidence);
 if(s.needs.hunger>=100)s.health-=5;if(s.needs.thirst>=100)s.health-=13;if(s.health<=0){s.alive=false;s.health=0;s.deathCause=s.needs.thirst>=100?'dehydration':'starvation';receipt(s,events,'death',`Septimus died from ${s.deathCause}`,{irreversible:true});s.goal=null;}

 return {state:s,events,decision:s.lastDecision,pastGoalId:past?.id||null};
}
module.exports={step,choose,receipt};
