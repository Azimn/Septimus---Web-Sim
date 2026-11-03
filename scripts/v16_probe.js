'use strict';
// Exact source-linked social and postal evidence from five independent 30-day lives.
const {fresh,archive,SEEDS}=require('./v12_probe');
const {advance,log,social,post}=require('../src/engine');
const Post=require('../src/post');
const clone=structuredClone,DAY=100000,START=25000;
function runFor(s,n){while(n>0&&!s.dead){const q=Math.min(n,1000);advance(s,archive,q);n-=q;}return s;}
function trace(s,id){
 const p=s.people[id],events=s.events,
  social=events.filter(e=>e.type==='social'&&e.personId===id),
  meeting=events.filter(e=>id==='mcfeely'?
    e.type==='carrier_conversation':e.type==='visitor_conversation');
 const encounters=events.filter(e=>e.type==='person_encounter'&&e.personId===id);
 const avoided=events.filter(e=>(e.type==='person_avoided'||e.type==='visitor_avoided')&&e.personId===id);
 const witnessed=meeting.filter(e=>(e.witnesses||[]).includes('pretorius'));
 return {id,name:p?.name||id,marker:p?.marker||null,relationshipSource:p?.prior?.prior_source||'lived_only',
  priorRefs:p?.prior?.sourceEventIds||[],livedEncounters:p?.liveEncounters||0,
  trust:p?.trust||0,effectiveTrust:p?socialTrust(p):0,
  encountered:encounters.length,witnessedConversations:witnessed.length,
  avoided:avoided.length,
  eventHistory:encounters.map(e=>({id:e.id,tick:e.t,personId:e.personId,
   form:e.treatment?.greet||'greet',priorWeight:e.priorWeight||0,
   trustAt:e.treatment?.trust??null})),
  trustTrajectory:social.map(e=>({id:e.id,tick:e.t,kind:e.kind,delta:e.delta,trust:e.trust})),
  recognitionIds:events.filter(e=>(e.type==='prior_reunion'||e.type==='person_recognized')&&e.personId===id).map(e=>e.id),
  dealings:events.filter(e=>(e.type==='merchant_delivery'||e.type==='carrier_arrival'||e.type==='trade_receipt'||
   e.type==='reply_collected')&&e.personId===id).map(e=>({id:e.id,type:e.type,tick:e.t})),
  knownFacts:p?.knowledge?.map(k=>({fact:k.fact,sourceEventId:k.sourceEventId,
   provenance:k.provenance}))||[]};
}
function socialTrust(p){return require('../src/social').effectiveTrust(p);}
function monthSeed(seed){
 const s=fresh(seed);runFor(s,30000);
 const mail=s.mail;
 const letters=mail.letters.map(l=>({id:l.id,sender:l.sender,contentClass:l.contentClass,
  provenance:l.provenance,deliveryMode:l.deliveryMode,arrivalTick:l.receivedAt,
  deliveryEventId:l.deliveryEventId,readTick:l.readAt,read:l.readAt!==null,
  replyWrittenAt:l.replyWrittenAt||null,replyCollectedAt:mail.outgoing.find(x=>x.letterId===l.id)?.collectedAt||null}));
 const parcels=mail.parcels.map(x=>({id:x.id,deliveryMode:x.deliveryMode,arrivalTick:x.receivedAt,
  openedAt:x.openedAt,content:x.contents,deliveryEventId:x.deliveryEventId}));
 const henry=letters.filter(l=>l.sender==='Henry Frankenstein');
 const completed=s.events.filter(e=>e.type==='completed');
 const early=s.events.find(e=>e.type==='merchant_delivery');
 const loud=s.events.filter(e=>e.type==='carrier_knock');
 const word=s.events.find(e=>e.type==='letter_read'&&e.senderId==='henry_frankenstein');
 const fidelitySamples=s.events.filter(e=>['visitor_conversation','noticed_by_person',
  'carrier_conversation'].includes(e.type)).map(e=>({
   eventId:e.id,day:e.day,tick:e.t,type:e.type,personId:e.personId,
   description:e.description,words:[e.visitorText,e.additionalLine].filter(Boolean),
   register:e.register||null,sourceIds:e.sourceIds||e.archiveReferences||[],
   witnesses:e.witnesses||[]
  }));
 return {seed,steps:30000,days:30,dead:s.dead,health:s.health,fidelitySamples,
  completedActivities:completed.length,activityDistribution:completed.reduce((m,e)=>(m[e.kind]=(m[e.kind]||0)+1,m),{}),
  resources:{...s.stores},rosa:trace(s,'visitor_01'),mcfeely:trace(s,'mcfeely'),
  mail:{letters,parcels,received:letters.length,read:letters.filter(x=>x.read).length,
   replied:letters.filter(x=>x.replyWrittenAt).length,
   repliesCollected:letters.filter(x=>x.replyCollectedAt).length,
   boxed:letters.filter(x=>x.deliveryMode==='boxed').length,
   handed:letters.filter(x=>x.deliveryMode==='handed').length,
   pendingBox:mail.box.slice(),stillUnanswered:mail.letters.filter(x=>x.requiresReply&&!x.replyWrittenAt).map(x=>x.id),
   unreadFactsExcluded:mail.letters.filter(x=>!x.readAt).every(l=>!
    mail.knowledge.some(k=>k.letterId===l.id)),
   henryLetterCount:henry.length,henry,henryReadReceipt:word?
    {eventId:word.id,tick:word.t,beliefProvenance:word.beliefProvenance,changedKnowledge:word.claims}:null,
   hearings:mail.hearsay.map(x=>({...x})),
   sourcedRumination:s.events.filter(e=>e.type==='rumination').slice(0,10).map(x=>({id:x.id,tick:x.t,sourceId:x.sourceId}))},
  supplierReceipts:s.events.filter(e=>e.type==='merchant_delivery').map(x=>({id:x.id,t:x.t,
   food:x.units.food,fuel:x.units.fuel,creditLimit:x.creditLimit,accountBalance:x.accountBalance})),
  firstMerchantDeliveryId:early?.id||null,carrierKnockCount:loud.length,
  pausedWorldEvents:s.events.filter(e=>e.type==='paused').length,
  canonArchiveSha:s.archiveSha,
  firstCrossSourceCorrection:s.events.find(e=>e.type==='belief_corrected')||null};
}
function priorAblation(){
 const withPrior=fresh(11),withoutPrior=clone(withPrior);
 withoutPrior.people.visitor_01.prior=null;
 const policy=s=>require('../src/social').treatment(s.people.visitor_01);
 const before=[policy(withPrior),policy(withoutPrior)];
 runFor(withPrior,30000);runFor(withoutPrior,30000);
 const after=[policy(withPrior),policy(withoutPrior)];
 const first=s=>s.events.find(e=>e.type==='visitor_conversation');
 const forms=[first(withPrior),first(withoutPrior)].map(x=>x?{
  id:x.id,greetingForm:x.greetingForm,timeOffered:x.timeOffered,
  priorWeight:x.priorWeight,additionalLine:x.additionalLine}:null);
 const differenceStart=before[0].trust-before[1].trust;
 const differenceEnd=after[0].trust-after[1].trust;
 const priorContribution=after[0].trust-withPrior.people.visitor_01.trust;
 const lived=withPrior.people.visitor_01.trust;
 return {seed:11,before,after,openingForms:forms,firstPriorReunionId:withPrior.events.find(x=>x.type==='prior_reunion')?.id||null,
  noPriorReunion:withoutPrior.events.some(x=>x.type==='prior_reunion'),
  sourceRefs:withPrior.people.visitor_01.prior.sourceEventIds,
  differenceStart,differenceEnd,converged:Math.abs(differenceEnd)<Math.abs(differenceStart),
  mostlyLived:Math.abs(lived)>Math.abs(priorContribution),
  sameCalendar:withPrior.mail.mailDays.join(',')===withoutPrior.mail.mailDays.join(','),
  sameMerchantDeliverySchedule:withPrior.events.filter(x=>x.type==='merchant_delivery').map(x=>x.day).join(',')===
    withoutPrior.events.filter(x=>x.type==='merchant_delivery').map(x=>x.day).join(','),
  afterLivedTrust:withPrior.people.visitor_01.trust,
  afterPriorContribution:priorContribution};
}
function historySwap(){
 const Social=require('../src/social'),s=fresh(11);
 const rosa=s.people.visitor_01,carrier=Social.person(s,'mcfeely');
 rosa.prior=null;rosa.present=true;rosa.room='garden';
 carrier.present=true;carrier.room='garden';s.location='garden';
 Social.shared(s,log,'gift',{id:'visitor_01'});
 Social.shared(s,log,'gift',{id:'visitor_01'});
 Social.shared(s,log,'insult',{id:'mcfeely'});
 Social.shared(s,log,'insult',{id:'mcfeely'});
 const before=[Social.treatment(rosa),Social.treatment(carrier)];
 const dataA={trust:rosa.trust,events:structuredClone(rosa.events),liveEncounters:rosa.liveEncounters||0},
  dataB={trust:carrier.trust,events:structuredClone(carrier.events),liveEncounters:carrier.liveEncounters||0};
 Object.assign(rosa,dataB);Object.assign(carrier,dataA);
 const after=[Social.treatment(rosa),Social.treatment(carrier)];
 const logEvent=log(s,'social_history_swap_control','Only the two persons lived social histories were exchanged in a fork.',
  {operatorOnly:true,changes:['trust','events','liveEncounters'],
   noPersonIdInTreatment:!/visitor_01|mcfeely/.test(String(Social.treatment))});
 return {before,after,eventId:logEvent.id,
  passed:before[0].greet==='greet'&&before[1].greet==='withhold'&&
  after[0].greet==='withhold'&&after[1].greet==='greet'&&
  before[0].shareConfidence&&!after[0].shareConfidence&&
  before[0].minutes===after[1].minutes&&
  !/visitor_01|mcfeely/.test(String(Social.treatment)),
  sourceEventIds:s.events.filter(e=>e.type==='social').map(e=>e.id)};
}
function threeMind(){
 const s=fresh(11),rosa=s.people.visitor_01,p=Post.carrierRecord(s);
 p.present=true;p.room='garden';s.location='bedchamber';
 // Independent written request physically enters the tower on a mock round.
 s.clock.day=3;s.clock.centibeats=342000;
 Post.arrive(s,log);
 const l=s.mail.letters.at(-1),unread=s.mail.knowledge.every(x=>x.letterId!==l.id);
 Post.check(s,log);s.location='library';
 Post.read(s,log);const known=s.mail.knowledge.some(x=>x.letterId===l.id);
 Post.writeReply(s,log,{letterId:l.id,privateToCarrier:true,fact:'The west jar contains a corrected measure'});
 s.location='garden';Post.postReply(s,log);
 const openBefore=s.commitments.find(x=>x.id==='POST-'+l.id)?.status;
 // Posting after this carrier's arrival cannot be retroactively collected.
 Post.collectOutgoing(s,log);
 const premature=s.mail.outgoing.some(x=>x.collectedAt);
 Post.depart(s,log);
 s.clock.day=5;s.clock.centibeats=542000;
 Post.arrive(s,log);
 const openAfter=s.commitments.find(x=>x.id==='POST-'+l.id)?.status;
 const factKnownByCarrier=p.knowledge.some(x=>x.fact==='The west jar contains a corrected measure'),
  factKnownByRosa=rosa.knowledge.some(x=>x.fact==='The west jar contains a corrected measure');
 const relay=Post.relay(s,log,{sourcePerson:'visitor_01',
  fact:'Rosa has taken her cart away for the season',laterDisconfirmedBy:'direct_visit'});
 const beforehand=relay.corrected;
 const visit=SocialReturn(s,log);
 const correction=s.events.find(x=>x.type==='belief_corrected'&&x.priorClaimId===relay.sourceEventId);
 return {letter:l.id,unreadUnknown:unread,readKnown:known,
  beforeCollection:openBefore,afterCollection:openAfter,
  factKnownByCarrier,factKnownByRosa,hearsay:relay,directVisit:visit,
  tailEvents:s.events.slice(-18).map(e=>({id:e.id,type:e.type,personId:e.personId,priorClaimId:e.priorClaimId})),
  correctedOnDirectVisit:!!correction,
  correctionSource:correction?.priorClaimId||null,
  passed:unread&&known&&openBefore==='open'&&openAfter==='kept'&&
   factKnownByCarrier&&!factKnownByRosa&&!beforehand&&!premature&&!!correction};
}
function SocialReturn(s,log){
 const Soc=require('../src/social');
 // A direct witnessed reunion, not a receipt appearing in the archive.
 const p=s.people.visitor_01;
 p.present=true;p.room='garden';p.lastVisitDay=8;s.clock.day=8;s.clock.centibeats=844000;
 const before={location:s.location,personRoom:p.room,personPresent:p.present,
  wasMetDay:p.metVisitDay,activity:s.activity?.kind||null,
  hearsay:s.mail.hearsay.map(x=>({id:x.id,aboutPerson:x.aboutPerson,corrected:x.corrected}))};
 Soc.meet(s,log);
 return {...before,afterMetDay:p.metVisitDay};
}
function run(){
 const runs=SEEDS.map(monthSeed),prior=priorAblation(),
 swap=historySwap(),knowledge=threeMind();
 const acceptance={
  thirtyDays:runs.every(r=>r.days===30&&!r.dead),
  twoPresent:runs.every(r=>r.rosa.name==='Rosa Brandl'&&r.mcfeely.name==='Mr. McFeely'),
  twoWitnessed:runs.filter(r=>r.rosa.witnessedConversations>0&&r.mcfeely.witnessedConversations>0).length>=4,
  distinctTrajectories:runs.every(r=>r.rosa.trustTrajectory.length!==r.mcfeely.trustTrajectory.length),
  mailPhysical:runs.every(r=>r.mail.received>0&&r.mail.unreadFactsExcluded&&
    r.mail.letters.every(l=>l.deliveryMode==='boxed'||l.deliveryMode==='handed')),
  henryOnce:runs.every(r=>r.mail.henryLetterCount===1),
  carrierNeverInside:runs.every(r=>r.mcfeely.eventHistory.every(e=>e.form)&&r.carrierKnockCount>0),
  swapControl:swap.passed,knowledgeControl:knowledge.passed,
  priorDifferenceAndConvergence:prior.openingForms[0]?.greetingForm!==prior.openingForms[1]?.greetingForm&&
    prior.converged&&prior.mostlyLived&&prior.sameCalendar
 };
 return {schema:'simple-tower-v1.6-evidence-v1',sourceHead:process.env.GITHUB_SHA||'unversioned',
  sourceArchive:'canon/Pretorius_v12_450_Events_Complete.jsonl',
  policy:'one scripted merchant and one scripted mail carrier; no model; letters are not archive memories',
  runs,priorAblation:prior,historySwap:swap,threeMind:knowledge,acceptance};
}
function main(){
 const d=run(),raw=Buffer.from(JSON.stringify(d),'utf8').toString('base64');
 console.log('V16_DATA_BEGIN '+raw.length);
 for(let i=0;i<raw.length;i+=1700)console.log('V16_DATA_PART '+Math.floor(i/1700)+' '+raw.slice(i,i+1700));
 console.log('V16_DATA_END '+Math.ceil(raw.length/1700));
 for(const x of d.runs)console.log('V16_SEED '+JSON.stringify({seed:x.seed,rosaTalks:x.rosa.witnessedConversations,
  carrierTalks:x.mcfeely.witnessedConversations,rosaTrust:x.rosa.trust,carrierTrust:x.mcfeely.trust,
  delivered:x.mail.received,read:x.mail.read,replied:x.mail.replied,collected:x.mail.repliesCollected,
  parcels:x.mail.parcels.length,henry:x.mail.henryLetterCount,henryRead:x.mail.henryReadReceipt?.tick||null}));
 console.log('V16_PRIOR '+JSON.stringify({initial:d.priorAblation.differenceStart,end:d.priorAblation.differenceEnd,
  converged:d.priorAblation.converged,mostlyLived:d.priorAblation.mostlyLived,
  forms:d.priorAblation.openingForms}));
 console.log('V16_CONTROLS '+JSON.stringify({swap:d.historySwap.passed,knowledge:d.threeMind.passed,
  acceptance:d.acceptance}));
}
if(require.main===module)main();
module.exports={run,monthSeed,priorAblation,historySwap,threeMind};
