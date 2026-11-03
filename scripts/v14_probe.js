'use strict';
// Reproducible v1.4 thirty-day autonomous endurance, with v1.3 economy constants untouched.
// Reports adverse outcomes without rescue, checkpoint rewind or score inflation.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {fresh,archive,identity,SEEDS}=require('./v12_probe');
const {advance,view}=require('../src/engine');
const {save,resume}=require('../src/store');
const {ECONOMY}=require('../src/economy');
const START=25000,DAY=100000,HORIZON=30*DAY;
function counts(rows,kind){const x={};for(const e of rows)if(e.type==='completed'){x[e.kind]=(x[e.kind]||0)+1;}return x;}
function peakOpenCommitments(events){
 let open=1,peak=1;
 for(const e of events){
  if(e.type==='commitment_opened')open++;
  if(['commitment_kept','commitment_broken','commitment_released'].includes(e.type))open=Math.max(0,open-1);
  peak=Math.max(peak,open);
 }
 return peak;
}
function snapshot(s,e){return {seed:s.seed,tick:e.t,day:e.day,eventId:e.id,kind:e.kind||e.chosen||null,
 type:e.type,text:e.description,room:e.room,controller:e.controller||null,
 needsOperatorOnly:{...s.needs},healthOperatorOnly:s.health,position:s.location,
 perceived:s.perception.map(x=>x.id),pendingCommitments:s.commitments.filter(c=>!c.done&&(c.status===undefined||c.status==='open')).map(c=>c.id),
 sourceFolioIds:s.folioReads.slice(-2).map(x=>x.id),decisionScore:e.score??null,decisionMargin:e.margin??null};}
