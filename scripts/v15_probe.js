'use strict';
// Five 30-day matched-seed new-economy comparisons and one unrescued 90-day life.
// All receipts come from the real event store. Never reinterpret broken goals as kept.
const fs=require('node:fs'),path=require('node:path');
const {fresh,archive,SEEDS}=require('./v12_probe');
const {runSeed}=require('./v14_probe');
const {advance}=require('../src/engine');
const {ECONOMY,SURPLUS,BODY_LIMITS}=require('../src/economy');
const DAY=100000,START=25000;
function sums(events,type,filter=()=>true){return events.filter(e=>e.type===type&&filter(e));}
function summaryOfSurplus(s,baselineWaste){
 const e=s.events,harvest=sums(e,'harvest'),preserved=sums(e,'preservation'),trades=sums(e,'trade_receipt'),
  spoiled=sums(e,'spoilage'),meal=sums(e,'meal_stock');
 const actualWaste=harvest.reduce((sum,x)=>sum+(x.wasted??Math.max(0,ECONOMY.harvestFood-(x.amount||0))),0);
 const physicalBalance=events=>events.map(x=>({id:x.id,t:x.t,controller:x.controller||null,source:x.sourceStock,
   before:x.before,after:x.after,inputs:x.inputs,output:x.output,received:x.received,
   payment:x.payment,unitsGiven:x.unitsGiven,unitsReceived:x.unitsReceived,amount:x.amount,
   target:x.target,personId:x.personId}));
 return {baselineWaste,actualWaste,wasteSaved:baselineWaste-actualWaste,
  wasteReductionRate:baselineWaste>0?(baselineWaste-actualWaste)/baselineWaste:null,
  preserved:s.stores.preserved,food:s.stores.food,tea:s.stores.tea,fuel:s.stores.fuel,
  preservationActions:preserved.length,tradeActions:trades.length,spoilageEvents:spoiled.length,
  preservedProduced:preserved.reduce((n,e)=>n+e.output.preserved,0),
  freshUsedForPreservation:preserved.reduce((n,e)=>n+e.inputs.food,0),
  preservedConsumed:meal.filter(x=>x.sourceStock==='preserved').length,
  expiredFood:spoiled.filter(x=>x.stock==='food').reduce((n,e)=>n+e.amount,0),
  expiredPreserved:spoiled.filter(x=>x.stock==='preserved').reduce((n,e)=>n+e.amount,0),
  tradeFoodGiven:trades.reduce((n,e)=>n+e.unitsGiven,0),
  tradeFuelReceived:trades.filter(e=>e.received==='fuel').reduce((n,e)=>n+e.unitsReceived,0),
  tradeTeaReceived:trades.filter(e=>e.received==='tea').reduce((n,e)=>n+e.unitsReceived,0),
  harvestReceipts:harvest.map(x=>({id:x.id,t:x.t,before:x.before,amount:x.amount,
   potential:x.potential,wasted:x.wasted,after:x.after})),
  preservationReceipts:physicalBalance(preserved),tradeReceipts:physicalBalance(trades),
  mealReceipts:physicalBalance(meal),spoilageReceipts:physicalBalance(spoiled),
  tradeSocialLinks:sums(e,'trade_link').map(x=>({id:x.id,t:x.t,tradeEventId:x.tradeEventId,socialEventId:x.socialEventId})),
  relationshipTradeEffects:sums(e,'social',x=>x.kind==='trade').map(x=>({id:x.id,t:x.t,delta:x.delta,trust:x.trust})),
  correspondingTradeWorldEvents:trades.every(x=>e.some(y=>y.type==='social'&&y.kind==='trade'&&
    e.some(z=>z.type==='trade_link'&&z.tradeEventId===x.id&&z.socialEventId===y.id))),
  conservation:{
   allPreservesDebited:preserved.every(x=>x.before.food-x.after.food===x.inputs.food&&
      x.before.preserved+x.output.preserved===x.after.preserved&&
      x.before.fuel-x.after.fuel===x.inputs.fuel),
   allTradesBalanced:trades.every(x=>x.before[x.payment]-x.unitsGiven===x.after[x.payment]&&
      x.before[x.received]+x.unitsReceived===x.after[x.received])
  }};
}
function month(){
 const runs=[];
 for(const seed of SEEDS){
  const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'..','evidence','v1.4','endurance','seed-'+seed+'.json'),'utf8'));
  const {summary,finalState}=runSeed(seed,{restart:seed===13});
  const surplus=summaryOfSurplus(finalState,baseline.monthDynamics.harvestCapWasteUnits);
  runs.push({...summary,surplus,comparison:{
    previousHead:'cc2065dd1f31a6db911736c592858aac10acc751',
    previousEndFood:baseline.finalStores.food,previousEndHealth:baseline.finalHealth,
    previousCompleted:baseline.activitiesTotal,previousVisitorTrust:baseline.trustEvents.at(-1)?.trust??0,
    previousWaste:baseline.monthDynamics.harvestCapWasteUnits,
    currentVisitorTrust:summary.trustEvents.at(-1)?.trust??0}});
 }
 return runs;
}
function ninety(){
 const s=fresh(11),daily=[],firstFailures=[],snapshots={day30:null,day60:null,day90:null};
 let steps=0,previousDay=s.clock.day;
 const snapshotsAt=new Set([30,60,90]);
 for(let i=0;i<90000&&!s.dead;i++){
  advance(s,archive,1);steps++;
  if(s.clock.centibeats===START+30*DAY)snapshots.day30=stateView(s);
  if(s.clock.centibeats===START+60*DAY)snapshots.day60=stateView(s);
  if(s.clock.centibeats===START+90*DAY)snapshots.day90=stateView(s);
  if(s.clock.day!==previousDay){
   const end=s.clock.centibeats,begin=end-DAY;
   const segment=s.events.filter(x=>x.t>begin&&x.t<=end);
   const completed=segment.filter(x=>x.type==='completed');
   const kinds=[...new Set(completed.map(x=>x.kind))];
   const failed=segment.filter(x=>x.type==='action_failed');
   const row={day:previousDay,finishTick:end,completed:completed.length,actionKinds:kinds,
    health:s.health,food:s.stores.food,preserved:s.stores.preserved||0,
    tea:s.stores.tea,fuel:s.stores.fuel,trust:s.people.visitor_01.trust,
    harvestWaste:segment.filter(x=>x.type==='harvest').reduce((n,x)=>n+(x.wasted||0),0),
    spoilage:segment.filter(x=>x.type==='spoilage').reduce((n,x)=>n+(x.amount||0),0),
    preservedActions:segment.filter(x=>x.type==='preservation').length,
    trades:segment.filter(x=>x.type==='trade_receipt').length,
    earnedQuirks:s.quirks.filter(x=>x.memoryClass==='lived_runtime_memory').length,
    failures:failed.map(x=>({id:x.id,reason:x.reason,kind:x.kind})),
    deadlinesBroken:segment.filter(x=>x.type==='commitment_broken').map(x=>x.commitmentId)};
   daily.push(row);previousDay=s.clock.day;
   if(!completed.length)firstFailures.push({t:end,day:row.day,type:'softlock',detail:'no completed action in 24 hours'});
   if(s.health<50)firstFailures.push({t:end,day:row.day,type:'health_drift',detail:s.health});
   if(s.stores.preserved>=SURPLUS.maxPreserved)firstFailures.push({t:end,day:row.day,type:'preserved_stock_cap',detail:s.stores.preserved});
   if(s.people.visitor_01.trust>100)firstFailures.push({t:end,day:row.day,type:'relationship_saturation',detail:s.people.visitor_01.trust});
   if(row.harvestWaste>0)firstFailures.push({t:end,day:row.day,type:'harvest_cap_waste',detail:row.harvestWaste});
   if(completed.length>=4){
    const most=Math.max(...Object.values(completed.reduce((m,x)=>(m[x.kind]=(m[x.kind]||0)+1,m),{})));
    if(most/completed.length>.75)firstFailures.push({t:end,day:row.day,type:'single_action_dominance',detail:most/completed.length});
   }
  }
 }
 const relevant=s.events.filter(e=>['trade_receipt','preservation','spoilage','custom_conflict',
 'custom_negotiation','quirk_matured','death','world_loss','commitment_broken'].includes(e.type));
 const surplus=summaryOfSurplus(s,null);
 const first=firstFailures.sort((a,b)=>a.t-b.t)[0]||null;
 return {seed:11,targetDays:90,daysCompleted:(s.clock.centibeats-START)/DAY,
  stepsExecuted:steps,terminalHealth:s.health,death:s.dead,terminalStores:s.stores,
  firstSlowFailure:first,allDeclaredFailures:firstFailures,dayByDay:daily,
  snapshots,worldEvents:relevant,monthlyCommitments:s.commitments.filter(c=>String(c.id).startsWith('MONTH-')),
  finalHabits:s.habitProfiles,quirkOrigins:s.quirks.filter(q=>q.memoryClass==='lived_runtime_memory'),
  predictorAccuracy:s.predictions.length?s.predictions.filter(x=>x.hit).length/s.predictions.length:null,
  surplus:summarize90(s,surplus)};
}
function stateView(s){return {t:s.clock.centibeats,day:s.clock.day,stores:{...s.stores},
 skills:{...s.skills},health:s.health,habits:structuredClone(s.habitProfiles),
 quirks:s.quirks.filter(x=>x.memoryClass==='lived_runtime_memory').map(x=>({...x})),
 trust:s.people.visitor_01.trust,
 actionCounts:s.events.filter(e=>e.type==='completed').reduce((m,e)=>(m[e.kind]=(m[e.kind]||0)+1,m),{}),
 commitments:s.commitments.filter(x=>String(x.id).startsWith('MONTH-')).map(x=>({id:x.id,status:x.status}))};}
