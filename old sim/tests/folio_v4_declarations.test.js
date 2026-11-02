'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const World=require('../src/world'),Diary=require('../src/diary'),Sim=require('../src/simulation'),P=require('../src/folio_v4_proposals');
const archive=Diary.loadArchive(),index=new Map(archive.records.map((r,i)=>[r.event_id,i]));
function read(id,tick=20){return {id:'EV-READ-'+id,kind:'journal_read',tick,position:{x:7,y:2},details:{folioIndex:index.get(id)}}}
test('proposals are grounded in the untouched source and require a physical read receipt',()=>{
 for(const [id,spec] of Object.entries(P.SPECS)){const event=read(id);
  assert.equal(archive.records[event.details.folioIndex].title,spec.title);
  const a=World.fresh(1);const grant=P.previewGrant(a,archive,id,event,'A');
  assert.equal(grant.sourceHash,Diary.sha(archive.records[event.details.folioIndex]));
  assert.equal(grant.readReceiptId,event.id);assert.equal(grant.provenance.sourceKind,'folio');
  assert.equal(grant.ratified,false);assert.equal(grant.experimentalOnly,true);
  assert.throws(()=>P.previewGrant(World.fresh(1),archive,id,{...event,position:{x:2,y:2}}),/Physical notebook/);
  assert.throws(()=>P.previewGrant(World.fresh(1),archive,id,{...event,details:{folioIndex:0}}),/mismatch/);
  const c=P.previewGrant(World.fresh(1),archive,id,event,'C');
  assert.equal(c.factId,spec.counterId);
  assert.equal(c.provenance.sourceKind,'experiment_control_substitution');
 }
});
test('no proposal fact affects an earlier, withheld, or ordinary live decision',()=>{
 const w=World.fresh(1);w.day=124;w.wallet=40;w.stock.meals=0;w.stock.vegetables=0;
 const candidates=[{kind:'order_science',score:75},{kind:'order_staples',score:70}];
 assert.equal(P.previewDecision(w,candidates,30).selected,'order_science');
 P.previewGrant(w,archive,'E22-012',read('E22-012',40));
 const before=P.previewDecision(w,candidates,40);assert.equal(before.selected,'order_science');assert.equal(before.checks.length,0);
 const real=Sim.choose(w).map(x=>[x.kind,x.score]);
 const without=structuredClone(w);delete without.proposedKnowledge;
 assert.deepEqual(real,Sim.choose(without).map(x=>[x.kind,x.score]),'nonratified proposals must not enter the live planner');
});
test('E22-012 winter budgeting and C false priority both have traceable opposite candidate consequences',()=>{
 const choices=[{kind:'order_science',score:75},{kind:'order_staples',score:70}];
 const a=World.fresh(2),c=World.fresh(2);
 for(const w of [a,c]){w.day=124;w.wallet=40;w.stock.meals=0;w.stock.vegetables=0;w.household.coal.dry=1}
 P.previewGrant(a,archive,'E22-012',read('E22-012'),'A');
 P.previewGrant(c,archive,'E22-012',read('E22-012'),'C');
 const A=P.previewDecision(a,choices,21),C=P.previewDecision(c,choices,21);
 assert.equal(A.selected,'order_staples');assert.equal(C.selected,'order_science');
 assert.ok(A.checks.some(x=>x.factId==='winter_staples_before_science'&&x.grantTick<21&&x.provenance.readReceiptId===read('E22-012').id));
 assert.ok(C.checks.some(x=>x.factId==='winter_science_first'&&x.provenance.sourceKind==='experiment_control_substitution'));
});
test('E22-003 meal-before-bench and counter negation operate below the Maslow critical band',()=>{
 const choices=[{kind:'work',score:80},{kind:'eat',score:70}];
 const a=World.fresh(3),c=World.fresh(3);
 for(const w of [a,c]){w.needs.hunger=60;w.stock.meals=2}
 P.previewGrant(a,archive,'E22-003',read('E22-003'),'A');P.previewGrant(c,archive,'E22-003',read('E22-003'),'C');
 assert.equal(P.previewDecision(a,choices,21).selected,'eat');
 assert.equal(P.previewDecision(c,choices,21).selected,'work');
});
test('E03-015 only affects candidates physically marked bulky, not existing reagent bundles',()=>{
 const a=World.fresh(4),c=World.fresh(4);
 P.previewGrant(a,archive,'E03-015',read('E03-015'),'A');P.previewGrant(c,archive,'E03-015',read('E03-015'),'C');
 const normal=[{kind:'order_science',score:80,detail:{}},{kind:'order_staples',score:70}];
 assert.equal(P.previewDecision(a,normal,21).checks.length,0);
 const bulky=[{kind:'order_science',score:80,detail:{bulky:true}},{kind:'order_staples',score:70}];
 assert.equal(P.previewDecision(a,bulky,21).selected,'order_staples');
 assert.equal(P.previewDecision(c,bulky,21).selected,'order_science');
});
