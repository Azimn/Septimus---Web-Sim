'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const W=require('../src/world'),S=require('../src/simulation');
test('A16: critical hunger does not replace supply collection with an impossible cook action',()=>{
 const w=W.fresh(7);w.day=124;w.needs.hunger=96;w.stock.meals=0;w.stock.vegetables=0;w.stock.milk=0;w.stock.grain=6;w.wallet=83;
 w.goal={id:'SUPPLY',kind:'order_groceries',target:'catalog',detail:{}};
 const r=S.step(w);
 assert.equal(r.state.goal?.kind,'order_groceries');
 assert.ok(!r.events.some(e=>e.kind==='goal_suspended'));
});
test('standing weekly pantry habit is not a folio fact, and uses usable meal equivalents',()=>{
 const Pantry=require('../src/pantry'),H=require('../src/household');
 const w=W.fresh(12);w.day=124;
 w.stock={...w.stock,meals:0,vegetables:0,milk:0,grain:6};w.wallet=83;
 const p=Pantry.plan(w);
 assert.equal(p.onHand,0);assert.equal(p.reserveTriggerPortions,4);
 assert.equal(p.weeklyPortions,13);assert.equal(p.quote,26);
 assert.equal(p.eligible,true);assert.equal(p.learnedFromFolio,false);
 assert.equal(S.choose(w)[0].kind,'order_staples');
 w.day=154;assert.equal(Pantry.plan(w).quote,33);
 assert.equal(H.price(W.CATALOG.groceries.price,w.day,'groceries'),15);
});
test('weekly delivery remains paid, physically delayed, and unowned until collected',()=>{
 const w=W.fresh(15);w.day=124;w.position={x:13,y:7};
 w.stock={...w.stock,meals:0,vegetables:0,milk:0,grain:0};w.wallet=72;
 const r=S.step(w),o=r.state.orders.find(o=>o.type==='staples');
 assert.ok(o);assert.equal(r.state.wallet,46);
 assert.equal(o.dueTick-r.state.tick,9);
 assert.deepEqual(o.goods,{vegetables:9,grain:4,milk:4});
 assert.equal(r.state.stock.vegetables,0);
});
