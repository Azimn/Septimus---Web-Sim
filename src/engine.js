'use strict';
const {DAY,STEP,ROOMS,OBJECTS,context,distance}=require('./world');
const {DEFINITIONS,scores,available,clip,applyMood,perceiveTopic}=require('./actions');
const {findFolios}=require('./history');
function log(s,type,description,extra={}){const event={id:`L${++s.sequence}`,t:s.clock.centibeats,day:s.clock.day,type,room:s.location,description,provenance:'lived_runtime_memory',...extra};s.events.push(event);return event;}
function start(s,kind,controller='autonomous',query=''){
 if(s.activity)throw Error('Current activity must finish or be interrupted');
 if(!available(s,kind))throw Error(`Unavailable: ${kind}`);
 const a=DEFINITIONS[kind],destination=OBJECTS[a.target].room;
 s.activity={kind,controller,query,target:a.target,room:destination,status:s.location===destination?'active':'traveling',remaining:a.duration,travelRemaining:distance(s.location,destination)*300,started:s.clock.centibeats};
 log(s,'started',`I set out to ${kind}.`,{kind,controller});return s.activity;
}
function finish(s,a,archive){const n=s.needs,st=s.stores;let description='';
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
 case 'read':{const results=findFolios(archive,a.query,1),r=results[0];if(r){s.folioReads.push({day:s.clock.day,t:s.clock.centibeats,id:r.event_id,query:a.query,provenance:r.provenance,memoryClass:'pre_awakened_'+r.provenance});perceiveTopic(s,[r.title,...(r.participants||[])].join(' '),'folio');description=`I consulted folio ${r.event_id}: ${r.title}. Its account belongs to my earlier life, not to this morning.`;}else description='I searched the folios but found no matching record.';break;}
 case 'diary':{const last=s.events.filter(e=>e.type==='completed'&&e.kind!=='diary').at(-1);const line=last?`I returned to the notebook after ${last.kind}. The work remains mine to judge.`:'I wrote what I could verify, leaving my uncertainties intact.';s.diary.push({day:s.clock.day,t:s.clock.centibeats,text:line,sourceEventId:last?.id||null});description=line;break;}
 case 'walk':n.comfort=clip(n.comfort+7);description='I walked along the garden path.';break;
 case 'tend':n.comfort=clip(n.comfort+10);n.energy=clip(n.energy-5);description='I tended the patch beside the tower.';break;
 }
 s.habits[a.kind]=(s.habits[a.kind]||0)+1;s.outcomes[a.kind]={success:(s.outcomes[a.kind]?.success||0)+1};
 s.surface.lastWords=description;log(s,'completed',description,{kind:a.kind,controller:a.controller,object:a.target});s.activity=null;
}
function tick(s,archive){const n=s.needs,a=s.activity,now=s.clock.centibeats;
 s.clock.centibeats+=STEP;s.clock.day=Math.floor(s.clock.centibeats/DAY);
 n.hunger=clip(n.hunger+.06);n.stimulation=clip(n.stimulation-.027);n.comfort=clip(n.comfort-.013);
 if(a?.kind==='sleep'&&a.status==='active')n.energy=clip(n.energy+.18);else n.energy=clip(n.energy-.038);
 s.mood=s.mood.filter(x=>x.until>s.clock.centibeats);
 if(!s.calendar.triggeredDays.includes(Math.floor((s.clock.centibeats-65000)/DAY))&&s.clock.centibeats%DAY>=65000){
  const d=s.clock.day;s.calendar.triggeredDays.push(d);
  const prepared=s.commitments[0].done;if(!prepared)applyMood(s,'unprepared dusk',-7);
  log(s,'calendar',prepared?'I met the dusk prepared.':'I reached dusk without securing the hearth.',{prepared});
 }
 if(s.clock.day>s.completedDays){s.completedDays=s.clock.day;s.calendar.date=new Date(Date.UTC(1899,6,1)+s.clock.day*86400000).toISOString().slice(0,10);log(s,'day',`I have lived another day in the tower.`);
 s.commitments=[{id:`C${s.clock.day+1}`,title:'Secure the hearth before dusk',deadline:s.clock.day*DAY+65000,done:false}];}
 if(!s.activity){const ranked=scores(s);if(ranked.length){s.decisions.push({t:s.clock.centibeats,candidates:ranked.slice(0,5),chosen:ranked[0].kind});s.decisions=s.decisions.slice(-100);start(s,ranked[0].kind);}}
 else if(a.status==='traveling'){a.travelRemaining-=STEP;if(a.travelRemaining<=0){s.location=a.room;a.status='active';log(s,'arrived',`I reached the ${ROOMS[s.location].label.toLowerCase()}.`,{target:a.target});}}
 else if(a.status==='active'){a.remaining-=STEP;if(a.remaining<=0)finish(s,a,archive);}
 s.surface.lastObservation=ROOMS[s.location].objects.slice(0,4).map(id=>OBJECTS[id].label);
 return s;
}
function advance(s,archive,steps=1){if(!Number.isSafeInteger(steps)||steps<1||steps>1000)throw Error('Steps must be integer 1..1000');for(let i=0;i<steps;i++)tick(s,archive);return s;}
function direct(s,kind,query=''){if(!available(s,kind))throw Error(`Unavailable: ${kind}`);if(s.activity){log(s,'interrupted',`I was interrupted while attempting ${s.activity.kind}.`,{controller:'player',interrupted:s.activity.kind});s.activity=null;}
 const result=start(s,kind,'player',query);return result;}
function speak(s,text){const topics=perceiveTopic(s,text);log(s,'heard',`I heard a visitor speak${topics.length?' of '+topics.join(', '):''}.`,{source:'visitor',topics});return s.surface.lastWords=topics.length?'Those names carry histories. I prefer evidence to flattery.':'I am occupied with the tower and my investigations. Speak plainly.';}
function view(s){return {clock:s.clock,day:s.clock.day+1,room:s.location,objects:ROOMS[s.location].objects.map(id=>({id,...OBJECTS[id]})),needs:s.needs,stores:s.stores,activity:s.activity,commitments:s.commitments,diary:s.diary.slice(-8),folioReads:s.folioReads.slice(-8),events:s.events.slice(-25),words:s.surface.lastWords,perception:context(s),choices:scores(s).slice(0,8),selfSheet:{location:s.location,energy:s.needs.energy<30?'exhausted':s.needs.energy<65?'weary':'capable',concern:s.commitments.find(x=>!x.done)?.title||'none',lastDecision:s.decisions.at(-1)?.chosen||'none'}};}
module.exports={advance,direct,speak,view,log,tick,start};
