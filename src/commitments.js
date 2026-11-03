'use strict';
// All recurrence is triggered from world time. No month-specific author script.
const {DAY}=require('./world');
const PERIOD_DAYS=30;
const SERIES_TEMPLATES=Object.freeze([
 {id:'DAILY-HEARTH',kind:'daily',intervalDays:1,openOffset:0,dueOffset:0,
  duePhase:65000,legacyPrefix:'C',title:'Secure the hearth before dusk',action:'prepare',requiredProgress:1},
 {id:'MONTH-FOLIO',kind:'monthly',intervalDays:PERIOD_DAYS,openOffset:8,dueOffset:10,
  duePhase:65000,title:'Consult folios in two sessions before the tenth day closes',action:'read',requiredProgress:2},
 {id:'MONTH-INSTRUMENT',kind:'monthly',intervalDays:PERIOD_DAYS,openOffset:16,dueOffset:18,
  duePhase:65000,title:'Inspect the instrument in two sessions before the eighteenth day closes',action:'inspect',requiredProgress:2},
 // Six-day window spans the physical 140000-centibeat growth cycle.
 {id:'MONTH-PROVISIONS',kind:'monthly',intervalDays:PERIOD_DAYS,openOffset:21,dueOffset:27,
  duePhase:65000,title:'Tend twice and hold twelve edible portions before the twenty-fifth day closes',
  action:'tend',requiredProgress:2,stockTarget:{item:'food',minimum:12,includePreserved:true}}
]);
const open=c=>!c.done&&(c.status===undefined||c.status==='open');
const actionFor=c=>c.action||'prepare';
function heldStock(s,t){if(!t)return null;return (s.stores[t.item]||0)+(t.includePreserved&&t.item==='food'?(s.stores.preserved||0):0);}
function targetSatisfied(s,c){return !c.stockTarget||heldStock(s,c.stockTarget)>=c.stockTarget.minimum;}
function ledger(s,id){
 s.series??={};
 if(!s.series[id])s.series[id]={id,instances:[],kept:0,broken:0,keptStreak:0,brokenStreak:0,
   cumulativeCompletionTicks:0,completionSamples:0,averageCompletionTicks:0};
 return s.series[id];
}
function register(s,c){if(!c.seriesId)return;const r=ledger(s,c.seriesId);
 if(!r.instances.includes(c.id))r.instances.push(c.id);
}
function ensure(s){
 // Existing series and generated instances are durable save-state records.
 // Rebuilding all registrations at every 100-centibeat tick becomes
 // superlinear over a year. Initialize once, then register only new instances.
 if(s.seriesReady)return;
 s.series??={};
 for(const template of SERIES_TEMPLATES)ledger(s,template.id);
 // C1 predates the recurrence design and is the one preserved bootstrap instance.
 const initial=s.commitments.find(c=>c.id==='C1');
 if(initial&&!initial.seriesId){initial.seriesId='DAILY-HEARTH';initial.seriesOrdinal=1;initial.openedAt=25000;
  initial.origin='calendar_bootstrap';initial.requiredProgress??=1;initial.progressCount??=0;}
 for(const c of s.commitments)register(s,c);
 s.seriesReady=true;
}
function outcome(s,c,status,log,cause=''){
 if(!c.seriesId)return;
 const r=ledger(s,c.seriesId);
 if(c.seriesRecorded)return;
 c.seriesRecorded=true;
 if(status==='kept'){r.kept++;r.keptStreak++;r.brokenStreak=0;
  r.cumulativeCompletionTicks+=Math.max(0,c.keptAt-(c.openedAt??c.keptAt));
  r.completionSamples++;
  r.averageCompletionTicks=Math.round(r.cumulativeCompletionTicks/r.completionSamples);}
 else {r.broken++;r.brokenStreak++;r.keptStreak=0;}
 const ev=log(s,'series_outcome','I retained the result of one obligation in its recurring series.',{
  seriesId:c.seriesId,instanceId:c.id,seriesOrdinal:c.seriesOrdinal,status,cause,
  keptStreak:r.keptStreak,brokenStreak:r.brokenStreak,averageCompletionTicks:r.averageCompletionTicks});
 c.seriesOutcomeEventId=ev.id;r.lastOutcomeEventId=ev.id;
 return ev;
}
function obligationPressure(s,c){
 if(!open(c))return 0;
 const stages=Math.max(0,(c.requiredProgress||1)-(c.progressCount||0));
 const deficit=c.stockTarget?Math.max(0,c.stockTarget.minimum-heldStock(s,c.stockTarget)):0;
 const daysRemaining=Math.max(0,(c.deadline-s.clock.centibeats)/DAY);
 const failure=s.series?.[c.seriesId]?.brokenStreak||0;
 const score=18+stages*19+(deficit>0?Math.min(28,deficit*2):0)+
  32*Math.max(0,1-daysRemaining/2.65)+Math.min(30,10*failure);
 return Math.min(145,Math.round(score*100)/100);
}
function matching(s,kind){return s.commitments.filter(c=>open(c)&&actionFor(c)===kind).sort((a,b)=>a.deadline-b.deadline);}
function began(s,activity,log){
 const c=matching(s,activity.kind)[0];
 if(!c){
  for(const outstanding of s.commitments.filter(x=>open(x)&&(x.progressCount||0)>0&&(x.progressCount||0)<(x.requiredProgress||1))){
   const prior=s.commitmentProgress?.[outstanding.id]||{};
   if(prior.interrupted)continue;
   s.commitmentProgress[outstanding.id]={...prior,interrupted:true,interruptCount:(prior.interruptCount||0)+1,interveningAction:activity.kind};
   log(s,'commitment_interrupted','I set unfinished work aside for another need.',{
    commitmentId:outstanding.id,interveningAction:activity.kind,stage:outstanding.progressCount,
    requiredProgress:outstanding.requiredProgress,reason:'competing_real_activity'});
  }
  return;
 }
 activity.commitmentId=c.id;s.commitmentProgress??={};
 const previous=s.commitmentProgress[c.id],resuming=previous?.interrupted;
 const e=log(s,resuming?'commitment_resumed':'commitment_progress',
  resuming?'I resumed an interrupted obligation.':'I began the next part of an obligation.',
  {commitmentId:c.id,seriesId:c.seriesId||null,action:activity.kind,deadline:c.deadline,controller:activity.controller});
 s.commitmentProgress[c.id]={...previous,interrupted:false,lastEventId:e.id,activityKind:activity.kind};
}
function interrupted(s,activity,log){
 if(!activity?.commitmentId)return;
 s.commitmentProgress??={};const prior=s.commitmentProgress[activity.commitmentId]||{};
 s.commitmentProgress[activity.commitmentId]={...prior,interrupted:true,lastTick:s.clock.centibeats,
  activityKind:activity.kind,interruptCount:(prior.interruptCount||0)+1};
 log(s,'commitment_interrupted','I left an obligation unfinished, intending to resume it.',{commitmentId:activity.commitmentId,action:activity.kind});
}
function completed(s,activity,log){
 if(!activity.commitmentId)return;
 const c=s.commitments.find(x=>x.id===activity.commitmentId);
 if(!c||!open(c))return;
 c.progressCount=(c.progressCount||0)+1;
 const targetReached=targetSatisfied(s,c),stagesFinished=c.progressCount>=(c.requiredProgress||1);
 if(!targetReached||!stagesFinished){
  log(s,'commitment_progress','I completed work, but the undertaking remains open.',{
   commitmentId:c.id,action:activity.kind,stage:c.progressCount,requiredProgress:c.requiredProgress||1,
   stockTarget:c.stockTarget||null,targetReached,heldStock:heldStock(s,c.stockTarget),sourceActionTick:s.clock.centibeats});
  return;
 }
 c.done=true;c.status='kept';c.keptAt=s.clock.centibeats;c.sourceAction=activity.kind;
 const ev=log(s,'commitment_kept','I fulfilled an obligation through actual work.',{
  commitmentId:c.id,seriesId:c.seriesId||null,action:activity.kind,deadline:c.deadline});
 c.resolutionEventId=ev.id;outcome(s,c,'kept',log);
}
function breakInstance(s,c,log,cause='deadline_missed'){
 if(!open(c))return null;
 c.status='broken';c.brokenAt=s.clock.centibeats;c.done=false;c.breakCause=cause;
 const ev=log(s,'commitment_broken','An obligation passed without fulfillment.',{
  commitmentId:c.id,seriesId:c.seriesId||null,deadline:c.deadline,cause});
 c.resolutionEventId=ev.id;outcome(s,c,'broken',log,cause);
 return ev;
}
function deadlines(s,log){for(const c of s.commitments)if(open(c)&&c.deadline<s.clock.centibeats)breakInstance(s,c,log);}
function add(s,{id,title,deadline,action,stockTarget=null,origin='chosen',requiredProgress=1,
 seriesId=null,seriesOrdinal=null},log){
 if(!id||!title||!Number.isSafeInteger(deadline)||!action||s.commitments.some(c=>c.id===id))throw Error('Invalid or repeated commitment');
 const c={id,title,deadline,action,stockTarget,origin,requiredProgress,progressCount:0,
  status:'open',done:false,openedAt:s.clock.centibeats};
 if(seriesId){c.seriesId=seriesId;c.seriesOrdinal=seriesOrdinal;}
 s.commitments.push(c);register(s,c);
 const ev=log(s,'commitment_opened','I accepted a new obligation.',{
  commitmentId:id,seriesId,seriesOrdinal,deadline,action,origin,stockTarget,requiredProgress});
 c.openEventId=ev.id;
 return c;
}
function instanceId(template,ordinal){
 return template.kind==='daily'?'C'+ordinal:ordinal===1?template.id:template.id+'@'+String(ordinal).padStart(2,'0');
}
function fire(s,template,ordinal,log){
 ensure(s);
 const id=instanceId(template,ordinal);
 if(ledger(s,template.id).instances.includes(id))return null;
 const previousId=ordinal>1?instanceId(template,ordinal-1):null;
 const previous=s.commitments.find(c=>c.id===previousId);
 if(previous&&open(previous)){
  const superseded=log(s,'commitment_superseded','The next recurring duty displaced unfinished earlier work.',{
   seriesId:template.id,predecessorId:previous.id,successorId:id,cause:'next_instance_due'});
  breakInstance(s,previous,log,'superseded_by_'+id);
  previous.supersededBy=id;previous.supersessionEventId=superseded.id;
 }
 const startDay=(ordinal-1)*template.intervalDays;
 const c=add(s,{id,title:template.title,deadline:(startDay+template.dueOffset)*DAY+template.duePhase,
  action:template.action,stockTarget:template.stockTarget||null,origin:'calendar',
  requiredProgress:template.requiredProgress,seriesId:template.id,seriesOrdinal:ordinal},log);
 c.scheduledDay=startDay+template.openOffset;
 c.generationRule={templateId:template.id,intervalDays:template.intervalDays,
  openOffset:template.openOffset,dueOffset:template.dueOffset,duePhase:template.duePhase};
 const e=log(s,'series_instance_generated','The calendar opened the next instance of a recurring undertaking.',{
  seriesId:template.id,instanceId:id,ordinal,scheduledDay:c.scheduledDay,
  openedAt:c.openedAt,deadline:c.deadline,rule:c.generationRule,
  previousInstanceId:previousId});
 c.generationEventId=e.id;
 if(c.deadline<s.clock.centibeats)breakInstance(s,c,log,'missed_during_clock_gap');
 return c;
}
function nextDay(s,log){ensure(s);const template=SERIES_TEMPLATES[0];
 const current=ledger(s,template.id).instances.length;
 for(let ordinal=Math.max(2,current+1);ordinal<=s.clock.day+1;ordinal++)fire(s,template,ordinal,log);}
function scheduleMonth(s,log){
 ensure(s);
 for(const template of SERIES_TEMPLATES.filter(t=>t.kind==='monthly')){
  const max=Math.floor((s.clock.day-template.openOffset)/template.intervalDays)+1;
  const next=ledger(s,template.id).instances.length+1;
  for(let ordinal=next;ordinal<=max;ordinal++)fire(s,template,ordinal,log);
 }
}
// Compatibility export: first-month labels are retained, but subsequent instances
// arise only from the declared runtime interval and rule metadata.
const MONTH_SCHEDULE=Object.freeze(SERIES_TEMPLATES.filter(x=>x.kind==='monthly').map(t=>({
 openDay:t.openOffset,id:t.id,title:t.title,action:t.action,
 dueDay:t.dueOffset,requiredProgress:t.requiredProgress,stockTarget:t.stockTarget||null
})));
module.exports={PERIOD_DAYS,SERIES_TEMPLATES,ledger,ensure,outcome,open,heldStock,targetSatisfied,
 obligationPressure,matching,began,interrupted,completed,breakInstance,deadlines,nextDay,add,fire,scheduleMonth,MONTH_SCHEDULE};
