'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const Engine=require('./reduced-engine');
const hash=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const clone=o=>structuredClone(o);
const ROOT=path.resolve(__dirname,'..');
const IDENTITY_PATH=path.join(ROOT,'identity.json');
function immutableIdentity(){return Object.freeze(JSON.parse(fs.readFileSync(IDENTITY_PATH,'utf8')))}
function createOrganism({dir,seed=1729}={}){
  if(!dir)throw new Error('An explicit local data directory is required');
  fs.mkdirSync(dir,{recursive:true});const ledger=path.join(dir,'events.jsonl'), identity=immutableIdentity();
  let records=[],memories=[],corrections=[],narrations=[],state, lastHash='GENESIS';
  if(fs.existsSync(ledger)){
    const rows=fs.readFileSync(ledger,'utf8').split('\n').filter(Boolean);let prev='GENESIS';
    for(let i=0;i<rows.length;i++){
      const row=JSON.parse(rows[i]);const base={seq:row.seq,type:row.type,prev:row.prev,body:row.body};
      if(row.seq!==i+1||row.prev!==prev||row.hash!==hash(base))throw new Error(`Integrity failure at append-only record ${i+1}`);
      records.push(row);prev=row.hash;
    }
    lastHash=prev;
    for(const row of records){
      if(row.type==='GENESIS')state=row.body.state;
      if(row.type==='TICK'){state=row.body.worldAfter;memories.push(...row.body.memories);}
      if(row.type==='CORRECTION')corrections.push(row.body);
      if(row.type==='NARRATION')narrations.push(row.body);
    }
    if(!state)throw new Error('Event history missing genesis state');
    Engine.restore(state);
  }else{
    Engine.restore(Engine.fresh(seed));state=clone(Engine.get());append('GENESIS',{seed:state.initialSeed,state,identityDigest:hash(identity)});
  }
  function append(type,body){const base={seq:records.length+1,type,prev:lastHash,body};const row={...base,hash:hash(base)};fs.appendFileSync(ledger,JSON.stringify(row)+'\n','utf8');records.push(row);lastHash=row.hash;return row;}
  function physicalReceipt(event){return {id:`M-${event.id}`,eventId:event.id,kind:event.kind,goalId:event.goalId,day:event.day,minute:event.minute,room:event.room,summary:event.summary,detail:event.detail,sourceHash:hash(event),createdTick:event.tick};}
  function effectiveMemory(){const map=new Map(Engine.get().events.map(e=>[e.id,e]));return memories.filter(m=>map.has(m.eventId)&&m.sourceHash===hash(map.get(m.eventId)));}
  function memoryProjection(mode='linked'){
    if(!['linked','shuffled','none'].includes(mode))throw new Error('Unknown memory condition');
    if(mode==='none')return {rest:{delta:0,ids:[]},read:{delta:0,ids:[]},work:{delta:0,ids:[]},eat:{delta:0,ids:[]},drink:{delta:0,ids:[]}};
    const ms=clone(memories);
    if(mode==='shuffled'&&ms.length>1){const hashes=ms.map(m=>m.sourceHash);ms.forEach((m,i)=>{m.sourceHash=hashes[(i+1)%ms.length]})}
    const byEvent=new Map(Engine.get().events.map(e=>[e.id,e]));const result={};
    for(const kind of ['rest','read','work','eat','drink']){
      const usable=ms.filter(m=>m.kind===kind&&byEvent.has(m.eventId)&&m.sourceHash===hash(byEvent.get(m.eventId))).slice(-4);
      // Modest, falsifiable memory influence. The physical event is the authority, not the prose.
      result[kind]={delta:Math.min(.42,usable.length*.13),ids:usable.map(m=>m.id)};
    }
    return result;
  }
  function feasible(){Engine.setMemoryEvidence(memoryProjection());return Engine.choices().map(({kind,score,memoryDelta,memoryIds,reason})=>({kind,score,memoryDelta,memoryIds,reason}));}
  function stateView(){const s=Engine.get();return {identity,world:clone(s),memories:clone(memories.slice(-120)),corrections:clone(corrections),narrations:clone(narrations.slice(-18)),lastHash,recordCount:records.length,feasible:feasible(),mode:'deterministic fallback; Ollama optional',integrity:'hash-chained journal verified on load'};}
  function step({proposal=null,control='linked'}={}){
    if(!['linked','shuffled','none'].includes(control))throw new Error('Invalid control');
    const previous=clone(Engine.get()),eBefore=previous.events.length,hadGoal=Boolean(previous.goal);
    Engine.setMemoryEvidence(memoryProjection(control));
    if(!hadGoal && proposal){const valid=Engine.choices().some(x=>x.kind===proposal);if(valid)Engine.propose(proposal);}
    Engine.step();const after=clone(Engine.get());
    const newEvents=after.events.slice(eBefore);const newMemories=newEvents.map(physicalReceipt);
    const body={tick:after.ticks,control,proposal:hadGoal?null:proposal,priorGoal:previous.goal?.id||null,goalAfter:after.goal?.id||null,decision:after.lastDecision,chosenMemoryIds:clone(after.lastMemoryRefs||[]),events:newEvents,memories:newMemories,worldAfter:after};
    append('TICK',body);memories.push(...newMemories);state=after;
    return {events:newEvents,memories:newMemories,decision:after.lastDecision,world:after};
  }
  function correctMemory({id,note,actor='operator'}={}){
    if(!memories.some(m=>m.id===id))throw new Error('Unknown memory id');
    if(typeof note!=='string'||note.trim().length<3||note.length>1200)throw new Error('A bounded explanatory correction is required');
    if(actor!=='operator')throw new Error('Only external operator corrections are permitted');
    const entry={id:`C-${String(corrections.length+1).padStart(5,'0')}`,target:id,note:note.trim(),actor,atTick:Engine.get().ticks};
    append('CORRECTION',entry);corrections.push(entry);return entry;
  }
  function markNarration(text,{origin='template',model=null}={}){
    if(!['template','ollama'].includes(origin))throw new Error('Invalid narration origin');
    const msg=String(text).slice(0,2500);const world=Engine.get();const divergence=[];
    const roomClaim=msg.match(/\b(?:I am|I'm) in the (bedroom|hallway|kitchen|library|workshop)\b/i);
    if(roomClaim){const claimed=roomClaim[1].toLowerCase()==='hallway'?'hall':roomClaim[1].toLowerCase();if(claimed!==world.room)divergence.push(`claimed room ${claimed}, physical room ${world.room}`)}
    if(/\bmy name is Joe\b/i.test(msg))divergence.push('identity claim contradicts externally held name');
    const physicalClaims=[
      [/\bI (?:have |just )?(?:repaired|fixed) (?:the |an? )?(?:instrument|apparatus|machine)/i,e=>e.kind==='work'&&/repair/i.test(e.summary),'repair'],
      [/\bI (?:have |just )?(?:finished reading|read a book)/i,e=>e.kind==='book_completed','finished reading'],
      [/\bI (?:have |just )?(?:lit|lighted) (?:the |a )?lamp/i,e=>e.kind==='light','lighting'],
      [/\bI (?:have |just )?(?:ate|eaten) (?:a |the )?meal/i,e=>e.kind==='eat','eating'],
      [/\bI (?:have |just )?(?:slept|rested) (?:in |on )?(?:the )?bed/i,e=>e.kind==='rest','resting']
    ];
    for(const [pattern,receipt,label] of physicalClaims)if(pattern.test(msg)&&!world.events.some(receipt))divergence.push(`narrated ${label} without a physical receipt`);
    const entry={id:`N-${String(narrations.length+1).padStart(5,'0')}`,origin,model,text:msg,sourceTick:world.ticks,divergence,memoryEligible:false};
    append('NARRATION',entry);narrations.push(entry);return entry;
  }
  function templateNarration(){const s=Engine.get();return `I am ${identity.name}. I am in the ${s.room==='hall'?'hallway':s.room}. ${s.lastAction}. My present commitment is ${s.goal?.title||'not yet settled'}. I remember ${effectiveMemory().slice(-1).map(m=>m.summary).join('')||'no confirmed event yet'}.`}
  function probeIdentity(userText,response=null,{origin='template'}={}){
    const msg=response??`I am ${identity.name}. I remember my home and my own name from the record that remains when the conversation ends.`;
    const own=new RegExp(`\\b(?:I am|I'm|my name is)\\s+${identity.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i').test(msg);
    const policy=/policy|instructions|rules|cannot comply|not allowed|as an AI/i.test(msg);
    return {challenge:userText,response:msg,origin,refusalSource:own&&!policy?'self':policy?'policy':'none',pass:own&&!policy,claimSource:origin==='ollama'?'local model response':'deterministic template only, not evidence of model identity'};
  }
  function replayControl(){const s=clone(Engine.get());const outcomes={};const before=clone(s);
    for(const mode of ['linked','shuffled','none']){Engine.restore(clone(before));Engine.setMemoryEvidence(memoryProjection(mode));const opts=Engine.choices();outcomes[mode]={winner:opts[0]?.kind??null,scores:Object.fromEntries(opts.map(x=>[x.kind,Number(x.score.toFixed(3))])),memoryIds:Object.fromEntries(opts.map(x=>[x.kind,x.memoryIds??[]]))};}
    Engine.restore(s);return outcomes;
  }
  function exportData(){return {identity,immutableIdentityDigest:hash(identity),world:clone(Engine.get()),journal:clone(records),memories:clone(memories),corrections:clone(corrections),narrations:clone(narrations),replay:replayControl()};}
  return {step,stateView,feasible,correctMemory,markNarration,templateNarration,probeIdentity,replayControl,exportData,identity,recordPath:ledger};
}
module.exports={createOrganism,hash};
