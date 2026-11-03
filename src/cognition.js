'use strict';
const {OBJECTS,ROOMS,TRIGGERS}=require('./world');
function observe(s,log){
 const ids=ROOMS[s.location].objects.filter(id=>(s.objectPositions[id]||OBJECTS[id].room)===s.location);
 const candidates=ids.map(id=>{const obj=OBJECTS[id],novel=!s.seenObjects.includes(id)?12:0;
 const relevance=(id==='stores'&&s.needs.hunger>65?15:0)+(id==='bed'&&s.needs.energy<35?15:0);
 const moving=s.movingObjects?.includes(id)?10:0,noise=s.noisyObjects?.includes(id)?8:0;
 const trigger=Object.entries(TRIGGERS).reduce((m,[key,v])=>obj.label.toLowerCase().includes(key)?m+v.salience:m,0);
 return {id,label:obj.label,room:s.location,score:10+novel+relevance+moving+noise+trigger,factors:{novel,relevance,moving,noise,trigger}};
 });
 if(s.people?.visitor_01?.present&&s.location==='library')candidates.push({id:'visitor_01',label:'The visiting caller',room:'library',score:28,factors:{movement:10,novel:8}});
 for(const signal of (s.roomSignals||[]).filter(x=>x.room===s.location&&s.events.some(e=>e.id===x.sourceEventId))){
  candidates.push({id:'signal:'+signal.sourceEventId,label:signal.label||'An observable disturbance',
    room:s.location,score:10+(signal.movement?20:0)+(signal.noise?15:0)+(signal.needRelevance||0),
    factors:{movement:signal.movement?20:0,noise:signal.noise?15:0,relevance:signal.needRelevance||0,sourceEventId:signal.sourceEventId}});
 }
 candidates.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 const observed=candidates.slice(0,4),set=new Set(observed.map(x=>x.id));
 const previous=new Set(s.lastPerceptionIds||[]);
 for(const p of observed){if(!s.seenObjects.includes(p.id))s.seenObjects.push(p.id);
  if(p.id in OBJECTS)s.beliefs[p.id]={room:s.location,sourceTick:s.clock.centibeats};}
 for(const [id,b] of Object.entries(s.beliefs)){if(b?.room===s.location&&!ids.includes(id))s.beliefs[id]={room:null,sourceTick:s.clock.centibeats,staleCorrected:true};}
 s.perception=observed;s.lastPerceptionIds=observed.map(x=>x.id);
 if(log&&observed.some(x=>!previous.has(x.id)))log(s,'perception','I noticed something newly salient in this room.',{observed:observed.map(x=>({id:x.id,score:x.score,factors:x.factors})),unnoticed:candidates.filter(x=>!set.has(x.id)).map(x=>x.id)});
 return observed;
}
function selfSheet(s){const band=(v)=>v<30?'urgent':v<60?'noticeable':'settled';
 return {room:s.location,needs:Object.fromEntries(Object.entries(s.needs).map(([k,v])=>[k,band(v)])),
 mood:s.mood.map(x=>({tag:x.tag,value:x.value})),open:s.commitments.filter(x=>!x.done).map(x=>({id:x.id,title:x.title})),
 duskSoon:s.clock.centibeats%100000>=50000,visible:s.perception.map(x=>x.id),quirks:s.quirks.map(x=>({...x})),memory:s.folioReads.slice(-2).map(x=>x.id),
 hidden:['residue','numeric needs','unperceived room state']};}
function predictedAction(s){const sheet=selfSheet(s);if(sheet.needs.energy==='urgent')return 'rest';
 if(sheet.needs.hunger==='urgent')return 'eat';if(sheet.open.length&&sheet.duskSoon)return 'prepare';
 return sheet.needs.stimulation==='urgent'?'read':'work';}
function deliberate(s,ranked,log){
 s.deliberation.checks++;
 const phase=s.clock.centibeats%100000;
 const pressure=s.commitments.some(c=>!c.done&&c.deadline-s.clock.centibeats<15000);
 const novel=s.perception.some(p=>p.factors?.novel>0);
 const conflict=ranked.length>1&&ranked[0].score-ranked[1].score<12;
 const tired=s.needs.energy<30;
 const allowed=!!(pressure||novel||conflict||s.deliberation.checks% (tired?5:2)===0);
 if(allowed){s.deliberation.performed++;const prediction=predictedAction(s),chosen=ranked[0]?.kind||'none';
 const e=log(s,'prediction','I made a limited prediction of my next choice.',{prediction,chosen,hit:prediction===chosen,source:'self-sheet',trigger:{pressure,novel,conflict,tired}});
 s.predictions.push({sourceEventId:e.id,prediction,actual:chosen,hit:prediction===chosen});s.predictions=s.predictions.slice(-200);
 }else{s.deliberation.skipped++;log(s,'reflex','I used a limited choice budget instead of deliberation.',{tired,pressure,novel,conflict});}
 s.deliberation.rate=s.deliberation.performed/s.deliberation.checks;
}
function ruminate(s,log){if(s.activity?.kind==='sleep')return null;
 if(s.clock.centibeats%4500>=100)return null;
 const commitment=s.commitments.find(x=>!x.done),source=commitment?.id||s.events.filter(x=>x.type==='completed').at(-1)?.id;
 if(!source)return null;const e=log(s,'rumination','I found myself returning to an unfinished matter.',{sourceId:source,private:true});
 s.thoughts.push({id:e.id,sourceId:source,t:s.clock.centibeats});s.thoughts=s.thoughts.slice(-80);return e;}
function lesion(s,name,enabled,log){if(!(name in s.debugSwitches)||typeof enabled!=='boolean')throw Error('Unknown named state switch');s.debugSwitches[name]=enabled;return log(s,'state_switch','I was subjected to a controlled state intervention.',{name,enabled,operatorOnly:true});}
function moveUnseen(s,id,room,log){if(!(id in OBJECTS)||!(room in ROOMS))throw Error('Unknown object or room');
 if(s.location===OBJECTS[id].room||s.location===room)throw Error('Object change must be unperceived');
 s.objectPositions[id]=room;return log(s,'world_movement','An unseen object was moved by the environment.',{id,room,perceived:false,operatorOnly:true});}
function impair(s,id,until,log){if(!((id in OBJECTS)||id.startsWith('room:')&&id.slice(5) in ROOMS))throw Error('Unknown loss target');
 if(!Number.isSafeInteger(until)||until<=s.clock.centibeats)throw Error('Invalid recovery time');
 s.worldLosses[id]=until;return log(s,'world_loss','An object or room became temporarily unusable.',{target:id,recoversTick:until,perceived:false});}
function originQuirk(s,sourceEventId,description,log){if(!sourceEventId||!s.folioReads.some(x=>x.id===sourceEventId))throw Error('Quirk lacks consulted origin');
 if(s.quirks.some(x=>x.originEventId===sourceEventId))return null;
 const e=log(s,'quirk_origin','I recognized a preference in my earlier account.',{sourceEventId,description});
 const q={description,originEventId:sourceEventId,observedEventId:e.id};s.quirks.push(q);return q;}
module.exports={observe,selfSheet,predictedAction,deliberate,ruminate,lesion,moveUnseen,impair,originQuirk};