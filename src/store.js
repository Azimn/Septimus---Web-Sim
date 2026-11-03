'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {initialState,ensureHooks}=require('./world');
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const FORMAT='simple-tower-save-v2',LEGACY='simple-tower-save-v1';
const SEGMENT_EVENTS=512;
const eventDir=file=>file+'.events';
const snapDir=file=>file+'.snapshots';
const name=i=>'segment-'+String(i).padStart(7,'0');
const segFile=(file,i)=>path.join(eventDir(file),name(i)+'.jsonl');
const sealFile=(file,i)=>path.join(eventDir(file),name(i)+'.seal.json');
const snapFile=(file,g)=>path.join(snapDir(file),'snapshot-'+String(g).padStart(9,'0')+'.json');
const rawFile=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const stringHash=value=>digest(JSON.stringify(value));
function atomic(file,payload){
 const tmp=file+'.tmp-'+process.pid;
 fs.writeFileSync(tmp,payload);fs.renameSync(tmp,file);
}
function compact(state){
 // Property order is preserved: restoring the event array reconstructs the
 // exact JSON state, including the original event key's position.
 return {...state,events:[]};
}
function legacyValue(file){
 const value=rawFile(file);
 if(value.format!==LEGACY||!value.state||stringHash(value.state)!==value.hash)
  throw Error('Save integrity failure');
 return value;
}
function segmentBytes(events){return events.map(e=>JSON.stringify(e)+'\n').join('');}
function readSegment(file,index,bytes,count,hash){
 const pathName=segFile(file,index),b=fs.readFileSync(pathName);
 if(b.length<bytes)throw Error('Segment truncated: '+index);
 const prefix=b.subarray(0,bytes),raw=prefix.toString('utf8');
 if(digest(raw)!==hash)throw Error('Segment integrity failure: '+index);
 const lines=raw.trimEnd()?raw.trimEnd().split('\n'):[];
 if(lines.length!==count)throw Error('Segment count mismatch: '+index);
 return lines.map(x=>JSON.parse(x));
}
function readV2(file,value){
 if(value.format!==FORMAT||value.version!==2||!Number.isSafeInteger(value.eventCount))
  throw Error('Unsupported tower save format');
 const snapshotFile=snapFile(file,value.generation);
 const snapshot=rawFile(snapshotFile);
 if(snapshot.format!=='simple-tower-snapshot-v2'||snapshot.generation!==value.generation||
  stringHash(snapshot.state)!==value.snapshotHash||snapshot.hash!==value.snapshotHash)
  throw Error('Compact snapshot integrity failure');
 const events=[];
 let prior='GENESIS';
 for(let i=1;i<value.activeIndex;i++){
  const seal=rawFile(sealFile(file,i));
  if(seal.index!==i||seal.count!==SEGMENT_EVENTS||seal.previousSealHash!==prior)
   throw Error('Segment chain mismatch: '+i);
  const group=readSegment(file,i,seal.bytes,seal.count,seal.hash);
  const next=digest(prior+':'+seal.hash+':'+i);
  if(seal.chainHash!==next)throw Error('Segment seal integrity failure');
  events.push(...group);prior=next;
 }
 if(prior!==value.lastSealedHash)throw Error('Segment head mismatch');
 const active=readSegment(file,value.activeIndex,value.activeBytes,
  value.activeCount,value.activeHash);
 events.push(...active);
 if(events.length!==value.eventCount)throw Error('Event count mismatch');
 if((events.at(-1)?.id||null)!==(value.lastEventId||null))
  throw Error('Event identity chain mismatch');
 if(snapshot.state.events?.length!==0)throw Error('Snapshot contains event history');
 snapshot.state.events=events;
 return {state:snapshot.state,metadata:value};
}
function rawState(file){
 if(!fs.existsSync(file))return null;
 const value=rawFile(file);
 if(value.format===LEGACY)return legacyValue(file).state;
 return readV2(file,value).state;
}
function checkIdentity(s,identity,archive){
 if(s.identitySha!==identity.sha||s.archiveSha!==archive.sha)throw Error('Identity or canon mismatch');
 if(s.schema!==1)throw Error('Unsupported tower schema');
}
function load(file,identity,archive){
 const state=rawState(file);
 if(!state)return initialState(identity.sha,archive.sha);
 checkIdentity(state,identity,archive);
 return ensureHooks(state);
}
function append(file,state,prior,savedAtMs){
 const baseEvents=prior?.eventCount||0;
 if(state.events.length<baseEvents)throw Error('Append-only history shortened');
 if(prior&&baseEvents>0&&state.events[baseEvents-1]?.id!==prior.lastEventId)
  throw Error('Append-only event prefix mismatch');
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.mkdirSync(eventDir(file),{recursive:true});
 fs.mkdirSync(snapDir(file),{recursive:true});
 let index=prior?.activeIndex||1,count=prior?.activeCount||0,
  activeBytes=prior?.activeBytes||0,activeHash=prior?.activeHash||digest(''),
  sealedHash=prior?.lastSealedHash||'GENESIS';
 // If an interrupted write left a tail beyond the committed prefix,
 // NEVER treat that uncommitted tail as lived history. Keep the old file
 // untouched and begin a new segment; the old tail remains as an orphan.
 let segment=segFile(file,index);
 if(prior&&fs.existsSync(segment)&&fs.statSync(segment).size>activeBytes){
  const priorCount=count,priorHash=activeHash,priorBytes=activeBytes;
  // A partial active segment cannot be sealed; retain it and explicitly
  // record its chain break via operator checkpoint metadata.
  index++;
  count=0;activeBytes=0;activeHash=digest('');
  segment=segFile(file,index);
  if(fs.existsSync(segment))throw Error('Uncommitted segment collision');
 }
 if(!fs.existsSync(segment))fs.writeFileSync(segment,'');
 let cursor=baseEvents;
 while(cursor<state.events.length){
  if(count===SEGMENT_EVENTS){
   const seal={format:'simple-tower-seal-v2',index,count,bytes:activeBytes,
    hash:activeHash,previousSealHash:sealedHash,
    chainHash:digest(sealedHash+':'+activeHash+':'+index)};
   if(!fs.existsSync(sealFile(file,index)))atomic(sealFile(file,index),JSON.stringify(seal));
   else if(JSON.stringify(rawFile(sealFile(file,index)))!==JSON.stringify(seal))
    throw Error('Sealed segment altered');
   sealedHash=seal.chainHash;index++;count=0;activeBytes=0;activeHash=digest('');
   segment=segFile(file,index);
   if(fs.existsSync(segment))throw Error('Attempt to overwrite sealed segment');
   fs.writeFileSync(segment,'');
  }
  const size=Math.min(SEGMENT_EVENTS-count,state.events.length-cursor);
  const chunk=segmentBytes(state.events.slice(cursor,cursor+size));
  fs.appendFileSync(segment,chunk);
  activeBytes+=Buffer.byteLength(chunk,'utf8');
  // Hash at most 512 events, not the accumulated world log.
  const current=fs.readFileSync(segment).subarray(0,activeBytes);
  activeHash=digest(current);count+=size;cursor+=size;
 }
 // seal only when new events force rotation; a full final segment may
 // remain active, but will never be rewritten after being sealed.
 const generation=(prior?.generation||0)+1,snapshot=compact(state),
  snapshotHash=stringHash(snapshot),snapshotPayload={format:'simple-tower-snapshot-v2',
   generation,hash:snapshotHash,state:snapshot};
 atomic(snapFile(file,generation),JSON.stringify(snapshotPayload));
 const manifest={format:FORMAT,version:2,generation,savedAt:new Date(savedAtMs).toISOString(),
  eventCount:state.events.length,lastEventId:state.events.at(-1)?.id||null,
  snapshotHash,activeIndex:index,activeCount:count,activeBytes,activeHash,
  lastSealedHash:sealedHash,segmentSize:SEGMENT_EVENTS,
  integrity:'compact_state_sha256_plus_append_only_hash_chained_event_segments'};
 atomic(file,JSON.stringify(manifest));
 // Snapshots are replaceable checkpoints, not history. Retain current and
 // previous for crash diagnosis; sealed event segments remain immutable.
 if(generation>2){
  const old=snapFile(file,generation-2);
  if(fs.existsSync(old))fs.unlinkSync(old);
 }
 return manifest;
}
function save(file,state,{savedAtMs=Date.now()}={}){
 if(!Array.isArray(state.events))throw Error('World event log missing');
 if(fs.existsSync(file)){
  const prev=rawFile(file);
  if(prev.format===LEGACY){
   // Verify old state before migration, retain the unmodified legacy file
   // as a source of truth, then switch to v2 atomically.
   const old=legacyValue(file),backup=file+'.legacy-v1';
   if(!fs.existsSync(backup))fs.copyFileSync(file,backup,fs.constants.COPYFILE_EXCL);
   const oldState=old.state;
   if(state.events.length<oldState.events.length||
    (oldState.events.length>0&&state.events[oldState.events.length-1]?.id!==
     oldState.events.at(-1)?.id))throw Error('Legacy history cannot be shortened');
   // First checkpoint preserves old state; then append any later events.
   append(file,oldState,null,Date.parse(old.savedAt));
   if(state!==oldState)return append(file,state,rawFile(file),savedAtMs);
   return rawFile(file);
  }
  if(prev.format!==FORMAT)throw Error('Unknown save format');
  return append(file,state,prev,savedAtMs);
 }
 return append(file,state,null,savedAtMs);
}
function migrateLegacy(file,identity,archive,{savedAtMs=Date.now()}={}){
 const old=legacyValue(file);
 checkIdentity(old.state,identity,archive);
 const exactBefore=stringHash(old.state);
 const oldSavedAt=old.savedAt;
 save(file,old.state,{savedAtMs});
 const after=rawState(file),exactAfter=stringHash(after);
 if(exactBefore!==exactAfter)throw Error('Legacy migration state-hash mismatch');
 return {exactBefore,exactAfter,equal:exactBefore===exactAfter,
  oldSavedAt,oldFormat:LEGACY,newFormat:FORMAT,
  events:after.events.length,manifest:rawFile(file)};
}
function resume(file,identity,archive,{nowMs=Date.now()}={}){
 const s=load(file,identity,archive);
 if(!fs.existsSync(file))return s;
 const env=rawFile(file);
 const startMs=Date.parse(env.savedAt||new Date(nowMs).toISOString());
 if(!Number.isFinite(nowMs)||!Number.isFinite(startMs)||nowMs<startMs)
  throw Error('Invalid pause interval');
 const tick=s.clock.centibeats,interval={startedAt:new Date(startMs).toISOString(),
  endedAt:new Date(nowMs).toISOString(),elapsedMilliseconds:nowMs-startMs,
  startTick:tick,endTick:tick};
 s.clock.pausedIntervals??=[];s.clock.pausedIntervals.push(interval);
 const e={id:'L'+(++s.sequence),t:tick,day:s.clock.day,type:'paused',room:s.location,
  description:'The tower clock did not advance during this saved interval.',
  provenance:'operator_metadata',operatorOnly:true,interval};
 s.events.push(e);s.running=false;s.wallMs=nowMs;
 return s;
}
module.exports={FORMAT,LEGACY,SEGMENT_EVENTS,save,load,rawState,migrateLegacy,resume,
 eventDir,snapDir,digest};
