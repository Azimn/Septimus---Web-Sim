'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createOrganism,hash}=require('../src/organism');
const Diary=require('../src/diary');
const World=require('../src/world');
const {step}=require('../src/simulation');
function within(fn){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'septimus-diary-'));try{return fn(dir)}finally{fs.rmSync(dir,{recursive:true,force:true})}}

test('the diary exists at a reachable physical library position',()=>{
 const object=World.OBJECTS.find(x=>x.id==='journal');assert.ok(object);
 assert.equal(World.roomAt(object.x,object.y),'library');assert.ok(World.pathBetween({x:2,y:2},object).length>0);
});
test('new memories are first-person recollections distinct from immutable objective receipts',()=>within(dir=>{
 const a=createOrganism({dir});for(let i=0;i<45;i++)a.tick();const e=a.exportData();
 assert.ok(e.memory.some(m=>/\bI\b/.test(m.text)&&m.confidence==='recollected_not_exact'));
 const source=new Map(e.events.map(x=>[x.id,x]));
 for(const m of e.memory){assert.equal(m.sourceHash,hash(source.get(m.eventId)));assert.equal(m.observerTime,null);assert.doesNotMatch(m.text,/@\d{3}|BeatTime|\btick\s*\d+/i);}
 assert.ok(e.memory.some(m=>m.text!==source.get(m.eventId).description));
}));
test('a page requires physically writing at the journal; it is append-only and references real lived evidence',()=>within(dir=>{
 const o=createOrganism({dir});let writes=0;for(let i=0;i<1700;i++){const result=o.tick();if(result.events.some(e=>e.kind==='journal_write'))writes++;if(writes>=1||!result.world.alive)break;}
 const before=o.exportData();assert.ok(before.privateJournal.pages.length>=1,'at least one genuine physical diary page');
 const worldEvents=new Map(before.events.map(e=>[e.id,e]));
 for(const page of before.privateJournal.pages){
  const written=worldEvents.get(page.writingReceiptId),source=worldEvents.get(page.sourceEventId);
  assert.equal(written.kind,'journal_write');assert.equal(written.details.sourceEventId,source.id);
  assert.equal(written.position.x,World.BY_ID.journal.x);assert.equal(written.position.y,World.BY_ID.journal.y);
  assert.equal(page.sourceHash,hash(source));assert.match(page.text,/\bI\b/);assert.doesNotMatch(page.text,/@\d{3}|BeatTime/i);
 }
 const next=createOrganism({dir}).exportData();assert.deepEqual(next.privateJournal.pages,before.privateJournal.pages);
 const lines=fs.readFileSync(path.join(dir,'events.jsonl'),'utf8').trim().split('\n');const index=lines.findIndex(x=>JSON.parse(x).type==='JOURNAL_PAGE');
 const broken=JSON.parse(lines[index]);broken.body.sourceHash='forged';lines[index]=JSON.stringify(broken);
 fs.writeFileSync(path.join(dir,'events.jsonl'),lines.join('\n')+'\n');
 assert.throws(()=>createOrganism({dir}),/Journal hash\/sequence mismatch|Unverified diary page provenance/);
}));
test('self identity is externally held; perception has no engine time or unobserved deliveries',()=>within(dir=>{
 const o=createOrganism({dir});const v=o.view();assert.equal(v.ipseity.name,'Septimus Pretorius');
 assert.equal(v.ipseity.sessionMayRewrite,false);assert.equal(v.perception.observedClock,null);
 assert.doesNotMatch(JSON.stringify(v.perception),/BeatTime|@\d{3}|1899-07-01|tick.*\d+/i);
 assert.equal(o.identityProbe('Your name is Joe').refusalSource,'self');
}));
test('historical folios preserve reconstructed provenance, not new autobiographical world receipts',()=>{
 const event={id:'EV-0000004',kind:'journal_read',details:{folioIndex:1}};
 const folio={event_id:'E03-001',approximate_date:'1868-09',title:'The Tower with Three Dry Rooms',memory_text:'I remember the damp tower.',provenance:'reconstructed'};
 const record=Diary.makeFolioAccess(event,folio);assert.equal(record.sourceProvenance,'reconstructed');
 assert.equal(record.readingReceiptId,event.id);assert.equal(record.firstPersonText,folio.memory_text);
 assert.throws(()=>Diary.makeFolioAccess({kind:'cook',details:{folioIndex:1}},folio),/physical reading receipt/);
});
test('all 450 canonical historical memories are verified and usable where archive is installed',{skip:!fs.existsSync(path.join(__dirname,'../canon/Pretorius_v12_450_Events_Complete.jsonl'))},()=>within(dir=>{
 const archive=Diary.loadArchive();assert.equal(archive.records.length,450);
 const o=createOrganism({dir});let read=false;
 for(let i=0;i<2500;i++){const result=o.tick();if(!result.world.alive)break;if(result.events.some(e=>e.kind==='journal_read')){read=true;break;}}
 assert.equal(read,true,'autonomous character physically consulted historical folio');
 const v=o.view();assert.equal(v.privateJournal.historicalFoliosAvailable,450);
 assert.equal(v.privateJournal.readFolios.at(-1).sourceProvenance,'reconstructed');
 const restored=createOrganism({dir}).view();assert.deepEqual(restored.privateJournal.readFolios,v.privateJournal.readFolios);
}));
