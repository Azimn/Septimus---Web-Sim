'use strict';
const {OBJECTS,TRIGGERS,distance}=require('./world');
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
 tend:{target:'plot',duration:3200,base:7,trait:'industrious'}
};
const clip=n=>Math.max(0,Math.min(100,Math.round(n*100)/100));
function available(state,kind){const a=DEFINITIONS[kind];if(!a||!OBJECTS[a.target])return false;
 if(['eat','cook'].includes(kind)&&state.stores.food<1)return false;
 if(['tea','cook'].includes(kind)&&(state.stores.water<1||state.stores.fuel<1))return false;
 if(kind==='tea'&&state.stores.tea<1)return false;
 if(kind==='prepare'&&state.commitments[0].done)return false;
 if(kind==='read'&&state.folioReads.some(x=>x.day===state.clock.day))return false;
 if(kind==='diary'&&state.diary.some(x=>x.day===state.clock.day))return false;
 return true;}
function scores(state){const n=state.needs,deadline=state.commitments[0],time=state.clock.centibeats%100000;
 return Object.entries(DEFINITIONS).filter(([key])=>available(state,key)).map(([key,a])=>{
  let score=a.base*(state.traits[a.trait]||1);
  if(key==='sleep')score+=(100-n.energy)*.72+(time>75000?20:0);
  if(key==='rest')score+=(100-n.energy)*.23;
  if(key==='eat')score+=n.hunger*1.18;
  if(key==='cook')score+=n.hunger*.36;
  if(key==='tea')score+=n.hunger*.16+(100-n.comfort)*.18;
  if(['read','study','inspect'].includes(key))score+=(100-n.stimulation)*.42;
  if(key==='work')score+=n.energy*.22;
  if(key==='prepare'&&!deadline.done)score+=time<65000?Math.min(95,15+65*Math.max(0,1-(65000-time)/36000)):1;
  if(['walk','tend'].includes(key))score+=(100-n.comfort)*.23;
  score+=(state.habits[key]||0)*.7;
  score+=(state.residue[key]||0);
  if(['rest','inspect'].includes(key))score+=state.traits.nervous*3;
  if(['diary','walk'].includes(key))score+=state.traits.sociable*3;
  const mood=state.mood.reduce((sum,m)=>sum+m.value,0);
  if(['read','inspect','study','work'].includes(key))score+=mood*.36;
  if(['tea','rest','walk'].includes(key))score-=mood*.22;
  // Bounded deterministic tie-breaking, not an LLM or unrecorded randomness.
  const noise=((Math.imul(state.clock.centibeats+13,key.length*7919)+state.seed)>>>0)%5-2;
  score=Math.round((score+noise)*100)/100;
  return {kind:key,target:a.target,score,noise,distance:distance(state.location,OBJECTS[a.target].room)};
 }).sort((a,b)=>b.score-a.score||a.kind.localeCompare(b.kind));}
function applyMood(state,tag,value,duration=5000){state.mood.push({tag,value,until:state.clock.centibeats+duration});state.mood=state.mood.slice(-20);}
function perceiveTopic(state,text,source='visitor'){
 const lower=String(text).slice(0,300).toLowerCase(),hits=[];
 for(const [key,v] of Object.entries(TRIGGERS)){if(lower.includes(key)){hits.push(key);state.residue[key]=(state.residue[key]||0)+v.salience;applyMood(state,key,v.mood);}}
 if(hits.length){state.surface.lastWords=`That name is not without consequence: ${hits.join(', ')}.`;}
 return hits;
}
module.exports={DEFINITIONS,clip,available,scores,applyMood,perceiveTopic};