function summarize90(s,extra){const {harvestReceipts,preservationReceipts,tradeReceipts,mealReceipts,spoilageReceipts,
 tradeSocialLinks,relationshipTradeEffects,...counts}=extra;return {
 ...counts,receiptCounts:{harvest:harvestReceipts.length,preservation:preservationReceipts.length,
 trade:tradeReceipts.length,meal:mealReceipts.length,spoilage:spoilageReceipts.length},socialTradeEvents:relationshipTradeEffects};}
function main(){
 const runs=month(),long=ninety();
 const baselineTotal=runs.reduce((sum,x)=>sum+x.surplus.baselineWaste,0),
  actualTotal=runs.reduce((sum,x)=>sum+x.surplus.actualWaste,0);
 const acceptance={
  fiveThirtyDayRuns:runs.length===5&&runs.every(x=>x.ticksExecuted===30000),
  fiveSurvive:runs.every(x=>!x.deathObserved&&x.finalHealth>0),
  conserved:runs.every(x=>x.surplus.conservation.allPreservesDebited&&x.surplus.conservation.allTradesBalanced),
  surplusNearZero:actualTotal<=Math.max(5,baselineTotal*.1),
  preservationUsed:runs.every(x=>x.surplus.preservationActions>0),
  tradeUsed:runs.every(x=>x.surplus.tradeActions>0),
  tradeLinkedToSocial:runs.every(x=>x.surplus.correspondingTradeWorldEvents),
  variantRemainsDiverse:runs.every(x=>x.softlocks.length===0&&x.varietyCollapseConsecutiveDays.length===0),
  ninetyDays:long.stepsExecuted===90000&&!long.death,
  snapshotClockExact:[30,60,90].every(day=>long.snapshots['day'+day]?.t===START+day*DAY)
 };
 const report={schema:'simple-tower-v1.5-evidence-v1',sourceHead:process.env.GITHUB_SHA||'unversioned',
 baselineSource:'evidence/v1.4/endurance',economyBaselineConstants:ECONOMY,
 surplusConstants:SURPLUS,bodyLimits:BODY_LIMITS,seeds:SEEDS,runs,longHorizon:long,
 baselineWasteTotal:baselineTotal,currentWasteTotal:actualTotal,wasteSaved:baselineTotal-actualTotal,acceptance};
 const encoded=Buffer.from(JSON.stringify(report),'utf8').toString('base64');
 console.log('V15_DATA_BEGIN '+encoded.length);
 for(let i=0;i<encoded.length;i+=1700)console.log('V15_DATA_PART '+Math.floor(i/1700)+' '+encoded.slice(i,i+1700));
 console.log('V15_DATA_END '+Math.ceil(encoded.length/1700));
 runs.forEach(x=>console.log('V15_SEED '+JSON.stringify({seed:x.seed,actions:x.activitiesTotal,
  food:x.finalStores.food,preserved:x.finalStores.preserved,health:x.finalHealth,
  wasteBefore:x.surplus.baselineWaste,wasteAfter:x.surplus.actualWaste,
  preservation:x.surplus.preservationActions,trades:x.surplus.tradeActions,trustDelta:x.comparison.currentVisitorTrust-x.comparison.previousVisitorTrust,
  death:x.deathObserved,variety:x.varietyCollapseConsecutiveDays})));
 console.log('V15_90DAY '+JSON.stringify({days:long.daysCompleted,dead:long.death,food:long.terminalStores.food,
  preserved:long.terminalStores.preserved,health:long.terminalHealth,firstSlowFailure:long.firstSlowFailure,
  spoilage:long.surplus.expiredFood+long.surplus.expiredPreserved,quirks:long.quirkOrigins.length}));
 console.log('V15_ACCEPTANCE '+JSON.stringify(acceptance));
}
if(require.main===module)main();
module.exports={month,ninety,main,summaryOfSurplus};
