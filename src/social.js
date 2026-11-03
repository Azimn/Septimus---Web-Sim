'use strict';
const {applyMood,clip}=require('./actions');
const {STEP,distance,ROSA_PRIOR}=require('./world');
const VISITOR='visitor_01';
// Trust approaches its upper bound by diminishing earned gains, rather than
// growing indefinitely through repetitive trade receipts. Losses remain real.
const RELATIONSHIP=Object.freeze({upper:99.99,lower:-100,frictionPenalty:-4});
function changeTrust(p,raw){
 const before=p.trust||0;
 const scaled=raw>0?Math.round(raw*Math.max(0,100-Math.max(0,before))/100*100)/100:raw;
 const after=Math.max(RELATIONSHIP.lower,Math.min(RELATIONSHIP.upper,
  Math.round((before+scaled)*100)/100));
 p.trust=after;return {delta:Math.round((after-before)*100)/100,rawDelta:raw};
}
function person(s,id=VISITOR){return s.people[id]??(s.people[id]={id,
 name:id==='mcfeely'?'Mr. McFeely':id,marker:id==='mcfeely'?'three deliberate knocks at the garden path':id,
 role:id==='mcfeely'?'mail carrier':'caller',present:false,trust:0,affinity:0,
 grievance:0,events:[],witnessed:[],knowledge:[],liveEncounters:0,
 custom:id==='mcfeely'?{tripleKnock:true,waitAt:'garden'}:null});}
// The only inputs to social conduct are source-linked person history and its
// fading prior. The policy never checks person ID or kind, including swap controls.
function priorWeight(p){return p.prior?1/(1+(p.liveEncounters||0)*(p.prior.decayPerLivedEncounter||.55)):0;}
function effectiveTrust(p){
 // Directly lived severe insult outweighs the reconstructed social prior.
 // This preserves the earlier causal order-swap test and avoids making history a cage.
 if((p.trust||0)<-12)return p.trust;
 return (p.trust||0)+(p.prior?.initialFacetWeight||0)*priorWeight(p);
}
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
   if(s.clock.day>0&&s.clock.day%30===0)issueStatement(s,log);
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
 p.account.creditLimit=policy.extendCredit?DELIVERY.creditWithPrior:DELIVERY.creditForStranger;
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

