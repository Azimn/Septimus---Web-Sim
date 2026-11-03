'use strict';
const {applyMood}=require('./actions');
const VISITOR='visitor_01';
function person(s,id=VISITOR){return s.people[id]??(s.people[id]={id,marker:id,present:false,trust:0,affinity:0,grievance:0,events:[],witnessed:[],knowledge:[]});}
function arrive(s,log){const p=person(s);if(p.present)return null;p.present=true;return log(s,'visitor_arrival',s.location==='library'?'I noticed a familiar caller arrive at the tower.':'A caller arrived while I was elsewhere in the tower.',{personId:VISITOR,marker:p.marker,perceived:s.location==='library'});}
function depart(s,log){const p=person(s);if(!p.present)return null;p.present=false;return log(s,'visitor_departure',s.location==='library'?'I saw the caller depart.':'The caller departed without my witnessing it.',{personId:VISITOR,perceived:s.location==='library'});}
function scheduled(s,log){const phase=s.clock.centibeats%100000,day=s.clock.day;const p=person(s);if(phase>=44000&&phase<60000&&!p.present&&p.lastVisitDay!==day){p.lastVisitDay=day;arrive(s,log);}
 if(phase>=60000&&p.present)depart(s,log);}
function shared(s,log,kind,{id=VISITOR,fact='',privateToVisitor=false}={}){
 const p=person(s,id),prior=p.events.map(x=>x.kind);
 const delta=kind==='gift'?(prior.includes('insult')?5:20):kind==='insult'?(prior.includes('gift')?-35:-15):0;
 p.trust+=delta;p.affinity+=kind==='gift'?7:kind==='insult'?-5:0;p.grievance+=kind==='insult'?1:0;
 const witnesses=privateToVisitor?[id,'pretorius']:[id,'pretorius','player'];
 const e=log(s,'social',`I recorded a shared ${kind} with ${id}.`,{kind,personId:id,delta,trust:p.trust,witnesses,privateToVisitor});
 p.events.push({id:e.id,kind,delta});p.witnessed.push(e.id);
 if(privateToVisitor){if(fact)p.knowledge.push({fact,sourceEventId:e.id});}
 else s.people.player.witnessed.push(e.id);
 return e;
}
function observeCustom(s,log,id=VISITOR){const c=s.customs.greeting;c.observations++;const e=log(s,'custom_observed','I noticed the caller perform the same formal greeting.',{personId:id,observation:c.observations});c.sourceEventIds.push(e.id);if(c.observations>=2)c.learned=true;return e;}
function violateCustom(s,log){const c=s.customs.greeting;if(!c.learned)return null;const e=log(s,'surprise','I was surprised by the breach of a greeting I had learned.',{custom:'greeting',sourceIds:[...c.sourceEventIds],moodDelta:-3});applyMood(s,'custom breached',-3);return e;}
function markFunny(s,log,id=VISITOR){const e=shared(s,log,'funny',{id});s.humor.push({sourceEventId:e.id,personId:id,used:false,cooldownUntil:0});return e;}
function callback(s,log,id=VISITOR){const h=s.humor.find(x=>x.personId===id&&!x.used&&s.clock.centibeats>=x.cooldownUntil);if(!h)return null;h.used=true;h.cooldownUntil=s.clock.centibeats+5000;return log(s,'humor_callback','I recalled our earlier absurd mishap, once.',{sourceEventId:h.sourceEventId,personId:id,cooldownUntil:h.cooldownUntil});}
module.exports={VISITOR,person,arrive,depart,scheduled,shared,observeCustom,violateCustom,markFunny,callback};