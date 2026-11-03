'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const World=require('../src/world'),Sim=require('../src/simulation');
const {createOrganism}=require('../src/organism');
const tmp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'septimus-play-'));

test('actual world objects expose usable actions without waiting for a mood threshold',()=>{
 const s=World.fresh(31),actions=Sim.playerChoices(s);
 assert.ok(actions.find(x=>x.kind==='read'&&x.target==='bookshelf'),'reading is a player choice even when boredom is modest');
 assert.ok(actions.find(x=>x.kind==='drink'&&x.target==='sink'));
 assert.ok(actions.find(x=>x.kind==='reflect'&&x.target==='table'));
 assert.ok(actions.find(x=>x.kind==='cook'&&x.target==='stove'));
 assert.ok(actions.find(x=>x.kind==='order_staples'&&x.target==='catalog'));
 for(const choice of actions)assert.ok(World.BY_ID[choice.target],choice.kind);
 assert.deepEqual(s,World.fresh(31),'merely opening the game menu must not change the world');
});

test('player may override an unfinished intention but still must physically travel and act',()=>{
 const s=World.fresh(17);
 s.goal={id:'G-OLD',kind:'inspect_floor',target:'floorboards',detail:{},reason:'Old plan',phase:'active',score:40,selectedTick:0,memoryIds:[]};
 const first=Sim.step(s,{}, {kind:'read',target:'bookshelf'});
 assert.ok(first.events.some(x=>x.kind==='goal_cancelled'&&x.details.controller==='player'));
 assert.equal(first.state.lastDecision.controller,'player');
 assert.equal(first.state.goal.kind,'read');
 assert.equal(first.state.goal.controller,'player');
 assert.equal(first.state.booksRead.length,0,'choosing the action must not teleport to the shelf');
 assert.ok(first.events.some(x=>x.kind==='walk'));
 let current=first.state,sawReading=false;
 for(let i=0;i<25;i++){
  const out=Sim.step(current);current=out.state;
  if(out.events.some(x=>x.kind==='read_section')){sawReading=true;break}
 }
 assert.ok(sawReading,'the regular autonomous ticking process should finish the player-selected reading');
 assert.ok(current.bookProgress[World.BOOKS[0]]>=1);
 assert.equal(s.goal.kind,'inspect_floor','the input state remains unchanged');
});

test('objects and action names must match server-side affordances, not arbitrary client commands',()=>{
 const s=World.fresh(19),before=structuredClone(s);
 assert.throws(()=>Sim.step(s,{}, {kind:'order_science',target:'bed'}),/Unavailable action/);
 assert.throws(()=>Sim.step(s,{}, {kind:'teleport',target:'bookshelf'}),/Unavailable action/);
 assert.throws(()=>Sim.step(s,{}, {kind:'read',target:'missing'}),/Unavailable action/);
 assert.throws(()=>Sim.step(s,{}, {kind:'read',target:'bookshelf',wallet:999}),/Malformed object interaction/);
 assert.deepEqual(s,before,'invalid player directives never mutate the supplied world');
 const noMaterials=World.fresh();noMaterials.stock.reagents=0;noMaterials.stock.spares=0;
 assert.equal(Sim.playerChoices(noMaterials).some(x=>x.kind==='work'),false,'empty instruments cannot be conjured into a playable action');
});

test('manual catalog directions retain transit, payment and physical collection requirements',()=>{
 let s=World.fresh(21);s.position={x:13,y:7};s.stock.meals=4;
 const wallet=s.wallet;
 const r=Sim.step(s,{}, {kind:'order_staples',target:'catalog'});
 assert.equal(r.state.wallet,wallet-World.CATALOG.staples.price);
 assert.equal(r.state.stock.vegetables,s.stock.vegetables);
 assert.ok(r.state.orders.some(o=>o.type==='staples'&&!o.arrived&&!o.collected));
 assert.ok(r.events.some(x=>x.kind==='catalog_order'));
});

test('player directions survive cold restart as original world receipts with honest attribution',()=>{
 const dir=tmp();
 try{
  const u=createOrganism({dir,seed:48});
  const initial=u.view().world.tick;
  const directed=u.direct('read','bookshelf');
  assert.equal(directed.world.tick,initial+1);
  assert.equal(u.view().world.goal.controller,'player');
  assert.equal(u.view().recentEvents.findLast(e=>e.kind==='goal_selected').details.controller,'player');
  const saved=createOrganism({dir,seed:48});
  assert.deepEqual(saved.view().world,u.view().world);
  assert.equal(saved.view().lastHash,u.view().lastHash);
  let read=false;
  for(let i=0;i<30;i++){
   const out=saved.tick();
   if(out.events.some(e=>e.kind==='read_section')){read=true;break}
  }
  assert.ok(read,'a player-directed action must finish with the existing autonomous step process');
  const reopened=createOrganism({dir,seed:48});
  assert.deepEqual(reopened.view().world,saved.view().world);
  assert.equal(reopened.view().lastHash,saved.view().lastHash);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('direct commands require a paused live game; ordinary autonomous updates remain unchanged',()=>{
 const dir=tmp();
 try{
  const u=createOrganism({dir,seed:24});u.setRunning(true);
  const seq=u.view().recordCount;
  assert.throws(()=>u.direct('read','bookshelf'),/Pause the living world/);
  assert.equal(u.view().recordCount,seq);
  u.setRunning(false);
  assert.deepEqual(Sim.step(World.fresh(5)),Sim.step(World.fresh(5),{},null));
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
