'use strict';
// Commitments remain separate durable records; new days may never discard them.
const open=c=>!c.done&&(c.status===undefined||c.status==='open');
const actionFor=c=>c.action||'prepare';
function matching(s,kind){return s.commitments.filter(c=>open(c)&&actionFor(c)===kind).sort((a,b)=>a.deadline-b.deadline);}
function began(s,activity,log){
 const c=matching(s,activity.kind)[0];if(!c)return;
 activity.commitmentId=c.id;s.commitmentProgress??={};
 const previous=s.commitmentProgress[c.id],resuming=previous?.interrupted;
 const e=log(s,resuming?'commitment_resumed':'commitment_progress',
  resuming?'I resumed an interrupted obligation.':'I began the next part of an obligation.',
  {commitmentId:c.id,action:activity.kind,deadline:c.deadline,controller:activity.controller});
 s.commitmentProgress[c.id]={interrupted:false,lastEventId:e.id,activityKind:activity.kind};
}
function interrupted(s,activity,log){
 if(!activity?.commitmentId)return;
 s.commitmentProgress??={};s.commitmentProgress[activity.commitmentId]={interrupted:true,lastTick:s.clock.centibeats,activityKind:activity.kind};
 log(s,'commitment_interrupted','I left an obligation unfinished, intending to resume it.',{commitmentId:activity.commitmentId,action:activity.kind});
}
function completed(s,activity,log){
 if(!activity.commitmentId)return;
 const c=s.commitments.find(x=>x.id===activity.commitmentId);
 if(!c||!open(c))return;
 if(c.stockTarget&&s.stores[c.stockTarget.item]<c.stockTarget.minimum){
  log(s,'commitment_progress','I worked toward the stored-provisions target but have not reached it.',{commitmentId:c.id,action:activity.kind,stockItem:c.stockTarget.item,current:s.stores[c.stockTarget.item],minimum:c.stockTarget.minimum});
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
function add(s,{id,title,deadline,action,stockTarget=null,origin='chosen'},log){
 if(!id||!title||!Number.isSafeInteger(deadline)||!action||s.commitments.some(c=>c.id===id))throw Error('Invalid or repeated commitment');
 const c={id,title,deadline,action,stockTarget,origin,status:'open',done:false};s.commitments.push(c);
 log(s,'commitment_opened','I accepted a new obligation.',{commitmentId:id,deadline,action,origin,stockTarget});
 return c;
}
const MONTH_SCHEDULE=Object.freeze([
 {openDay:8,id:'MONTH-FOLIO',title:'Consult a folio before the tenth day closes',action:'read',dueDay:10},
 {openDay:16,id:'MONTH-INSTRUMENT',title:'Inspect the instrument before the eighteenth day closes',action:'inspect',dueDay:18},
 {openDay:23,id:'MONTH-PROVISIONS',title:'Store at least twelve units of food before the twenty-fifth day closes',action:'tend',dueDay:25,stockTarget:{item:'food',minimum:12}}
]);
function scheduleMonth(s,log){
 for(const scheduled of MONTH_SCHEDULE){
  if(s.clock.day<scheduled.openDay||s.commitments.some(c=>c.id===scheduled.id))continue;
  const c=add(s,{id:scheduled.id,title:scheduled.title,
   deadline:scheduled.dueDay*100000+65000,action:scheduled.action,
   stockTarget:scheduled.stockTarget||null,origin:'calendar'},log);
  c.scheduledDay=scheduled.openDay;
 }
}
module.exports={open,matching,began,interrupted,completed,deadlines,nextDay,add,scheduleMonth,MONTH_SCHEDULE};
