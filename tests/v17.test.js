'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {fresh}=require('../scripts/v12_probe');
const {log}=require('../src/engine');
const {scores}=require('../src/actions');
const Social=require('../src/social');
const Commitments=require('../src/commitments');
const {SURPLUS}=require('../src/economy');

test('v1.7 social: repeated sales have diminishing earned trust, not unlimited reputation',()=>{
 const s=fresh(11),p=s.people.visitor_01;
 p.present=true;p.room=s.location;
 for(let i=0;i<300;i++)Social.shared(s,log,'trade');
 assert.ok(p.trust<100 && p.trust>80,p.trust);
 assert.ok(s.events.filter(x=>x.type==='social').every(x=>x.rawDelta===4&&x.delta>=0));
 const series=s.events.filter(x=>x.type==='social').map(x=>x.delta);
 assert.ok(series[0]>series[40],'repetitive trades never become less informative');
 assert.ok(series[40]>=series.at(-1));
 assert.equal(Social.treatment(p).extendCredit,true);
});

test('v1.7 social: adverse witnessed dealings reduce saturated reputation, and history swap still works',()=>{
 const s=fresh(11),p=s.people.visitor_01;
 p.present=true;p.room=s.location;p.trust=95;
 const before=p.trust;
 Social.shared(s,log,'insult');assert.ok(p.trust<before-10);
 const after=p.trust;Social.shared(s,log,'gift');assert.ok(p.trust>after);
 assert.equal(p.events.at(-1).kind,'gift');
});

test('v1.7 social: a real co-present custom disagreement creates sourced negative and negotiated events',()=>{
 const s=fresh(11),p=s.people.visitor_01;
 p.present=true;p.room=s.location;s.customs.tea_first.learned=true;
 s.customs.tea_first.sourceEventIds=['Lfixture'];
 const e=Social.negotiateCustom(s,log,'tea_first');
 assert.ok(e);
 const friction=s.events.find(x=>x.id===e.frictionEventId);
 const response=s.events.find(x=>x.id===e.socialEventId);
 assert.equal(friction.kind,'friction');
 assert.ok(friction.delta<0);
 assert.equal(friction.sourceEventId,e.conflictEventId);
 assert.ok(response.delta>0);
 assert.ok(p.events.some(x=>x.id===friction.id));
});

test('v1.7 commitments: edible portions are counted without fabricating fresh stock',()=>{
 const s=fresh(11),c={stockTarget:{item:'food',minimum:12,includePreserved:true}};
 s.stores.food=3;s.stores.preserved=8;
 assert.equal(Commitments.heldStock(s,c.stockTarget),11);
 assert.equal(Commitments.targetSatisfied(s,c),false);
 s.stores.preserved++;
 assert.equal(Commitments.targetSatisfied(s,c),true);
 assert.equal(s.stores.food,3);
 const freshOnly={stockTarget:{item:'food',minimum:12}};
 assert.equal(Commitments.targetSatisfied(s,freshOnly),false);
});

test('v1.7 commitments: real completed actions and actual stores are both required',()=>{
 const s=fresh(11);
 const c=Commitments.add(s,{id:'TEST-STOCK',title:'Stock pantry',deadline:s.clock.centibeats+100000,
   action:'tend',requiredProgress:2,stockTarget:{item:'food',minimum:12,includePreserved:true}},log);
 s.stores.food=2;s.stores.preserved=7;
 const act={kind:'tend',commitmentId:c.id};
 Commitments.completed(s,act,log);Commitments.completed(s,act,log);
 assert.equal(c.status,'open');
 assert.equal(c.progressCount,2);
 s.stores.preserved=10;
 Commitments.completed(s,act,log);
 assert.equal(c.status,'kept');
 assert.equal(c.progressCount,3);
 assert.ok(s.events.some(x=>x.type==='commitment_kept'&&x.commitmentId===c.id));
});

test('v1.7 commitments: source-linked pressure begins at opening and rises near deadline',()=>{
 const s=fresh(11);
 const c=Commitments.add(s,{id:'TEST-WORK',title:'Two inspections',deadline:s.clock.centibeats+200000,
   action:'inspect',requiredProgress:2},log);
 const early=Commitments.obligationPressure(s,c);
 s.clock.centibeats+=150000;
 const late=Commitments.obligationPressure(s,c);
 assert.ok(early>0);
 assert.ok(late>early);
 const ranks=scores(s),inspect=ranks.find(x=>x.kind==='inspect');
 assert.ok(inspect.commitmentFactors.some(x=>x.id===c.id&&x.bonus===late));
});

test('v1.7 garden: a ripe crop is preserved physically when storage cannot hold the full yield',()=>{
 const s=fresh(11),Economy=require('../src/economy'),Actions=require('../src/actions');
 s.stores.food=20;
 s.garden.ripeAt=s.clock.centibeats-1;s.garden.plantedAt=s.clock.centibeats-140000;
 const before=s.stores.food;
 assert.equal(Economy.availableGarden(s),false);
 assert.equal(Actions.available(s,'tend'),false);
 Economy.harvestOrPlant(s,log);
 assert.equal(s.stores.food,before);
 assert.ok(s.events.some(x=>x.type==='harvest_deferred'&&x.food===before));
 assert.ok(s.garden.ripeAt!==null);
 s.stores.food=16;
 assert.equal(Economy.availableGarden(s),true);
 Economy.harvestOrPlant(s,log);
 assert.equal(s.stores.food,24);
 const harvest=s.events.find(x=>x.type==='harvest');
 assert.equal(harvest.amount,8);assert.equal(harvest.wasted,0);
});
