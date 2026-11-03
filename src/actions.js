'use strict';
const {OBJECTS,TRIGGERS,distance}=require('./world');
const {ECONOMY,availableGarden,supplyScore}=require('./economy');
const DEFINITIONS={
 sleep:{target:'bed',duration:25000,base:5,trait:'stubborn'},
 rest:{target:'bed',duration:3000,base:6,trait:'gentle'},
 diary:{target:'notebook',duration:1700,base:8,trait:'curious'},
 read:{target:'folios',duration:3700,base:10,trait:'curious'},
 prepare:{target:'hearth',duration:1800,base:3,trait:'industrious'},
 cook:{target:'stove',duration:2400,base:5,trait:'industrious'},
 tea:{target:'kettle',duration:1200,base:5,trait:'gentle'},
 eat:{target:'stores',duration:1000,base:5,trait:'gentle'},
 work:{target:'bench',duration:7400,base:17,trait:'industrious'},
 inspect:{target:'instrument',duration:1900,base:9,trait:'curious'},
 study:{target:'specimens',duration:3300,base:10,trait:'curious'},
 walk:{target:'path',duration:1800,base:5,trait:'curious'},
 tend:{target:'plot',duration:3200,base:7,trait:'industrious'},
 gather_fuel:{target:'path',duration:1800,base:4,trait:'industrious'},
 draw_water:{target:'path',duration:1600,base:5,trait:'industrious'},
 converse:{target:'visitor_01',duration:900,base:9,trait:'sociable'}
};
const clip=n=>Math.max(0,Math.min(100,Math.round(n*100)/100));
const ACTION_WEIGHTS=Object.freeze(Object.fromEntries(Object.keys(DEFINITIONS).map(k=>[k,1])));
const topicAction=Object.freeze({henry:'work',victor:'inspect',bride:'study',university:'diary',homunculi:'study'});
function setUtilityWeight(s,kind,value){
 if(!(kind in ACTION_WEIGHTS)||typeof value!=='number'||!Number.isFinite(value)||value<0||value>6)throw Error('Unknown utility weight or invalid value');
 s.utilityWeights??={};s.utilityWeights[kind]=value;return {kind,value};
}
function memoryCue(record){
 const lower=[record.title||'',...(record.recall_cues||[]),...(record.participants||[])].join(' ').toLowerCase();
 if(/homuncul|bride|specimen/.test(lower))return 'study';
 if(/frankenstein|experiment|apparatus|scientif|research/.test(lower))return 'work';
 if(/magistrate|university|letter|father|debate/.test(lower))return 'diary';
 if(/instrument|measurement|inquiry|observ/.test(lower))return 'inspect';
 return 'read';
}
function available(state,kind){const a=DEFINITIONS[kind];if(!a||!(a.target in OBJECTS||a.target==='visitor_01'))return false;
 if(state.dead)return false;
 if(kind==='converse')return !!state.people?.visitor_01?.present;
 if((state.worldLosses?.[a.target]||0)>state.clock.centibeats)return false;
 if((state.worldLosses?.['room:'+OBJECTS[a.target].room]||0)>state.clock.centibeats)return false;
 if(['eat','cook'].includes(kind)&&state.stores.food<1)return false;
 if(['tea','cook'].includes(kind)&&(state.stores.water<1||state.stores.fuel<1))return false;
 if(kind==='tea'&&state.stores.tea<1)return false;
 if(kind==='prepare'&&!state.commitments.some(c=>!c.done&&(c.status===undefined||c.status==='open')&&(c.action===undefined||c.action==='prepare')))return false;
 if(kind==='tend'&&(!availableGarden(state)||(state.garden?.ripeAt===null&&state.stores.water<ECONOMY.plantWater)))return false;
 if(kind==='gather_fuel'&&state.stores.fuel>=ECONOMY.maxFuel)return false;
 if(kind==='draw_water'&&state.stores.water>=ECONOMY.maxWater)return false;
 if(kind==='read'&&state.folioReads.some(x=>x.day===state.clock.day))return false;
 if(kind==='diary'&&state.diary.some(x=>x.day===state.clock.day))return false;
 return true;}
