'use strict';
const {OBJECTS,ROOMS,TRIGGERS}=require('./world');
function observe(s,log){
 const ids=Object.keys(OBJECTS).filter(id=>(s.objectPositions[id]||OBJECTS[id].room)===s.location);
 const candidates=ids.map(id=>{const obj=OBJECTS[id],novel=!s.seenObjects.includes(id)?12:0;
 const relevance=(id==='stores'&&s.needs.hunger>65?15:0)+(id==='bed'&&s.needs.energy<35?15:0);
 const moving=s.movingObjects?.includes(id)?10:0,noise=s.noisyObjects?.includes(id)?8:0;
 const trigger=Object.entries(TRIGGERS).reduce((m,[key,v])=>obj.label.toLowerCase().includes(key)?m+v.salience:m,0),ambient=s.objectSalience?.[id]||0;
 return {id,label:obj.label,room:s.location,score:Math.max(0,10+novel+relevance+moving+noise+trigger+ambient),factors:{novel,relevance,moving,noise,trigger,ambient}};
 });
 if(s.people?.visitor_01?.present&&s.people.visitor_01.room===s.location)candidates.push({id:'visitor_01',label:'The visiting caller',room:s.location,score:28,factors:{movement:10,novel:8}});
 for(const signal of (s.roomSignals||[]).filter(x=>x.room===s.location&&s.events.some(e=>e.id===x.sourceEventId))){
  candidates.push({id:'signal:'+signal.sourceEventId,label:signal.label||'An observable disturbance',
    room:s.location,score:10+(signal.movement?20:0)+(signal.noise?15:0)+(signal.needRelevance||0),
    factors:{movement:signal.movement?20:0,noise:signal.noise?15:0,relevance:signal.needRelevance||0,sourceEventId:signal.sourceEventId}});
 }
 candidates.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 const observed=candidates.slice(0,4),set=new Set(observed.map(x=>x.id));
 const previous=new Set(s.lastPerceptionIds||[]);
 for(const p of observed){if(!s.seenObjects.includes(p.id))s.seenObjects.push(p.id);
  if(p.id in OBJECTS){
   const belief=s.beliefs[p.id],prior=belief?.room;
   if(prior&&prior!==s.location){
    log?.(s,'route_learned','I updated where I must travel to find this object.',
      {objectId:p.id,previousRoom:prior,newRoom:s.location,source:'perceived_object'});
   }
   s.beliefs[p.id]={room:s.location,sourceTick:s.clock.centibeats};
  }}
 for(const [id,b] of Object.entries(s.beliefs)){if(b?.room===s.location&&!ids.includes(id))s.beliefs[id]={room:null,sourceTick:s.clock.centibeats,staleCorrected:true};}
 s.perception=observed;s.lastPerceptionIds=observed.map(x=>x.id);
 if(log&&observed.some(x=>!previous.has(x.id)))log(s,'perception','I noticed something newly salient in this room.',{observed:observed.map(x=>({id:x.id,score:x.score,factors:x.factors})),unnoticed:candidates.filter(x=>!set.has(x.id)).map(x=>x.id)});
 return observed;
}
function selfSheet(s){
 const low=v=>v<30?'urgent':v<60?'noticeable':'settled';
 const high=v=>v>=70?'urgent':v>=40?'noticeable':'settled';
 const failedSeries=Object.values(s.series||{}).filter(x=>x.brokenStreak>0)
  .map(x=>({id:x.id,brokenStreak:x.brokenStreak,level:x.brokenStreak>=2?'persistent':'recent',
   lastOutcomeEventId:x.lastOutcomeEventId}));
 return {room:s.location,needs:Object.fromEntries(Object.entries(s.needs).map(([k,v])=>[k,k==='hunger'?high(v):low(v)])),
 mood:s.mood.map(x=>({tag:x.tag,value:x.value})),
 failedSeries,urgentSeries:failedSeries.filter(x=>x.brokenStreak>=2),
 open:s.commitments.filter(x=>!x.done&&(x.status===undefined||x.status==='open')).map(x=>({id:x.id,title:x.title})),
 duskSoon:s.clock.centibeats%100000>=50000,visible:s.perception.map(x=>x.id),quirks:s.quirks.map(x=>({...x})),memory:s.folioReads.slice(-2).map(x=>x.id),
 hidden:['residue','numeric needs','unperceived room state']};}
