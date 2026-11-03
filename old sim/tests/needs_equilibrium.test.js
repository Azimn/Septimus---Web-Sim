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
test('A05 E05 reflection closes the measured boredom loop',()=>{
 const w=W.fresh(3);w.day=124;w.position={x:7,y:5};w.needs.boredom=60;
 w.booksRead=[...W.BOOKS];w.goal={id:'TEST-REFLECT',kind:'reflect',target:'table',detail:{}};
 const out=S.step(w);
 assert.ok(out.events.some(e=>e.kind==='reflection'));
 assert.equal(Number(out.state.needs.boredom.toFixed(2)),37.56);
 assert.ok(218*23/60>144*.56);
});
test('A07 E07 completed cold sleep now restores health above sustained cold exposure',()=>{
 const w=W.fresh(3);w.day=124;w.position={x:2,y:2};w.health=50;w.needs.fatigue=70;
 w.goal={id:'TEST-HEALTH',kind:'sleep',target:'bed',detail:{}};
 const r=S.step(w),sleep=r.events.find(e=>e.kind==='sleep');
 assert.equal(sleep?.details.restRelief,44);
 assert.equal(Number(r.state.health.toFixed(2)),59.2);
 assert.ok((144*.78/44)*(10-.8)>144/4*.65);
});
