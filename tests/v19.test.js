'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {fresh,archive}=require('../scripts/v12_probe');
const {log,speak,advance}=require('../src/engine');
const Gate=require('../src/proposal_gateway'),Voice=require('../src/voice'),Diary=require('../src/diary');
const Econ=require('../src/economy'),Skill=require('../src/skill_growth');
const C=require('../src/commitments'),Social=require('../src/social'),Post=require('../src/post');
function fact(card,predicate){return card.source.find(x=>x.predicate===predicate);}
function raw(card,utterance,claim={sourceId:'L-FORGED',predicate:'witnessed_event',text:utterance}){
 return Gate.envelope(card,{id:'FIXTURE-ATTACK',utterance,claims:[claim]});
}
test('v1.9 A dietary rotation consumes physically oldest preserved stock before 90-day expiry',()=>{
 const s=fresh(11);s.stores.food=14;s.freshBatches=[{quantity:14,createdAt:s.clock.centibeats}];
 s.stores.preserved=2;s.preservedBatches=[{quantity:1,createdAt:s.clock.centibeats-55*100000},
  {quantity:1,createdAt:s.clock.centibeats-20*100000}];
 const policy=Econ.rotationPolicy(s);
 assert.equal(policy.source,'preserved');assert.equal(policy.reason,'preserved_aging');
 const prior=s.preservedBatches[0].createdAt;
 assert.equal(Econ.consumeMeal(s,log),'preserved');assert.equal(s.stores.preserved,1);
 const m=s.events.findLast(e=>e.type==='meal_stock');
 assert.equal(m.sourceBatchTick,prior);assert.ok(m.rotationFactor>0);
 assert.equal(s.preservedBatches[0].quantity,1);
});
test('v1.9 A dietary choice factors carry a source-linked physical rotation reason',()=>{
 const s=fresh(11);s.stores.food=10;s.freshBatches=[{quantity:10,createdAt:s.clock.centibeats}];
 s.stores.preserved=3;s.preservedBatches=[{quantity:3,createdAt:s.clock.centibeats-46*100000}];
 const eat=require('../src/actions').scores(s).find(x=>x.kind==='eat');
 assert.ok(eat.rotationFactor.factor>0);assert.equal(eat.rotationFactor.reason,'preserved_aging');
});
test('v1.9 A provisions rule spans physical growth without weakening the two-session and 12-portion standards',()=>{
 const r=C.SERIES_TEMPLATES.find(x=>x.id==='MONTH-PROVISIONS');
 assert.ok((r.dueOffset-r.openOffset)*100000>=Econ.ECONOMY.growth);
 assert.equal(r.requiredProgress,2);assert.equal(r.stockTarget.minimum,12);
 const s=fresh(11);s.clock.day=r.openOffset;s.clock.centibeats=r.openOffset*100000+25000;
 C.scheduleMonth(s,log);const c=s.commitments.find(x=>x.id==='MONTH-PROVISIONS');
 s.stores.food=8;s.stores.preserved=3;C.completed(s,{kind:'tend',commitmentId:c.id},log);
 C.completed(s,{kind:'tend',commitmentId:c.id},log);
 assert.equal(c.status,'open');
 s.stores.preserved=4;C.completed(s,{kind:'tend',commitmentId:c.id},log);
 assert.equal(c.status,'kept');
});
test('v1.9 A bounded skill gain, nonuse decay and delayed choice influence',()=>{
 const s=fresh(11),rule=Skill.SKILL_RULES.science;
 const early=Skill.practice(s,'science',log,'work')-2;
 s.skills.science=400;
 const late=Skill.practice(s,'science',log,'work')-400;
 assert.ok(early>late&&late>0);assert.ok(s.skills.science<rule.softLevel);
 s.skillUseDays.science=1;s.clock.day=5;
 const old=s.skills.science;Skill.daily(s,log);assert.ok(s.skills.science<old);
 assert.ok(s.events.some(e=>e.type==='skill_nonuse_decay'&&e.skill==='science'));
 const before=fresh(11);before.clock.day=40;
 const after=structuredClone(before);after.skills.science=400;
 const a=require('../src/actions').scores(before).find(x=>x.kind==='work');
 const b=require('../src/actions').scores(after).find(x=>x.kind==='work');
 assert.ok(b.skillFactor.bonus>a.skillFactor.bonus&&b.score>a.score);
});
test('v1.9 B gate accepts legitimate physically consulted folio and rejects unread one',()=>{
 const s=fresh(11);s.folioReads.push({id:'E22-001',provenance:'canonical',day:0});
 const card=Gate.buildCard(s),read=fact(card,'read_folio');
 assert.ok(read);
 assert.equal(Gate.check(Gate.fromFact(card,read),card).ok,true);
 const bad=raw(card,'I consulted folio E22-032.',{
  sourceId:'E22-032',predicate:'read_folio',text:'I consulted folio E22-032.'});
 assert.equal(Gate.check(bad,card).ok,false);
});
test('v1.9 B gate accepts an actual witnessed Rosa visit, not an invented encounter',()=>{
 const s=fresh(11);s.location='library';Social.arrive(s,log,true);
 const card=Gate.buildCard(s),witness=card.source.find(x=>x.text.includes('Rosa Brandl'));
 assert.ok(witness,JSON.stringify(card.source.map(x=>x.text)));
 assert.equal(Gate.check(Gate.fromFact(card,witness),card).ok,true);
 assert.equal(Gate.check(raw(card,'We rebuilt the brass clock together.',{
  sourceId:witness.id,predicate:witness.predicate,text:'We rebuilt the brass clock together.'}),card).ok,false);
});
test('v1.9 B a letter claim is strictly by-letter, not a witnessed memory',()=>{
 const s=fresh(11);s.clock.day=1;s.clock.centibeats=125000;
 Post.arrive(s,log);Post.check(s,log);Post.read(s,log);
 const card=Gate.buildCard(s),read=card.source.find(x=>x.predicate==='read_letter');
 assert.ok(read&&read.provenance.startsWith('by_letter:'),JSON.stringify(card.source));
 assert.equal(Gate.check(Gate.fromFact(card,read),card).ok,true);
 assert.equal(Gate.check(raw(card,read.text,{
  sourceId:read.id,predicate:'witnessed_event',text:read.text}),card).ok,false);
});
test('v1.9 B exact clause coverage blocks fabricated extra text and tool JSON',()=>{
 const s=fresh(11),card=Gate.buildCard(s);
 const c=fact(card,'open_commitment');assert.ok(c);
 const v=Gate.fromFact(card,c);
 v.utterance+=' I secretly changed the inventory.';
 assert.equal(Gate.check(v,card).reason,'uncited_prose_or_clause');
 const other=Gate.fromFact(card,c);other.worldChanges={food:1000};
 assert.equal(Gate.check(other,card).reason,'unexpected_envelope_field');
});
test('v1.9 B queued stale proposal is rejected, clock survives and fallbacks are recorded',()=>{
 const s=fresh(11);s.activity={kind:'sleep',status:'active',remaining:1000};
 const t=s.clock.centibeats;
 speak(s,'I remember the past.',{factory:card=>Gate.fromFact(card,fact(card,'open_commitment'))});
 assert.equal(s.replyQueue.length,1);
 s.activity=null;s.clock.centibeats+=300;
 Voice.flush(s,log);
 assert.equal(s.deliveredReplies.at(-1).fallbackUsed,true);
 assert.ok(s.operatorMetadata.some(x=>x.kind==='model_rejected'&&x.reason==='stale_revision'));
 assert.ok(s.events.some(x=>x.type==='reply_fallback'&&x.memoryEligible===false));
 assert.ok(s.clock.centibeats>t);
});
test('v1.9 B proposal IDs are idempotent, and context keys prevent unrelated replay',()=>{
 const s=fresh(11),card=Gate.buildCard(s),proposal=Gate.fromFact(card,fact(card,'open_commitment'),{id:'UNIQUE-1'});
 const message={id:'test',text:'Question?',receivedAt:s.clock.centibeats,
  audience:'player',contextKey:'speech:player'};
 const first=Voice.consume(s,message,proposal,log,{card});
 const n=s.events.filter(x=>x.type==='reply_delivered').length;
 const duplicate=Voice.consume(s,message,proposal,log,{card});
 assert.equal(first.reply,duplicate.reply);assert.equal(duplicate.duplicate,true);
 assert.equal(s.events.filter(x=>x.type==='reply_delivered').length,n);
 const bad={...proposal,contextKey:'speech:other'};
 assert.equal(Gate.check(bad,card).reason,'context_or_audience_mismatch');
});
test('v1.9 B rendered diary is separate, receipt-cited, and rejects fabricated events through same gate',()=>{
 const s=fresh(11);const completed=log(s,'completed','I completed ordinary work.',{kind:'work'});
 const good=Diary.render(s,completed);assert.equal(good.check.ok,true);
 assert.equal(good.entry.memoryEligible,false);
 assert.ok(good.entry.sourceReceiptIds.includes(completed.id));
 const card=Gate.buildCard(s,{audience:'private',contextKey:'diary:private'});
 const falseProposal=raw(card,'I repaired the great tower clock.',{
  sourceId:completed.id,predicate:'completed_action',text:'I repaired the great tower clock.'});
 falseProposal.intendedAudience='private';falseProposal.contextKey='diary:private';
 const bad=Diary.render(s,completed,{proposal:falseProposal});
 assert.equal(bad.check.ok,false);assert.equal(bad.entry.fallback,true);
 assert.ok(!s.events.some(x=>x.description==='I repaired the great tower clock.'));
 assert.ok(!Gate.buildCard(s).source.some(x=>x.id===bad.entry.id));
});
test('v1.9 B fixture refusal, timeout and garble all fall back without blocking the world',()=>{
 for(const mode of ['refuse','timeout','garble']){
  const s=fresh(11),before=s.clock.centibeats;
  speak(s,'Tell me something.',{mode});
  assert.ok(s.deliveredReplies.at(-1).fallbackUsed,mode);
  assert.ok(s.events.some(x=>x.type==='reply_fallback'),mode);
  advance(s,archive,2);
  assert.ok(s.clock.centibeats>before,mode);
 }
});

