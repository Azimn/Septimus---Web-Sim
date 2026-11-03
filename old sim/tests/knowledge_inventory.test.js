'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const W=require('../src/world'),S=require('../src/simulation'),D=require('../src/diary'),K=require('../src/knowledge');
const {createOrganism,hash}=require('../src/organism');
const archive=D.loadArchive(),byId=new Map(archive.records.map((r,index)=>[r.event_id,{index,record:r}]));
const meta=archive.records.map((f,index)=>({id:f.event_id,index,participants:f.participants||[],locations:f.locations||[],recall_cues:f.recall_cues||[]}));
const evidence={__historyCount:450,__folioCatalog:meta};
test('knowledge inventory begins empty; no unread original or substituted fact changes a goal',()=>{
 const w=W.fresh(11);assert.equal(K.held(w,'floor_east_rotten'),null);
 const baseline=S.choose(structuredClone(w),evidence).map(x=>[x.kind,x.score]);
 const after=S.choose(structuredClone(w),{...evidence,__unreadText:'Floor is rotten',__falseCounterFolio:'Floor is sound'}).map(x=>[x.kind,x.score]);
 assert.deepEqual(after,baseline);
});
test('only verified declared folio grants facts and provenance, no fabricated facts',()=>{
 const f=byId.get('E22-001'),w=W.fresh(9),e={id:'EV-22',kind:'journal_read',tick:42,details:{folioIndex:f.index}};
 const access=D.makeFolioAccess(e,f.record);
 const grants=K.canonicalGrants(w,access.sourceEventId,e.id,access.sourceHash,e.tick);
 assert.deepEqual(grants.map(x=>x.id),['floor_east_rotten','floor_inspection_warranted']);
 assert.ok(grants.every(x=>x.provenance.sourceReceiptId===e.id&&x.provenance.readTick===42));
 K.validatePersisted(grants[0],access,e,f.record,D.sha(f.record));
 assert.throws(()=>K.grant(w,{id:'unknown_magic',sourceKind:'folio',sourceId:access.sourceEventId,sourceReceiptId:e.id,sourceHash:access.sourceHash,readTick:e.tick,grantTick:e.tick}),/Undeclared/);
 assert.throws(()=>K.validatePersisted(grants[0],access,{...e,tick:44},f.record,D.sha(f.record)),/Invalid/);
});
test('after grant, relevant decisions cite exactly held provenance and grant precedes use',()=>{
 const w=W.fresh(8);w.tick=80;w.needs.boredom=4;
 const f=byId.get('E22-001');K.canonicalGrants(w,'E22-001','EV-007',D.sha(f.record),42);
 const choice=S.choose(w,evidence).find(x=>x.kind==='inspect_floor');
 assert.ok(choice.usedFacts.some(x=>x.id==='floor_inspection_warranted'&&x.grantTick===42&&x.provenance.sourceKind==='folio'));
 const step=S.step(w,evidence);
 for(const selected of step.events.filter(x=>x.kind==='goal_selected'))assert.ok(selected.details.usedFacts.every(f=>f.grantTick<selected.tick));
});
test('false counter folio remains harness-only and steers a goal in opposite direction',()=>{
 const f=byId.get('E22-001'),positive=W.fresh(8),negative=W.fresh(8);
 positive.tick=negative.tick=80;positive.needs.boredom=negative.needs.boredom=0;
 K.canonicalGrants(positive,'E22-001','EV-007',D.sha(f.record),42);
 K.counterGrants(negative,'E22-001','EV-007',D.sha(f.record),42);
 const a=S.choose(positive,evidence).find(x=>x.kind==='inspect_floor'),c=S.choose(negative,evidence).find(x=>x.kind==='inspect_floor');
 assert.ok(a.score>c.score);
 assert.equal(K.held(negative,'floor_sound').provenance.sourceKind,'experiment_control_substitution');
});
test('experience grants only when perceived, and direct scars have the same fact identifier',()=>{
 const w=W.fresh(9),a={id:'EV-12',tick:20,kind:'floor_hazard',perceived:true,details:{healthLost:3}},b={...a,id:'EV-13',perceived:false};
 assert.deepEqual(K.experiencedGrants(w,b),[]);
 const grants=K.experiencedGrants(w,a);assert.ok(grants.some(x=>x.id==='floor_east_rotten'));
 assert.equal(K.held(w,'floor_east_rotten').provenance.sourceKind,'experienced');
});
test('learned coal warning enables advance reserve decision while no warning does not',()=>{
 const w=W.fresh(4);w.household.coal.dry=8;w.needs.boredom=0;
 const no=S.choose(structuredClone(w),evidence);assert.equal(no.some(x=>x.kind==='order_coal'),false);
 const rec=byId.get('E03-002');K.canonicalGrants(w,'E03-002','EV-17',D.sha(rec.record),15);
 const yes=S.choose(w,evidence).find(x=>x.kind==='order_coal');
 assert.ok(yes&&yes.usedFacts.some(x=>x.id==='coal_unreliable'));
});
test('learned nettle warning enables earlier tending than ordinary overgrowth',()=>{
 const w=W.fresh(3);w.household.garden.nettles=8;w.needs.boredom=0;
 assert.equal(S.choose(structuredClone(w),evidence).some(x=>x.kind==='tend_path'),false);
 const f=byId.get('E18-010');K.canonicalGrants(w,'E18-010','EV-14',D.sha(f.record),12);
 assert.ok(S.choose(w,evidence).some(x=>x.kind==='tend_path'&&x.usedFacts.some(f=>f.id==='paths_nettle_untended')));
});
test('critical needs beat science, leisure, and report posting; gate remains comparable in controls',()=>{
 const s=W.fresh(4);s.needs.hunger=96;s.needs.thirst=90;s.needs.boredom=99;s.stock.reagents=5;
 const opts=S.choose(s,evidence);assert.ok(['drink','eat','cook','order_groceries','stoke_hearth'].includes(opts[0].kind));
 assert.ok(opts[0].survivalFloor);
 const g=structuredClone(s);g.policyOptions={survivalFloor:false};
 assert.ok(S.choose(g,evidence).every(x=>!x.survivalFloor));
});
test('known broken floor avoids unsafe square when carrying and a garden route exists',()=>{
 const s=W.fresh(4);s.position={x:12,y:7};s.carried={vegetables:1};s.household.fabric.floor=11;
 K.grant(s,{id:'floor_east_rotten',sourceKind:'experienced',sourceId:'floor_hazard',sourceReceiptId:'EV-19',grantTick:10});
 const r=S.step(s,evidence);assert.ok(r.events.some(e=>e.kind==='walk'));
 assert.equal(r.state.position.x!==3||r.state.position.y!==4,true);
});
test('physical source grants survive cold restart and unauthorized added grant is rejected',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'septimus-knowledge-'));
 try{
  createOrganism({dir});
  const filename=path.join(dir,'events.jsonl'),lines=fs.readFileSync(filename,'utf8').trim().split('\n');
  const first=JSON.parse(lines[0]);first.body.world.journal={lastReadTick:-999,lastWriteTick:-999,folioCursor:byId.get('E22-001').index,entries:0};
  first.hash=hash({seq:first.seq,type:first.type,prev:first.prev,body:first.body});
  fs.writeFileSync(filename,JSON.stringify(first)+'\n');
  const o=createOrganism({dir});let found=false;
  for(let i=0;i<800;i++){
   const result=o.tick();if(result.events.some(x=>x.kind==='journal_read')){found=true;break}
  }
  assert.ok(found,'natural read receipt reached');
  const snapshot=o.exportData(),grants=snapshot.knowledge.facts.filter(x=>x.provenance.sourceKind==='folio');
  assert.ok(grants.some(x=>x.id==='floor_east_rotten'));
  assert.deepEqual(createOrganism({dir}).exportData().knowledge,snapshot.knowledge);
  const rows=fs.readFileSync(filename,'utf8').trim().split('\n');
  const index=rows.findIndex(x=>JSON.parse(x).type==='BELIEF_GRANT');assert.ok(index>0);
  const forged=JSON.parse(rows[index]);forged.body.provenance.readTick+=1;
  forged.hash=hash({seq:forged.seq,type:forged.type,prev:forged.prev,body:forged.body});
  rows[index]=JSON.stringify(forged);fs.writeFileSync(filename,rows.join('\n')+'\n');
  assert.throws(()=>createOrganism({dir}),/Journal hash|Invalid persisted folio knowledge grant/);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
