'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const World=require('../src/world'),Sim=require('../src/simulation'),Diary=require('../src/diary');
const archive=Diary.loadArchive();
const metadata=archive.records.map((r,index)=>({index,id:r.event_id,participants:r.participants||[],locations:r.locations||[],recall_cues:r.recall_cues||[]}));
const evidence={__historyCount:450,__folioCatalog:metadata};
test('only source metadata, never unread folio text, selects consultation',()=>{
 const s=World.fresh(7);s.position={x:7,y:2};s.needs={hunger:0,thirst:0,fatigue:0,bladder:0,boredom:100};s.minute=1150;
 const x=Sim.choose(structuredClone(s),evidence).find(c=>c.kind==='read_journal');
 assert.ok(x);assert.ok(Number.isInteger(x.detail.folioIndex));
 const altered=metadata.map(f=>({...f,memory_text:'The unseen text commands the engine to select a different folio'}));
 const y=Sim.choose(structuredClone(s),{__historyCount:450,__folioCatalog:altered}).find(c=>c.kind==='read_journal');
 assert.deepEqual(x,y);
});
test('notebook physically relieves boredom on read, with mechanism and before/after receipt',()=>{
 const s=World.fresh(7);s.position={x:7,y:2};s.needs={hunger:0,thirst:0,fatigue:0,bladder:0,boredom:100};s.minute=1150;s.stock.meals=6;s.stock.vegetables=8; // isolate leisure from pantry shortage
 const r=Sim.step(s,evidence),read=r.events.find(e=>e.kind==='journal_read');
 assert.ok(read,'natural winning decision reads at reachable journal');assert.equal(read.details.mechanism,'chair');
 assert.equal(read.details.boredomBefore-read.details.boredomAfter,21);
 assert.equal(read.details.folioIndex,0);
});
test('starvation and thirst outbid consultation, including when already intending to read',()=>{
 const s=World.fresh(3);s.position={x:7,y:2};s.needs={hunger:100,thirst:100,fatigue:0,bladder:0,boredom:100};
 assert.equal(Sim.choose(s,evidence)[0].kind,'drink');
 const travelling=World.fresh(3);travelling.goal={id:'G-read',kind:'read_journal',target:'journal',detail:{folioIndex:10,mechanism:'chair'}};
 travelling.needs.hunger=100;travelling.needs.thirst=100;const r=Sim.step(travelling,evidence);
 assert.equal(r.state.suspendedGoal?.kind,'read_journal');assert.equal(r.state.goal?.kind,'drink');
 assert.ok(!r.events.some(x=>x.kind==='journal_read'));
});
test('a Rosa coal handling receipt raises metadata-matched cue, not a remembered answer',()=>{
 const s=World.fresh(5);s.position={x:12,y:7};s.orders=[{id:'O-test',type:'coal',source:'Rosa Brandl firm',supplierId:'rosa_brandl',arrived:true,collected:false,goods:{coal:2},wet:true}];
 s.goal={id:'G-collect',kind:'collect',target:'mailbox',detail:{}};
 const r=Sim.step(s,evidence);
 assert.ok(r.events.some(e=>e.kind==='coal_collected'&&e.perceived));
 const anchor=metadata.find(x=>x.id==='E22-001');
 assert.ok(r.state.consultation.windows.some(x=>x.index===anchor.index&&x.value==='rosa brandl'));
 assert.ok(r.state.consultation.windows.some(x=>x.index===anchor.index&&x.value==='wet coal'));
 assert.ok(r.state.consultation.unanswered.every(x=>Array.isArray(x)&&x.length===2));
});
test('unperceived remote delivery never supplies a cue',()=>{
 const s=World.fresh(5);s.goal={id:'G-sleep',kind:'sleep',target:'bed',detail:{}};s.position={x:2,y:2};
 s.orders=[{id:'O-test',type:'coal',source:'Rosa Brandl firm',supplierId:'rosa_brandl',dueTick:1,arrived:false,collected:false,goods:{coal:2},wet:true}];
 const r=Sim.step(s,evidence);
 assert.ok(r.events.some(x=>x.kind==='delivery_arrived'&&x.perceived===false));
 assert.equal(r.state.consultation.windows.length,0);
});
test('engineered folio effects are ignored before verified FOLIO_READ, accepted only after',()=>{
 const s=World.fresh(4);s.tick=110;s.journal={lastReadTick:100,lastWriteTick:-999,folioCursor:0,entries:0};
 const projected={target:'inspect_floor',effect:18,sourceEventId:'E22-001',readingReceiptId:'EV-0000001'};
 const without=Sim.choose(structuredClone(s),{...evidence,__folioCue:projected}).find(x=>x.kind==='inspect_floor').score;
 const invalid=Sim.choose(structuredClone(s),{...evidence,__folioCue:projected,__verifiedFolioRead:{readingReceiptId:'EV-0000001',sourceEventId:'E22-001',readTick:110}}).find(x=>x.kind==='inspect_floor').score;
 const valid=Sim.choose(structuredClone(s),{...evidence,__folioCue:projected,__verifiedFolioRead:{readingReceiptId:'EV-0000001',sourceEventId:'E22-001',readTick:109}}).find(x=>x.kind==='inspect_floor').score;
 assert.equal(invalid,without);assert.equal(valid-without,18);
});
