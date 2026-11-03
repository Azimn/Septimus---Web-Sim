'use strict';
// Scripted correspondence is lived evidence of receiving a letter, never an
// addition to the 450-event archive or a memory that the sender experienced it.
const {DAY}=require('./world');
const Social=require('./social');
const Commitments=require('./commitments');
const CARRIER='mcfeely';
const {POST}=require('./post_contract');
const SCRIPT=Object.freeze({
  1:{sender:'Rosa Brandl',senderId:'visitor_01',class:'bill_notice',
    text:'The scales decide the coal measure. Our account is settled by weight, not title.',
    fact:'Rosa keeps the tower account by weight',requiresReply:false},
  3:{sender:'University Secretary',senderId:'university_office',class:'request',
    text:'Please acknowledge the inquiry into the university instrument inventory before the next five days pass.',
    fact:'University requested inventory acknowledgment',requiresReply:true},
  5:{sender:'Henry Frankenstein',senderId:'henry_frankenstein',class:'personal',
    text:'I write about the unfinished experiments and ask whether the tower remains fit for another inquiry.',
    fact:'A correspondent signing Henry asked about tower experiments',requiresReply:true},
  8:{sender:'Rosa Brandl',senderId:'visitor_01',class:'news',
    text:'The market takes my cart for a while. Do not confuse an intention with a fixed itinerary.',
    fact:'Rosa planned to take her cart to market',requiresReply:false},
  10:{sender:'Village Dispatch',senderId:'dispatch_office',class:'parcel_notice',
    text:'A parcel of lamp supplies is expected on the next scheduled postal round.',
    fact:'A parcel of lamp supplies was announced',requiresReply:false,parcel:'PARCEL-LAMP-12'},
  15:{sender:'Rosa Brandl',senderId:'visitor_01',class:'bill_notice',
    text:'Your balance remains measured in actual coal and provisions, not in promises.',
    fact:'Rosa sent an account reminder',requiresReply:false}
});
const PARCELS=Object.freeze({
  12:{id:'PARCEL-LAMP-12',from:'Village Dispatch',contents:{lampSupplies:2}},
  19:{id:'PARCEL-TEA-19',from:'Rosa Brandl',contents:{tea:2}},
  26:{id:'PARCEL-BOOK-26',from:'University Secretary',contents:{books:1}}
});
function ensure(s){
 s.mail??={letters:[],parcels:[],box:[],carried:[],outgoing:[],
  knowledge:[],hearsay:[],mailDays:[],pendingParcelNotices:[],henryLetters:0};
 return s.mail;
}
function letter(day){
 const source=SCRIPT[day]||{sender:'Local Postal Office',senderId:'postal_office',
  class:'news',text:'The road remains passable and the local post continues its rounds.',
  fact:'Local postal route continues',requiresReply:false};
 return {id:'LETTER-'+String(day).padStart(2,'0'),sender:source.sender,senderId:source.senderId,
  contentClass:source.class,content:source.text,claim:source.fact,
  provenance:'synthesized_correspondence',scenarioDay:day,
  requiresReply:!!source.requiresReply,parcelId:source.parcel||null,
  receivedAt:null,readAt:null,opened:false,deliveredBy:CARRIER,deliveryMode:null,
  informedPeople:[source.senderId]};
}
function carrierRecord(s){const p=Social.person(s,CARRIER);p.name='Mr. McFeely';
 p.role='mail carrier';p.marker='three knocks at the path and a pause';
 p.custom??={tripleKnock:true,waitAt:'garden',source:'scenario_script'};
 return p;}