// Billing follows actual delivery invoices. Goods-for-goods trades already pay
// on the spot, but are listed in the monthly statement as matched debit/credit.
function issueStatement(s,log){
 const p=person(s),a=p.account,period=Math.floor(s.clock.day/30)-1;
 a.statements??=[];
 if(period<0||a.statements.some(x=>x.period===period))return null;
 const start=period*30*100000,end=(period+1)*30*100000;
 const charges=s.events.filter(e=>e.type==='merchant_delivery'&&e.personId===VISITOR&&e.t>=start&&e.t<end);
 const trades=s.events.filter(e=>e.type==='trade_receipt'&&e.personId===VISITOR&&e.t>=start&&e.t<end);
 const previous=a.statements.at(-1);
 const priorBalance=previous?(previous.status==='settled'?previous.closingBalance:previous.dueBalance):0;
 const chargeTotal=charges.reduce((n,e)=>n+e.price,0);
 // A previous statement may be overdue when this month's bill is issued.
 // It remains in the ledger with an explicit carry-forward reference.
 if(previous&&previous.status==='due'){
  previous.status='carried';previous.rolledInto=period;
  log(s,'merchant_statement_carried','The previous unpaid statement was carried forward to this month.',{
   personId:VISITOR,fromPeriod:previous.period,toPeriod:period,
   outstanding:previous.dueBalance,sourceStatementId:previous.issueEventId});
 }
 const due=priorBalance+chargeTotal;
 const spotItems=trades.map(e=>({id:e.id,given:{stock:e.payment,units:e.unitsGiven},
  received:{stock:e.received,units:e.unitsReceived},accountCharge:0}));
 const ev=log(s,'merchant_statement_issued','Rosa presented an account calculated from actual weighed deliveries.',{
  personId:VISITOR,period,start,end,openingBalance:priorBalance,
  charges:chargeTotal,chargeEventIds:charges.map(e=>e.id),spotTradeReceipts:spotItems,
  dueBalance:due,accountBalance:a.balance,perceived:p.room===s.location,
  provenance:'lived_runtime_economic_receipts'});
 if(a.balance!==due){
  log(s,'merchant_statement_discrepancy','The merchant invoice and the live account failed to reconcile.',{
   personId:VISITOR,period,expected:due,actual:a.balance,sourceStatementId:ev.id});
 }
 const st={period,start,end,openingBalance:priorBalance,charges:chargeTotal,
  chargeEventIds:charges.map(e=>e.id),spotTradeReceipts:spotItems,
  dueBalance:due,issueEventId:ev.id,issuedAt:s.clock.centibeats,status:'due'};
 a.statements.push(st);
 return st;
}
function settleAccount(s,log){
 const p=person(s),a=p.account,st=a?.statements?.findLast(x=>x.status==='due');
 if(!st||!p.present||p.room!==s.location)return null;
 const Economy=require('./economy'),before={food:s.stores.food,preserved:s.stores.preserved};
 let left=st.dueBalance,paidPreserved=Math.min(s.stores.preserved||0,left);
 if(paidPreserved>0){Economy.drawStock(s,'preserved',paidPreserved);left-=paidPreserved;}
 // Reserve at least five fresh meal portions. No money or food is created.
 const paidFresh=Math.min(Math.max(0,s.stores.food-5),left);
 if(paidFresh>0){Economy.drawStock(s,'food',paidFresh);left-=paidFresh;}
 const paid=paidPreserved+paidFresh;
 a.balance-=paid;st.closingBalance=left;st.paid=paid;st.paidPreserved=paidPreserved;
 st.paidFresh=paidFresh;st.settledAt=s.clock.centibeats;st.status='settled';
 const payment=log(s,'merchant_settlement','I paid the merchant using real household provisions, with any shortfall carried as credit.',{
  personId:VISITOR,period:st.period,statementEventId:st.issueEventId,
  invoiceStart:st.start,invoiceEnd:st.end,openingBalance:st.openingBalance,
  chargeEventIds:st.chargeEventIds,charges:st.charges,
  spotTradeReceiptIds:st.spotTradeReceipts.map(x=>x.id),
  dueBalance:st.dueBalance,paid,paidPreserved,paidFresh,closingBalance:left,
  beforeStores:before,afterStores:{food:s.stores.food,preserved:s.stores.preserved},
  accountBalance:a.balance,coPresent:true,witnesses:[VISITOR,'pretorius'],
  accountedBy:'actual_delivery_receipts_and_in_kind_payment'});
 st.settlementEventId=payment.id;
 if(left>0){
  const friction=shared(s,log,'friction',{sourceEventId:payment.id});
  st.frictionEventId=friction.id;
  const policy=treatment(p);
  const credit=log(s,'merchant_credit_carried','The merchant allowed an unsettled account to continue under known terms.',{
   personId:VISITOR,period:st.period,unpaid:left,policySource:policy.factors,
   creditPermitted:policy.extendCredit,sourceStatementId:st.issueEventId,
   frictionEventId:friction.id});
  st.creditEventId=credit.id;
 }
 return payment;
}
function address(s,log){const p=person(s);if(!p.present||p.room!==s.location)throw Error('Visitor conversation requires shared presence');
 const policy=treatment(p),established=policy.trust>=15;
 const historical=established&&!!p.prior&&policy.priorWeight>0.10;
 const text=historical?
  'Coal by weight, Doctor. The old account needs no ceremony.':
  established?'Coal by weight. We have settled those terms already.':
  'Coal by weight, Doctor. Titles do not change the terms.';
 const e=log(s,'visitor_conversation',
  established?'Rosa spoke as a merchant familiar with my actual dealings.':
    'I heard the merchant set out her terms without deference.',
  {personId:VISITOR,visitorText:'Good evening, Doctor Pretorius.',additionalLine:text,
   register:established?'familiar_non_deferential':'formal_non_deferential',
   greetingForm:established?'established_contract':'new_contact',
   timeOffered:policy.minutes,confidenceShared:policy.shareConfidence,
   priorWeight:policy.priorWeight,historyFactors:policy.factors,
   sourceProvenance:historical?'reconstructed_archive':'lived_runtime_memory',
   sourceIds:historical?[...p.prior.sourceEventIds]:p.events.map(x=>x.id),
   witnesses:[VISITOR,'pretorius']});
 p.witnessed.push(e.id);return e;
}
function depart(s,log){const p=person(s);if(!p.present)return null;p.present=false;p.targetRoom=null;p.travelRemaining=0;return log(s,'visitor_departure',s.location==='library'?'I saw the caller depart.':'The caller departed without my witnessing it.',{personId:VISITOR,perceived:s.location==='library'});}
function meet(s,log){
 const p=person(s);if(!p.present||p.room!==s.location||p.metVisitDay===s.clock.day||s.activity?.kind==='sleep')return;
 p.metVisitDay=s.clock.day;
 if(treatment(p).greet==='withhold'){log(s,'visitor_avoided','I chose to withhold a greeting from that caller.',{personId:VISITOR,trust:p.trust,decision:'avoid',sourceSocialEvents:p.events.map(x=>x.id)});return;}
 const encounter=recordEncounter(s,log,VISITOR,'greeting',{coPresent:true});
 settleAccount(s,log);
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
 const staleReports=(s.mail?.hearsay||[]).filter(x=>!x.corrected&&x.aboutPerson===VISITOR&&x.laterDisconfirmedBy==='direct_visit');
 for(const hearsay of staleReports){
  const witness=log(s,'belief_corrected','I saw Rosa Brandl here, contrary to a prior report of her prolonged absence.',
   {personId:VISITOR,priorClaimId:hearsay.sourceEventId,hearsayId:hearsay.id,
    directWitness:s.clock.centibeats,previousConfidence:'hearsay',correctedBy:'direct_encounter'});
  hearsay.corrected=true;hearsay.correctionEventId=witness.id;
  for(const belief of s.mail.knowledge.filter(x=>x.sourceEventId===hearsay.sourceEventId)){
   belief.epistemicStatus='disconfirmed_by_direct_witness';
   belief.correctionEventId=witness.id;
  }
 }
 s.needs.company=clip(s.needs.company+18);
}
function scheduled(s,log){
 const phase=s.clock.centibeats%100000,day=s.clock.day,p=person(s);
 if((day%7===0||day>0&&day%30===0)&&phase>=44000&&phase<60000&&!p.present&&p.lastVisitDay!==day){p.lastVisitDay=day;arrive(s,log,true);}
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
function shared(s,log,kind,{id=VISITOR,fact='',privateToVisitor=false,sourceEventId=null}={}){
 const p=person(s,id);if(!p.present||p.room!==s.location)throw Error('Shared social event requires physical co-presence');
 const prior=p.events.map(x=>x.kind);
 const raw=kind==='gift'?(prior.includes('insult')?5:20):
  kind==='insult'?(prior.includes('gift')?-35:-15):
  kind==='greeting'?2:kind==='conversation'?3:
  kind==='trade'?(prior.includes('insult')?1:4):
  kind==='negotiation'?2:kind==='friction'?RELATIONSHIP.frictionPenalty:0;
 const {delta,rawDelta}=changeTrust(p,raw);
 p.affinity+=kind==='gift'?7:kind==='insult'?-5:0;
 p.grievance+=kind==='insult'?1:kind==='friction'?1:0;
 const witnesses=privateToVisitor?[id,'pretorius']:[id,'pretorius','player'];
 const e=log(s,'social',kind==='friction'?
  'I witnessed disagreement over an established custom and felt it strain our relationship.':
  `I recorded a shared ${kind} with ${id}.`,
  {kind,personId:id,delta,rawDelta,trust:p.trust,witnesses,
   privateToVisitor,sourceEventId});
 p.events.push({id:e.id,kind,delta,sourceEventId,t:s.clock.centibeats});
 p.witnessed.push(e.id);
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
 const friction=shared(s,log,'friction',{sourceEventId:conflict.id});
 const negotiation=shared(s,log,'negotiation',{sourceEventId:conflict.id});
 return log(s,'custom_negotiation','I acknowledged the custom without relinquishing my independence.',
  {personId:VISITOR,custom:kind,conflictEventId:conflict.id,
   frictionEventId:friction.id,socialEventId:negotiation.id,
   sourceIds:[...c.sourceEventIds]});
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
function violateMerchantCustom(s,log,violation='volume_measure'){
 const p=person(s),policy=treatment(p);
 if(!p.present)return null;
 if(!['volume_measure','unsafe_floor','cart_wait'].includes(violation))throw Error('Unknown merchant custom');
 const archiveRefs=p.prior?.sourceEventIds||['E22-001'];
 const e=log(s,'merchant_custom_breached',
  'The merchant refused to substitute an assumption for the weight or safe delivery point.',
  {personId:VISITOR,violation,sourceEvents:[...archiveRefs],
   prior_source:'reconstructed_archive',currentEncounter:p.metVisitDay,
   historyFactors:policy.factors});
 const surprise=log(s,'surprise','I met resistance to a practice I thought could be altered.',
  {personId:VISITOR,reason:violation,sourceEventId:e.id,moodDelta:-3});
 applyMood(s,'merchant measurement dispute',-3);
 SocialNoteForCurrentOnly(s,log,e);
 return surprise;
}
function SocialNoteForCurrentOnly(s,log,source){
 return log(s,'relationship_friction','I found that our business arrangements still have edges.',
  {personId:VISITOR,sourceEventId:source.id});
}
function violateCustom(s,log){const c=s.customs.greeting;if(!c.learned||!person(s).present||person(s).room!==s.location)return null;const e=log(s,'surprise','I was surprised by the breach of a greeting I had learned.',{custom:'greeting',sourceIds:[...c.sourceEventIds],moodDelta:-3});applyMood(s,'custom breached',-3);return e;}
function markFunny(s,log,id=VISITOR){const e=shared(s,log,'funny',{id});s.humor.push({sourceEventId:e.id,personId:id,used:false,cooldownUntil:0});return e;}
function callback(s,log,id=VISITOR){const h=s.humor.find(x=>x.personId===id&&!x.used&&s.clock.centibeats>=x.cooldownUntil);if(!h)return null;h.used=true;h.cooldownUntil=s.clock.centibeats+5000;return log(s,'humor_callback','I recalled our earlier absurd mishap, once.',{sourceEventId:h.sourceEventId,personId:id,cooldownUntil:h.cooldownUntil});}
module.exports={VISITOR,DELIVERY,RELATIONSHIP,changeTrust,issueStatement,settleAccount,person,priorWeight,effectiveTrust,treatment,recordEncounter,deliverGoods,arrive,depart,address,meet,scheduled,shared,observeCustom,negotiateCustom,checkCustoms,violateMerchantCustom,violateCustom,markFunny,callback};