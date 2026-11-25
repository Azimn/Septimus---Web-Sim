'use strict';
// Exact Small Tower physical rules, one external cognitive owner.
// This is an offline trusted host interface, not a model endpoint.
const {ROOMS,OBJECTS,STEP,ensureHooks}=require('./world');
const {DEFINITIONS,available}=require('./actions');
const {tick,start,log,cognition}=require('./engine');
const {digest}=require('./store');
const ID=/^[a-zA-Z0-9_-]{1,100}$/;
const SOURCE='simple-tower-doctor-world-v1';
const NAMES={visitor_01:'Rosa Brandl',mcfeely:'Mr. McFeely'};
const LABELS={
 sleep:'go to sleep',rest:'sit and rest',diary:'write in my notebook',read:'consult my historical folios',
 prepare:'secure the hearth',cook:'cook a meal',tea:'brew tea',eat:'eat from my stores',
 work:'work at my bench',inspect:'inspect the instrument',study:'study my specimens',
 walk:'walk in my garden',tend:'tend my garden',gather_fuel:'gather fallen wood',
 draw_water:'draw water',converse:'speak with Rosa Brandl',preserve:'preserve provisions',
 trade:'exchange provisions with Rosa Brandl',settle_account:'attend to my account with Rosa Brandl',meet_carrier:'speak with Mr. McFeely',
 check_mail:'collect my unopened post',read_letter:'read a letter in my possession',
 write_reply:'write a reply',post_reply:'post my reply',open_parcel:'open my delivered package'};
function requireWorld(s){if(s.controllerMode!=='doctor_world'||!s.doctorWorld||!ID.test(s.doctorWorld.epoch))throw Error('Explicit canonical world enrollment required');}
function enroll(s,epoch){
 if(!ID.test(epoch))throw Error('Invalid world epoch');
 if(s.doctorWorld||s.events.length||s.activity)throw Error('Use a fresh disposable Tower save; no silent migration');
 ensureHooks(s);s.controllerMode='doctor_world';s.running=false;
 s.doctorWorld={epoch,requests:{}};cognition.observe(s,log);return s;
}
function revision(s){
 requireWorld(s);
 // Original store verifies complete snapshot and event segments on load.
 // Bind a decision to the exact current state (not just clock or room).
 const {events,doctorWorld,...rest}=s;
 return digest(JSON.stringify([doctorWorld.epoch,rest,events.length,events.at(-1)||null]));
}
function visible(s){
 // Only top-four actual observed objects; never include unseen room content.
 return s.perception.filter(p=>p.room===s.location).map(p=>p.label);
}
function narrative(s){
 requireWorld(s);
 const lines=['I am in my '+ROOMS[s.location].label.toLowerCase()+'.'];
 for(const label of visible(s))lines.push('I can see '+label+'.');
 if(s.perception.some(x=>x.id==='stores'&&x.room===s.location)){
  if(s.stores.food+(s.stores.preserved||0)<=3)lines.push('I can see that my edible provisions are running low.');
  if(s.stores.fuel<=3)lines.push('I can see that my fuel is running low.');
  if(s.stores.water<=3)lines.push('I can see that my water is running low.');
  if(s.stores.tea<=2)lines.push('I can see that my tea is running low.');
 }
 const rosa=s.people.visitor_01;
 if(rosa?.present&&rosa.room===s.location)lines.push('I see Rosa Brandl here with me.');
 const carrier=s.people.mcfeely;
 if(carrier?.present&&carrier.room===s.location)lines.push('I see Mr. McFeely at the garden path.');
 if(s.needs.hunger>=70)lines.push('I am painfully hungry.');
 else if(s.needs.hunger>=40)lines.push('I could do with something to eat.');
 if(s.needs.energy<30)lines.push('I feel worn out and find it hard to concentrate.');
 else if(s.needs.energy<60)lines.push('I am getting tired.');
 if(s.needs.comfort<30)lines.push('I feel uncomfortable.');
 if(s.needs.company<30)lines.push('I find the solitude wearing.');
 if(s.needs.stimulation<30)lines.push('I long for something to occupy my mind.');
 if(s.activity)lines.push('I am occupied with an unfinished activity.');
 // Known adjacent exits are a local spatial affordance, not a global map.
 if(!s.activity&&!s.dead)for(const room of ROOMS[s.location].exits)
  lines.push('I can make my way to my '+ROOMS[room].label.toLowerCase()+'.');
 return lines;
}
function choices(s){
 if(s.activity||s.dead)return [];
 const perceived=new Set(s.perception.filter(p=>p.room===s.location).map(p=>p.id));
 const result=[];
 for(const [kind,a] of Object.entries(DEFINITIONS)){
  const person=s.people[a.target];
  // A person must be physically co-present; object must be actually seen.
  // Carrier's path presence is a direct encounter, never hidden remote state.
  const known=person?person.present&&person.room===s.location:
   perceived.has(a.target)&&(s.objectPositions[a.target]||OBJECTS[a.target]?.room)===s.location;
  if(known&&available(s,kind))result.push({key:kind,text:'I could '+LABELS[kind]+'.'});
 }
 for(const room of ROOMS[s.location].exits)
  result.push({key:'move_'+room,text:'I could go to my '+ROOMS[room].label.toLowerCase()+'.'});
 return result;
}
function eventText(e){
 const witnessed=Array.isArray(e.witnesses)&&e.witnesses.includes('pretorius');
 if(e.operatorOnly||e.provenance==='operator_metadata')return null;
 if(e.type==='completed'&&e.controller==='doctor_canonical'){
  if(e.kind==='read')return 'I consulted my historical folios, not an event I newly lived.';
  if(e.kind==='diary')return 'I wrote in my private notebook.';
  return /^I\b/.test(e.description)?e.description:null;
 }
 if(e.type==='action_failed'&&e.controller==='doctor_canonical')return 'I could not complete my intended activity.';
 if(e.type==='visitor_arrival'&&e.perceived===true)return 'I noticed Rosa Brandl arrive at my tower.';
 if(e.type==='visitor_conversation'&&witnessed)return 'I heard Rosa Brandl say, “'+e.additionalLine+'”';
 if(e.type==='carrier_conversation'&&witnessed)return 'I heard Mr. McFeely knock three times and wait for my acknowledgment.';
 if(e.type==='carrier_knock'&&e.coPresent===true)return 'I heard three knocks from the path-side post box.';
 if(e.type==='merchant_settlement'&&e.coPresent===true)return 'I attended to my account with Rosa Brandl.';
 if(e.type==='social'&&witnessed&&NAMES[e.personId]){
  const words={greeting:'greeted',conversation:'spoke with',trade:'traded with',friction:'had a disagreement with',
   negotiation:'negotiated with',gift:'exchanged a gift with',insult:'had an unpleasant exchange with'};
  return words[e.kind]?'I '+words[e.kind]+' '+NAMES[e.personId]+'.':null;
 }
 if(e.type==='letter_read'&&typeof e.sender==='string'&&typeof e.claims?.[0]==='string')
  return 'I read a letter from '+e.sender+'. It reports, “'+e.claims[0]+'”';
 if(e.type==='belief_corrected'&&e.correctedBy==='direct_encounter')
  return 'I saw Rosa Brandl here, contrary to an earlier report of her absence.';
 return null;
}
function eventsAfter(s,after=0){
 requireWorld(s);
 if(!Number.isSafeInteger(after)||after<0||after>s.sequence)throw Error('Invalid source cursor');
 const events=[];
 for(const e of s.events){
  const seq=Number(e.id.slice(1));
  if(seq<=after)continue;
  const text=eventText(e);
  if(text)events.push({id:e.id,sequence:seq,sha256:digest(JSON.stringify(e)),
   text,kind:e.type,operation:e.type==='completed'||e.type==='action_failed'?e.kind:null,
   actor:NAMES[e.personId]||e.sender||null,
   socialKind:e.type==='social'?e.kind:null,
   epistemic:e.type==='letter_read'?'received_testimony':'witnessed_experience',
   policyRef:e.policyRef||null});
 }
 return {events,cursor:s.sequence};
}
function observe(s,after=0){requireWorld(s);
 return {schema:SOURCE,epoch:s.doctorWorld.epoch,revision:revision(s),busy:!!s.activity,
  deceased:!!s.dead,narrative:narrative(s),offers:choices(s),...eventsAfter(s,after)};}
