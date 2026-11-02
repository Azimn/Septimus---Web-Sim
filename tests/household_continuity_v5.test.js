'use strict';
// V5 tests only: no changes to previously reviewed, frozen outcome files.
const test=require('node:test'),assert=require('node:assert/strict');
const World=require('../src/world'),Sim=require('../src/simulation'),Pantry=require('../src/pantry');

function stocked(){const w=World.fresh(31);w.day=124;w.stock.meals=6;w.stock.vegetables=6;return w;}

test('edible garden can order seeds without exhausting unrelated tea seeds',()=>{
 const w=stocked();w.stock.vegetable_seeds=0;w.stock.tea_seeds=3;w.garden.vegetables.stage='empty';
 const goal=Sim.choose(w).find(x=>x.kind==='order_seeds');
 assert.ok(goal,'leftover tea seeds must not disable vegetable seed catalog access');
 assert.ok(goal.score>60);
});

test('research can reorder reagents while spare parts remain',()=>{
 const w=stocked();w.stock.reagents=0;w.stock.spares=4;w.lab.damage=0;
 const goal=Sim.choose(w).find(x=>x.kind==='order_science');
 assert.ok(goal,'unspent repair parts must not halt experiment production indefinitely');
 assert.ok(goal.score>100);
});

test('science supplies still have to be physically ordered, paid, delivered and collected',()=>{
 let w=stocked();w.position={x:13,y:7};w.stock.reagents=0;w.stock.spares=3;
 // Other spending priorities are excluded by the edible and seed reserves.
 w.stock.vegetable_seeds=4;w.stock.tea_leaves=3;w.stock.tea_seeds=2;
 const before=w.wallet;
 let placed=null;
 for(let i=0;i<10&&!placed;i++){const r=Sim.step(w);w=r.state;placed=w.orders.find(o=>o.type==='science');}
 assert.ok(placed,'the ordinary planner should purchase a needed reagent shipment');
 assert.equal(before-w.wallet,placed.paid);
 assert.equal(w.stock.reagents,0,'a paid order must not teleport into the laboratory');
 for(let i=0;i<100&&!(w.orders.find(o=>o.id===placed.id)?.arrived);i++)w=Sim.step(w).state;
 assert.ok(w.orders.find(o=>o.id===placed.id)?.arrived,'the original transit delay remains active');
});

test('posting earned research income is preferred before optional purchases when short on cash',()=>{
 const w=stocked();w.wallet=30;w.researchReports=1;w.stock.reagents=1;
 assert.equal(Sim.choose(w)[0].kind,'post_report');
});

test('coal is burned selectively rather than automatically whenever a hearth timer expires',()=>{
 const w=stocked();w.household.coal.dry=4;w.household.heat.fuelledUntil=0;
 w.needs.fatigue=24;w.health=100;
 const elective=Sim.choose(w).find(x=>x.kind==='stoke_hearth').score;
 assert.ok(elective<50,'optional fuel should rank below productive and survival tasks');
 w.health=50;
 const needed=Sim.choose(w).find(x=>x.kind==='stoke_hearth').score;
 assert.ok(needed>=elective+60,'serious physical cold should substantially elevate heating');
});

test('a cold-health death is not incorrectly labeled starvation',()=>{
 const w=World.fresh(17);w.day=124;w.tick=3;w.position={x:2,y:2};w.health=.1;
 w.needs.hunger=5;w.needs.thirst=5;w.household.coal.dry=0;w.household.coal.wet=0;
 const r=Sim.step(w);
 assert.equal(r.state.alive,false);
 assert.equal(r.state.deathCause,'cold_exposure');
 const death=r.events.find(e=>e.kind==='death');
 assert.equal(death.details.coldDamageObserved,true);
 assert.ok(death.details.terminalHunger<100);
});
