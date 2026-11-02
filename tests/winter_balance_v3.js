'use strict';
// Fair-spawn scenarios, strict gate control, optional ONE predeclared economy sensitivity.
// Frozen original-policy diagnosis lives in winter_diagnosis_original.* and is never regenerated here.
const fs=require('node:fs'),path=require('node:path');
const W=require('../src/world'),S=require('../src/simulation'),D=require('../src/diary'),H=require('../src/household'),Cal=require('../src/calendar');
const a=D.loadArchive(),catalog=a.records.map((r,index)=>({index,id:r.event_id,participants:r.participants||[],locations:r.locations||[],recall_cues:r.recall_cues||[]}));
const FULL=['drink_sink','eat_meal','cook','harvest','catalog_order','collect_parcel','read_section','experiment'];
const scenarios=[
 {id:'september_onramp_ungated',start:'September 1',fair:'onramp',gate:false,paymentDelay:22},
 {id:'november_autumn_stores_ungated',start:'November 1',fair:'stores',gate:false,paymentDelay:22},
 {id:'september_onramp_gated',start:'September 1',fair:'onramp',gate:true,paymentDelay:22},
 {id:'november_autumn_stores_gated',start:'November 1',fair:'stores',gate:true,paymentDelay:22}
];
const storeBoost={coalDry:20,vegetables:8,grain:6,milk:4,meals:6,extraWallet:0};
function runOne(seed,variant){
 const begun=performance.now(),w0=W.fresh(seed);
 let w=w0;w.day=variant.fair==='onramp'?63:124;
 w.policyOptions={survivalFloor:variant.gate};w.scenarioEconomy={reportPaymentDelay:variant.paymentDelay};
 if(variant.fair==='stores'){
  w.household.coal.dry+=storeBoost.coalDry;
  w.stock.vegetables+=storeBoost.vegetables;
  w.stock.grain+=storeBoost.grain;w.stock.milk+=storeBoost.milk;w.stock.meals+=storeBoost.meals;
 }
 const prelude=variant.fair==='onramp'?61*144:0,measure=60*144,MAX=prelude+measure;
 const firstDate=Cal.dateForDay(w.day),wallet=[{date:firstDate,tick:w.tick,amount:w.wallet,health:w.health,coal:w.household.coal.dry+w.household.coal.wet,libraryDry:w.household.fabric.dryRooms.library}];
 const countsBefore=new Set(),countsWinter=new Set(),spending={food:0,coal:0,science:0,other:0},actions={},
  deathEvents=[],coalStockouts=[],dryLosses=[],dryRecoveries=[],selectedGoals=[],survivalNeedSamples=[];
 let totalEmpty=0,openStockout=null,observedTicks=0,winterReached=false,lastReadCount=0;
 for(let t=0;t<MAX&&w.alive;t++){
  const prevDry=w.household.fabric.dryRooms.library;
  const result=S.step(w,{__historyCount:450,__folioCatalog:catalog});w=result.state;
  const isWinter=w.day>=124; if(isWinter){observedTicks++;winterReached=true}
  for(const e of result.events){
   if(isWinter)countsWinter.add(e.kind);else countsBefore.add(e.kind);
   if(e.kind==='goal_selected'&&isWinter)selectedGoals.push({tick:e.tick,date:e.calendarDate,kind:e.description.match(/^Intended to ([^:]+):/)?.[1]||'unknown',
    score:e.details.score,survivalFloor:e.details.survivalFloor===true,usedFacts:e.details.usedFacts||[]});
   if(isWinter){actions[e.kind]=(actions[e.kind]||0)+1;}
   if(e.kind==='catalog_order'&&isWinter){
    const d=e.details,kind=d.supplierId==='rosa_brandl'?'coal':e.description.includes('grocer')||e.description.includes('seed house')||e.description.includes('tea merchant')?'food':e.description.includes('scientific catalog')?'science':'other';
    spending[kind]+=d.price;
   }
   if(e.kind==='journal_read')lastReadCount++;
   if(e.kind==='death')deathEvents.push({receiptId:e.id,tick:e.tick,date:e.calendarDate,mechanicalCause:e.details,effects:w.needs,health:w.health});
  }
  if(isWinter){
   const coal=w.household.coal.dry+w.household.coal.wet;
   if(!coal){totalEmpty++;if(openStockout===null)openStockout=w.tick;}
   else if(openStockout!==null){coalStockouts.push({fromTick:openStockout,toTick:w.tick-1,ticks:w.tick-openStockout});openStockout=null;}
   const dry=w.household.fabric.dryRooms.library;
   if(prevDry&&!dry)dryLosses.push({tick:w.tick,date:Cal.dateForDay(w.day)});
   if(!prevDry&&dry)dryRecoveries.push({tick:w.tick,date:Cal.dateForDay(w.day)});
   if(w.tick%18===0||!w.alive)survivalNeedSamples.push({tick:w.tick,date:Cal.dateForDay(w.day),wallet:w.wallet,hunger:w.needs.hunger,
    thirst:w.needs.thirst,health:w.health,fatigue:w.needs.fatigue,localWarmth:H.comfort(w,W.roomAt(w.position.x,w.position.y)).warmth,
    coal,food:w.stock.meals+ w.stock.vegetables,goal:w.goal?.kind||null});
  }
  const today=Cal.dateForDay(w.day);
  if(wallet.at(-1).date!==today)wallet.push({date:today,tick:w.tick,amount:w.wallet,health:w.health,coal:w.household.coal.dry+w.household.coal.wet,libraryDry:w.household.fabric.dryRooms.library});
 }
 if(openStockout!==null)coalStockouts.push({fromTick:openStockout,toTick:w.tick,ticks:w.tick-openStockout+1});
 const survived=!!w.alive&&observedTicks>=60*144;
 return {seed,variant:variant.id,initialScenario:variant.fair==='stores'?storeBoost:{onrampCalendarStart:'1899-09-01',initialStock:'World.fresh(seed)'},
  survivalFloor:variant.gate,paymentDelay:variant.paymentDelay,preludeTicks:Math.min(w.tick,prelude),winterReached,
  requestedWinterTicks:60*144,observedWinterTicks:observedTicks,finalDate:Cal.dateForDay(w.day),endTick:w.tick,
  survived,alive:w.alive,deathCause:w.deathCause,deathEvents,finalHealth:w.health,finalNeeds:w.needs,
  finalWallet:w.wallet,walletTrajectory:wallet,winterSpending:spending,
  coalEmptyTicks:totalEmpty,coalStockouts,dryRoomLosses:dryLosses,dryRoomRecoveries:dryRecoveries,
  fullLifeSinceStart:FULL.every(x=>countsBefore.has(x)||countsWinter.has(x)),winterFullLife:FULL.every(x=>countsWinter.has(x)),
  winterFullLifeMissing:FULL.filter(x=>!countsWinter.has(x)),roofRepairs:w.household.fabric.roofRepaired,
  floorRepairs:w.household.fabric.floorRepaired,winterActions:actions,winterGoalLog:selectedGoals,
  winterNeedTrajectory:survivalNeedSamples,readCount:lastReadCount,runtimeMs:Math.round(performance.now()-begun)};
}
function runVariant(variant){
 const t=performance.now(),runs=[];for(let seed=1;seed<=10;seed++)runs.push(runOne(seed,variant));
 const survival=runs.filter(x=>x.survived).length;
 return {id:variant.id,fairSpawn:variant.fair,maslowGate:variant.gate,reportPaymentDelay:variant.paymentDelay,
  seeds:10,survived:survival,dead:10-survival,fullLifeWinter:runs.filter(x=>x.winterFullLife).length,
  fullLifeSinceStart:runs.filter(x=>x.fullLifeSinceStart).length,
  reachedNovember:runs.filter(x=>x.winterReached).length,
  dryRoomLosses:runs.reduce((n,x)=>n+x.dryRoomLosses.length,0),dryRoomRecoveries:runs.reduce((n,x)=>n+x.dryRoomRecoveries.length,0),
  coalEmptyTicks:runs.reduce((n,x)=>n+x.coalEmptyTicks,0),
  deathCauses:runs.reduce((a,x)=>{if(!x.survived){const cause=x.deathCause||'prewinter_death';a[cause]=(a[cause]||0)+1}return a},{}),
  terminalWallets:runs.map(x=>x.finalWallet),runtimeMs:Math.round(performance.now()-t),runs};
}
function run(){
 const t=performance.now(),variants=scenarios.map(runVariant);
 const gated=variants.filter(v=>v.maslowGate),needOneKnob=gated.every(v=>v.survived<5);
 if(needOneKnob){
  for(const basis of scenarios.filter(v=>v.gate))variants.push(runVariant({...basis,id:basis.id+'_report_delay_12',paymentDelay:12}));
 }
 const out={kind:'winter_fair_spawn_balance_v3',protocol:'docs/FOLIO_MEMORY_PREREGISTRATION_V3.md',engine:'new_knowledge_and_survival_controller',
  originalNovV2:'results/winter_60_day.json',originalDiagnostic:'results/winter_diagnosis_original.json',
  physicsUntouchedExceptScenarioAndOnePredeclaredOptionalDelay:true,
  scenarioAutumnStores:storeBoost,onramp:{startDate:'1899-09-01',preludeDays:61,winterMeasurementStart:'1899-11-01'},
  maslowFloor:'hunger>=80 / thirst>=78 / health<=35 / local warmth<34 in winter',oneKnobCondition:'both gated 60-day survival <5/10',
  oneKnobApplied:needOneKnob,oneKnob:{parameter:'research payment postal delay in ten-minute ticks',before:22,after:needOneKnob?12:null},
  durationMs:Math.round(performance.now()-t),variants};
 const dest=path.join(__dirname,'../results');fs.mkdirSync(dest,{recursive:true});
 fs.writeFileSync(path.join(dest,'winter_balance_v3.json'),JSON.stringify(out,null,2)+'\n');
 const lines=['# Winter v3: declared fair spawns, needs floor, and at most one economy adjustment','',
  'Original November v2 benchmark and its separate pre-change diagnostic remain frozen. These are **scenario comparisons**, not retroactively amended controls.',
  `Autumn-store assumption: ${JSON.stringify(storeBoost)}; September on-ramp: 61 days before November 1. Each variant is seeds 1..10 and measures 60 winter days or earlier death.`,
  `Economy adjustment applied: ${needOneKnob?'YES, research-payment receipt delay 22 to 12 ticks only':'NO'}. Total measured Node runtime: ${out.durationMs} ms.`,
  '','| Variant | November reached | 60-day survivors | Winter full-life | Coal-empty ticks | Dry loss/recovery | Final wallets | Runtime ms |',
  '|---|---:|---:|---:|---:|---|---|---:|',
  ...variants.map(v=>`| ${v.id} | ${v.reachedNovember}/10 | ${v.survived}/10 | ${v.fullLifeWinter}/10 | ${v.coalEmptyTicks} | ${v.dryRoomLosses}/${v.dryRoomRecoveries} | ${v.terminalWallets.join(',')} | ${v.runtimeMs} |`),
  '','The JSON preserves all individual live days, daily wallets and health, hourly needs, hunger/thirst, death receipts, coal-stockout intervals, dry-room changes, full-life evidence, survival-gate scoring and action traces.',
  '','Interpretation must distinguish supply generosity from controller improvement, and survival failure from partial-life richness. Source world facts, prices, harvest yields and weather were not retuned. A conditional single report delay comparison does not validate a general economy overhaul.'];
 fs.writeFileSync(path.join(dest,'winter_balance_v3.md'),lines.join('\n')+'\n');
 console.log(JSON.stringify({oneKnobApplied:needOneKnob,durationMs:out.durationMs,variants:variants.map(v=>({id:v.id,survived:v.survived,reachedNovember:v.reachedNovember,dead:v.dead,fullLifeWinter:v.fullLifeWinter,coalEmptyTicks:v.coalEmptyTicks,dryRoomLosses:v.dryRoomLosses,deathCauses:v.deathCauses,runtimeMs:v.runtimeMs}))}));
 return out;
}
if(require.main===module)run();
module.exports={run};
