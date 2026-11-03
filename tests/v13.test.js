'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {fresh,ticks,archive,identity}=require('../scripts/v12_probe');
const {advance,direct,speak,log,social,commitments,cognition}=require('../src/engine');
const {scores,setUtilityWeight}=require('../src/actions');
const {save,load,resume}=require('../src/store');
const {ECONOMY}=require('../src/economy');
const copy=structuredClone,top=s=>scores(s)[0]?.kind||null;
function stepUntil(s,condition,max=300){for(let i=0;i<max;i++){advance(s,archive,1);if(condition())return true;}return false;}
test('Part A: named economy constants support physical garden, water and wood receipts',()=>{
 const s=fresh(11);assert.equal(ECONOMY.growth,140000);
 s.stores.food=1;assert.equal(top(s),'tend');
 assert.ok(stepUntil(s,()=>s.events.some(e=>e.type==='planted'),70));
 const p=s.events.find(e=>e.type==='planted');assert.equal(s.garden.ripeAt,p.ripeAt);
 assert.ok(p.waterSpent===ECONOMY.plantWater);
 assert.ok(stepUntil(s,()=>s.events.some(e=>e.type==='harvest'),1800));
 const h=s.events.find(e=>e.type==='harvest');
 assert.ok(h.amount>0);assert.equal(h.after-h.before,h.amount);
 assert.ok(s.events.some(e=>e.type==='started'&&e.kind==='tend'&&e.controller==='autonomous'));
});
test('Part A: starvation control dies, halts at one terminal receipt and cannot resurrect',()=>{
 const s=fresh(11);s.productionDisabled=true;
 for(let i=0;i<7000&&!s.dead;i++)advance(s,archive,1);
 assert.equal(s.dead,true);assert.equal(s.health,0);
 const deaths=s.events.filter(e=>e.type==='death');
 assert.equal(deaths.length,1);assert.match(deaths[0].cause,/starvation/);
 const count=s.events.length,tick=s.clock.centibeats;advance(s,archive,100);
 assert.equal(s.events.length,count);assert.equal(s.clock.centibeats,tick);
 assert.throws(()=>direct(s,'work'),/deceased/);
 const file=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'v13-death-')),'state.json');
 save(file,s);const restored=load(file,identity,archive);
 assert.equal(restored.dead,true);assert.deepEqual(restored.events.filter(e=>e.type==='death'),deaths);
});
test('Part B: autonomous scheduled visitor reaches resident and leaves witnessed social consequences',()=>{
 const s=fresh(11);ticks(s,500);
 const witnessed=s.events.filter(e=>e.type==='visitor_conversation');
 assert.ok(witnessed.length>0,'visitor never actually met the resident');
 assert.ok(s.events.some(e=>e.type==='social'&&e.kind==='greeting'));
 assert.ok(s.events.some(e=>e.type==='custom_observed'));
 assert.ok(s.people.visitor_01.trust>0);
});
test('Article 03: explicit resume records real downtime without fictional game ticks',()=>{
 const s=fresh(11);direct(s,'work');ticks(s,10);
 const filename=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'v13-pause-')),'saved.json');
 save(filename,s,{savedAtMs:5000});
 const r=resume(filename,identity,archive,{nowMs:5000+86400000});
 assert.equal(r.clock.centibeats,s.clock.centibeats);
 assert.deepEqual(r.activity,s.activity);
 assert.equal(r.clock.pausedIntervals.at(-1).elapsedMilliseconds,86400000);
 const e=r.events.at(-1);assert.equal(e.type,'paused');
 assert.equal(e.provenance,'operator_metadata');
 assert.equal(e.interval.startTick,e.interval.endTick);
 assert.equal(r.events.filter(x=>x.type==='completed').length,s.events.filter(x=>x.type==='completed').length);
});
test('Article 14: declared single utility-weight intervention flips chosen action with exact arithmetic',()=>{
 const a=fresh(11),b=copy(a),before=scores(a).find(x=>x.kind==='work');
 setUtilityWeight(b,'work',6);
 const after=scores(b).find(x=>x.kind==='work');
 assert.equal(Math.round((after.score-before.score)*100)/100,85);
 assert.notEqual(top(a),top(b));assert.equal(top(b),'work');
 advance(b,archive,1);
 const d=b.events.find(e=>e.type==='decision');
 assert.equal(d.chosen,'work');
 assert.equal(d.candidates.find(x=>x.kind==='work').utilityWeight,6);
});
test('Article 04: real consulted folio becomes a cited utility factor and withholding it can flip action',()=>{
 const basis=fresh(11);basis.location='library';direct(basis,'read','Henry');
 assert.ok(stepUntil(basis,()=>basis.folioReads.length>0,90));basis.activity=null;
 const r=basis.folioReads.at(-1);assert.equal(r.actionCue,'work');
 let witness=null;
 outer:for(const hunger of [10,20,30,40,50,60,70,80])for(const energy of [25,45,65,85])for(const stim of [15,40,65]){
  const a=copy(basis),b=copy(basis);
  for(const s of [a,b]){s.needs.hunger=hunger;s.needs.energy=energy;s.needs.stimulation=stim;}
  b.folioReads=[];cognition.impair(b,'folios',b.clock.centibeats+100000,log);
  if(top(a)===top(b))continue;
  advance(a,archive,1);advance(b,archive,1);
  const d=a.events.find(e=>e.type==='decision'&&e.t===a.clock.centibeats);
  const e=b.events.find(e=>e.type==='decision'&&e.t===b.clock.centibeats);
  if(d&&e&&d.chosen!==e.chosen&&d.candidates.some(x=>x.memoryFactors?.some(f=>f.folioId===r.id))){witness={d,e};break outer;}
 }
 assert.ok(witness,'no causally attributed choice difference found');
 assert.notEqual(witness.d.chosen,witness.e.chosen);
 assert.ok(witness.d.candidates.some(x=>x.memoryFactors?.some(f=>f.folioId===r.id)));
});
test('Article 09: two days after a witnessed trigger, residue affects a matched choice',()=>{
 const basis=fresh(11);speak(basis,'Henry Frankenstein');
 ticks(basis,2000);assert.ok(basis.residue.henry>0);
 let witness=null;
 outer:for(const hunger of [5,15,25,35,45,55,65,75])for(const energy of [20,40,60,80])for(const stim of [20,40,60,80]){
  const a=copy(basis),b=copy(basis);
  for(const s of [a,b]){s.activity=null;s.needs.hunger=hunger;s.needs.energy=energy;s.needs.stimulation=stim;}
  b.residue.henry=0;
  if(top(a)===top(b))continue;
  advance(a,archive,1);advance(b,archive,1);
  const x=a.events.find(e=>e.type==='decision'&&e.t===a.clock.centibeats),y=b.events.find(e=>e.type==='decision'&&e.t===b.clock.centibeats);
  if(x&&y&&x.chosen!==y.chosen&&x.candidates.some(c=>c.residueFactors?.some(f=>f.topic==='henry'&&f.sourceEventId))){witness={x,y};break outer;}
 }
 assert.ok(witness,'two-day source-backed residue did not move any selected action');
});
test('Articles 17 and 18: separate commitments persist, resume and alter a timed choice',()=>{
 const s=fresh(11);commitments.add(s,{id:'EX-W',title:'Repair bench findings',action:'work',deadline:275000},log);
 commitments.add(s,{id:'EX-R',title:'Consult material',action:'read',deadline:285000},log);
 assert.ok(s.commitments.filter(c=>c.status==='open'||c.status===undefined).length>=3);
 direct(s,'work');ticks(s,10);direct(s,'diary');direct(s,'work');
 assert.ok(s.events.some(e=>e.type==='commitment_interrupted'&&e.commitmentId==='EX-W'));
 assert.ok(s.events.some(e=>e.type==='commitment_resumed'&&e.commitmentId==='EX-W'));
 assert.ok(stepUntil(s,()=>s.commitments.find(c=>c.id==='EX-W').done,180));
 ticks(s,1900);
 assert.ok(s.commitments.some(c=>c.id==='EX-R'),'a non-daily commitment was silently discarded');
 assert.ok(s.commitments.some(c=>c.id==='EX-W'&&c.status==='kept'));
 const a=fresh(12),b=copy(a);
 commitments.add(b,{id:'URGENT-I',title:'Inspect before the bell',action:'inspect',deadline:b.clock.centibeats+4000},log);
 assert.notEqual(top(a),top(b));
 advance(b,archive,1);const decision=b.events.find(e=>e.type==='decision');
 assert.ok(decision.candidates.find(x=>x.kind==='inspect').commitmentFactors.some(c=>c.id==='URGENT-I'));
});
test('Article 12: low-salience object stays unselected for three days, new movement is noticed',()=>{
 const s=fresh(11);s.location='kitchen';s.objectSalience={kettle:-80};
 const source=log(s,'ambient_signal','I heard steps outside.',{operatorOnly:true});
 s.roomSignals=[{room:'kitchen',sourceEventId:source.id,label:'Approaching steps',movement:true,noise:true}];
 advance(s,archive,1);
 assert.ok(s.events.some(e=>e.type==='perception'&&e.observed?.some(o=>o.id==='signal:'+source.id)));
 ticks(s,3000);
 assert.ok(!s.seenObjects.includes('kettle'));
 assert.equal(s.events.filter(e=>e.type==='started'&&e.kind==='tea').length,0);
 assert.ok(s.diary.every(x=>!/kettle/i.test(x.text)));
 assert.ok(s.thoughts.every(x=>!/kettle/i.test(JSON.stringify(x))));
});
test('Article 28: gift and insult order cause distinct subsequent autonomous social conduct',()=>{
 const a=fresh(11),b=fresh(11);
 for(const s of [a,b]){s.location='library';social.arrive(s,log);}
 social.shared(a,log,'gift');social.shared(a,log,'insult');
 social.shared(b,log,'insult');social.shared(b,log,'gift');
 assert.notEqual(a.people.visitor_01.trust,b.people.visitor_01.trust);
 for(const s of [a,b]){social.depart(s,log);s.clock.centibeats=43900;s.clock.day=0;}
 ticks(a,15);ticks(b,15);
 assert.ok(a.events.some(e=>e.type==='visitor_avoided'));
 assert.ok(b.events.some(e=>e.type==='visitor_conversation'&&e.t>=44000));
});
