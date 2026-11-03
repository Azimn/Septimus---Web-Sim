'use strict';
const {applyMood,clip}=require('./actions');
const {STEP,distance,ROSA_PRIOR}=require('./world');
const VISITOR='visitor_01';
function person(s,id=VISITOR){return s.people[id]??(s.people[id]={id,
 name:id==='mcfeely'?'Mr. McFeely':id,marker:id==='mcfeely'?'three deliberate knocks at the garden path':id,
 role:id==='mcfeely'?'mail carrier':'caller',present:false,trust:0,affinity:0,
 grievance:0,events:[],witnessed:[],knowledge:[],liveEncounters:0,
 custom:id==='mcfeely'?{tripleKnock:true,waitAt:'garden'}:null});}
// The only inputs to social conduct are source-linked person history and its
// fading prior. The policy never checks person ID or kind, including swap controls.
function priorWeight(p){return p.prior?1/(1+(p.liveEncounters||0)*(p.prior.decayPerLivedEncounter||.55)):0;}
function effectiveTrust(p){return (p.trust||0)+(p.prior?.initialFacetWeight||0)*priorWeight(p);}
function treatment(p){
 const value=effectiveTrust(p);
 return {greet:value>=-12?'greet':'withhold',shareConfidence:value>=16,
  extendCredit:value>=5,minutes:value>=15?12:value>=-12?4:0,
  trust:value,priorWeight:priorWeight(p),
  factors:{livedTrust:p.trust||0,livedEncounters:p.liveEncounters||0,
   priorSource:p.prior?.prior_source||null,sourceEventIds:p.prior?.sourceEventIds||[],
   livedSocialEvents:p.events.map(e=>e.id)}};
}
function recordEncounter(s,log,id,kind,extra={}){
 const p=person(s,id);p.liveEncounters=(p.liveEncounters||0)+1;
 return log(s,'person_encounter','I dealt with another person in the world.',{
  personId:id,kind,priorWeight:priorWeight(p),treatment:treatment(p),
  sources:p.prior?.sourceEventIds||[],...extra});
}
function arrive(s,log,scheduledVisit=false){const p=person(s);if(p.present)return null;p.present=true;
 p.room='library';p.targetRoom=null;p.travelRemaining=0;p.manuallyIntroduced=!scheduledVisit;p.arrivalTick=s.clock.centibeats;
 const event=log(s,'visitor_arrival',s.location==='library'?'I noticed a familiar caller arrive at the tower.':'A caller arrived while I was elsewhere in the tower.',{personId:VISITOR,marker:p.marker,perceived:s.location==='library'});
 if(scheduledVisit){
   if(!p.reunionSeen&&p.prior){p.reunionSeen=true;log(s,'prior_reunion',
    'I recognized Rosa Brandl from the account of our long supply arrangements.',
    {personId:VISITOR,prior_source:'reconstructed_archive',
     priorEventIds:[...p.prior.sourceEventIds],priorWeight:priorWeight(p),
     knowledgeNotLived:true});}
   deliverGoods(s,log);
 }
 if(s.location==='library'){if(scheduledVisit)meet(s,log);else address(s,log);}
 return event;
}
const DELIVERY=Object.freeze({food:2,fuel:2,priceFood:1,priceFuel:1,creditForStranger:30,creditWithPrior:90});
function deliverGoods(s,log){
 const p=person(s),policy=treatment(p);
 const price=DELIVERY.food*DELIVERY.priceFood+DELIVERY.fuel*DELIVERY.priceFuel;
 p.account??={balance:0,creditLimit:policy.extendCredit?DELIVERY.creditWithPrior:DELIVERY.creditForStranger,
  deliveryPoint:'kitchen',basis:'weight'};
 p.account.creditLimit=p.prior?DELIVERY.creditWithPrior:DELIVERY.creditForStranger;
 if(p.account.balance+price>p.account.creditLimit){
  log(s,'delivery_refused','The account was not extended without settled terms.',
   {personId:VISITOR,price,accountBalance:p.account.balance,
    creditLimit:p.account.creditLimit,policySource:policy.factors});return null;
 }
 const Economy=require('./economy'),before={food:s.stores.food,fuel:s.stores.fuel};
 const addedFood=Economy.putFresh(s,DELIVERY.food,s.clock.centibeats);
 const addedFuel=Math.min(DELIVERY.fuel,Economy.ECONOMY.maxFuel-s.stores.fuel);
 s.stores.fuel+=addedFuel;
 const actualPrice=addedFood*DELIVERY.priceFood+addedFuel*DELIVERY.priceFuel;
 p.account.balance+=actualPrice;
 return log(s,'merchant_delivery','Rosa left weighed provisions at the settled kitchen store point.',
  {personId:VISITOR,deliveryPoint:'kitchen',measure:'weight',sourceContract:'reconstructed_archive',
   contractRefs:['E22-001','E22-003'],before,after:{food:s.stores.food,fuel:s.stores.fuel},
   units:{food:addedFood,fuel:addedFuel},capacityRefused:{food:DELIVERY.food-addedFood,
    fuel:DELIVERY.fuel-addedFuel},accountBalance:p.account.balance,
   price:actualPrice,creditLimit:p.account.creditLimit});
}
function address(s,log){const p=person(s);if(!p.present||p.room!==s.location)throw Error('Visitor conversation requires shared presence');
 const e=log(s,'visitor_conversation','I heard the caller offer a guarded formal greeting.',{personId:VISITOR,visitorText:'Good evening, Doctor Pretorius.',witnesses:[VISITOR,'pretorius']});
 p.witnessed.push(e.id);return e;
}
function depart(s,log){const p=person(s);if(!p.present)return null;p.present=false;p.targetRoom=null;p.travelRemaining=0;return log(s,'visitor_departure',s.location==='library'?'I saw the caller depart.':'The caller departed without my witnessing it.',{personId:VISITOR,perceived:s.location==='library'});}
function meet(s,log){
 const p=person(s);if(!p.present||p.room!==s.location||p.metVisitDay===s.clock.day||s.activity?.kind==='sleep')return;
 p.metVisitDay=s.clock.day;
 if(treatment(p).greet==='withhold'){log(s,'visitor_avoided','I chose to withhold a greeting from that caller.',{personId:VISITOR,trust:p.trust,decision:'avoid',sourceSocialEvents:p.events.map(x=>x.id)});return;}
 const encounter=recordEncounter(s,log,VISITOR,'greeting',{coPresent:true});
 if(p.prior&&p.prior.knownToRosa.length){
  const seen=s.habits.work||0,observed=(seen>=5?'I see the bench still claims your hours.':
    'The path needs attention. Put the baskets on sound boards.');
  log(s,'noticed_by_person',observed,{personId:VISITOR,encounterId:encounter.id,
   archiveReferences:p.prior.knownToRosa.map(x=>x.sourceEventId),
   prior_source:'reconstructed_archive',observationFromCurrent:s.clock.centibeats});
 }
 address(s,log);
 observeCustom(s,log);
 observeCustom(s,log,VISITOR,'tea_first');
 observeCustom(s,log,VISITOR,'instrument_quiet');
 shared(s,log,'greeting');
 const hearsay=s.mail?.hearsay?.find(x=>!x.corrected&&x.aboutPerson===VISITOR);
 if(hearsay){
  const witness=log(s,'belief_corrected','I saw Rosa Brandl here, contrary to a prior report of her prolonged absence.',
   {personId:VISITOR,priorClaimId:hearsay.sourceEventId,hearsayId:hearsay.id,
    directWitness:s.clock.centibeats,previousConfidence:'hearsay',correctedBy:'direct_encounter'});
  hearsay.corrected=true;hearsay.correctionEventId=witness.id;
 }
 s.needs.company=clip(s.needs.company+18);
}
function scheduled(s,log){
 const phase=s.clock.centibeats%100000,day=s.clock.day,p=person(s);
 if(day%7===0&&phase>=44000&&phase<60000&&!p.present&&p.lastVisitDay!==day){p.lastVisitDay=day;arrive(s,log,true);}
 if(phase>=60000&&p.present){depart(s,log);return;}
 if(!p.present||p.manuallyIntroduced)return;
 if(!p.room)p.room='library';
 if(p.room!==s.location){
  if(p.targetRoom!==s.location){p.targetRoom=s.location;p.travelRemaining=distance(p.room,s.location)*300;}
  p.travelRemaining-=STEP;
  if(p.travelRemaining<=0){p.room=p.targetRoom;log(s,'visitor_moved','A caller walked through the tower to find me.',{personId:VISITOR,visitorRoom:p.room,perceived:p.room===s.location});}
 }
 meet(s,log);
 checkCustoms(s,log);
}
function shared(s,log,kind,{id=VISITOR,fact='',privateToVisitor=false}={}){
 const p=person(s,id);if(!p.present||p.room!==s.location)throw Error('Shared social event requires physical co-presence');
 const prior=p.events.map(x=>x.kind);
 const delta=kind==='gift'?(prior.includes('insult')?5:20):kind==='insult'?(prior.includes('gift')?-35:-15):kind==='greeting'?2:kind==='conversation'?3:kind==='trade'?(prior.includes('insult')?1:4):kind==='negotiation'?2:0;
 p.trust+=delta;p.affinity+=kind==='gift'?7:kind==='insult'?-5:0;p.grievance+=kind==='insult'?1:0;
 const witnesses=privateToVisitor?[id,'pretorius']:[id,'pretorius','player'];
 const e=log(s,'social',`I recorded a shared ${kind} with ${id}.`,{kind,personId:id,delta,trust:p.trust,witnesses,privateToVisitor});
 p.events.push({id:e.id,kind,delta});p.witnessed.push(e.id);
 if(privateToVisitor){if(fact)p.knowledge.push({fact,sourceEventId:e.id});}
 else s.people.player.witnessed.push(e.id);
 return e;
}
function observeCustom(s,log,id=VISITOR,kind='greeting'){
 if(!person(s,id).present||person(s,id).room!==s.location)throw Error('Custom observation requires co-presence');
 const c=s.customs[kind];if(!c)throw Error('Unknown visitor custom');
 c.observations++;
 const description=kind==='greeting'?'I noticed the caller perform the same formal greeting.':
  kind==='tea_first'?'The caller prefers tea before discussing tower business.':
  'The caller favors silence around the laboratory instruments.';
 const e=log(s,'custom_observed',description,{personId:id,custom:kind,
  observation:c.observations,learned:c.observations>=2});
 c.sourceEventIds.push(e.id);if(c.observations>=2)c.learned=true;return e;
}
function negotiateCustom(s,log,kind){
 const p=person(s),c=s.customs[kind];if(!p.present||p.room!==s.location||!c?.learned)return null;
 p.negotiatedCustoms??={};const visit=String(s.clock.day)+':'+kind;
 if(p.negotiatedCustoms[visit])return null;
 p.negotiatedCustoms[visit]=true;
 const conflict=log(s,'custom_conflict','A learned social custom conflicted with a tower habit or immediate errand.',
  {personId:VISITOR,custom:kind,habitEventId:s.habitProfiles.work?.formed?
    s.events.findLast(e=>e.type==='habit_formed'&&e.kind==='work')?.id:null,
   learnedFrom:[...c.sourceEventIds]});
 applyMood(s,'visitor custom conflict',-2,4500);
 const negotiation=shared(s,log,'negotiation');
 return log(s,'custom_negotiation','I acknowledged the custom without relinquishing my independence.',
  {personId:VISITOR,custom:kind,conflictEventId:conflict.id,
   socialEventId:negotiation.id,sourceIds:[...c.sourceEventIds]});
}
function checkCustoms(s,log){
 const p=person(s);
 if(!p.present||p.room!==s.location||p.manuallyIntroduced)return null;
 if(s.activity?.kind==='work'&&s.habitProfiles.work?.formed&&s.customs.instrument_quiet?.learned)
  return negotiateCustom(s,log,'instrument_quiet');
 if(s.activity?.kind==='trade'&&s.customs.tea_first?.learned&&
  !s.events.some(e=>e.type==='completed'&&e.kind==='tea'&&e.t>=p.arrivalTick))
  return negotiateCustom(s,log,'tea_first');
 return null;
}
function violateCustom(s,log){const c=s.customs.greeting;if(!c.learned||!person(s).present||person(s).room!==s.location)return null;const e=log(s,'surprise','I was surprised by the breach of a greeting I had learned.',{custom:'greeting',sourceIds:[...c.sourceEventIds],moodDelta:-3});applyMood(s,'custom breached',-3);return e;}
function markFunny(s,log,id=VISITOR){const e=shared(s,log,'funny',{id});s.humor.push({sourceEventId:e.id,personId:id,used:false,cooldownUntil:0});return e;}
function callback(s,log,id=VISITOR){const h=s.humor.find(x=>x.personId===id&&!x.used&&s.clock.centibeats>=x.cooldownUntil);if(!h)return null;h.used=true;h.cooldownUntil=s.clock.centibeats+5000;return log(s,'humor_callback','I recalled our earlier absurd mishap, once.',{sourceEventId:h.sourceEventId,personId:id,cooldownUntil:h.cooldownUntil});}
module.exports={VISITOR,DELIVERY,person,priorWeight,effectiveTrust,treatment,recordEncounter,deliverGoods,arrive,depart,address,meet,scheduled,shared,observeCustom,negotiateCustom,checkCustoms,violateCustom,markFunny,callback};