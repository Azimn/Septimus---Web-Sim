'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const W=require('../src/world'),S=require('../src/simulation');
test('A03 E03 cold rest now closes the measured fatigue loop',()=>{
 const w=W.fresh(2);w.day=124;w.position={x:2,y:2};w.needs.fatigue=70;
 w.goal={id:'TEST-COLD-REST',kind:'sleep',target:'bed',detail:{}};
 const r=S.step(w),receipt=r.events.find(e=>e.kind==='sleep');
 assert.equal(receipt?.details.restRelief,44);
 assert.ok(159*44/60>144*.78);
 assert.equal(Number(r.state.needs.fatigue.toFixed(2)),26.78);
});
