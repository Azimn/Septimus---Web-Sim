'use strict';
// New independent v5 benchmark. Read-only, never rewrites a frozen result.
// Run: node tests/winter_continuity_v5.js
const World=require('../src/world'),Sim=require('../src/simulation'),Diary=require('../src/diary'),Cal=require('../src/calendar'),Pantry=require('../src/pantry');
const records=Diary.loadArchive().records;
const catalog=records.map((r,index)=>({index,id:r.event_id,participants:r.participants||[],locations:r.locations||[],recall_cues:r.recall_cues||[]}));
const FIELDS=['hunger','thirst','fatigue','bladder','boredom'];
const FULL=['drink_sink','eat_meal','cook','harvest','catalog_order','collect_parcel','read_section','experiment'];
const scenarios=[
 {id:'september_onramp_gated',day:63,prelude:61*144,stores:false},
 {id:'november_autumn_stores_gated',day:124,prelude:0,stores:true}
];
function run(seed,scenario){
 let w=World.fresh(seed);w.day=scenario.day;w.policyOptions={survivalFloor:true};w.scenarioEconomy={reportPaymentDelay:22};
 if(scenario.stores){w.household.coal.dry+=20;w.stock.vegetables+=8;w.stock.grain+=6;w.stock.milk+=4;w.stock.meals+=6;}
 const counts={},walkTargets={},spending={},income={reports:0,posted:0,paid:0,earned:0};
 const peaks=Object.fromEntries(FIELDS.map(f=>[f,0])),critical=Object.fromEntries(FIELDS.map(f=>[f,0]));
 let walkedTicks=0,observed=0,months=0,coalEmptyTicks=0,localColdTicks=0,heatActions=0,novemberReached=false;
 const total=scenario.prelude+60*144;
 const eventsEver=new Set(),eventsWinter=new Set(),daily=[],lastLife=[];
 for(let t=0;t<total&&w.alive;t++){
  const before=Pantry.portions(w.stock),res=Sim.step(w,{__historyCount:records.length,__folioCatalog:catalog});w=res.state;
  const inWinter=t>=scenario.prelude;
  if(inWinter){novemberReached=true;observed++;}
  if(res.events.some(e=>e.kind==='walk')&&inWinter)walkedTicks++;
  for(const e of res.events){
   eventsEver.add(e.kind);
   if(inWinter){eventsWinter.add(e.kind);counts[e.kind]=(counts[e.kind]||0)+1;}
   if(e.kind==='walk'&&inWinter)walkTargets[e.details.objectId]=(walkTargets[e.details.objectId]||0)+1;
   if(e.kind==='experiment')income.reports++;
   if(e.kind==='report_posted')income.posted++;
   if(e.kind==='collect_payment'){income.paid++;income.earned+=e.details.amount;}
   if(e.kind==='catalog_order')spending[e.description.split('to ').at(-1)]=(spending[e.description.split('to ').at(-1)]||0)+e.details.price;
   if(e.kind==='burn_coal'&&inWinter)heatActions++;
  }
  if(inWinter){
   for(const f of FIELDS){peaks[f]=Math.max(peaks[f],w.needs[f]);if(w.needs[f]>=90)critical[f]++;}
   if(w.household.coal.dry+w.household.coal.wet===0)coalEmptyTicks++;
   if(require('../src/household').comfort(w,World.roomAt(w.position.x,w.position.y)).warmth<34)localColdTicks++;
  }
  if(w.tick%144===0)daily.push({date:Cal.dateForDay(w.day),wallet:w.wallet,food:Pantry.portions(w.stock),coal:w.household.coal.dry+w.household.coal.wet,health:+w.health.toFixed(2),needs:Object.fromEntries(FIELDS.map(f=>[f,+w.needs[f].toFixed(1)]))});
 }
 return {seed,id:scenario.id,alive:w.alive,survived:w.alive&&observed===60*144,novemberReached,observedWinterTicks:observed,deathCause:w.deathCause,date:Cal.dateForDay(w.day),
  wallet:w.wallet,food:Pantry.portions(w.stock),coal:w.household.coal.dry+w.household.coal.wet,health:+w.health.toFixed(2),
  terminalNeeds:Object.fromEntries(FIELDS.map(f=>[f,+w.needs[f].toFixed(1)])),peaks:Object.fromEntries(FIELDS.map(f=>[f,+peaks[f].toFixed(1)])),critical,
  walkedTicks,walkShare:+(walkedTicks/Math.max(1,observed)).toFixed(4),walkTargets,coalEmptyTicks,localColdTicks,heatActions,
  counters:counts,spending,income,fullLifeWinter:FULL.every(x=>eventsWinter.has(x)),fullLifeEver:FULL.every(x=>eventsEver.has(x)),lastDays:daily.slice(-5)};
}
const variants=scenarios.map(s=>({id:s.id,runs:Array.from({length:10},(_,i)=>run(i+1,s))}));
for(const v of variants){v.survivors=v.runs.filter(x=>x.survived).length;v.novemberReached=v.runs.filter(x=>x.novemberReached).length;v.fullLifeWinter=v.runs.filter(x=>x.fullLifeWinter).length;v.walkShareAvg=+(v.runs.reduce((t,r)=>t+r.walkShare,0)/10).toFixed(4);v.coalEmptyTicks=v.runs.reduce((t,r)=>t+r.coalEmptyTicks,0);}
console.log('V5WINTER_JSON '+JSON.stringify({name:'independent_one_house_v5',version:1,scenarios:variants,modelCalls:0,noAddedResources:true,priorGenerationsUntouched:true}));
