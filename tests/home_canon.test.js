'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createOrganism}=require('../src/organism');
const {rooms}=require('../src/world');
test('canonical residence is the documented tower, and gameplay map preserves tower rooms',()=>{
 const id=JSON.parse(fs.readFileSync(path.join(__dirname,'../identity.json'),'utf8'));
 assert.equal(id.home,'The ruined tower outside Ingolstadt');
 for(const k of ['bedroom','library','workshop','hall','kitchen','garden'])assert.match(rooms[k],/Tower/);
});
test('legacy home label changes only through one append-only event',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'tower-canon-'));
 try{
  const current=JSON.parse(fs.readFileSync(path.join(__dirname,'../identity.json'),'utf8'));
  const legacy={name:current.name,role:'Resident scientist of the isolated Victorian house and garden',home:'The Laboratory at Ash Grove',values:current.values,commitments:current.commitments,canonical_version:1};
  const identityPath=path.join(d,'legacy.json'),dir=path.join(d,'world');
  fs.writeFileSync(identityPath,JSON.stringify(legacy));
  const old=createOrganism({dir,identityPath});for(let i=0;i<12;i++)old.tick();
  const before=old.exportData(),journal=path.join(dir,'events.jsonl'),lines=fs.readFileSync(journal,'utf8').trim().split('\n');
  const updated=createOrganism({dir});
  assert.deepEqual(updated.view().world,before.world);
  assert.deepEqual(updated.exportData().memory,before.memory);
  const after=fs.readFileSync(journal,'utf8').trim().split('\n');
  assert.deepEqual(after.slice(0,lines.length),lines);
  assert.equal(after.length,lines.length+1);
  assert.equal(JSON.parse(after.at(-1)).type,'CANON_CORRECTION');
  assert.equal(createOrganism({dir}).view().recordCount,after.length);
 }finally{fs.rmSync(d,{recursive:true,force:true})}
});
