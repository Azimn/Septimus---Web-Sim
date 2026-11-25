'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {initialState}=require('../src/world');
const {save,load}=require('../src/store');
const {direct,speak}=require('../src/engine');
const Port=require('../src/doctor_world_port');
const identity={sha:'fixture'},archive={sha:'fixture',records:[]};
function fixture(){return Port.enroll(initialState(identity.sha,archive.sha),'world_fixture');}
function run(s,choice,id,steps=1000){return Port.pulse(s,archive,{id,revision:Port.revision(s),choice,policyRef:choice?'policy_'+id:null,steps});}
test('canonical mode waits, never invokes the Tower chooser or player command',()=>{
 const s=fixture();run(s,null,'idle');assert.equal(s.activity,null);
 assert.equal(s.decisions.length,0);assert.throws(()=>direct(s,'sleep'),/canonical/i);
 assert.throws(()=>speak(s,'hello'),/canonical/i);
 assert.ok(Port.observe(s).narrative.every(x=>/^I\b/.test(x)));
 assert.ok(!JSON.stringify(Port.observe(s).narrative).includes('centibeats'));
 assert.throws(()=>run(s,'work','remote'),/feasible/);
});
test('actual adjacent movement and local consumption survive source save and idempotent retry',()=>{
 const s=fixture(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'tower-doctor-'));
 try{
  run(s,'move_library','move1');run(s,'move_kitchen','move2');
  const before=s.stores.food,req={id:'meal',revision:Port.revision(s),choice:'eat',policyRef:'policy_meal',steps:1000};
  const a=Port.pulse(s,archive,req);assert.equal(s.stores.food,before-1);
  const file=path.join(dir,'save.json');save(file,s);const cold=load(file,identity,archive);
  assert.equal(Port.pulse(cold,archive,req).replayed,true);assert.equal(cold.stores.food,before-1);
  assert.equal(cold.decisions.length,0);
  const receipt=Port.observe(cold).events.find(e=>e.policyRef==='policy_meal');
  assert.ok(receipt);assert.match(receipt.text,/I ate/);assert.equal(receipt.epistemic,'witnessed_experience');
  assert.throws(()=>Port.pulse(cold,archive,{...req,steps:1}),/Changed/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('unwitnessed and reported events remain distinct',()=>{
 assert.equal(Port.eventText({type:'visitor_arrival',perceived:false}),null);
 assert.equal(Port.eventText({type:'social',personId:'visitor_01',kind:'conversation',witnesses:['visitor_01']}),null);
 assert.match(Port.eventText({type:'letter_read',sender:'Rosa Brandl',claims:['There is a shortage of coal']}),/^I read a letter/);
 assert.equal(Port.eventText({type:'decision',description:'I chose with score 12'}),null);
});
