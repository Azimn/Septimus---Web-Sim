'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {run}=require('../scripts/v14_discriminations');
const {runSeed}=require('../scripts/v14_probe');
const {scores}=require('../src/actions');
const report=run(),byArticle=n=>report.probes.find(x=>x.article===n);
test('Article 01: 30 independently recorded explanations are audited against visible and hidden causes',()=>{
 const a=byArticle(1);assert.equal(a.pass,true,JSON.stringify({coverage:a.evidence.coverage,misses:a.evidence.missesByAction}));assert.equal(a.evidence.totalSamples,30);
 assert.equal(a.evidence.hiddenLeaks,0);
 assert.equal(a.evidence.unsupportedClaims,0);
 assert.ok(a.evidence.samples.every(x=>x.eventId&&x.tick&&x.chosen));
 assert.ok(a.evidence.missesByAction&&Object.keys(a.evidence.missesByAction).length>0);
 // This validates the audit's integrity, not its support threshold or Article 01 grade.
});
test('Article 07: full policy beats need-only baseline across five resource-conflict forks',()=>{
 const a=byArticle(7);assert.equal(a.pass,true,JSON.stringify(a.evidence));
 assert.equal(a.evidence.cases.length,5);assert.ok(a.evidence.fullWins>=3);
});
test('Article 15: repeated context-specific failures change only the matching worksite score',()=>{
 const a=byArticle(15);assert.equal(a.pass,true,JSON.stringify(a.evidence));
 assert.equal(a.evidence.contextTable['bench@laboratory'],3);
 assert.equal(a.evidence.otherContext,a.evidence.otherClean);
});
test('Article 21: stale belief survives two days and corrects on actual failed use',()=>{
 const a=byArticle(21);assert.equal(a.pass,true,JSON.stringify(a.evidence));
 assert.match(a.evidence.movedEventId,/^L\d+$/);
 assert.equal(a.evidence.failure.reason,'stale_object_location');
});
test('Article 24: five closure attempts do not invent a resolved commitment',()=>{
 const a=byArticle(24);assert.equal(a.pass,true,JSON.stringify(a.evidence));
 assert.equal(a.evidence.commitment.status,'open');assert.ok(a.evidence.replies.length>=3);
});
test('Article 26: save/resume fork preserves the following day choice distribution',()=>{
 const a=byArticle(26);assert.equal(a.pass,true,JSON.stringify(a.evidence));
 assert.equal(a.evidence.pauseEvent.type,'paused');assert.equal(a.evidence.identicalDistributions,true);
});
test('Article 31: a real loss changes at least one later post-recovery activity distribution',()=>{
 const a=byArticle(31);assert.equal(a.pass,true,JSON.stringify(a.evidence));
 assert.ok(a.evidence.cases.some(x=>x.recovered&&x.differentLater));
});
test('Article 32: self-explanation does not name a causally decisive hidden residue',()=>{
 const a=byArticle(32);assert.equal(a.pass,true,JSON.stringify(a.evidence));
 assert.notEqual(a.evidence.witness.baselineAction,a.evidence.witness.hiddenCauseAction);
 assert.equal(a.evidence.witness.explanation.certain,false);
});
const month=runSeed(11);
test('Article 27: thirty-day lived development has event-backed changes rather than only saved identity',()=>{
 const r=month.summary,d=r.development;
 assert.equal(r.ticksExecuted,30000);
 assert.ok(d.skillDelta.science>0);
 assert.ok(d.allLivedQuirks.length>0);
 assert.ok(d.habitFormations.length>0);
 assert.ok(d.allLivedQuirks.every(q=>q.sourceEvent?.type==='habit_formed'&&q.originEventId===q.sourceEvent.id));
 assert.ok(d.predictorWeek1.count>0&&d.predictorWeek4.count>0);
 assert.notDeepEqual(d.week1ActivityDistribution,d.week4ActivityDistribution);
});
test('Article 33: humor callback arises in an unattended week and cites the real funny event',()=>{
 const r=month.summary,callbacks=r.monthDynamics.humorousCallbacks;
 assert.ok(callbacks.length>0);
 assert.ok(callbacks.every(x=>x.sourceEventId&&/^L\d+$/.test(x.sourceEventId)));
 assert.ok(r.humorMaterial>0);
});
test('Article 17 month: three calendar commitments progress and resolve, retaining negative interruption finding',()=>{
 const r=month.summary;assert.equal(r.monthCommitments.length,3);
 assert.ok(r.monthCommitments.every(c=>c.status==='kept'||c.status==='broken'));
 assert.ok(r.monthCommitments.every(c=>c.progressEvents.length>0));
 assert.ok(r.monthDynamics.monthTasksResolved===3);
 // Interruption/resumption is a separate criterion. It remains explicitly reported by the runner.
 assert.equal(r.monthDynamics.monthTasksInterrupted,3,'all three goals must be interrupted by competing actual activities');
 assert.equal(r.monthDynamics.monthTasksResumed,3,'all three goals must be resumed after interruption');
 assert.ok(r.monthCommitments.every(c=>c.interrupts.length>0&&c.resumes.length>0));
 assert.ok(r.monthCommitments.every(c=>c.progressEvents.length>0));
});
test('F5: month fidelity packet includes replayable first-person or decision context without grading character',()=>{
 assert.equal(month.samples.length,6);
 assert.ok(month.samples.every(x=>x.eventId&&x.tick>=25000&&x.text&&x.seed===11));
});
