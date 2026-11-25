'use strict';
const fs=require('node:fs'),path=require('node:path');
const {load,save}=require('./store');
const {readCanon,externalIdentity}=require('./history');
const Port=require('./doctor_world_port');
const root=path.resolve(__dirname,'..');
const file=process.argv[2];
if(!file||!path.isAbsolute(file))throw Error('Absolute dedicated Tower save path required');
const input=JSON.parse(fs.readFileSync(0,'utf8'));
fs.mkdirSync(path.dirname(file),{recursive:true});
const lock=file+'.doctor-port.lock';
const fd=fs.openSync(lock,'wx',0o600);
try{
 const identity=externalIdentity(path.join(root,'identity.json'));
 const archive=readCanon(path.join(root,'canon/Pretorius_v12_450_Events_Complete.jsonl'));
 const s=load(file,identity,archive);
 let answer;
 if(input.op==='init'){
  if(fs.existsSync(file))throw Error('Existing world cannot be enrolled implicitly');
  Port.enroll(s,input.epoch);save(file,s);answer=Port.observe(s,0);
 }else if(input.op==='observe')answer=Port.observe(s,input.after??0);
 else if(input.op==='pulse'){answer=Port.pulse(s,archive,input.request);if(!answer.replayed)save(file,s);}
 else throw Error('Unknown canonical world operation');
 process.stdout.write(JSON.stringify(answer)+'\n');
}finally{fs.closeSync(fd);fs.unlinkSync(lock);}
