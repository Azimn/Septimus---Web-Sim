'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {initialState,ensureHooks}=require('./world');
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
function save(file,state,{savedAtMs=Date.now()}={}){fs.mkdirSync(path.dirname(file),{recursive:true});const data=JSON.stringify(state);const payload=JSON.stringify({format:'simple-tower-save-v1',hash:digest(data),savedAt:new Date(savedAtMs).toISOString(),state},null,2);const temp=file+'.tmp-'+process.pid;fs.writeFileSync(temp,payload);fs.renameSync(temp,file);}
function load(file,identity,archive){if(!fs.existsSync(file))return initialState(identity.sha,archive.sha);const value=JSON.parse(fs.readFileSync(file,'utf8'));
 if(value.format!=='simple-tower-save-v1'||digest(JSON.stringify(value.state))!==value.hash)throw Error('Save integrity failure');
 if(value.state.identitySha!==identity.sha||value.state.archiveSha!==archive.sha)throw Error('Identity or canon mismatch');
 if(value.state.schema!==1)throw Error('Unsupported tower schema');return ensureHooks(value.state);}
// Explicit resume means the stored pause is not confused with simulated lived activity.
// Plain load remains an inspection/clone API so old v1.1 equality tests retain their contract.
function resume(file,identity,archive,{nowMs=Date.now()}={}){
 const s=load(file,identity,archive);
 if(!fs.existsSync(file))return s;
 const env=JSON.parse(fs.readFileSync(file,'utf8'));
 const startMs=Date.parse(env.savedAt||new Date(nowMs).toISOString());
 if(!Number.isFinite(nowMs)||!Number.isFinite(startMs)||nowMs<startMs)throw Error('Invalid pause interval');
 const tick=s.clock.centibeats,interval={startedAt:new Date(startMs).toISOString(),endedAt:new Date(nowMs).toISOString(),
   elapsedMilliseconds:nowMs-startMs,startTick:tick,endTick:tick};
 s.clock.pausedIntervals??=[];s.clock.pausedIntervals.push(interval);
 const e={id:'L'+(++s.sequence),t:tick,day:s.clock.day,type:'paused',room:s.location,
  description:'The tower clock did not advance during this saved interval.',
  provenance:'operator_metadata',operatorOnly:true,interval};
 s.events.push(e);s.running=false;s.wallMs=nowMs;
 return s;
}
module.exports={save,load,resume};
