'use strict';
// Commitments remain separate durable records; new days may never discard them.
const open=c=>!c.done&&(c.status===undefined||c.status==='open');
const actionFor=c=>c.action||'prepare';
// The monthly provisions oath refers to edible portions physically held,
// whether freshly picked or stored as preserved batches. No future crop is counted.
function heldStock(s,stockTarget){
 if(!stockTarget)return null;
 const value=s.stores[stockTarget.item]||0;
 return stockTarget.includePreserved&&stockTarget.item==='food'?
  value+(s.stores.preserved||0):value;
}
function targetSatisfied(s,c){return !c.stockTarget||
 heldStock(s,c.stockTarget)>=c.stockTarget.minimum;}
function obligationPressure(s,c){
 if(!open(c))return 0;
 const stages=Math.max(0,(c.requiredProgress||1)-(c.progressCount||0));
 const deficit=c.stockTarget?Math.max(0,c.stockTarget.minimum-heldStock(s,c.stockTarget)):0;
 const daysRemaining=Math.max(0,(c.deadline-s.clock.centibeats)/100000);
 // The plan is useful when it opens, not only after the deadline is almost gone.
 // No completed work is awarded by prioritization; availability still gates action.
 const score=18+stages*19+(deficit>0?Math.min(28,deficit*2):0)+
  32*Math.max(0,1-daysRemaining/2.65);
 return Math.min(125,Math.round(score*100)/100);
}
function matching(s,kind){return s.commitments.filter(c=>open(c)&&actionFor(c)===kind).sort((a,b)=>a.deadline-b.deadline);}
function began(s,activity,log){
 const c=matching(s,activity.kind)[0];
 if(!c){
  // A different, genuinely begun activity interrupts a partially finished
  // multi-session undertaking. Do not invent an interruption without work.
  for(const outstanding of s.commitments.filter(x=>open(x)&&(x.progressCount||0)>0&&
    (x.progressCount||0)<(x.requiredProgress||1))){
   const prior=s.commitmentProgress?.[outstanding.id]||{};
   if(prior.interrupted)continue;
   s.commitmentProgress[outstanding.id]={...prior,interrupted:true,
     interruptCount:(prior.interruptCount||0)+1,interveningAction:activity.kind};
   log(s,'commitment_interrupted','I set unfinished work aside for another obligation or ordinary need.',
     {commitmentId:outstanding.id,interveningAction:activity.kind,
      stage:outstanding.progressCount,requiredProgress:outstanding.requiredProgress,
      reason:'competing_real_activity'});
  }
  return;
 }
 activity.commitmentId=c.id;s.commitmentProgress??={};
 const previous=s.commitmentProgress[c.id],resuming=previous?.interrupted;
 const e=log(s,resuming?'commitment_resumed':'commitment_progress',
  resuming?'I resumed an interrupted obligation.':'I began the next part of an obligation.',
  {commitmentId:c.id,action:activity.kind,deadline:c.deadline,controller:activity.controller});
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
 const targetReached=targetSatisfied(s,c);
 const stagesFinished=c.progressCount>=(c.requiredProgress||1);
 if(!targetReached||!stagesFinished){
  log(s,'commitment_progress','I completed one real work session, but the undertaking remains open.',
   {commitmentId:c.id,action:activity.kind,stage:c.progressCount,
    requiredProgress:c.requiredProgress||1,stockTarget:c.stockTarget||null,
    targetReached,heldStock:heldStock(s,c.stockTarget),
    sourceActionTick:s.clock.centibeats});
  return;
 }
 c.done=true;c.status='kept';c.keptAt=s.clock.centibeats;c.sourceAction=activity.kind;
 log(s,'commitment_kept','I fulfilled an obligation through actual work.',{commitmentId:c.id,action:activity.kind,deadline:c.deadline});
}
function deadlines(s,log){
 for(const c of s.commitments)if(open(c)&&c.deadline<s.clock.centibeats){
  c.status='broken';c.brokenAt=s.clock.centibeats;c.done=false;
  log(s,'commitment_broken','An obligation passed without fulfillment.',{commitmentId:c.id,deadline:c.deadline});
 }
}
function nextDay(s,log){
 const id='C'+(s.clock.day+1);
 if(s.commitments.some(c=>c.id===id))return;
 const c={id,title:'Secure the hearth before dusk',deadline:s.clock.day*100000+65000,action:'prepare',status:'open',done:false};
 s.commitments.push(c);
 log(s,'commitment_opened','I undertook the next hearth preparation.',{commitmentId:id,deadline:c.deadline});
}
function add(s,{id,title,deadline,action,stockTarget=null,origin='chosen',requiredProgress=1},log){
 if(!id||!title||!Number.isSafeInteger(deadline)||!action||s.commitments.some(c=>c.id===id))throw Error('Invalid or repeated commitment');
 const c={id,title,deadline,action,stockTarget,origin,requiredProgress,progressCount:0,status:'open',done:false};s.commitments.push(c);
 log(s,'commitment_opened','I accepted a new obligation.',{commitmentId:id,deadline,action,origin,stockTarget,requiredProgress});
 return c;
}
const MONTH_SCHEDULE=Object.freeze([
 {openDay:8,id:'MONTH-FOLIO',title:'Consult folios in two sessions before the tenth day closes',action:'read',dueDay:10,requiredProgress:2},
 {openDay:16,id:'MONTH-INSTRUMENT',title:'Inspect the instrument in two sessions before the eighteenth day closes',action:'inspect',dueDay:18,requiredProgress:2},
 {openDay:23,id:'MONTH-PROVISIONS',title:'Tend two sessions and hold at least twelve edible portions (fresh plus preserved) before the twenty-fifth day closes',action:'tend',dueDay:25,requiredProgress:2,stockTarget:{item:'food',minimum:12,includePreserved:true}}
]);
function scheduleMonth(s,log){
 for(const scheduled of MONTH_SCHEDULE){
  if(s.clock.day<scheduled.openDay||s.commitments.some(c=>c.id===scheduled.id))continue;
  const c=add(s,{id:scheduled.id,title:scheduled.title,
   deadline:scheduled.dueDay*100000+65000,action:scheduled.action,
   stockTarget:scheduled.stockTarget||null,origin:'calendar',requiredProgress:scheduled.requiredProgress||1},log);
  c.scheduledDay=scheduled.openDay;
 }
}
module.exports={open,heldStock,targetSatisfied,obligationPressure,matching,began,interrupted,completed,deadlines,nextDay,add,scheduleMonth,MONTH_SCHEDULE};
