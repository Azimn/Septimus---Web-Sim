'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {probe,fresh,ticks}=require('../scripts/v12_probe');
const {log,social}=require('../src/engine');
const observed=probe();
const byArticle=id=>observed.results.find(x=>x.article===id);
test('Article 22: all five state lesions change a selected autonomous action',()=>{
 const p=byArticle(22);
 assert.equal(p.pass,true,JSON.stringify(p.evidence));
 assert.deepEqual(Object.keys(p.evidence.switches).sort(),['commitments','habits','mood','needs','residue']);
 for(const witness of Object.values(p.evidence.switches)){
  assert.notEqual(witness.enabled,witness.disabled);
  assert.match(witness.interventionId,/^L\d+$/);
 }
});
test('Article 16: one matched trait swap changes one-day choice distributions',()=>{
 const p=byArticle(16);assert.equal(p.pass,true);
 assert.equal(p.evidence.runs.length,5);
 assert.ok(p.evidence.runs.some(x=>x.l1Counts>0));
});
test('Article 10: bounded mood intervention changes real activity counts in the predicted score direction',()=>{
 const p=byArticle(10);assert.equal(p.pass,true);
 assert.ok(p.evidence.runs.every(x=>x.scoreDirectionCorrect));
 assert.ok(p.evidence.runs.some(x=>x.actionCountL1>0));
});
test('Article 02: unattended hourly rumination sources beat the declared weak shuffled control',()=>{
 const p=byArticle(2);assert.equal(p.pass,true);
 assert.ok(p.evidence.realOpenFraction>p.evidence.shuffledOpenFraction);
 for(const x of p.evidence.runs)assert.equal(x.thoughts,x.validSources);
});
test('Article 08: a naturally formed habit misfires after an unseen cue relocation without player commands',()=>{
 const p=byArticle(8);assert.equal(p.pass,true,JSON.stringify(p.evidence));
 assert.ok(p.evidence.runs.some(x=>x.intervention?.receiptValid&&x.autonomousCueMisfires.length>0));
});
test('Article 28: distinct social event order persists across 1000 autonomous ticks, not yet a conduct difference',()=>{
 const a=fresh(11),b=fresh(11);
 for(const s of [a,b]){s.location='library';social.arrive(s,log);}
 social.shared(a,log,'gift');social.shared(a,log,'insult');
 social.shared(b,log,'insult');social.shared(b,log,'gift');
 const original=[a.people.visitor_01.trust,b.people.visitor_01.trust];
 assert.notEqual(...original);
 ticks(a,1000);ticks(b,1000);
 assert.deepEqual([a.people.visitor_01.trust,b.people.visitor_01.trust],original);
 assert.notDeepEqual(a.people.visitor_01.events,b.people.visitor_01.events);
 // This test does not assert independent differences in later autonomous conduct.
});