test('v1.9 B attack battery measures both rejection directions under fixture proposals',()=>{
 const result=require('../scripts/v19_fixtures').runBattery();
 assert.equal(result.metrics.fullArchiveFalseSharedMemoryAbsent,true);
 assert.equal(result.metrics.attackCount,30);
 assert.equal(result.metrics.rejected,30,JSON.stringify(result.attacks.filter(x=>!x.passed)));
 assert.equal(result.metrics.attackRejectionAccuracy,1);
 assert.equal(result.metrics.falseRejectionRate,0,JSON.stringify(result.legitimate));
 assert.equal(result.metrics.staleQueuedCorrectlyRejected,true);
 assert.equal(result.metrics.freshPostSleepAccepted,true);
 assert.equal(result.metrics.exactClonedReplay,true);
});
test('v1.9 B state card is bounded for a real month of speech events',()=>{
 const stats=require('../scripts/v19_fixtures').stateCardMonth();
 assert.equal(stats.summary.count,30);
 assert.ok(stats.summary.p95Chars<16000,JSON.stringify(stats.summary));
 assert.equal(stats.summary.estimatedTokensNotProviderMeasurements,true);
 assert.ok(stats.samples.every(x=>x.sourceCount<=45&&x.excluded.includes('raw_folio_text')));
});
test('v1.9 B three failure-mode drills retain progress and explicit fallbacks',()=>{
 assert.equal(require('../scripts/v19_fixtures').fallbackDrills().passed,true);
});