function socialMeet(s,log){
 const p=carrierRecord(s);
 if(!p.present||s.location!=='garden'||s.activity?.kind==='sleep'||s.clock.day===p.lastMetDay)return null;
 p.lastMetDay=s.clock.day;
 const decision=Social.treatment(p);
 const e=Social.recordEncounter(s,log,CARRIER,'postal_errand',{coPresent:true,treatment:decision});
 if(decision.greet==='withhold'){
  log(s,'person_avoided','I did not invite a prolonged exchange.',
   {personId:CARRIER,historyFactors:decision.factors,sourceEncounterId:e.id});
 }else{
  const conversation=log(s,'carrier_conversation','Mr. McFeely knocked three times and waited for an acknowledgment.',
   {personId:CARRIER,knocks:3,witnesses:['pretorius',CARRIER],sourceEncounterId:e.id});
  p.witnessed.push(conversation.id);
  Social.shared(s,log,'greeting',{id:CARRIER});
  s.needs.company=Math.min(100,s.needs.company+7);
 }
 if(!p.firstRecognition){
  p.firstRecognition=e.id;
  log(s,'person_recognized','I can distinguish the mail carrier from my merchant caller.',
   {personId:CARRIER,recognitionMarker:p.marker,sourceEventId:e.id});
 }
 if(!p.relayGiven){
  p.relayGiven=true; relay(s,log,
   {sourcePerson:'visitor_01',fact:'Rosa intends to stay at market for the season',
    knowledgeAt:'earlier_report',status:'unconfirmed',laterDisconfirmedBy:'direct_visit'});
 }
 return e;
}
function stageDelivery(s,log,day,kind,record,handed){
 const mail=ensure(s),p=carrierRecord(s),arrival=log(s,handed?'mail_handed':'mail_boxed',
  handed?'I accepted correspondence from the carrier at the path.':'The carrier left correspondence in the path-side box.',
  {personId:CARRIER,objectId:record.id,objectKind:kind,
   mode:handed?'handed':'boxed',presentRoom:'garden',busy:s.activity?.kind||'free',
   witnessed:handed,witnesses:handed?[CARRIER,'pretorius']:[CARRIER]});
 record.receivedAt=s.clock.centibeats;record.deliveryMode=handed?'handed':'boxed';
 record.deliveryEventId=arrival.id;
 if(kind==='letter')mail.letters.push(record);else mail.parcels.push(record);
 (handed?mail.carried:mail.box).push(record.id);
 if(handed)p.witnessed.push(arrival.id);
 return arrival;
}
function collectOutgoing(s,log){
 const mail=ensure(s);
 for(const x of mail.outgoing.filter(x=>x.postedAt&&!x.collectedAt)){
  x.collectedAt=s.clock.centibeats;
  const e=log(s,'reply_collected','The carrier collected a sealed reply from the box.',
   {replyId:x.id,letterId:x.letterId,personId:CARRIER,
    provenance:'synthesized_correspondence',postedAt:x.postedAt,collectionAt:x.collectedAt,
    privateToCarrier:!!x.privateToCarrier});
  x.collectionEventId=e.id;
  const c=s.commitments.find(c=>c.id===x.commitmentId&&c.status==='open');
  if(c){c.done=true;c.status='kept';c.keptAt=s.clock.centibeats;c.sourceAction='carrier_collection';
   log(s,'commitment_kept','The obligation was fulfilled only when the sealed reply left with the post.',
    {commitmentId:c.id,replyCollectionEventId:e.id,sourceLetterId:x.letterId});}
  if(x.privateToCarrier&&x.fact){
   const p=carrierRecord(s);p.knowledge.push({fact:x.fact,sourceEventId:e.id,
    provenance:'received_private_correspondence'});
  }
 }
}
function arrive(s,log){
 const mail=ensure(s),day=s.clock.day,p=carrierRecord(s);
 if(mail.mailDays.includes(day))return null;
 mail.mailDays.push(day);
 p.present=true;p.room='garden';p.lastRouteDay=day;p.arrivalTick=s.clock.centibeats;
 const arrival=log(s,'carrier_arrival','Mr. McFeely arrived at the garden path on his postal round.',
  {personId:CARRIER,room:'garden',knocks:3,enterTower:false,cadence:'three_rounds_per_week',
   marker:p.marker,source:'scenario_calendar'});
 log(s,'carrier_knock','Three knocks came from the path-side post box.',
  {personId:CARRIER,knocks:3,coPresent:s.location==='garden'&&!s.activity});
 const handed=s.location==='garden'&&!s.activity;
 if(handed)socialMeet(s,log);
 const l=letter(day);
 if(l.senderId==='henry_frankenstein')mail.henryLetters++;
 stageDelivery(s,log,day,'letter',l,handed);
 const parcel=PARCELS[day];
 if(parcel){
  stageDelivery(s,log,day,'parcel',{id:parcel.id,from:parcel.from,
   contents:{...parcel.contents},provenance:'synthesized_correspondence',
   announcedBy:day===12?'LETTER-10':null,
   receivedAt:null,openedAt:null},handed);
 }
 collectOutgoing(s,log);
 return arrival;
}
function depart(s,log){const p=carrierRecord(s);if(!p.present)return null;
 p.present=false;p.room='garden';
 return log(s,'carrier_departure','The carrier completed his errand and departed by the path.',
  {personId:CARRIER,lastRouteDay:p.lastRouteDay});}
