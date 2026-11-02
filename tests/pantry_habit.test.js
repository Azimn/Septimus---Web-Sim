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
