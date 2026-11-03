'use strict';
const {DAY,STEP,ROOMS,OBJECTS,context,distance,ensureHooks}=require('./world');
const {DEFINITIONS,scores,available,clip,applyMood,perceiveTopic}=require('./actions');
const {findFolios}=require('./history');
const Cognition=require('./cognition');
const Social=require('./social');
const Voice=require('./voice');
function log(s,type,description,extra={}){const event={id:`L${++s.sequence}`,t:s.clock.centibeats,day:s.clock.day,type,room:s.location,description,provenance:'lived_runtime_memory',...extra};s.events.push(event);return event;}
function start(s,kind,controller='autonomous',query=''){
 ensureHooks(s);
 if(s.activity)throw Error('Current activity must finish or be interrupted');
 if(!available(s,kind))throw Error(`Unavailable: ${kind}`);
 const a=DEFINITIONS[kind],destination=s.beliefs?.[a.target]?.room||OBJECTS[a.target].room;
 s.activity={kind,controller,query,target:a.target,room:destination,status:s.location===destination?'active':'traveling',remaining:a.duration,travelRemaining:distance(s.location,destination)*300,started:s.clock.centibeats};
 log(s,'started',`I set out to ${kind}.`,{kind,controller});return s.activity;
}
function fail(s,a,reason){
 const prior=s.outcomes[a.kind]||{},context=a.target+'@'+a.room;
 s.outcomes[a.kind]={...prior,failure:(prior.failure||0)+1,lastFailure:reason,context};
 if((s.objectPositions[a.target]||OBJECTS[a.target].room)!==a.room){
   s.beliefs[a.target]={room:null,sourceTick:s.clock.centibeats,staleCorrected:true};
   log(s,'belief_correction','I discovered that my belief about an object location was stale.',{object:a.target,previousRoom:a.room,correctedRoom:null});
 }
 log(s,'action_failed','I could not complete the intended work.',{kind:a.kind,reason,context,controller:a.controller});
 log(s,'surprise','I found the result different from the result I expected.',{kind:a.kind,expected:'completed',actual:'failed',reason});
 s.activity=null;Voice.flush(s,log);
}
function finish(s,a,archive){const n=s.needs,st=s.stores;let description='';
 const actualRoom=s.objectPositions[a.target]||OBJECTS[a.target].room;
 if(actualRoom!==a.room&&s.habitProfiles[a.kind]?.formed)return fail(s,a,'habit_cue_missing');
 if(actualRoom!==a.room)return fail(s,a,'stale_object_location');
 if((s.worldLosses[a.target]||0)>s.clock.centibeats||(s.worldLosses['room:'+a.room]||0)>s.clock.centibeats)return fail(s,a,'durable_impairment');
 if(['eat','cook'].includes(a.kind)&&st.food<1)return fail(s,a,'food_exhausted');
 if(['cook','tea'].includes(a.kind)&&(st.water<1||st.fuel<1))return fail(s,a,'supplies_exhausted');
 if(a.kind==='tea'&&st.tea<1)return fail(s,a,'tea_exhausted');
 const habit=s.habitProfiles[a.kind];if(habit?.formed&&habit.cue===a.target+'@'+a.room&&s.objectPositions[a.target]&&s.objectPositions[a.target]!==a.room)return fail(s,a,'habit_cue_missing');
 switch(a.kind){
 case 'sleep':n.energy=clip(n.energy+18);n.comfort=clip(n.comfort+6);description='I slept, though the tower did not sleep with me.';break;
 case 'rest':n.energy=clip(n.energy+8);description='I sat awhile to recover my strength.';break;
 case 'eat':st.food--;n.hunger=clip(n.hunger-40);description='I ate from the finite provisions.';break;
 case 'cook':st.food--;st.water--;st.fuel--;n.hunger=clip(n.hunger-32);description='I cooked a modest meal from the stores.';break;
 case 'tea':st.water--;st.fuel--;st.tea--;n.comfort=clip(n.comfort+13);description='I brewed tea at the kettle.';break;
 case 'prepare':s.commitments[0].done=true;n.comfort=clip(n.comfort+8);description='I secured the hearth against the approaching dusk.';break;
 case 'work':s.skills.science++;n.energy=clip(n.energy-9);n.stimulation=clip(n.stimulation+18);description='I worked at my bench and learned something of the apparatus.';break;
 case 'inspect':n.stimulation=clip(n.stimulation+8);description='I inspected the instrument before making any claims.';break;
 case 'study':n.stimulation=clip(n.stimulation+12);description='I studied the specimens, with several questions unanswered.';break;
 case 'read':{const results=findFolios(archive,a.query,1),r=results[0];if(r){s.folioReads.push({day:s.clock.day,t:s.clock.centibeats,id:r.event_id,query:a.query,provenance:r.provenance,memoryClass:'pre_awakened_'+r.provenance});
 Cognition.originQuirk(s,r.event_id,'This account bears on my private intellectual preferences.',log);perceiveTopic(s,[r.title,...(r.participants||[])].join(' '),'folio');description=`I consulted folio ${r.event_id}: ${r.title}. Its account belongs to my earlier life, not to this morning.`;}else description='I searched the folios but found no matching record.';break;}
 case 'diary':{const last=s.events.filter(e=>e.type==='completed'&&e.kind!=='diary').at(-1);const line=last?`I returned to the notebook after ${last.kind}. The work remains mine to judge.`:'I wrote what I could verify, leaving my uncertainties intact.';s.diary.push({day:s.clock.day,t:s.clock.centibeats,text:line,sourceEventId:last?.id||null});description=line;break;}
 case 'walk':n.comfort=clip(n.comfort+7);description='I walked along the garden path.';break;
 case 'tend':n.comfort=clip(n.comfort+10);n.energy=clip(n.energy-5);description='I tended the patch beside the tower.';break;
 }
 const prior=s.outcomes[a.kind]||{};s.outcomes[a.kind]={...prior,success:(prior.success||0)+1};
 s.habits[a.kind]=(s.habits[a.kind]||0)+1;
 const cue=a.target+'@'+a.room,profile=s.habitProfiles[a.kind]||{cue,count:0,formed:false};
 if(profile.cue!==cue){profile.cue=cue;profile.count=0;profile.formed=false;}
 profile.count++;if(profile.count>=5&&!profile.formed){profile.formed=true;log(s,'habit_formed','I had begun to repeat that action without fresh deliberation.',{kind:a.kind,cue,count:profile.count});}
 s.habitProfiles[a.kind]=profile;
 s.surface.lastWords=description;log(s,'completed',description,{kind:a.kind,controller:a.controller,object:a.target});
 s.activity=null;Voice.flush(s,log);
}
function tick(s,archive){ensureHooks(s);const n=s.needs,a=s.activity,now=s.clock.centibeats;
 s.clock.centibeats+=STEP;s.clock.day=Math.floor(s.clock.centibeats/DAY);
 n.hunger=clip(n.hunger+.06);n.stimulation=clip(n.stimulation-.027);n.comfort=clip(n.comfort-.013);
 if(a?.kind==='sleep'&&a.status==='active')n.energy=clip(n.energy+.18);else n.energy=clip(n.energy-.038);
 s.mood=s.mood.filter(x=>x.until>s.clock.centibeats);
 for(const [id,until] of Object.entries(s.worldLosses||{}))if(until<=s.clock.centibeats){delete s.worldLosses[id];log(s,'world_restored','I found an earlier obstruction had cleared.',{target:id});}
 Social.scheduled(s,log);
 Cognition.observe(s,log);
 Cognition.ruminate(s,log);
 if(!s.calendar.triggeredDays.includes(Math.floor((s.clock.centibeats-65000)/DAY))&&s.clock.centibeats%DAY>=65000){
  const d=s.clock.day;s.calendar.triggeredDays.push(d);
  const prepared=s.commitments[0].done;if(!prepared)applyMood(s,'unprepared dusk',-7);
  log(s,'calendar',prepared?'I met the dusk prepared.':'I reached dusk without securing the hearth.',{prepared});
 }
 if(s.clock.day>s.completedDays){s.completedDays=s.clock.day;s.calendar.date=new Date(Date.UTC(1899,6,1)+s.clock.day*86400000).toISOString().slice(0,10);log(s,'day',`I have lived another day in the tower.`);
 s.commitments=[{id:`C${s.clock.day+1}`,title:'Secure the hearth before dusk',deadline:s.clock.day*DAY+65000,done:false}];}
 if(!s.activity){Voice.flush(s,log);const ranked=scores(s);if(ranked.length){
 const runnerUp=ranked[1]||null;
 Cognition.deliberate(s,ranked,log);
 const event=log(s,'decision','I selected the strongest available course of action.',{
  chosen:ranked[0].kind,score:ranked[0].score,foregone:runnerUp?.kind||null,
  foregoneScore:runnerUp?.score??null,margin:runnerUp?Math.round((ranked[0].score-runnerUp.score)*100)/100:null,
  candidates:ranked.slice(0,5),controller:'autonomous',switches:{...s.debugSwitches}});
 s.decisions.push({t:s.clock.centibeats,candidates:ranked.slice(0,5),chosen:ranked[0].kind,
  runnerUp,margin:event.margin,sourceEventId:event.id});
 s.decisions=s.decisions.slice(-100);start(s,ranked[0].kind);}}
 else if(a.status==='traveling'){a.travelRemaining-=STEP;if(a.travelRemaining<=0){s.location=a.room;a.status='active';log(s,'arrived',`I reached the ${ROOMS[s.location].label.toLowerCase()}.`,{target:a.target});}}
 else if(a.status==='active'){a.remaining-=STEP;if(a.remaining<=0)finish(s,a,archive);}
 Cognition.observe(s,log);
 s.surface.lastObservation=s.perception.map(x=>x.label);
 return s;
}
function advance(s,archive,steps=1){if(!Number.isSafeInteger(steps)||steps<1||steps>1000)throw Error('Steps must be integer 1..1000');for(let i=0;i<steps;i++)tick(s,archive);return s;}
function direct(s,kind,query=''){ensureHooks(s);if(!available(s,kind))throw Error(`Unavailable: ${kind}`);if(s.activity){log(s,'interrupted',`I was interrupted while attempting ${s.activity.kind}.`,{controller:'player',interrupted:s.activity.kind});s.activity=null;}
 const result=start(s,kind,'player',query);return result;}