function runSeed(seed,{restart=false}={}){
 let s=fresh(seed);const samples=[],observations=[null,null,null,null,null,null];
 const checkpoints=[],trajectory=[{tick:s.clock.centibeats,...s.stores,health:s.health}];
 const developmentSnapshots={start:{tick:s.clock.centibeats,skills:{...s.skills},habits:{...s.habits},quirks:structuredClone(s.quirks)},day1:null,day30:null};
 const resourceLosses=[];
 const targets=restart?[START+10*DAY+30000,START+24*DAY+30000]:[],file=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'tower-v13-')),'save.json');
 let interruptedAt=0,executed=0,lastDay=0;
 for(let i=0;i<30000;i++){
  if(s.dead)break;
  const prior=s.events.length;
  advance(s,archive,1);executed++;
  for(const e of s.events.slice(prior)){
   if(e.type==='decision'||e.type==='completed'){
    const bin=Math.min(5,Math.floor((s.clock.centibeats-START)/HORIZON*6));
    if(!observations[bin])observations[bin]=snapshot(s,e);
   }
  }
  if(s.clock.centibeats%DAY===0){
   trajectory.push({tick:s.clock.centibeats,...s.stores,health:s.health});
  }
  if(s.clock.centibeats===START+DAY)developmentSnapshots.day1={tick:s.clock.centibeats,skills:{...s.skills},habits:{...s.habits},quirks:structuredClone(s.quirks)};
  if(s.clock.centibeats===START+HORIZON)developmentSnapshots.day30={tick:s.clock.centibeats,skills:{...s.skills},habits:{...s.habits},quirks:structuredClone(s.quirks)};
  if(interruptedAt<targets.length&&s.clock.centibeats>=targets[interruptedAt]&&s.activity){
   const before=structuredClone(s),savedAt=1000+interruptedAt*86400000;
   save(file,s,{savedAtMs:savedAt});
   s=resume(file,identity,archive,{nowMs:savedAt+86400000});
   const last=s.events.at(-1),interval=last.interval;
   checkpoints.push({day:s.clock.day,tick:s.clock.centibeats,activity:before.activity.kind,
    identityPreserved:s.identitySha===before.identitySha,
    commitmentsPreserved:JSON.stringify(s.commitments)===JSON.stringify(before.commitments),
    habitsPreserved:JSON.stringify(s.habitProfiles)===JSON.stringify(before.habitProfiles),
    inProgressActivityPreserved:JSON.stringify(s.activity)===JSON.stringify(before.activity),
    pausedEventPresent:last.type==='paused',elapsedWallMs:interval?.elapsedMilliseconds,
    worldClockFrozen:interval?.startTick===interval?.endTick&&interval?.endTick===s.clock.centibeats});
   interruptedAt++;
  }
 }
 const events=s.events,prods=events.filter(e=>['harvest','planted','production'].includes(e.type));
 const within=(start,end,type)=>events.filter(e=>e.t>=start&&e.t<end&&(!type||e.type===type));
 const acc=rows=>({count:rows.length,hits:rows.filter(e=>e.hit===true).length,
  rate:rows.length?rows.filter(e=>e.hit===true).length/rows.length:null});
 const week1Events=within(START,START+7*DAY),week4Events=within(START+21*DAY,START+28*DAY);
 const quirkByOrigin=s.quirks.map(q=>({...q,sourceEvent:events.find(e=>e.id===q.originEventId)||null}));
 const monthly=s.commitments.filter(c=>String(c.id).startsWith('MONTH-'));
 const monthlyHistory=monthly.map(c=>({id:c.id,title:c.title,action:c.action,status:c.status||'open',
  opened:c.scheduledDay,deadline:c.deadline,sourceAction:c.sourceAction||null,keptAt:c.keptAt||null,
  brokenAt:c.brokenAt||null,stockTarget:c.stockTarget,
  progressEvents:events.filter(e=>e.commitmentId===c.id&&e.type==='commitment_progress').map(e=>e.id),
  interrupts:events.filter(e=>e.commitmentId===c.id&&e.type==='commitment_interrupted').map(e=>e.id),
  resumes:events.filter(e=>e.commitmentId===c.id&&e.type==='commitment_resumed').map(e=>e.id)}));
 const byDay=events.filter(e=>e.type==='completed').reduce((m,e)=>{m[e.day]??={};m[e.day][e.kind]=(m[e.day][e.kind]||0)+1;return m;},{});
 const customEvents=events.filter(e=>e.type==='custom_observed');
 const callbackEvents=events.filter(e=>e.type==='humor_callback');
 const predictorWeek1=acc(week1Events.filter(e=>e.type==='prediction'));
 const predictorWeek4=acc(week4Events.filter(e=>e.type==='prediction'));
 const waste=events.filter(e=>e.type==='harvest').reduce((n,e)=>n+Math.max(0,8-(e.amount||0)),0);
 const elapsedDays=[];
 for(let i=0;i<30;i++){
  const start=START+i*DAY,end=start+DAY;
  const segment=events.filter(x=>x.type==='completed'&&x.t>=start&&x.t<end);
  elapsedDays.push({elapsedDay:i+1,completed:segment.length,
   actions:counts(segment),distinctActions:new Set(segment.map(x=>x.kind)).size,
   softlocked:segment.length===0});
 }
 const narrow=elapsedDays.filter((x,i)=>i>0&&x.distinctActions<=2&&elapsedDays[i-1].distinctActions<=2).map(x=>x.elapsedDay);
 const social=events.filter(e=>e.type==='social');
 const summary={seed,startTick:START,endTick:s.clock.centibeats,targetTick:START+HORIZON,
  elapsedWorldDays:(s.clock.centibeats-START)/DAY,ticksExecuted:executed,
  totalEvents:events.length,decisions:events.filter(e=>e.type==='decision').length,
  activitiesTotal:events.filter(e=>e.type==='completed').length,
  activityDistribution:counts(events),
  activitiesByWorldDay:Object.fromEntries([...new Set(events.map(e=>e.day))].map(day=>[day,{activities:counts(events.filter(e=>e.day===day)),
   visitorArrivals:events.filter(e=>e.day===day&&e.type==='visitor_arrival').length,
   visitorConversations:events.filter(e=>e.day===day&&e.type==='visitor_conversation').length,
   diaryWrites:events.filter(e=>e.day===day&&e.type==='completed'&&e.kind==='diary').length,
   preparations:events.filter(e=>e.day===day&&e.type==='completed'&&e.kind==='prepare').length}])),
  elapsedDayWindows:elapsedDays,varietyCollapseConsecutiveDays:narrow,
  storesTrajectory:trajectory.concat([{tick:s.clock.centibeats,...s.stores,health:s.health}]),
  finalStores:s.stores,finalHealth:s.health,finalNeeds:s.needs,
  productionReceipts:prods.map(e=>({eventId:e.id,tick:e.t,type:e.type,kind:e.kind||null,amount:e.amount??null,
   stock:e.stock||null,delta:e.delta??null,before:e.before??null,after:e.after??null,ripeAt:e.ripeAt??null})),
  harvests:events.filter(e=>e.type==='harvest').length,
  harvestFoodProduced:events.filter(e=>e.type==='harvest').reduce((n,e)=>n+e.amount,0),
  waterProduced:events.filter(e=>e.type==='production'&&e.stock==='water').reduce((n,e)=>n+e.delta,0),
  fuelProduced:events.filter(e=>e.type==='production'&&e.stock==='fuel').reduce((n,e)=>n+e.delta,0),
  foodConsumption:events.filter(e=>e.type==='completed'&&['eat','cook'].includes(e.kind)).length,
  diaryEntries:s.diary.length,folioReads:s.folioReads.length,
  visitorArrivals:events.filter(e=>e.type==='visitor_arrival').length,
  visitorWitnessedConversations:events.filter(e=>e.type==='visitor_conversation').length,
  trustEvents:social.map(e=>({id:e.id,tick:e.t,kind:e.kind,delta:e.delta,trust:e.trust})),
  customObservations:events.filter(e=>e.type==='custom_observed').length,
  humorMaterial:events.filter(e=>e.type==='social'&&e.kind==='funny').length,
  commitmentsOpened:s.commitments.length,
  commitmentsKept:s.commitments.filter(c=>c.status==='kept').length,
  commitmentsBroken:s.commitments.filter(c=>c.status==='broken').length,
  commitmentsReleased:s.commitments.filter(c=>c.status==='released').length,
  commitmentEvents:events.filter(e=>e.type.startsWith('commitment_')).map(e=>({type:e.type,id:e.commitmentId,tick:e.t})),
  concurrentCommitmentPeak:peakOpenCommitments(events),
  monthCommitments:monthlyHistory,
  development:{day1:developmentSnapshots.day1,day30:developmentSnapshots.day30,
   skillDelta:Object.fromEntries(Object.keys(s.skills).map(k=>[k,(developmentSnapshots.day30?.skills[k]??s.skills[k])-(developmentSnapshots.day1?.skills[k]??0)])),
   allLivedQuirks:quirkByOrigin.filter(q=>q.memoryClass==='lived_runtime_memory'),
   allInheritedQuirks:quirkByOrigin.filter(q=>q.memoryClass!=='lived_runtime_memory'),
   predictorWeek1,predictorWeek4,
   week1ActivityDistribution:counts(week1Events),week4ActivityDistribution:counts(week4Events),
   habitFormations:events.filter(e=>e.type==='habit_formed').map(e=>({id:e.id,kind:e.kind,tick:e.t,day:e.day})),
   habitCountsDay1:developmentSnapshots.day1?.habits||{},habitCountsDay30:developmentSnapshots.day30?.habits||{}},
  monthDynamics:{dailyActivityDistribution:byDay,
   healthTrajectory:trajectory.map(x=>({tick:x.tick,health:x.health})),
   harvestCapWasteUnits:waste,
   trustTrajectory:social.map(e=>({id:e.id,tick:e.t,kind:e.kind,trust:e.trust,delta:e.delta})),
   customLearnedAt:customEvents[1]?{id:customEvents[1].id,tick:customEvents[1].t}:null,
   customObservedAfterLearning:Math.max(0,customEvents.length-2),
   humorousCallbacks:callbackEvents.map(e=>({id:e.id,tick:e.t,sourceEventId:e.sourceEventId})),
   unresolvedMonthTasks:monthlyHistory.filter(c=>c.status==='open'),
   monthTasksProgressed:monthlyHistory.filter(c=>c.progressEvents.length>0).length,
   monthTasksInterrupted:monthlyHistory.filter(c=>c.interrupts.length>0).length,
   monthTasksResumed:monthlyHistory.filter(c=>c.resumes.length>0).length,
   monthTasksResolved:monthlyHistory.filter(c=>c.status==='kept'||c.status==='broken').length},
  formedHabits:events.filter(e=>e.type==='habit_formed').map(e=>({id:e.id,kind:e.kind,tick:e.t})),
  habitMisfires:events.filter(e=>e.type==='action_failed'&&e.reason==='habit_cue_missing').length,
  worldLosses:events.filter(e=>e.type==='world_loss').length,
  actionFailures:events.filter(e=>e.type==='action_failed').map(e=>({id:e.id,kind:e.kind,reason:e.reason})),
  deathStateModeled:true,deathObserved:s.dead,deathEvent:events.find(e=>e.type==='death')||null,
  softlocks:elapsedDays.filter(x=>x.softlocked).map(x=>x.elapsedDay),
  restartCheckpoints:checkpoints,
  pausedEventRequirementMet:!restart||checkpoints.length===2&&checkpoints.every(c=>c.pausedEventPresent&&c.worldClockFrozen),
  startGardenHealth:100,endGardenHealth:s.health,
  sourceRunNotes:'No player commands, frozen v1.3 economy constants, weekly visitor calendar, thirty elapsed 24-hour windows unless fatal.',
  finalEventId:events.at(-1)?.id||null};
 return {summary,samples:observations.filter(Boolean)};
}
function starvationControl(){
 const s=fresh(11);s.productionDisabled=true;let steps=0;
 while(!s.dead&&steps<7000){advance(s,archive,1);steps++;}
 const deaths=s.events.filter(e=>e.type==='death');
 const terminalTick=s.clock.centibeats,terminalEventCount=s.events.length;
 advance(s,archive,50);
 return {seed:11,productionDisabled:true,steps,dead:s.dead,deathCause:deaths[0]?.cause||null,
 deathTick:deaths[0]?.t||null,terminalTick,oneDeath:deaths.length===1,
 noPostDeathActions:s.events.length===terminalEventCount&&s.clock.centibeats===terminalTick,
 finalFood:s.stores.food,finalHealth:s.health,
 harvestReceipts:s.events.filter(e=>e.type==='harvest').length};
}
function main(){
 const runs=[],samples=[];
 for(const seed of SEEDS){const {summary,samples:packet}=runSeed(seed,{restart:seed===13});runs.push(summary);samples.push(...packet);}
 const ctrl=starvationControl();
 const pass={
  monthCompletes:runs.every(x=>x.ticksExecuted===30000&&!x.deathObserved),
  fiveSurvive:runs.every(x=>!x.deathObserved&&x.finalHealth>0),
  producedFood:runs.every(x=>x.harvests>0&&x.harvestFoodProduced>0&&x.finalStores.food>0),
  visitorsMet:runs.filter(x=>x.visitorWitnessedConversations>0).length>=4,
  pauses:runs.find(x=>x.seed===13)?.pausedEventRequirementMet===true,
  variety:runs.every(x=>x.softlocks.length===0&&x.varietyCollapseConsecutiveDays.length===0),
  starvationControl:ctrl.dead&&ctrl.oneDeath&&ctrl.noPostDeathActions&&ctrl.harvestReceipts===0,
  scheduledMonthTasks:runs.every(x=>x.monthCommitments.length===3),
  monthCommitmentResolution:runs.every(x=>x.monthDynamics.monthTasksResolved===3),
  naturalMonthInterruption:runs.every(x=>x.monthDynamics.monthTasksInterrupted>0&&x.monthDynamics.monthTasksResumed>0),
  naturalHumorCallback:runs.some(x=>x.monthDynamics.humorousCallbacks.length>0),
  livedQuirkDevelopment:runs.every(x=>x.development.allLivedQuirks.length>0)
 };
 const evidence={schema:'simple-tower-v1.4-evidence-v1',codeHead:process.env.GITHUB_SHA||'unversioned',
  archiveGitBlob:archive.sha,identityDigest:identity.sha,constants:ECONOMY,
  seeds:SEEDS,dayCentibeats:DAY,stepCentibeats:100,runs,starvationControl:ctrl,
  acceptance:pass,
  fidelityPacket:samples.slice(0,30),note:'Tests/v13.test.js provide named Article discriminations. Do not infer passing Article status solely from five seed survival.'};
 const raw=Buffer.from(JSON.stringify(evidence),'utf8').toString('base64');
 console.log('V14_DATA_BEGIN '+raw.length);
 for(let i=0;i<raw.length;i+=1700)console.log('V14_DATA_PART '+Math.floor(i/1700)+' '+raw.slice(i,i+1700));
 console.log('V14_DATA_END '+Math.ceil(raw.length/1700));
 runs.forEach(x=>console.log('V14_SEED '+JSON.stringify({seed:x.seed,actions:x.activitiesTotal,unique:Object.keys(x.activityDistribution).length,monthly:x.monthCommitments.map(c=>[c.id,c.status,c.interrupts.length,c.resumes.length]),livedQuirks:x.development.allLivedQuirks.length,humor:x.monthDynamics.humorousCallbacks.length,
  food:x.finalStores.food,health:x.finalHealth,harvest:x.harvestFoodProduced,visitorTalks:x.visitorWitnessedConversations,
  deaths:x.deathObserved,softlocks:x.softlocks,pauses:x.restartCheckpoints.length,paused:x.pausedEventRequirementMet})));
 console.log('V14_ACCEPTANCE '+JSON.stringify(pass));
 console.log('V14_STARVATION '+JSON.stringify(ctrl));
}
if(require.main===module)main();
module.exports={runSeed,starvationControl,main};