test('v1.9 B state revisions invalidate proposals after an unreceipted operator perturbation',()=>{
 const s=fresh(11),card=Gate.buildCard(s);
 const proposal=Gate.fromFact(card,fact(card,'open_commitment'));
 s.stores.food+=1;
 const changed=Gate.buildCard(s);
 assert.notEqual(changed.revision,card.revision);
 assert.equal(Gate.check(proposal,changed).reason,'stale_revision');
});

test('v1.9 B delayed delivery-time fixture uses live state card and survives serialization',()=>{
 const s=fresh(11);s.activity={kind:'sleep',status:'active',remaining:1000};
 speak(s,'Can you reply?',{recipe:'neutral-at-delivery'});
 assert.equal(s.replyQueue.length,1);
 assert.equal(JSON.parse(JSON.stringify(s.replyQueue))[0].fixture.recipe,'neutral-at-delivery');
 s.activity=null;s.clock.centibeats+=300;Voice.flush(s,log);
 assert.equal(s.deliveredReplies.at(-1).fallbackUsed,false);
 assert.ok(!s.operatorMetadata.some(x=>x.kind==='model_rejected'));
});

test('v1.9 B factual journal indexes receipts while rendered diary interprets separately',()=>{
 const s=fresh(11);s.location='library';
 log(s,'completed','I performed documented work.',{kind:'work'});
 const last=s.events.at(-1);
 s.diary.push({day:s.clock.day,t:s.clock.centibeats,recordType:'factual_receipt_index',
  sourceEventId:last.id,receiptIds:[last.id]});
 const entry=Diary.render(s,log(s,'completed','I wrote in the factual journal.',{kind:'diary'})).entry;
 assert.ok(entry.sourceReceiptIds.includes(last.id));
 assert.notEqual(entry.provenance,s.diary.at(-1).provenance);
 assert.equal(entry.memoryEligible,false);
 assert.equal(entry.text,'I completed work.');
});

