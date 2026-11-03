'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {fresh,archive}=require('../scripts/v12_probe');
const {advance,direct,log}=require('../src/engine');
const Economy=require('../src/economy');
const {run}=require('../scripts/v15_discriminations');
const x=run(),article=id=>x.probes.find(p=>p.article===id);
function runSteps(s,n){while(n>0){advance(s,archive,Math.min(n,1000));n-=Math.min(n,1000);}}
test('Part A: kitchen preservation conserves physical batches, debits fuel and emits a sourced receipt',()=>{
 const s=fresh(11);s.location='kitchen';s.stores.food=12;s.stores.fuel=5;
 const original={...s.stores};direct(s,'preserve');runSteps(s,40);
 const e=s.events.find(x=>x.type==='preservation');
 assert.ok(e,'preservation did not complete');assert.equal(e.inputs.food,Economy.SURPLUS.preserveInput);
 assert.equal(e.output.preserved,Economy.SURPLUS.preserveOutput);
 assert.equal(e.before.food-e.after.food,e.inputs.food);
 assert.equal(e.before.fuel-e.after.fuel,e.inputs.fuel);
 assert.equal(e.after.preserved-e.before.preserved,e.output.preserved);
 assert.equal(s.stores.preserved,Economy.SURPLUS.preserveOutput);
});
test('Part A: trade requires original caller co-presence and couples one resource receipt to one trust event',()=>{
 const s=fresh(11);s.location='kitchen';s.people.visitor_01.present=true;
 s.people.visitor_01.room='kitchen';s.people.visitor_01.manuallyIntroduced=false;
 s.stores.preserved=10;s.stores.fuel=3;
 const offer=Economy.tradeOffer(s);assert.equal(offer.payment,'preserved');
 direct(s,'trade');runSteps(s,20);
 const e=s.events.find(x=>x.type==='trade_receipt'),social=s.events.find(x=>x.type==='social'&&x.kind==='trade');
 const link=s.events.find(x=>x.type==='trade_link');
 assert.ok(e&&social&&link);
 assert.equal(e.before[e.payment]-e.unitsGiven,e.after[e.payment]);
 assert.equal(e.before[e.received]+e.unitsReceived,e.after[e.received]);
 assert.equal(link.tradeEventId,e.id);assert.equal(link.socialEventId,social.id);
});
test('Part A: after fresh food is gone, eating preserved stock debits the correct food batch',()=>{
 const s=fresh(11);s.stores.food=0;s.freshBatches=[];s.stores.preserved=2;
 s.preservedBatches=[{quantity:2,createdAt:s.clock.centibeats}];
 direct(s,'eat');runSteps(s,30);
 const meal=s.events.find(e=>e.type==='meal_stock');
 assert.equal(meal.sourceStock,'preserved');assert.equal(s.stores.preserved,1);
 assert.equal(s.stores.food,0);
});
test('Part A: fresh stock expires before preserved stock with separate spoilage receipts',()=>{
 const s=fresh(11),now=s.clock.centibeats;
 s.stores.food=3;s.freshBatches=[{quantity:3,createdAt:now-(Economy.SURPLUS.freshShelfLifeDays+1)*100000}];
 s.stores.preserved=3;s.preservedBatches=[{quantity:3,createdAt:now-20*100000}];
 s.surplusAgeDay=-1;Economy.spoil(s,log);
 assert.equal(s.stores.food,0);assert.equal(s.stores.preserved,3);
 assert.ok(s.events.some(e=>e.type==='spoilage'&&e.stock==='food'&&e.amount===3));
 assert.ok(!s.events.some(e=>e.type==='spoilage'&&e.stock==='preserved'));
});
test('Article 11: deprivation can disable or physically abort long work without inventing success',()=>{
 const p=article(11);assert.equal(p.pass,true,JSON.stringify(p.evidence));assert.ok(p.evidence.refusalReceipt);
});
test('Article 13: disabling conflict deliberation worsens real matched deadline outcomes',()=>{
 const p=article(13);assert.equal(p.pass,true,JSON.stringify(p.evidence));
 assert.ok(p.evidence.betterCount>=3);
});
test('Article 19: after seeded interruptions, only genuine autonomous scientific initiative is counted',()=>{
 const p=article(19);assert.equal(p.pass,true,JSON.stringify(p.evidence));
 assert.ok(p.evidence.cases.every(x=>x.interruptions>=3&&x.postInterruptionInitiatives>0));
});
test('Article 20: an object truly moved unseen is found by perception and inspected in its new location',()=>{
 const p=article(20);assert.equal(p.pass,true,JSON.stringify(p.evidence));
 assert.ok(p.evidence.cases.filter(x=>x.succeeded).length>=3);
});
test('Article 25: asynchronous messages queue across sleep, work and free time with exact delays',()=>{
 const p=article(25);assert.equal(p.pass,true,JSON.stringify(p.evidence));
 assert.ok(p.evidence.cases.every(x=>x.ok&&x.duringSleep>0));
});
test('Article 29: month two creates new source-linked lived quirks that influence chosen decisions',()=>{
 const p=article(29);assert.equal(p.pass,true,JSON.stringify(p.evidence));
 assert.ok(p.evidence.gained.some(x=>x.source==='completed'&&x.laterChosenDecisions>0));
});
test('Article 30: three genuine interruptions and a later failure require measurable recovery',()=>{
 const p=article(30);assert.equal(p.pass,true,JSON.stringify(p.evidence));
 assert.ok(p.evidence.cases.every(x=>x.delay>0&&x.failures.length>0));
});
test('Article 34: two additional independent customs are learned from the existing visitor',()=>{
 const p=article(34);assert.equal(p.pass,true,JSON.stringify(p.evidence));
 assert.ok(p.evidence.cases.filter(x=>x.pass).length>=3);
});
test('Article 01: 100-decision audit exceeds the half-explained floor without false causal disclosure',()=>{
 const p=article(1);assert.equal(p.pass,true,JSON.stringify({rate:p.evidence.supportRate,errors:p.evidence.errors}));
 assert.equal(p.evidence.n,100);assert.equal(p.evidence.unsupported,0);
 assert.ok(p.evidence.supportRate>=.65);
});
test('Article 31: ten matched setback pairs report the true post-restoration divergence rate',()=>{
 const p=article(31);assert.equal(p.pass,true,JSON.stringify(p.evidence));
 assert.equal(p.evidence.n,10);assert.equal(p.evidence.effectRate,p.evidence.shifted/10);
});
test('Blocked Articles 05, 06 and 23 remain outside this no-model one-visitor implementation',()=>{
 const s=fresh(11);
 assert.equal(Object.keys(s.people).filter(x=>x!=='player').length,1);
 assert.ok(!x.probes.some(p=>[5,6,23].includes(p.article)));
});