function pulse(s,archive,request){
 requireWorld(s);
 if(!request||!ID.test(request.id)||!Number.isSafeInteger(request.steps)||request.steps<1||request.steps>1000||
    typeof request.revision!=='string')throw Error('Invalid bounded canonical host request');
 if(['__proto__','constructor','prototype'].includes(request.id))throw Error('Reserved request identifier');
 const signature=digest(JSON.stringify(request)),prior=Object.hasOwn(s.doctorWorld.requests,request.id)?s.doctorWorld.requests[request.id]:null;
 if(prior){if(prior.signature!==signature)throw Error('Changed canonical request');return {...prior.result,replayed:true};}
 if(request.revision!==revision(s))throw Error('Stale observation');
 if(s.dead)throw Error('The inhabitant is deceased');
 if(request.choice!==null){
  if(!ID.test(request.policyRef)||!choices(s).some(x=>x.key===request.choice))throw Error('Original current feasible choice and policy reference required');
  if(request.choice.startsWith('move_')){
   const room=request.choice.slice(5);
   if(!ROOMS[s.location].exits.includes(room))throw Error('Nonadjacent navigation');
   s.activity={kind:'doctor_move',controller:'doctor_canonical',target:room,room,status:'traveling',
     remaining:0,travelRemaining:300,started:s.clock.centibeats,policyRef:request.policyRef};
   log(s,'started','I set out towards an adjoining room.',{kind:'doctor_move',controller:'doctor_canonical',policyRef:request.policyRef});
  }else{
   start(s,request.choice,'doctor_canonical','');
   s.activity.policyRef=request.policyRef;
  }
 }else if(request.policyRef!==null)throw Error('No policy reference without a choice');
 let elapsed=0;
 // No internal choice can take place after the original selected action.
 // Stop as soon as the pending activity ends. Idle wait is one bounded tick.
 do{tick(s,archive);elapsed++;}while(s.activity&&!s.dead&&elapsed<request.steps);
 const result={requestId:request.id,elapsed,revision:revision(s),busy:!!s.activity,deceased:!!s.dead,
  cursor:s.sequence,replayed:false};
 s.doctorWorld.requests[request.id]={signature,result};
 return result;
}
module.exports={enroll,observe,pulse,revision,eventText,SOURCE};