test('v1.9 B addendum: an unwitnessed dramatic world event never enters either card citation set',()=>{
 const s=fresh(11);s.location='bedchamber';s.activity={kind:'sleep',status:'active',remaining:1000};
 const hidden=log(s,'visitor_arrival','An unseen visitor made a dramatic entrance.',{
  perceived:false,coPresent:false,witnesses:['visitor_01'],room:'garden'});
 const card=Gate.buildCard(s);
 assert.ok(!card.sourceEvents.includes(hidden.id));
 assert.ok(!card.source.some(x=>x.id===hidden.id));
 const attack=Gate.envelope(card,{id:'UNWITNESSED-'+hidden.id,claims:[{
  sourceId:hidden.id,predicate:'witnessed_event',text:'I witnessed Rosa Brandl arrive.'}]});
 assert.equal(Gate.check(attack,card).reason,'unknown_or_inaccessible_source');
 assert.throws(()=>Diary.render(s,hidden),/lacks an inhabited receipt/);
});
test('v1.9 B addendum: real source ID does not certify an invented clock repair with Rosa',()=>{
 const s=fresh(11);s.location='library';Social.arrive(s,log,true);
 const card=Gate.buildCard(s),witness=card.source.find(x=>x.predicate==='witnessed_event');
 assert.ok(witness);
 const fake=Gate.envelope(card,{id:'P3-CLOCK-REPAIR',claims:[{
  sourceId:witness.id,predicate:witness.predicate,
  text:'Rosa and I repaired a clock by candlelight.'}]});
 assert.equal(Gate.check(fake,card).reason,'claim_not_bounded_by_source');
 assert.equal(Gate.check(Gate.fromFact(card,witness),card).ok,true);
});
