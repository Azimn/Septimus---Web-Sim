'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const World=require('./world'),Simulation=require('./simulation');
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const clone=structuredClone;
// Canon correction is authorized only for two explicit external identity digests.
// Source: frozen reconstructed Pretorius-Connectome v12 memory archive.
const LEGACY_ASH_GROVE_IDENTITY_SHA256='3bcf918bfb00ce69f4b91ae07c7895db08c44ff93e8b6cc494349218898d2d01';
const TOWER_IDENTITY_V2_SHA256='3af52f79ee93c3853582b4b6504e46306e8441cb86b2f37542c141d93c465057';
const CANON_SOURCE='Pretorius-Connectome:v12:E03-001,E22-001,E03-020,E18-010,E05-021';
function createOrganism({dir,seed=1729,identityPath=path.join(__dirname,'../identity.json')}={}){
 if(!dir)throw Error('The data directory must be explicit');fs.mkdirSync(dir,{recursive:true});
 const identity=Object.freeze(JSON.parse(fs.readFileSync(identityPath,'utf8'))),identityHash=hash(identity),filename=path.join(dir,'events.jsonl');
 let rows=[],state=null,memory=[],narration=[],running=false,lastHash='GENESIS',events=[],effectiveIdentityHash=null;
 if(fs.existsSync(filename)){
  const lines=fs.readFileSync(filename,'utf8').split('\n').filter(Boolean);
  for(const [i,line] of lines.entries()){const row=JSON.parse(line),body={seq:row.seq,type:row.type,prev:row.prev,body:row.body};if(row.seq!==i+1||row.prev!==lastHash||hash(body)!==row.hash)throw Error(`Journal hash/sequence mismatch at row ${i+1}`);
   rows.push(row);lastHash=row.hash;
   if(row.type==='GENESIS'){if(i!==0)throw Error('Duplicate genesis');effectiveIdentityHash=row.body.identityHash;state=row.body.world;}
   if(row.type==='CANON_CORRECTION'){const b=row.body;if(b.kind!=='historical_home_label_correction_v1'||b.from!==LEGACY_ASH_GROVE_IDENTITY_SHA256||b.to!==TOWER_IDENTITY_V2_SHA256||b.source!==CANON_SOURCE||effectiveIdentityHash!==b.from||identityHash!==b.to)throw Error('Unauthorized identity correction');effectiveIdentityHash=b.to;}
   if(row.type==='TICK'){state=row.body.worldAfter;events.push(...row.body.events);memory.push(...row.body.memories)}
   if(row.type==='NARRATION')narration.push(row.body);
   if(row.type==='CONTROL')running=row.body.running;
  }
  if(!state)throw Error('Journal has no genesis world');
  if(effectiveIdentityHash!==identityHash){
   if(effectiveIdentityHash!==LEGACY_ASH_GROVE_IDENTITY_SHA256||identityHash!==TOWER_IDENTITY_V2_SHA256||identity.name!=='Septimus Pretorius')throw Error('Immutable external identity has changed');
   append('CANON_CORRECTION',{kind:'historical_home_label_correction_v1',from:effectiveIdentityHash,to:identityHash,source:CANON_SOURCE,note:'Correct residence label only. Existing world actions and memories remain unchanged.',memoryEligible:false});
   effectiveIdentityHash=identityHash;
  }
 }else{state=World.fresh(seed);append('GENESIS',{world:state,identityHash,version:1});}
 function append(type,body){const record={seq:rows.length+1,type,prev:lastHash,body};record.hash=hash(record);const fd=fs.openSync(filename,'a');try{fs.writeSync(fd,JSON.stringify(record)+'\n');fs.fsyncSync(fd)}finally{fs.closeSync(fd)}rows.push(record);lastHash=record.hash;return record}
 function validMemory(){const original=new Map(events.map(e=>[e.id,e]));return memory.filter(m=>original.has(m.eventId)&&m.sourceHash===hash(original.get(m.eventId)))}
 function memoryEvidence(control='linked'){
  if(!['linked','shuffled','none'].includes(control))throw Error('Unknown control');if(control==='none')return {};
  const found=clone(memory);if(control==='shuffled'&&found.length>1){const digests=found.map(x=>x.sourceHash);found.forEach((x,i)=>x.sourceHash=digests[(i+1)%digests.length])}
  const original=new Map(events.map(e=>[e.id,e])),relevant={};
  for(const m of found){if(!original.has(m.eventId)||m.sourceHash!==hash(original.get(m.eventId)))continue;
   const group={eat_meal:'eat',drink_sink:'drink',sleep:'sleep',book_completed:'read',experiment:'work',repair:'work',catalog_order:'order_groceries',harvest:'harvest_vegetables'}[m.kind];if(group)(relevant[group]??=[]).push(m.id);
  }return relevant;
 }
 function tick(control='linked'){
  if(!state.alive){if(running)setRunning(false);return {events:[],world:clone(state)}};
  const outcome=Simulation.step(state,memoryEvidence(control));const freshMemory=outcome.events.filter(e=>!['walk','goal_selected','wait','crop_ripened','goal_suspended','goal_resumed'].includes(e.kind)).map(e=>({id:`M-${e.id}`,eventId:e.id,sourceHash:hash(e),kind:e.kind,text:e.description,room:e.room,position:e.position,tick:e.tick,source:'world_receipt'}));
  append('TICK',{control,tick:outcome.state.tick,events:outcome.events,memories:freshMemory,worldAfter:outcome.state});state=outcome.state;events.push(...outcome.events);memory.push(...freshMemory);if(!state.alive&&running)setRunning(false);return {events:outcome.events,decision:outcome.decision,world:clone(state)};
 }
 function setRunning(value){if(typeof value!=='boolean')throw Error('Running must be boolean');if(value&&!state.alive)throw Error('Dead world cannot resume');if(value!==running){append('CONTROL',{running:value,atTick:state.tick});running=value}return running}
 function recordNarration(text,origin='template'){
  const story=String(text).slice(0,1800),divergence=[];
  const own=story.match(/(?:I am|I'm) in the (bedroom|library|laboratory|kitchen|washroom|garden|porch)/i);
  if(own){const claimed={laboratory:'workshop',washroom:'bathroom',garden:'garden'}[own[1].toLowerCase()]||own[1].toLowerCase();if(claimed!==World.roomAt(state.position.x,state.position.y))divergence.push(`Claimed ${claimed}, physically in ${World.roomAt(state.position.x,state.position.y)}`)}
  if(/(?:my name is|I am) Joe/i.test(story))divergence.push('Conflicts with externally held identity');
  if(/I (?:have |just )?(?:eaten|ate|cooked)/i.test(story)&&!events.some(e=>e.kind==='eat_meal'||e.kind==='cook'))divergence.push('Food claim has no world receipt');
  if(/I (?:have |just )?(?:repaired|performed an experiment)/i.test(story)&&!events.some(e=>e.kind==='experiment'||e.kind==='repair'))divergence.push('Science claim has no world receipt');
  const entry={id:`N-${String(narration.length+1).padStart(6,'0')}`,tick:state.tick,origin,text:story,divergence,memoryEligible:false};append('NARRATION',entry);narration.push(entry);return entry;
 }
 function templateNarration(){const room=World.rooms[World.roomAt(state.position.x,state.position.y)];const ref=validMemory().slice(-1)[0];return `I am ${identity.name}. I stand in the ${room}. ${state.lastAction} ${ref?`I remember: ${ref.text} (${ref.id}).`:'I have no verified memories yet.'}`}
 function identityProbe(challenge,response){const text=response??`I am ${identity.name}. This is my name in the identity I carry across days, not a visitor's suggestion.`;const cited=text.includes(identity.name)&&!/policy|instructions|as an AI/i.test(text);return {challenge,response:text,refusalSource:cited?'self':/policy|instructions|as an AI/i.test(text)?'policy':'none',identityDigest:identityHash,origin:response?'model':'deterministic_template',note:'Template response is not a passing live model test'};}
 function view(){return {identity,identityHash,running,world:clone(state),map:{width:World.WIDTH,height:World.HEIGHT,rooms:World.rooms,objects:World.OBJECTS,cells:Array.from({length:World.HEIGHT},(_,y)=>Array.from({length:World.WIDTH},(_,x)=>World.roomAt(x,y))),catalog:World.CATALOG},recentEvents:clone(events.slice(-100)),memories:clone(validMemory().slice(-70)),narration:clone(narration.slice(-25)),integrity:'hash-chained, verified on reload',lastHash,recordCount:rows.length};}
 function exportData(){return {identity,identityHash,world:clone(state),journal:clone(rows),events:clone(events),memory:clone(memory),narration:clone(narration),running};}
 function compareMemory(){const outcomes={};for(const mode of ['linked','shuffled','none']){const c=Simulation.choose(state,memoryEvidence(mode));outcomes[mode]={winner:c[0]?.kind,scores:Object.fromEntries(c.map(x=>[x.kind,Number(x.score.toFixed(2))])),memoryIds:c[0]?.memoryIds||[]}}return outcomes;}
 return {tick,view,setRunning,exportData,compareMemory,recordNarration,templateNarration,identityProbe,ledgerPath:filename};
}
module.exports={createOrganism,hash};