function predictedAction(s){
 const sheet=selfSheet(s),signature=JSON.stringify([sheet.needs.energy,sheet.needs.hunger,
  sheet.needs.stimulation,sheet.duskSoon]);
 const history=s.decisions.filter(x=>x.selfNeedSignature===signature).slice(-35);
 if(history.length>=3){
  const count=history.reduce((m,d)=>(m[d.chosen]=(m[d.chosen]||0)+1,m),{});
  return Object.entries(count).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0][0];
 }
 if(sheet.needs.energy==='urgent')return 'rest';
 if(sheet.needs.hunger==='urgent')return 'eat';if(sheet.open.length&&sheet.duskSoon)return 'prepare';
 return sheet.needs.stimulation==='urgent'?'read':'work';}
const CONFLICT=Object.freeze({scoreGap:25,deadlineHorizon:18000,bonus:38,energyFloor:25});
function resolveConflict(s,ranked,log){
 if(s.debugSwitches.conflictDeliberation===false||s.needs.energy<CONFLICT.energyFloor||
  ranked.length<2||ranked[0].score-ranked[1].score>CONFLICT.scoreGap)return ranked;
 const candidates=ranked.map(x=>({...x,commitmentFactors:x.commitmentFactors||[]}));
 const near=candidates.filter(x=>x.commitmentFactors.some(f=>f.bonus>0&&f.deadline>=s.clock.centibeats&&
    f.deadline-s.clock.centibeats<=CONFLICT.deadlineHorizon));
 if(!near.length)return ranked;
 const chosen=near.sort((a,b)=>b.score-a.score)[0];
 const before=ranked[0],beforeScore=chosen.score;
 chosen.score=Math.round((chosen.score+CONFLICT.bonus)*100)/100;
 chosen.conflictDeliberation={previousWinner:before.kind,originalScore:beforeScore,
  bonus:CONFLICT.bonus,obligations:chosen.commitmentFactors.map(x=>x.id),energy:s.needs.energy};
 candidates.sort((a,b)=>b.score-a.score||a.kind.localeCompare(b.kind));
 log(s,'deliberation_rescore','I reconsidered an imminent competing obligation before acting.',
  {previousWinner:before.kind,selected:candidates[0].kind,bonus:CONFLICT.bonus,
   sourceCommitments:chosen.conflictDeliberation.obligations,confidence:'bounded_policy'});
 return candidates;
}
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
function explainChoice(s,choice){
 const sheet=selfSheet(s),reasons=[],kind=choice.kind;
 if(['eat','cook'].includes(kind)&&sheet.needs.hunger!=='settled')reasons.push('hunger');
 if(['sleep','rest'].includes(kind)&&sheet.needs.energy!=='settled')reasons.push('fatigue');
 if(['read','study','inspect'].includes(kind)&&sheet.needs.stimulation!=='settled')reasons.push('curiosity');
 if(['tend','gather_fuel','draw_water'].includes(kind)&&s.perception.some(x=>x.id===choice.target)){
  reasons.push('visible stores or worksite');
 }
 if(choice.supplyFactor>0&&['tend','gather_fuel','draw_water','preserve','trade'].includes(kind))
  reasons.push('known provisions');
 if(['converse','trade'].includes(kind)&&sheet.visible.includes('visitor_01'))
  reasons.push('visitor present');
 if(choice.commitmentFactors?.some(f=>f.bonus>0&&sheet.open.some(x=>x.id===f.id)))reasons.push('obligation');
 if(kind==='prepare'&&sheet.duskSoon&&sheet.open.length)reasons.push('dusk obligation');
 if(kind==='work'&&sheet.needs.energy!=='urgent')reasons.push('capacity');
 if(s.habitProfiles?.[kind]?.formed&&choice.quirkFactors?.length)reasons.push('learned preference');
 if(kind==='diary'&&s.events.filter(e=>e.type==='completed'&&e.day===s.clock.day).length>=2)
   reasons.push('unfinished daily record');
 if(kind==='prepare'&&sheet.open.some(x=>x.id.startsWith('C')))reasons.push('known hearth duty');
 if(['work','read','study','inspect'].includes(kind)&&sheet.mood.length&&s.debugSwitches?.mood!==false)
   reasons.push('felt mood');
 const text=reasons.length?
  'I chose '+kind+' because I noticed '+reasons.join(', ')+'. Other causes may elude me.':
  'I chose '+kind+'. I cannot fully account for that preference.';
 return {text,reasons,availableFrom:'self_sheet',certain:false,
  concealed:['residue','numeric utility score','unperceived room state','random tie-breaking']};
}
function ruminate(s,log){if(s.activity?.kind==='sleep')return null;
 if(s.clock.centibeats%4500>=100)return null;
 const failures=Object.values(s.series||{}).filter(x=>x.brokenStreak>0&&x.id!=='DAILY-HEARTH')
  .sort((a,b)=>b.brokenStreak-a.brokenStreak||a.id.localeCompare(b.id));
 const turn=Math.floor(s.clock.centibeats/4500);
 // An unrepaired single failure occupies one in four eligible thoughts.
 // Consecutive failures occupy three in four; rotate fairly among sources.
 const eligible=failures.filter(x=>turn%4<(x.brokenStreak>=2?3:1));
 const concerning=eligible.length?eligible[Math.floor(turn/4)%eligible.length]:null;
 const commitment=s.commitments.find(x=>!x.done&&(x.status===undefined||x.status==='open'));
 const source=concerning?.id||commitment?.id||s.events.filter(x=>x.type==='completed').at(-1)?.id;
 if(!source)return null;
 const e=log(s,'rumination',concerning?
  'I returned to a recurring obligation that I have failed to keep.':
  'I found myself returning to an unfinished matter.',
  {sourceId:source,seriesId:concerning?.id||null,
   seriesBrokenStreak:concerning?.brokenStreak||0,private:true});
 s.thoughts.push({id:e.id,sourceId:source,t:s.clock.centibeats});s.thoughts=s.thoughts.slice(-80);return e;}
