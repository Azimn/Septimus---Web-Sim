'use strict';
// V1 slice 1: no network, Python, borrowed world state or frozen V5 rewrites.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {fresh}=require('../src/world');
const Household=require('../src/household'),{step,choose}=require('../src/simulation');
const {createOrganism}=require('../src/organism');
function forced(kind,target,position){
 const w=fresh(97);w.position=position;w.goal={id:'G-water-test',kind,target,detail:{},phase:'active'};w.household.lastFabricDay=w.day;
 return w;
}
test('cistern draws are finite, attributable, and never silently refill',()=>{
 let w=forced('drink','sink',{x:2,y:5});const before=w.household.water.stored;
 let r=step(w);assert.equal(r.state.household.water.stored,before-1);
 const ev=r.events.find(x=>x.kind==='drink_sink');assert.ok(ev);
 assert.deepEqual(ev.details.water,{source:'tower_cistern',purpose:'drink',units:1,storedBefore:before,storedAfter:before-1});
 assert.equal(r.state.household.water.consumed,1);
 const dry=step({...r.state,household:{...r.state.household,lastFabricDay:r.state.day}}).state;
 assert.ok(dry.household.water.stored<=r.state.household.water.stored,'dry tick does not replenish water');
});
test('cooking, washing, gardening and brewing consume the same finite stock',()=>{
 const cases=[
  ['cook','stove',{x:4,y:5},w=>{},2,'cook'],
  ['toilet','toilet',{x:10,y:5},w=>{},1,'toilet'],
  ['water_vegetables','vegetable_plot',{x:3,y:8},w=>{w.garden.vegetables={stage:'growing',plantedTick:1,watered:false}},2,'water_garden'],
  ['brew_tea','stove',{x:4,y:5},w=>{},1,'brew_tea'],
  ['work','bench',{x:11,y:2},w=>{w.lab.lampLit=true},1,'clean_bench']
 ];
 for(const [kind,target,pos,setup,units,receiptKind] of cases){
  const w=forced(kind,target,pos);setup(w);const before=w.household.water.stored;
  const r=step(w);assert.equal(r.state.household.water.stored,before-units,kind);
  const ev=r.events.find(x=>x.kind===receiptKind);assert.ok(ev,kind);
  assert.equal(ev.details.water.units,units,kind);
 }
});
test('rain refills exactly once per rainy day and writes verifiable source receipts',()=>{
 let w=fresh(17);let rainyDay=0;
 for(let day=1;day<70;day++)if(Household.forecast(w.seed,day).rain){rainyDay=day;break}
 assert.ok(rainyDay);w.day=rainyDay;w.household.lastFabricDay=0;w.household.water.stored=9;
 const r=step(w),ev=r.events.find(e=>e.kind==='rain_captured');
 assert.ok(ev);assert.equal(ev.perceived,false);
 assert.equal(ev.details.source,'receipted_rain');assert.equal(ev.details.storedBefore,9);
 assert.equal(ev.details.added,36);assert.equal(r.state.household.water.stored,45);
 const again=step(r.state);assert.equal(again.events.filter(e=>e.kind==='rain_captured').length,0);
 assert.equal(again.state.household.water.captured,36);
});
test('an exhausted cistern denies drinking, cooking and washing without negative stock',()=>{
 const w=forced('drink','sink',{x:2,y:5});w.needs.thirst=99;w.household.water.stored=0;
 const r=step(w);assert.equal(r.state.household.water.stored,0);
 assert.ok(!r.events.some(e=>e.kind==='drink_sink'));
 assert.ok(!choose(r.state).some(x=>x.kind==='drink'||x.kind==='cook'||x.kind==='brew_tea'));
});
test('no water and no drinking kills by receipted dehydration before the next rainy day',()=>{
 let w=fresh(11);w.household.water.stored=0;w.household.lastFabricDay=w.day;
 w.stock.tea_cups=0;const events=[];
 for(let i=0;i<100&&w.alive;i++){const r=step(w);w=r.state;events.push(...r.events)}
 assert.equal(w.alive,false);assert.equal(w.deathCause,'dehydration');
 assert.ok(events.some(e=>e.kind==='death'&&e.details.terminalThirst>=100));
 assert.equal(w.household.water.stored,0);
});
test('pre-cistern saves migrate in one step; exact water and chain survive restart',()=>{
 let legacy=fresh(4);delete legacy.household.water;legacy.household.lastFabricDay=legacy.day;
 const once=step(legacy).state;assert.equal(once.household.water.capacity,120);
 const twice=step(once).state;assert.equal(twice.household.water.capacity,120);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'septimus-water-'));
 try{
  const a=createOrganism({dir,seed:13});for(let i=0;i<190;i++)a.tick();
  const before=a.view();const b=createOrganism({dir,seed:13});
  assert.deepEqual(b.view().world.household.water,before.world.household.water);
  assert.equal(b.view().lastHash,before.lastHash);
  b.tick();assert.equal(b.view().world.tick,before.world.tick+1);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
