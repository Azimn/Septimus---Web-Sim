'use strict';
// Baseline diagnostic. Never writes old outcomes. Runs against reviewed v3 rules only.
const fs=require('node:fs'),path=require('node:path');
const W=require('../src/world'),S=require('../src/simulation'),H=require('../src/household'),D=require('../src/diary'),Cal=require('../src/calendar');
const archive=D.loadArchive(),catalog=archive.records.map((r,index)=>({index,id:r.event_id,participants:r.participants||[],locations:r.locations||[],recall_cues:r.recall_cues||[]}));
const evidence={__historyCount:450,__folioCatalog:catalog};
const names=['hunger','thirst','fatigue','bladder','boredom','warmth','health_cold_bedroom','health_heated_kitchen'];
const T=144*60;
const classify=(events,goal)=>{
 const kinds=new Set(events.map(e=>e.kind));
 if(kinds.has('walk'))return 'travel';
 if(kinds.has('sleep'))return 'sleep';
 if(kinds.has('burn_coal')||goal==='stoke_hearth')return 'heating';
 if(kinds.has('eat_meal')||kinds.has('cook')||goal==='eat'||goal==='cook'||goal==='order_groceries')return 'eating_cooking';
 if(kinds.has('drink_sink')||kinds.has('drink_tea')||kinds.has('brew_tea'))return 'drinking_brewing';
 if(kinds.has('toilet'))return 'toileting';
 if(kinds.has('wait'))return 'idle';
 if(['work','post_report','order_science'].includes(goal)||kinds.has('experiment')||kinds.has('repair')||kinds.has('report_posted'))return 'work';
 return 'other';
};
const max=n=>Math.max(0,Math.min(100,n));
function runProbe(name){
 let s=W.fresh(101);s.day=124;s.health=100;s.wallet=1000000;
 s.needs={hunger:0,thirst:0,fatigue:0,bladder:0,boredom:0};
 s.position=name==='health_heated_kitchen'||name==='warmth'?{x:5,y:5}:name==='health_cold_bedroom'?{x:2,y:2}:s.position;
 s.booksRead=name==='boredom'?[...W.BOOKS]:[]; // reflect is a real available post-book action
 let fulfilled=0,restored=0,lowest=Infinity,highest=-Infinity,belowCritical=0,minWarmth=Infinity,warmTicks=0;
 const kinds={},start=performance.now();
 const thresholds={hunger:52,thirst:55,fatigue:60,bladder:55,boredom:52};
 const goals={hunger:'eat',thirst:'drink',fatigue:'sleep',bladder:'toilet',boredom:'reflect'};
 const targetMap={eat:'table',drink:'sink',sleep:'bed',toilet:'toilet',reflect:'table',stoke_hearth:'hearth',wait:'bed'};
 for(let i=0;i<T&&s.alive;i++){
  // Unlimited materials and external reset of all OTHER needs produce an upper bound,
  // not a claim of achievable household economics.
  s.stock.meals=Math.max(12,s.stock.meals);s.household.coal.dry=Math.max(12,s.household.coal.dry);
  s.stock.vegetables=Math.max(12,s.stock.vegetables);
  if(name!=='hunger')s.needs.hunger=0;
  if(name!=='thirst')s.needs.thirst=0;
  if(name!=='fatigue')s.needs.fatigue=0;
  if(name!=='bladder')s.needs.bladder=0;
  if(name!=='boredom')s.needs.boredom=0;
  if(name==='health_cold_bedroom'){s.position={x:2,y:2};s.goal={id:'ORACLE-COLD',kind:'wait',target:'bed',detail:{}};}
  else if(name==='health_heated_kitchen'||name==='warmth'){
   s.position={x:5,y:5};
   s.goal={id:'ORACLE-HEARTH',kind:'stoke_hearth',target:'hearth',detail:{}};
  }else if(!s.goal){
   const kind=s.needs[name]>=thresholds[name]?goals[name]:'wait';
   s.goal={id:'ORACLE-'+i,kind,target:targetMap[kind],detail:{}};
  }
  const pre=s.needs[name]??s.health;
  const out=S.step(s,{});s=out.state;
  const target=s.needs[name]??s.health;
  highest=Math.max(highest,target);lowest=Math.min(lowest,target);
  const isHealth=name.startsWith('health');
  const warm=H.comfort(s,name==='health_cold_bedroom'?'bedroom':name==='health_heated_kitchen'?'kitchen':'bedroom').warmth;
  minWarmth=Math.min(minWarmth,warm);if(warm>=34)warmTicks++;
  if(isHealth&&target<100)belowCritical++;
  else if(!isHealth&&name==='warmth'&&warm<34)belowCritical++;
  else if(!isHealth&&name!=='warmth'&&target>=80)belowCritical++;
  for(const ev of out.events){
   kinds[ev.kind]=(kinds[ev.kind]||0)+1;
   if(['eat_meal','drink_sink','sleep','toilet','reflection','burn_coal'].includes(ev.kind)){
    fulfilled++;
    const effects={eat_meal:75,drink_sink:78,sleep:ev.details.restRelief||0,toilet:90,reflection:22,burn_coal:ev.details.wet?12:26};
    restored+=effects[ev.kind]||0;
   }
  }
  if(!s.alive)break;
 }
 return {name,requestedTicks:T,completedTicks:s.tick,alive:s.alive,dayCount:s.tick/144,
  theoreticalMaxRestorePerDay:Math.round(1000*restored/(Math.max(s.tick,1)/144))/1000,
  completedRestorativeActions:fulfilled,restorationUnits:restored,
  peakMeter:highest,minimumMeter:lowest,underCriticalOrHealthDamagedTicks:belowCritical,
  bedroomWarmTicks:warmTicks,minBedOrLocalWarmth:minWarmth,
  finalHealth:s.health,deathCause:s.deathCause,kinds,runtimeMs:Math.round(performance.now()-start),
  caveat:'Other needs zeroed and inventories replenished externally each tick; isolated ceiling, not a playable policy.'};
}
function winterInit(seed,id){
 const s=W.fresh(seed);s.day=id.includes('september')?63:124;s.policyOptions={survivalFloor:id.includes('gated')};
 s.scenarioEconomy={reportPaymentDelay:22};
 if(id.includes('autumn_stores')){s.household.coal.dry+=20;s.stock.vegetables+=8;s.stock.grain+=6;s.stock.milk+=4;s.stock.meals+=6}
 return s;
}
function runAllocation(seed,id){
 let s=winterInit(seed,id),end=null,rolling=[],totalTicks=0;
 const start=performance.now(),MAX=(id.includes('september')?61:0)*144+60*144;
 for(let t=0;t<MAX&&s.alive;t++){
  const previousGoal=s.goal?.kind||null;
  const out=S.step(s,evidence);s=out.state;totalTicks++;
  const selected=out.events.find(e=>e.kind==='goal_selected');
  const kind=selected?.description.match(/^Intended to ([^:]+):/)?.[1]||previousGoal||'none';
  const category=classify(out.events,kind);
  rolling.push({tick:s.tick,category,kind,room:W.roomAt(s.position.x,s.position.y),
   hunger:s.needs.hunger,thirst:s.needs.thirst,health:s.health,coal:s.household.coal.dry+s.household.coal.wet,
   meals:s.stock.meals,vegetables:s.stock.vegetables,milk:s.stock.milk,grain:s.stock.grain,wallet:s.wallet});
  if(rolling.length>1008)rolling.shift();
 }
 const totals={sleep:0,heating:0,eating_cooking:0,drinking_brewing:0,toileting:0,travel:0,idle:0,work:0,other:0};
 for(const row of rolling)totals[row.category]++;
 if(Object.values(totals).reduce((a,b)=>a+b,0)!==rolling.length)throw Error('Final week time-budget conservation failure');
 return {seed,variant:id,finalDate:Cal.dateForDay(s.day),totalTicks,finalWindowTicks:rolling.length,
  timeAllocation:totals,finalRoom:W.roomAt(s.position.x,s.position.y),lastKind:rolling.at(-1)?.kind,
  finalWallet:s.wallet,finalHealth:s.health,finalNeeds:s.needs,finalStock:{meals:s.stock.meals,vegetables:s.stock.vegetables,milk:s.stock.milk,grain:s.stock.grain,coal:s.household.coal.dry+s.household.coal.wet},
  localWarmth:H.comfort(s,W.roomAt(s.position.x,s.position.y)).warmth,heaterUntil:s.household.heat.fuelledUntil,
  lastWeekFirstTick:rolling[0]?.tick,lastWeekLastTick:rolling.at(-1)?.tick,
  lastSevenNeedSamples:rolling.filter((_,i)=>i%18===0),runtimeMs:Math.round(performance.now()-start)};
}
function run(){
 const start=performance.now(),oracles=names.map(runProbe);
 const variants=['september_onramp_gated','november_autumn_stores_gated','september_onramp_ungated'];
 const runs=[];for(const id of variants)for(let seed=1;seed<=10;seed++)runs.push(runAllocation(seed,id));
 const obj={kind:'pre_correction_arithmetic_oracles_and_final_week_allocation',baselineAudit:'docs/NEEDS_ARITHMETIC_AUDIT.md',
  noControllerOrEconomyEdits:true,source:'Simulation.step, Household.comfort, World.fresh',
  requestedOracleDays:60,oracleMethod:'isolated external material refill for theoretical attainable upper bound',
  allocationMethod:'last min(1008, lived ticks) classified one category per actual tick; 10 seeds per named v3 variant',
  runtimeMs:Math.round(performance.now()-start),oracles,runs};
 const dir=path.join(__dirname,'../results');fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'needs_arithmetic_baseline.json'),JSON.stringify(obj,null,2)+'\n');
 const fmt=o=>o.toFixed?o.toFixed(2):o;
 const md=['# Needs arithmetic audit: untouched-policy oracle and dying-week allocation','','Scripted oracle supplies materials externally and silences unrelated needs, providing a **ceiling**, not an ordinary character run. Baseline mechanics are unchanged.',
  '','| Need | Ticks observed | Maintains target / death | Actions | Restoration units per 144 ticks | Peak meter | Warm ticks |',
  '|---|---:|---|---:|---:|---:|---:|',
  ...oracles.map(x=>`| ${x.name} | ${x.completedTicks} | ${x.alive?'survived isolated probe':'DIED: '+x.deathCause} | ${x.completedRestorativeActions} | ${fmt(x.theoreticalMaxRestorePerDay)} | ${fmt(x.peakMeter)} | ${x.bedroomWarmTicks} |`),
  '','The warm kitchen control and cold-bedroom control test health damage separately. No existing healing action exists. Model defects need not imply every isolated oracle dies.',
  '','| Variant/seed | Final date | Alive-week ticks | Sleep | Heat | Eat/cook | Drink | Toilet | Travel | Idle | Work | Other | Wallet | Hunger | Room |',
  '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|',
  ...runs.map(x=>`| ${x.variant}/${x.seed} | ${x.finalDate} | ${x.finalWindowTicks} | ${x.timeAllocation.sleep} | ${x.timeAllocation.heating} | ${x.timeAllocation.eating_cooking} | ${x.timeAllocation.drinking_brewing} | ${x.timeAllocation.toileting} | ${x.timeAllocation.travel} | ${x.timeAllocation.idle} | ${x.timeAllocation.work} | ${x.timeAllocation.other} | ${x.finalWallet} | ${fmt(x.finalNeeds.hunger)} | ${x.finalRoom} |`),
  '','Each row counts exactly one use of each lived tick. The complete JSON contains last-week need samples and pantry stock, including seed(s) that die with substantial money. These are measurements on v3, not a balance intervention.'];
 fs.writeFileSync(path.join(dir,'needs_arithmetic_baseline.md'),md.join('\n')+'\n');
 console.log(JSON.stringify({runtimeMs:obj.runtimeMs,oracles:oracles.map(x=>({name:x.name,ticks:x.completedTicks,alive:x.alive,actions:x.completedRestorativeActions,perDay:x.theoreticalMaxRestorePerDay,peak:x.peakMeter,coldTicks:x.underCriticalOrHealthDamagedTicks})),sampleRuns:runs.filter(x=>x.finalWallet>60).map(x=>({seed:x.seed,variant:x.variant,finalWallet:x.finalWallet,hunger:x.finalNeeds.hunger,stock:x.finalStock,allocation:x.timeAllocation})),allAllocations:runs.length}));
}
if(require.main===module)run();
module.exports={run};
