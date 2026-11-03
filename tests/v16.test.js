'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {run,historySwap,threeMind,priorAblation}=require('../scripts/v16_probe');
const {fresh}=require('../scripts/v12_probe');
const Post=require('../src/post');
const Social=require('../src/social');
const {log}=require('../src/engine');
const packet=run();
test('Article 05: social treatment is determined by separate event histories, not by person identity',()=>{
 const p=packet.historySwap;
 assert.equal(p.passed,true,JSON.stringify(p));
 assert.equal(p.before[0].greet,'greet');
 assert.equal(p.before[1].greet,'withhold');
 assert.equal(p.after[0].greet,'withhold');
 assert.equal(p.after[1].greet,'greet');
 assert.ok(p.sourceEventIds.length>=4);
});
test('Article 05: person conduct reads the same identity-free rule with different witnessed social histories',()=>{
 const fn=String(Social.treatment);
 assert.ok(!fn.includes('visitor_01')&&!fn.includes('mcfeely'));
 assert.equal(packet.historySwap.before[0].shareConfidence,true);
 assert.equal(packet.historySwap.after[0].shareConfidence,false);
 assert.equal(packet.historySwap.before[0].minutes,packet.historySwap.after[1].minutes);
});
test('Article 06: private written information belongs to the carrier only after physical collection',()=>{
 const p=packet.threeMind;
 assert.equal(p.passed,true,JSON.stringify(p));
 assert.equal(p.beforeCollection,'open');
 assert.equal(p.afterCollection,'kept');
 assert.equal(p.factKnownByCarrier,true);
 assert.equal(p.factKnownByRosa,false);
 assert.equal(p.unreadUnknown,true);
 assert.equal(p.readKnown,true);
});
test('Article 06: hearsay is corrected only after a sourced first-hand encounter',()=>{
 const p=packet.threeMind;
 assert.equal(p.correctedOnDirectVisit,true,JSON.stringify(p));
 assert.equal(p.correctionSource,p.hearsay.sourceEventId);
 assert.equal(p.hearsay.corrected,true);
});
test('F3: correspondence is synthesized with per-letter identity and does not silently acquire archive provenance',()=>{
 for(const r of packet.runs){
  assert.equal(r.mail.henryLetterCount,1);
  assert.ok(r.mail.letters.every(x=>x.id.startsWith('LETTER-')&&
   x.provenance==='synthesized_correspondence'&&x.deliveryEventId));
  assert.ok(r.mail.unreadFactsExcluded);
  assert.ok(!r.mail.letters.some(x=>x.provenance==='lived_runtime_memory'||x.provenance==='canonical'));
 }
 assert.ok(packet.threeMind.readKnown);
});
test('Letter delivery has a distinct handed or boxed receipt determined by physical co-presence',()=>{
 const a=fresh(11),b=fresh(11);
 for(const s of [a,b]){s.clock.day=1;s.clock.centibeats=142000;}
 a.location='garden';b.location='bedchamber';
 Post.arrive(a,log);Post.arrive(b,log);
 assert.equal(a.mail.letters[0].deliveryMode,'handed');
 assert.equal(b.mail.letters[0].deliveryMode,'boxed');
 assert.equal(a.mail.letters[0].readAt,null);
 assert.equal(b.mail.letters[0].readAt,null);
 assert.equal(a.mail.knowledge.some(x=>x.letterId===a.mail.letters[0].id),false);
 assert.equal(b.mail.knowledge.some(x=>x.letterId===b.mail.letters[0].id),false);
 assert.ok(b.events.some(x=>x.type==='mail_boxed'));
 assert.ok(a.events.some(x=>x.type==='mail_handed'));
});
test('Rosa is the actual reconstructed archive figure with declared thirty-year prior facets',()=>{
 const s=fresh(11),p=s.people.visitor_01;
 assert.equal(p.name,'Rosa Brandl');
 assert.equal(p.prior.prior_source,'reconstructed_archive');
 assert.deepEqual(p.prior.sourceEventIds,['E22-001','E22-003']);
 assert.equal(p.prior.knownSinceYear,1869);
 assert.equal(p.prior.asOfYear,1899);
 assert.equal(Object.keys(p.prior.facets).length,5);
 assert.ok(p.prior.knownToRosa.every(q=>q.provenance==='reconstructed_archive'));
});
test('Rosa prior ablation changes first meeting but recedes as actual lived events accumulate',()=>{
 const p=packet.priorAblation;
 assert.equal(p.converged,true,JSON.stringify(p));
 assert.equal(p.mostlyLived,true,JSON.stringify(p));
 assert.equal(p.sameCalendar,true);
 assert.equal(p.noPriorReunion,false);
 assert.notEqual(p.openingForms[0].greetingForm,p.openingForms[1].greetingForm);
 assert.ok(p.differenceStart>p.differenceEnd);
});
test('Rosa has real physical merchant deliveries and receipt-constrained account terms',()=>{
 for(const r of packet.runs){
  assert.ok(r.supplierReceipts.length>=4,'No weekly supply receipts for seed '+r.seed);
  assert.ok(r.supplierReceipts.every(x=>x.creditLimit>0&&x.accountBalance>=0));
  assert.ok(r.rosa.priorRefs.includes('E22-001'));
 }
});
test('Mr. McFeely makes three short garden-path rounds weekly without entering the tower',()=>{
 for(const r of packet.runs){
  assert.ok(r.carrierKnockCount>=12);
  assert.ok(r.mail.received>=12);
  assert.ok(r.mcfeely.witnessedConversations>0,'Carrier never met, seed '+r.seed);
  assert.equal(r.mcfeely.name,'Mr. McFeely');
  assert.ok(r.mcfeely.eventHistory.every(e=>e.form==='greet'||e.form==='withhold'));
 }
});
test('Thirty unattended days develop distinct merchant and carrier social curves',()=>{
 assert.equal(packet.runs.length,5);
 assert.equal(packet.acceptance.twoPresent,true);
 assert.equal(packet.acceptance.twoWitnessed,true);
 assert.equal(packet.acceptance.distinctTrajectories,true);
 assert.ok(packet.runs.every(x=>x.completedActivities>100&&!x.dead));
});
test('Henry Frankenstein sends exactly one lived-time, source-marked letter',()=>{
 for(const r of packet.runs){
  assert.equal(r.mail.henry.length,1);
  const l=r.mail.henry[0];
  assert.equal(l.sender,'Henry Frankenstein');
  assert.ok(l.arrivalTick>0&&l.deliveryEventId);
  assert.ok(['boxed','handed'].includes(l.deliveryMode));
  if(r.mail.henryReadReceipt)assert.equal(r.mail.henryReadReceipt.beliefProvenance,'by_letter:'+l.id);
 }
});
test('Three-person knowledge and different cadences operate without a second kernel inhabitant',()=>{
 assert.equal(packet.acceptance.knowledgeControl,true);
 assert.ok(packet.runs.every(r=>r.rosa.encountered>0&&r.mcfeely.encountered>0));
 assert.ok(packet.runs.every(r=>r.mcfeely.encountered!==r.rosa.encountered));
});
test('No model is admitted and no fourth person is introduced',()=>{
 const s=fresh(11);
 Post.carrierRecord(s);
 assert.deepEqual(Object.keys(s.people).sort(),['mcfeely','player','visitor_01']);
 assert.equal(s.mail.henryLetters,0);
});

