'use strict';
// V1.8 exact-source year and matched three-month scenario measurements.
// No mutation of archive, kernel, or prior evidence; no artificial rescue.
const {fresh,archive}=require('./v12_probe');
const {advance,log}=require('../src/engine');
const C=require('../src/commitments');
const crypto=require('node:crypto');
// Exact byte count for the src/store.js save() payload. Timestamp is fixed
// for repeatable evidence but has the same ISO length as a real save.
function saveBytes(s){
 const raw=JSON.stringify(s),hash=crypto.createHash('sha256').update(raw).digest('hex');
 return Buffer.byteLength(JSON.stringify({
  format:'simple-tower-save-v1',hash,savedAt:'1899-07-01T00:00:00.000Z',state:s
 },null,2),'utf8');
}
const Social=require('../src/social');
const DAY=100000,STEPPER=1000,MONTH=30;
const round=n=>Math.round(n*100)/100;
function oneDay(s){advance(s,archive,STEPPER);return s;}
function summarySeries(s){
 return Object.values(s.series||{}).map(r=>({
  id:r.id,opened:r.instances.length,kept:r.kept,broken:r.broken,
  keptStreak:r.keptStreak,brokenStreak:r.brokenStreak,
  avgCompletionTicks:r.averageCompletionTicks,
  instances:r.instances.map(id=>{
   const c=s.commitments.find(x=>x.id===id);
   return {id,ordinal:c?.seriesOrdinal,status:c?.status||'open',
    openedAt:c?.openedAt,deadline:c?.deadline,keptAt:c?.keptAt||null,
    brokenAt:c?.brokenAt||null,cause:c?.breakCause||null,
    progress:c?.progressCount||0,required:c?.requiredProgress||1,
    generationEventId:c?.generationEventId||null,
    resolutionEventId:c?.resolutionEventId||null};
  })
 }));
}
function account(s){
 const p=s.people.visitor_01;
 return {balance:p.account?.balance||0,creditLimit:p.account?.creditLimit||null,
  statements:(p.account?.statements||[]).map(x=>({
   period:x.period,openingBalance:x.openingBalance,charges:x.charges,
   dueBalance:x.dueBalance,paid:x.paid??null,closingBalance:x.closingBalance??null,
   status:x.status,chargeEventIds:x.chargeEventIds,tradeIds:x.spotTradeReceipts.map(e=>e.id),
   settlementEventId:x.settlementEventId||null,frictionEventId:x.frictionEventId||null,
   carriedFrom:x.rolledInto??null
  }))};
}
function snapshot(s,elapsed){
 const perKind=Object.values(s.habitProfiles).filter(x=>x.formed).length;
 const pred=s.predictions.length,hits=s.predictions.filter(x=>x.hit).length;
 return {elapsedDay:elapsed,worldDay:s.clock.day,tick:s.clock.centibeats,
  health:round(s.health),dead:s.dead,
  stores:{...s.stores},garden:{...s.garden},
  skills:{...s.skills},habitsFormed:perKind,habitCounts:Object.keys(s.habits).length,
  quirks:s.quirks.length,activeQuirkBonuses:s.quirks.filter(q=>q.bonus>0).length,
  predictions:pred,predictorAccuracy:pred?round(hits/pred):null,
  trust:{rosa:round(s.people.visitor_01.trust||0),mcfeely:round(s.people.mcfeely?.trust||0)},
  relationshipEncounters:{rosa:s.people.visitor_01.liveEncounters||0,
   mcfeely:s.people.mcfeely?.liveEncounters||0},
  eventLogEntries:s.events.length,eventLogBytes:Buffer.byteLength(JSON.stringify(s.events),'utf8'),
  diaryEntries:s.diary.length,diaryBytes:Buffer.byteLength(JSON.stringify(s.diary),'utf8'),
  renderedDiaryEntries:(s.renderedDiary||[]).length,
  renderedDiaryBytes:Buffer.byteLength(JSON.stringify(s.renderedDiary||[]),'utf8'),
  operatorMetadataEntries:(s.operatorMetadata||[]).length,
  folioReadEntries:s.folioReads.length,
  series:summarySeries(s).map(r=>({id:r.id,opened:r.opened,kept:r.kept,broken:r.broken,
   keptStreak:r.keptStreak,brokenStreak:r.brokenStreak,avgCompletionTicks:r.avgCompletionTicks})),
  serializedSaveBytes:saveBytes(s)};
}
function periodResult(i,days){
 const full=days.filter(x=>x.elapsedDay>i*MONTH&&x.elapsedDay<=Math.min(days.at(-1).elapsedDay,(i+1)*MONTH));
 const events=full.flatMap(x=>x.events);
 const counts={},retained=new Set();
 for(const e of events)if(e.type==='completed')counts[e.kind]=(counts[e.kind]||0)+1;
 const collapseDays=full.filter((d,j)=>j>0&&d.distinctKinds<=2&&full[j-1].distinctKinds<=2).map(d=>d.elapsedDay);
 return {period:i+1,days:full.length,elapsedStart:full[0]?.elapsedDay||null,
  elapsedEnd:full.at(-1)?.elapsedDay||null,
  harvestWaste:events.filter(e=>e.type==='harvest').reduce((n,e)=>n+(e.wasted||0),0),
  harvestDeferrals:events.filter(e=>e.type==='harvest_deferred').length,
  expiredFresh:events.filter(e=>e.type==='spoilage'&&e.stock==='food').reduce((n,e)=>n+e.amount,0),
  expiredPreserved:events.filter(e=>e.type==='spoilage'&&e.stock==='preserved').reduce((n,e)=>n+e.amount,0),
  preservedEaten:events.filter(e=>e.type==='meal_stock'&&e.sourceStock==='preserved').length,
  settlementEvents:events.filter(e=>e.type==='merchant_settlement').map(e=>e.id),
  statementIssuedEvents:events.filter(e=>e.type==='merchant_statement_issued').map(e=>e.id),
  accountFrictionEvents:events.filter(e=>e.type==='merchant_credit_carried').map(e=>e.id),
  generatedSeries:events.filter(e=>e.type==='series_instance_generated').map(e=>({id:e.instanceId,rule:e.rule,sourceEventId:e.id})),
  brokenSeries:events.filter(e=>e.type==='series_outcome'&&e.status==='broken').map(e=>({id:e.instanceId,cause:e.cause})),
  ruminations:events.filter(e=>e.type==='rumination').length,
  failedSeriesRuminations:events.filter(e=>e.type==='rumination'&&e.seriesId).map(e=>({id:e.id,seriesId:e.seriesId,brokenStreak:e.seriesBrokenStreak})),
  actionCounts:counts,softlockedDays:full.filter(d=>d.completed===0).map(d=>d.elapsedDay),
  sustainedNarrowDays:collapseDays,
  predicted:events.filter(e=>e.type==='prediction').length,
  predictionHits:events.filter(e=>e.type==='prediction'&&e.hit).length,
  firstHealth:full[0]?.health||null,lastHealth:full.at(-1)?.health||null,
  minHealth:full.length?Math.min(...full.map(x=>x.health)):null,
  maxHealth:full.length?Math.max(...full.map(x=>x.health)):null,
  minStores:Object.fromEntries(Object.keys(full[0]?.stores||{}).map(k=>[k,Math.min(...full.map(x=>x.stores[k]||0))])),
  trustBand:{
   rosa:[Math.min(...full.map(x=>x.trust.rosa)),Math.max(...full.map(x=>x.trust.rosa))],
   mcfeely:[Math.min(...full.map(x=>x.trust.mcfeely)),Math.max(...full.map(x=>x.trust.mcfeely))]
  },
  skillDelta:full.length?round(full.at(-1).skills.science-full[0].skills.science):0
 };
}
function life(seed,horizon){
 const s=fresh(seed),snapshots=[snapshot(s,0)],days=[],intervals=Math.ceil(horizon/MONTH),
  flags={negativeStock:null,batchMismatch:null,healthOutside:null,trustOutside:null,
   silentTopup:null,skillInflation:null};
 let cursor=0,firstDeath=null;
 for(let elapsed=1;elapsed<=horizon;elapsed++){
  if(s.dead)s.calendarContinuesAfterDeath=true;
  oneDay(s);
  const events=s.events.slice(cursor);cursor=s.events.length;
  const completed=events.filter(e=>e.type==='completed'),
   stocks={...s.stores},traits={rosa:s.people.visitor_01.trust||0,mcfeely:s.people.mcfeely?.trust||0};
  const row={elapsedDay:elapsed,worldDay:s.clock.day,tick:s.clock.centibeats,
   completed:completed.length,distinctKinds:new Set(completed.map(e=>e.kind)).size,
   health:round(s.health),dead:s.dead,stores:stocks,
   trust:traits,skills:{...s.skills},quirks:s.quirks.length,
   events};
  days.push(row);
  if(!firstDeath&&s.dead)firstDeath={day:elapsed,tick:s.clock.centibeats,
   eventId:s.events.findLast(e=>e.type==='death')?.id};
  if(!flags.negativeStock&&Object.entries(stocks).some(([,v])=>!Number.isFinite(v)||v<0))
   flags.negativeStock={day:elapsed,stocks};
  if(!flags.batchMismatch){
   const totals={food:(s.freshBatches||[]).reduce((n,x)=>n+x.quantity,0),
    preserved:(s.preservedBatches||[]).reduce((n,x)=>n+x.quantity,0)};
   if(totals.food!==stocks.food||totals.preserved!==stocks.preserved)
    flags.batchMismatch={day:elapsed,totals,actual:stocks};
  }
  if(!flags.silentTopup&&[...(s.freshBatches||[]),...(s.preservedBatches||[])].some(b=>b.source==='legacy_intervention'))
   flags.silentTopup={day:elapsed,reason:'intervention_batch_in_unattended_run'};
  if(!flags.healthOutside&&(s.health<0||s.health>100||!Number.isFinite(s.health)))
   flags.healthOutside={day:elapsed,health:s.health};
  if(!flags.trustOutside&&Object.values(traits).some(x=>x<-100||x>99.99))
   flags.trustOutside={day:elapsed,traits};
  if(!flags.skillInflation&&elapsed>=120&&s.skills.science>600)
   flags.skillInflation={day:elapsed,value:s.skills.science,rule:'science greater than 600 after 120 days'};
  if(elapsed===1||elapsed%MONTH===0||elapsed===horizon)snapshots.push(snapshot(s,elapsed));
 }
 const monthly=Array.from({length:intervals},(_,i)=>periodResult(i,days));
 const series=summarySeries(s),accountLedger=account(s);
 const allInstances=series.flatMap(x=>x.instances.map(c=>({...c,seriesId:x.id})));
 const invalidInstances=allInstances.filter(c=>!['kept','broken'].includes(c.status)&&
  !(c.status==='open'&&c.deadline>=s.clock.centibeats));
 const ungenerated=allInstances.filter(c=>c.seriesId!=='DAILY-HEARTH'||c.ordinal!==1)
  .filter(c=>!c.generationEventId);
 const statementMismatch=accountLedger.statements.filter(x=>
  x.dueBalance!==x.openingBalance+x.charges||
  x.status==='settled'&&(x.paid+x.closingBalance!==x.dueBalance));
 const allNegative=monthly.flatMap(x=>x.softlockedDays);
 const collapse=monthly.flatMap(x=>x.sustainedNarrowDays);
 const yearly=seed===11&&horizon===365;
 const invariants={
  noDeath:!firstDeath,
  noFullDaySoftlock:allNegative.length===0,
  noSustainedTwoActionCollapse:collapse.length===0,
  healthWithinBounds:!flags.healthOutside,
  nonnegativeStores:!flags.negativeStock,
  noSilentTopups:!flags.silentTopup&&!flags.batchMismatch,
  seriesAllAccounted:invalidInstances.length===0&&ungenerated.length===0,
  relationshipBounds:!flags.trustOutside,
  monthlyHarvestWasteReported:monthly.every(x=>Number.isInteger(x.harvestWaste)),
  stateGrowthReported:snapshots.every(x=>Number.isInteger(x.serializedSaveBytes)&&Number.isInteger(x.eventLogEntries)),
  settlementReconciles:statementMismatch.length===0,
  scienceSkillSoftCeiling:s.skills.science<=600
 };
 // The skill threshold is an explicitly monitored scientific concern, not an
 // intervention. We preserve unmodified run evidence if it fails.
 const milestones={initialState:snapshots[0],
  day1:snapshots.find(x=>x.elapsedDay===1)||snapshots[0],
  dayEnd:snapshots.at(-1),start:snapshots.find(x=>x.elapsedDay===1)||snapshots[0],
  end:snapshots.at(-1),
  quarterPredictions:Array.from({length:Math.ceil(horizon/90)},(_,q)=>{
   const from=q*90+1,to=Math.min(horizon,(q+1)*90),slice=monthly.flatMap(x=>x.failedSeriesRuminations);
   const ev=days.filter(x=>x.elapsedDay>=from&&x.elapsedDay<=to).flatMap(x=>x.events).filter(x=>x.type==='prediction');
   return {quarter:q+1,days:[from,to],count:ev.length,hits:ev.filter(e=>e.hit).length,
    accuracy:ev.length?round(ev.filter(e=>e.hit).length/ev.length):null};
  })};
 const recentDecisions=s.decisions.slice(-25).map(x=>({tick:x.t,chosen:x.chosen,margin:x.margin,
  quirkFactors:x.candidates?.[0]?.quirkFactors?.length||0}));
 const trustComposition=Object.fromEntries(['visitor_01','mcfeely'].map(id=>{
  const actor=s.people[id]||{trust:0,events:[]},kinds={};
  for(const event of actor.events||[]){
   const kind=event.kind||'unspecified';
   const item=kinds[kind]??(kinds[kind]={count:0,netDelta:0,positive:0,negative:0});
   item.count++;item.netDelta+=event.delta||0;
   if(event.delta>0)item.positive+=event.delta;
   if(event.delta<0)item.negative+=event.delta;
  }
  for(const item of Object.values(kinds)){
   item.netDelta=round(item.netDelta);item.positive=round(item.positive);
   item.negative=round(item.negative);
  }
  return [id,{name:actor.name||id,trust:round(actor.trust||0),
   kindBreakdown:kinds,eventCount:(actor.events||[]).length}];
 }));
 const result={schema:'v1.8-life-v1',seed,horizon,sourceHead:process.env.GITHUB_SHA||'unknown',
  physicalDaysAdvanced:days.length,finalDead:s.dead,firstDeath,flags,invariants,
  firstSlowFailure:([
   ...Object.entries(flags).filter(([k,v])=>v&&k==='skillInflation').map(([k,v])=>({type:k,...v})),
   ...allNegative.map(day=>({type:'softlock',day})),
   ...collapse.map(day=>({type:'two_action_collapse',day})),
   ...Object.entries(flags).filter(([k,v])=>v&&k!=='skillInflation').map(([k,v])=>({type:k,...v}))
  ].sort((a,b)=>a.day-b.day)[0]||null),
  trustComposition,
  monthly:monthly.map(({failedSeriesRuminations,...r})=>({...r,
   failedSeriesRuminationCount:failedSeriesRuminations.length,
   failedSeriesRuminationSources:failedSeriesRuminations.slice(0,10)})),
  snapshots,series,account:accountLedger,
  anomalies:{invalidInstances,ungenerated,statementMismatch,softlockDays:allNegative,narrowDays:collapse},
  development:milestones,quirkInfluence:{
   finalQuirkCount:s.quirks.length,earnedBonusQuirks:s.quirks.filter(q=>q.bonus>0).length,
   recentDecisions},
  preservedRotation:{
   expired:monthly.reduce((n,x)=>n+x.expiredPreserved,0),
   eaten:monthly.reduce((n,x)=>n+x.preservedEaten,0),
   sampleExpiryEvents:days.flatMap(x=>x.events.filter(e=>e.type==='spoilage'&&e.stock==='preserved')).slice(0,12)
    .map(e=>({id:e.id,day:e.day,amount:e.amount,shelfLifeDays:e.shelfLifeDays}))
  }
 };
 return result;
}
function threeMonths(){
 const s=fresh(11),start=s.clock.centibeats,events=[];
 for(let i=0;i<90;i++)oneDay(s);
 const monthly=summarySeries(s).filter(x=>x.id.startsWith('MONTH-'));
 return {seed:11,days:90,monthly,generated:s.events.filter(x=>x.type==='series_instance_generated')
  .filter(x=>x.seriesId.startsWith('MONTH-')).map(e=>({id:e.id,instanceId:e.instanceId,
   seriesId:e.seriesId,ordinal:e.ordinal,rule:e.rule,scheduledDay:e.scheduledDay,
   deadline:e.deadline})),dead:s.dead};
}
function forcedFork(){
 const base=fresh(11),fork=fresh(11);
 // Both histories are identical through day 52; only plot availability changes.
 for(let day=1;day<=90;day++){
  if(day===53){
   fork.worldLosses.plot=59*DAY;
   log(fork,'operator_fork_intervention','The garden plot was made inaccessible through month-two provisions deadline.',{
    target:'plot',until:59*DAY,experimentOnly:true});
  }
  oneDay(base);oneDay(fork);
 }
 const relevant=s=>s.events.filter(e=>e.type==='rumination'&&e.t>=56*DAY&&e.t<63*DAY);
 const trail=s=>summarySeries(s).find(x=>x.id==='MONTH-PROVISIONS');
 const report=s=>({month2:s.commitments.find(c=>c.id==='MONTH-PROVISIONS@02'),
  month3:s.commitments.find(c=>c.id==='MONTH-PROVISIONS@03'),
  series:trail(s),
  afterFailureRuminations:relevant(s).filter(e=>e.seriesId==='MONTH-PROVISIONS').length,
  totalRuminations:relevant(s).length});
 const a=report(base),b=report(fork);
 return {seed:11,intervention:{target:'plot',startDay:53,endDay:59},
  baseline:a,forced:b,deltaFailedRumination:b.afterFailureRuminations-a.afterFailureRuminations};
}
function emit(prefix,value){
 const raw=Buffer.from(JSON.stringify(value),'utf8').toString('base64');
 console.log(prefix+'_BEGIN '+raw.length);
 for(let i=0;i<raw.length;i+=1900)console.log(prefix+'_PART '+Math.floor(i/1900)+' '+raw.slice(i,i+1900));
 console.log(prefix+'_END '+Math.ceil(raw.length/1900));
}
function main(){
 const mode=process.argv.includes('--year')?'year':'scenario';
 if(mode==='scenario'){
  const result={schema:'v1.8-scenario-v1',sourceHead:process.env.GITHUB_SHA||'unknown',
   threeMonths:threeMonths(),forcedFork:forcedFork()};
  emit('V18_SCENARIO',result);
  console.log('V18_SCENARIO_SUMMARY '+JSON.stringify({
   recurrence:result.threeMonths.monthly.map(x=>({id:x.id,opened:x.opened,kept:x.kept,broken:x.broken})),
   fork:{baseline:result.forcedFork.baseline.month2?.status,
    forced:result.forcedFork.forced.month2?.status,
    next:result.forcedFork.forced.month3?.status,ruminationDelta:result.forcedFork.deltaFailedRumination}}));
 }else{
  const year=life(11,365),halfYear=life(14,180);
  emit('V18_YEAR', {schema:'v1.8-year-pair-v1',sourceHead:process.env.GITHUB_SHA||'unknown',year,halfYear});
  for(const x of [year,halfYear])console.log('V18_LONG '+JSON.stringify({
   seed:x.seed,days:x.physicalDaysAdvanced,first:x.firstSlowFailure,
   acceptance:x.invariants,science:x.development.end.skills.science,
   quirks:x.development.end.quirks,savedBytes:x.development.end.serializedSaveBytes,
   expiredPreserved:x.preservedRotation.expired,settlements:x.account.statements.length}));
 }
}
if(require.main===module)main();
module.exports={life,threeMonths,forcedFork,main};