function speak(s,text){ensureHooks(s);const topics=perceiveTopic(s,text);
 const response=Voice.receive(s,text,log);
 log(s,'heard',`I heard a visitor speak${topics.length?' of '+topics.join(', '):''}.`,{source:'visitor',topics});
 return response;}
function view(s){ensureHooks(s);return {clock:s.clock,day:s.clock.day+1,room:s.location,objects:ROOMS[s.location].objects.map(id=>({id,...OBJECTS[id]})),needs:s.needs,stores:s.stores,activity:s.activity,commitments:s.commitments,diary:s.diary.slice(-8),folioReads:s.folioReads.slice(-8),events:s.events.slice(-25),words:s.surface.lastWords,perception:context(s),choices:scores(s).slice(0,8),
 people:s.people,customs:s.customs,humor:s.humor,replyQueue:s.replyQueue,thoughts:s.thoughts.slice(-8),
 predictionAccuracy:{count:s.predictions.length,hits:s.predictions.filter(x=>x.hit).length,rate:s.predictions.length?s.predictions.filter(x=>x.hit).length/s.predictions.length:0},
 deliberation:s.deliberation,quirks:s.quirks,claimsCheck:'template-only socket',
 selfSheet:{location:s.location,energy:s.needs.energy<30?'exhausted':s.needs.energy<65?'weary':'capable',concern:s.commitments.find(x=>!x.done)?.title||'none',lastDecision:s.decisions.at(-1)?.chosen||'none'}};}
module.exports={advance,direct,speak,view,log,tick,start,
 social:Social,cognition:Cognition,voice:Voice,fail};