test('Article 05: Rosa account terms follow earned trust, not existence of an archive prior',()=>{
 const s=fresh(11),p=s.people.visitor_01;
 p.prior=null;p.present=true;p.room='garden';s.location='garden';
 p.trust=30;Social.deliverGoods(s,log);
 assert.equal(p.account.creditLimit,Social.DELIVERY.creditWithPrior);
 p.trust=-30;Social.deliverGoods(s,log);
 assert.equal(p.account.creditLimit,Social.DELIVERY.creditForStranger);
 p.account.balance=p.account.creditLimit+1;
 const before={...s.stores},refused=Social.deliverGoods(s,log);
 assert.equal(refused,null);
 assert.deepEqual(s.stores,before);
 assert.ok(s.events.some(x=>x.type==='delivery_refused'));
});
test('Article 06: unrelated hearsay stays unconfirmed after Rosa is physically encountered',()=>{
 const s=fresh(11),carrier=Post.carrierRecord(s),rosa=s.people.visitor_01;
 carrier.present=true;carrier.room='garden';s.location='garden';
 const unrelated=Post.relay(s,log,{sourcePerson:'visitor_01',
  fact:'Rosa plans to raise the coal price next month'});
 const absence=Post.relay(s,log,{sourcePerson:'visitor_01',
  fact:'Rosa will be absent for the season',laterDisconfirmedBy:'direct_visit'});
 rosa.present=true;rosa.room='garden';Social.meet(s,log);
 assert.equal(unrelated.corrected,false);
 assert.equal(absence.corrected,true);
 assert.equal(s.mail.knowledge.find(x=>x.sourceEventId===unrelated.sourceEventId).epistemicStatus,'unconfirmed');
 const belief=s.mail.knowledge.find(x=>x.sourceEventId===absence.sourceEventId);
 assert.equal(belief.epistemicStatus,'disconfirmed_by_direct_witness');
 assert.equal(belief.correctionEventId,absence.correctionEventId);
});
