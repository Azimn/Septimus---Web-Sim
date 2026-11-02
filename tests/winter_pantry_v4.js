'use strict';
// Fair-spawn scenarios, strict gate control, optional ONE predeclared economy sensitivity.
// Frozen original-policy diagnosis lives in winter_diagnosis_original.* and is never regenerated here.
const fs=require('node:fs'),path=require('node:path');
const W=require('../src/world'),S=require('../src/simulation'),D=require('../src/diary'),H=require('../src/household'),Cal=require('../src/calendar'),Pantry=require('../src/pantry');
const a=D.loadArchive(),catalog=a.records.map((r,index)=>({index,id:r.event_id,participants:r.participants||[],locations:r.locations||[],recall_cues:r.recall_cues||[]}));
const FULL=['drink_sink','eat_meal','cook','harvest','catalog_order','collect_parcel','read_section','experiment'];
const scenarios=[
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
  finalPantry:Pantry.plan(w),finalLocalWarmth:H.comfort(w,W.roomAt(w.position.x,w.position.y)).warmth,
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
function failure(r){
 if(r.survived)return 'survived';
 const pantry=r.finalPantry||{};
 if(r.finalNeeds.hunger>=99&&pantry.onHand===0)return 'food_refill_loop_no_cookable_servings';
 if(r.finalNeeds.thirst>=99)return 'water_refill_loop';
 if(r.finalHealth<=0&&r.finalLocalWarmth<34)return 'cold_health_damage_loop';
 if(r.finalHealth<=0)return 'other_health_damage_or_unclassified';
 return 'premature_end_unclassified';
}
function run(){
 const time=performance.now(),variants=scenarios.map(runVariant);
 for(const v of variants){v.failureLoops={};
  for(const r of v.runs){r.failureLoop=failure(r);v.failureLoops[r.failureLoop]=(v.failureLoops[r.failureLoop]||0)+1;}
 }
 const out={kind:'winter_v4_standing_pantry_habit',sourceProtocol:'docs/NEEDS_ARITHMETIC_AUDIT.md',
  previous:'results/winter_balance_v3.json',priorFrozen:true,
  mechanisms:'A03 cold fatigue, A05 boredom, A07 health, A14 pantry and A16 impossible cook',
  pricesUnchangedPerCookablePortion:true,conditionalEconomyKnobUsed:false,modelCalls:0,
  seeds:[1,2,3,4,5,6,7,8,9,10],window:'September 1 + 61 days or November 1 + 60 days',
  variantsRun:scenarios.map(s=>s.id),runtimeMs:Math.round(performance.now()-time),variants};
 const dest=path.join(__dirname,'../results');fs.mkdirSync(dest,{recursive:true});
 fs.writeFileSync(path.join(dest,'winter_pantry_v4.json'),JSON.stringify(out,null,2)+'\n');
 const md=['# Winter v4: fixed arithmetic plus standing pantry, only two gated scenarios','',
  'Prior v3 results remain frozen. Same seeds, same 61-day September on-ramp, same 60-day winter window, and exactly the original November autumn-store bonus. No new income or coal price tuning.',
  '','| Scenario | Reached Nov | 60-day survivors | Winter full-life | Coal-empty ticks | Dry-room loss/recovery | Failure loops | Runtime ms |',
  '|---|---:|---:|---:|---:|---|---|---:|',
  ...variants.map(v=>`| ${v.id} | ${v.reachedNovember}/10 | ${v.survived}/10 | ${v.fullLifeWinter}/10 | ${v.coalEmptyTicks} | ${v.dryRoomLosses}/${v.dryRoomRecoveries} | ${JSON.stringify(v.failureLoops)} | ${v.runtimeMs} |`),
  '','| Variant/seed | Death/final date | Survived | Wallet | Hunger | Thirst | Health | Coal | Food equivalents | Cause/failed loop |',
  '|---|---|---|---:|---:|---:|---:|---:|---:|---|',
  ...variants.flatMap(v=>v.runs.map(r=>`| ${v.id}/${r.seed} | ${r.finalDate} | ${r.survived} | ${r.finalWallet} | ${r.finalNeeds.hunger.toFixed(1)} | ${r.finalNeeds.thirst.toFixed(1)} | ${r.finalHealth.toFixed(1)} | ${r.coalStockouts.length} stock-outs | ${r.finalPantry.onHand} | ${r.deathCause||'alive'} / ${r.failureLoop} |`)),
  '','All daily wallets, actual goal selections, needs and winter cold losses, coal outages, pre-November failures and eight-action full-life flags are in the unedited JSON.',
  '','Limitations: a labeled death cause is not sufficient causal diagnosis. Where two resource loops fail together, the last-row loop label is the primary observed missing supply, not a complete counterfactual attribution. Existing v3 scenario resource boosts remain explicit. The standing pantry habit was not learned from a folio.'];
 fs.writeFileSync(path.join(dest,'winter_pantry_v4.md'),md.join('\n')+'\n');
 console.log(JSON.stringify({runtimeMs:out.runtimeMs,variants:variants.map(v=>({id:v.id,reachedNovember:v.reachedNovember,survived:v.survived,fullLifeWinter:v.fullLifeWinter,coalEmptyTicks:v.coalEmptyTicks,losses:v.dryRoomLosses,failureLoops:v.failureLoops,terminalWallets:v.terminalWallets}))}));
 return out;
}
if(require.main===module)run();
module.exports={run};