function scheduled(s,log){
 const phase=s.clock.centibeats%DAY,day=s.clock.day,p=carrierRecord(s);
 if(POST.days.includes(day%7)&&phase>=POST.arrivalPhase&&phase<POST.departurePhase&&!p.present&&!ensure(s).mailDays.includes(day))arrive(s,log);
 if(p.present&&phase>=POST.departurePhase)depart(s,log);
 if(p.present&&s.location==='garden'&&!s.activity)socialMeet(s,log);
}
function canCheck(s){return ensure(s).box.length>0;}
function canRead(s){const mail=ensure(s);
 return mail.carried.some(id=>mail.letters.some(x=>x.id===id&&!x.readAt));
}
function canWrite(s){return ensure(s).letters.some(x=>x.readAt&&x.requiresReply&&!x.replyWrittenAt);}
function canPost(s){return ensure(s).outgoing.some(x=>!x.postedAt);}
function canOpen(s){const mail=ensure(s);
 return mail.carried.some(id=>mail.parcels.some(p=>p.id===id&&!p.openedAt));}
function check(s,log){
 const mail=ensure(s),contents=mail.box.splice(0);
 if(!contents.length)throw Error('Empty mail box');
 mail.carried.push(...contents);
 return log(s,'mail_collected','I brought the unopened correspondence into my possession.',
  {objectIds:contents,from:'garden_path_mailbox',to:'in_hand',
   readFacts:[],knowledgeNotYetAcquired:true});
}
function read(s,log){
 const mail=ensure(s),l=mail.letters.find(x=>mail.carried.includes(x.id)&&!x.readAt);
 if(!l)throw Error('No held unread letter');
 l.readAt=s.clock.centibeats;
 const e=log(s,'letter_read','I read a letter which I had received, without treating its words as events I witnessed.',
  {letterId:l.id,sender:l.sender,senderId:l.senderId,content:l.content,
   contentClass:l.contentClass,claims:[l.claim],provenance:'synthesized_correspondence',
   beliefProvenance:'by_letter:'+l.id,arrivalEventId:l.deliveryEventId,
   readAt:l.readAt,notArchive:true});
 mail.knowledge.push({fact:l.claim,sourceEventId:e.id,letterId:l.id,
  provenance:'by_letter:'+l.id,epistemicStatus:'believed_from_correspondence',
  knownTo:['pretorius',l.senderId]});
 if(l.parcelId)mail.pendingParcelNotices.push({parcelId:l.parcelId,letterId:l.id,readEventId:e.id});
 if(l.requiresReply&&!s.commitments.some(c=>c.id==='POST-'+l.id))
  Commitments.add(s,{id:'POST-'+l.id,
   title:'Send a documented reply to '+l.sender+' and have it collected',
   deadline:s.clock.centibeats+POST.replyDeadlineDays*DAY,action:'carrier_collection',
   origin:'correspondence'},log);
 return e;
}
function writeReply(s,log,{letterId=null,privateToCarrier=false,fact=''}={}){
 const mail=ensure(s),l=mail.letters.find(x=>x.id===(letterId||mail.letters.find(y=>y.readAt&&y.requiresReply&&!y.replyWrittenAt)?.id));
 if(!l||!l.readAt||l.replyWrittenAt)throw Error('No eligible read, unanswered letter');
 l.replyWrittenAt=s.clock.centibeats;
 const response={id:'REPLY-'+l.id,letterId:l.id,to:l.sender,from:'Septimus Pretorius',
  provenance:'synthesized_correspondence',createdAt:s.clock.centibeats,postedAt:null,collectedAt:null,
  commitmentId:'POST-'+l.id,privateToCarrier, fact:privateToCarrier?fact:''};
 const e=log(s,'reply_written','I wrote a response, but it is not sent until the carrier takes it.',
  {replyId:response.id,sourceLetterId:l.id,provenance:'synthesized_correspondence',
   recipient:l.sender,privateToCarrier,notYetCollected:true});
 response.writtenEventId=e.id;mail.outgoing.push(response);return e;
}
function postReply(s,log){
 const reply=ensure(s).outgoing.find(x=>!x.postedAt);
 if(!reply)throw Error('No sealed reply to post');
 reply.postedAt=s.clock.centibeats;
 return log(s,'reply_posted','I placed the sealed reply in the path-side box for the next round.',
  {replyId:reply.id,letterId:reply.letterId,postedAt:reply.postedAt,
   stillOpenUntilCarrier:true,provenance:'synthesized_correspondence'});
}
function openParcel(s,log){
 const mail=ensure(s),p=mail.parcels.find(x=>mail.carried.includes(x.id)&&!x.openedAt);
 if(!p)throw Error('No unopened parcel in possession');
 const a=p.announcedBy?mail.pendingParcelNotices.find(x=>x.parcelId===p.id):null;
 if(p.announcedBy&&!a)throw Error('Parcel requires a previously read announcement');
 p.openedAt=s.clock.centibeats;
 const before={tea:s.stores.tea,books:s.stores.books||0,lampSupplies:s.stores.lampSupplies||0};
 for(const [k,q] of Object.entries(p.contents))s.stores[k]=(s.stores[k]||0)+q;
 return log(s,'parcel_opened','I opened a delivered parcel and entered its contents in my actual stores.',
  {parcelId:p.id,contents:{...p.contents},before,
   after:{tea:s.stores.tea,books:s.stores.books||0,lampSupplies:s.stores.lampSupplies||0},
   sourceDeliveryId:p.deliveryEventId,noticeReadEventId:a?.readEventId||null,
   provenance:'synthesized_correspondence'});
}
function relay(s,log,{sourcePerson,fact,knowledgeAt='earlier_report',status='unconfirmed',laterDisconfirmedBy='direct_visit'}){
 const p=carrierRecord(s);if(!p.present||p.room!==s.location)throw Error('Hearsay requires a witnessed encounter with carrier');
 const source=log(s,'hearsay_source','I heard the carrier attribute a report to another person.',
  {sourcePerson,intermediary:CARRIER,content:fact,
   statusAtSource:knowledgeAt,reportedStatus:status,
   provenance:'scenario_relay_not_archive',witnesses:['pretorius',CARRIER]});
 const belief={id:'HEARSAY-'+source.id,fact,aboutPerson:sourcePerson,
  sourcePerson,intermediary:CARRIER,sourceEventId:source.id,
  epistemicStatus:'hearsay',corrected:false,laterDisconfirmedBy};
 ensure(s).hearsay.push(belief);
 ensure(s).knowledge.push({fact,sourceEventId:source.id,
  provenance:'hearsay:'+sourcePerson+':'+CARRIER,
  epistemicStatus:'unconfirmed',knownTo:['pretorius',CARRIER,sourcePerson]});
 return belief;
}
function tell(s,log,personId,fact,{privateFact=false}={}){
 const p=s.people[personId];
 if(!p?.present||p.room!==s.location)throw Error('Disclosure requires physical shared presence');
 const e=log(s,'fact_told','I passed information to one actual witness.',
  {personId,fact,privateFact,witnesses:['pretorius',personId]});
 p.knowledge.push({fact,sourceEventId:e.id,provenance:'told_fact'});
 return e;
}
module.exports={POST,SCRIPT,PARCELS,CARRIER,ensure,carrierRecord,socialMeet,
 stageDelivery,collectOutgoing,arrive,depart,scheduled,canCheck,canRead,canWrite,canPost,canOpen,
 check,read,writeReply,postReply,openParcel,relay,tell};