function lesion(s,name,enabled,log){if(!(name in s.debugSwitches)||typeof enabled!=='boolean')throw Error('Unknown named state switch');s.debugSwitches[name]=enabled;return log(s,'state_switch','I was subjected to a controlled state intervention.',{name,enabled,operatorOnly:true});}
function moveUnseen(s,id,room,log){if(!(id in OBJECTS)||!(room in ROOMS))throw Error('Unknown object or room');
 if(s.location===OBJECTS[id].room||s.location===room)throw Error('Object change must be unperceived');
 s.objectPositions[id]=room;return log(s,'world_movement','An unseen object was moved by the environment.',{objectId:id,destinationRoom:room,perceived:false,operatorOnly:true});}
function impair(s,id,until,log){if(!((id in OBJECTS)||id.startsWith('room:')&&id.slice(5) in ROOMS))throw Error('Unknown loss target');
 if(!Number.isSafeInteger(until)||until<=s.clock.centibeats)throw Error('Invalid recovery time');
 s.worldLosses[id]=until;return log(s,'world_loss','An object or room became temporarily unusable.',{target:id,recoversTick:until,perceived:false});}
function livedQuirk(s,sourceEventId,kind,log){
 const source=s.events.find(e=>e.id===sourceEventId&&e.type==='habit_formed');
 if(!source)return null;
 if(s.quirks.some(q=>q.originEventId===sourceEventId))return null;
 const description='I have come to return habitually to '+kind+' through my days in the tower.';
 const e=log(s,'quirk_origin','I observed a habit acquired through repeated lived activity.',{sourceEventId,kind,memoryClass:'lived_runtime_memory'});
 const q={description,originEventId:sourceEventId,observedEventId:e.id,
   memoryClass:'lived_runtime_memory',kind};
 s.quirks.push(q);return q;
}
const MATURITY=Object.freeze({work:[180,250],read:[30,55],prepare:[35,55],tend:[20,35]});
function matureQuirk(s,source,kind,log){
 if(s.clock.day<30||source?.type!=='completed')return null;
 const threshold=(MATURITY[kind]||[]).find(count=>(s.habits[kind]||0)>=count&&
   !s.quirks.some(q=>q.originTag==='mature:'+kind+':'+count));
 if(!threshold)return null;
 const originTag='mature:'+kind+':'+threshold;
 const e=log(s,'quirk_matured','Repeated lived work has altered what I readily choose.',
   {sourceEventId:source.id,kind,threshold,memoryClass:'lived_runtime_memory'});
 const q={originTag,kind,threshold,description:'I have developed a lasting inclination toward '+kind+'.',
   memoryClass:'lived_runtime_memory',originEventId:source.id,observedEventId:e.id,bonus:2.5};
 s.quirks.push(q);return q;
}
function originQuirk(s,sourceEventId,description,log){if(!sourceEventId||!s.folioReads.some(x=>x.id===sourceEventId))throw Error('Quirk lacks consulted origin');
 if(s.quirks.some(x=>x.originEventId===sourceEventId))return null;
 const e=log(s,'quirk_origin','I recognized a preference in my earlier account.',{sourceEventId,description});
 const q={description,originEventId:sourceEventId,observedEventId:e.id};s.quirks.push(q);return q;}
module.exports={observe,selfSheet,predictedAction,deliberate,resolveConflict,CONFLICT,ruminate,lesion,moveUnseen,impair,originQuirk,livedQuirk,matureQuirk,explainChoice};