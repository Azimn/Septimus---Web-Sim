'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const crypto=require('node:crypto');
const {fresh,identity,archive}=require('../scripts/v12_probe');
const Store=require('../src/store');
const dir=()=>fs.mkdtempSync(path.join(os.tmpdir(),'tower-v19-append-'));
test('v1.9 addendum: segmented event log reconstructs bit-identical state across checkpoints',()=>{
 const file=path.join(dir(),'tower.json'),s=fresh(11);
 for(let i=0;i<1213;i++)s.events.push({id:'L'+(i+1),type:'manual_fixture',t:i,data:i});
 s.sequence=1213;
 Store.save(file,s,{savedAtMs:5000});
 assert.equal(Store.rawState(file)&&Store.digest(JSON.stringify(Store.rawState(file))),
  Store.digest(JSON.stringify(s)));
 assert.deepEqual(Store.load(file,identity,archive),s);
 assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).format,'simple-tower-save-v2');
 const old=Store.digest(JSON.stringify(Store.rawState(file)));
 s.events.push({id:'L1214',type:'next_fixture',t:1214});s.sequence++;
 Store.save(file,s,{savedAtMs:6000});
 assert.equal(Store.digest(JSON.stringify(Store.rawState(file))),
  Store.digest(JSON.stringify(s)));
 assert.notEqual(Store.digest(JSON.stringify(s)),old);
 const seals=fs.readdirSync(Store.eventDir(file)).filter(x=>x.endsWith('.seal.json'));
 assert.equal(seals.length,2);
 const before=fs.readFileSync(path.join(Store.eventDir(file),seals[0]));
 Store.save(file,s,{savedAtMs:7000});
 assert.deepEqual(fs.readFileSync(path.join(Store.eventDir(file),seals[0])),before);
 assert.deepEqual(Store.load(file,identity,archive),s);
});
test('v1.9 addendum: tampered event segment or compact snapshot refuses to load',()=>{
 const root=dir(),file=path.join(root,'tower.json'),s=fresh(11);
 for(let i=0;i<520;i++)s.events.push({id:'L'+(i+1),type:'receipt',t:i});
 s.sequence=520;Store.save(file,s);
 const segment=path.join(Store.eventDir(file),'segment-0000001.jsonl');
 const raw=fs.readFileSync(segment,'utf8');
 fs.writeFileSync(segment,raw.replace('"receipt"','"invented"'));
 assert.throws(()=>Store.load(file,identity,archive),/integrity/);
});
test('v1.9 addendum: verified v1 legacy save migrates with exactly equal raw state hash',()=>{
 const file=path.join(dir(),'legacy.json'),s=fresh(11),hash=Store.digest(JSON.stringify(s));
 const old={format:'simple-tower-save-v1',hash,savedAt:new Date(5000).toISOString(),state:s};
 fs.writeFileSync(file,JSON.stringify(old,null,2));
 const result=Store.migrateLegacy(file,identity,archive,{savedAtMs:6000});
 assert.equal(result.exactBefore,result.exactAfter);
 assert.equal(result.exactAfter,hash);assert.equal(result.equal,true);
 assert.deepEqual(Store.load(file,identity,archive),s);
 assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).format,Store.FORMAT);
 assert.ok(fs.existsSync(file+'.legacy-v1'));
});
test('v1.9 addendum: malformed or shortened append-only history is never silently accepted',()=>{
 const file=path.join(dir(),'save.json'),s=fresh(11);
 s.events=[{id:'L1',type:'work',t:1}];s.sequence=1;Store.save(file,s);
 s.events=[];assert.throws(()=>Store.save(file,s),/shortened/);
});