function scores(state){const enabled=state.debugSwitches||{};
 const n=enabled.needs===false?{energy:50,hunger:50,comfort:50,stimulation:50,company:50}:state.needs;
 const deadline=enabled.commitments===false?{...state.commitments[0],done:true}:
  (state.commitments.find(c=>!c.done&&(c.status===undefined||c.status==='open')&&(c.action===undefined||c.action==='prepare'))||{done:true});
 const time=state.clock.centibeats%100000;
 return Object.entries(DEFINITIONS).filter(([key,a])=>available(state,key)&&(key!=='sleep'||time>=70000||n.energy<20)&&
  !(a.target in OBJECTS&&OBJECTS[a.target].room===state.location&&state.perception?.length&&
   !state.perception.some(x=>x.id===a.target))).map(([key,a])=>{
  let score=a.base*(state.traits[a.trait]||1);
  if(key==='sleep')score+=(100-n.energy)*.72+(time>=70000?30:0);
  if(key==='rest')score+=(100-n.energy)*.23;
  if(key==='eat')score+=n.hunger*1.18;
  if(key==='cook')score+=n.hunger*.36;
  if(key==='tea')score+=n.hunger*.16+(100-n.comfort)*.18;
  if(['read','study','inspect'].includes(key))score+=(100-n.stimulation)*.42;
  if(key==='work')score+=n.energy*.22;
  if(key==='read')score+=18;
  if(key==='diary'&&state.events.filter(e=>e.type==='completed'&&e.day===state.clock.day).length>=2)score+=36;
  if(key==='prepare'&&!deadline.done){
   const rem=deadline.deadline-state.clock.centibeats;
   score+=rem<=0?1:Math.min(95,15+65*Math.max(0,1-rem/36000));
  }
  if(enabled.commitments!==false)for(const c of state.commitments){
   if(!c.done&&(c.status===undefined||c.status==='open')&&c.action===key&&key!=='prepare')
    score+=Math.max(0,75-Math.max(0,c.deadline-state.clock.centibeats)/750);
  }
  if(['walk','tend'].includes(key))score+=(100-n.comfort)*.23;
  score+=supplyScore(state,key);
  if(key==='converse'){
    const trust=state.people.visitor_01.trust||0;
    score+=Math.max(0,90-n.company)*.9+(trust>-12?26:-70);
  }
  if(enabled.habits!==false){
   score+=Math.min(5,(state.habits[key]||0))*.5;
   const profile=state.habitProfiles?.[key];
   if(profile?.formed&&(state.objectPositions?.[a.target]||OBJECTS[a.target].room)===OBJECTS[a.target].room)score+=3;
  }
  const recent=state.events.filter(e=>e.type==='completed'&&e.day===state.clock.day).slice(-3);
  score-=recent.filter(e=>e.kind===key).length*16;
  const residueFactors=[];
  if(enabled.residue!==false){
   score+=(state.residue[key]||0);
   for(const [topic,action] of Object.entries(topicAction)){
    if(action!==key||!(state.residue[topic]>0))continue;
    const age=Math.max(0,state.clock.centibeats-(state.residueSources?.[topic]?.tick??state.clock.centibeats));
    const bonus=Math.round(state.residue[topic]*Math.max(.15,1-age/(12*100000))*100)/100;
    score+=bonus;residueFactors.push({topic,sourceEventId:state.residueSources?.[topic]?.eventId||null,bonus});
   }
  }
  const memoryFactors=[];
  for(const r of state.folioReads||[]){
   if(r.actionCue!==key||r.day>state.clock.day||state.clock.day-r.day>4)continue;
   const bonus=Math.max(0,15-(state.clock.day-r.day)*2);
   score+=bonus;memoryFactors.push({folioId:r.id,bonus,actionCue:r.actionCue});
  }
  if(['rest','inspect'].includes(key))score+=state.traits.nervous*3;
  if(['diary','walk'].includes(key))score+=state.traits.sociable*3;
  const mood=enabled.mood===false?0:state.mood.reduce((sum,m)=>sum+m.value,0);
  if(['read','inspect','study','work'].includes(key))score+=mood*.36;
  if(['tea','rest','walk'].includes(key))score-=mood*.22;
  // Bounded deterministic tie-breaking, not an LLM or unrecorded randomness.
  const noise=((Math.imul(state.clock.centibeats+13,key.length*7919)+state.seed)>>>0)%5-2;
  score-=Math.min(20,(state.outcomes?.[key]?.failure||0)*5);
  const utilityWeight=state.utilityWeights?.[key]??ACTION_WEIGHTS[key];
  score=Math.round((score+a.base*(utilityWeight-1)+noise)*100)/100;
  const targetRoom=a.target==='visitor_01'?(state.people.visitor_01.room||'library'):OBJECTS[a.target].room;
  return {kind:key,target:a.target,score,noise,utilityWeight,memoryFactors,residueFactors,
    failures:state.outcomes?.[key]?.failure||0,distance:distance(state.location,targetRoom)};
 }).sort((a,b)=>b.score-a.score||a.kind.localeCompare(b.kind));}
function applyMood(state,tag,value,duration=5000){state.mood.push({tag,value,until:state.clock.centibeats+duration});state.mood=state.mood.slice(-20);}
function perceiveTopic(state,text,source='visitor'){
 const lower=String(text).slice(0,300).toLowerCase(),hits=[];
 for(const [key,v] of Object.entries(TRIGGERS)){if(lower.includes(key)){hits.push(key);
    state.residue[key]=(state.residue[key]||0)+v.salience;
    state.residueSources??={};state.residueSources[key]={tick:state.clock.centibeats,source};
    applyMood(state,key,v.mood);}}
 if(hits.length){state.surface.lastWords=`That name is not without consequence: ${hits.join(', ')}.`;}
 return hits;
}
module.exports={DEFINITIONS,ACTION_WEIGHTS,setUtilityWeight,topicAction,memoryCue,clip,available,scores,applyMood,perceiveTopic};
