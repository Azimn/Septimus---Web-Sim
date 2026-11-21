'use strict';
/**
 * Post hoc forensic replay of the existing, previously reported lesion.
 * NOT a new preregistered outcome trial. Changes no experimental coefficients.
 *
 * Base state: seed 11, coupled arm, exactly 149 completed days (149,000 steps).
 * Snapshot tick 14,925,000; first next decision at tick 14,925,100.
 *
 * Run: node scripts/recurrent_lesion_forensic.js
 */
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {fresh,archive}=require('./v12_probe');
const {advance}=require('../src/engine');
const {scores}=require('../src/actions');
const {GAIN,WINDOW,CAP}=require('../src/recurrent_coupling');
const ROOT=path.resolve(process.env.FORENSIC_OUT||path.join(__dirname,'../research-results/recurrent-lesion-forensic-20261120'));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const fileSha=p=>sha(fs.readFileSync(path.resolve(__dirname,'..',p)));
const BASELINE='af899b25212df4c55f55e9a9758b4a94d33f6079';
const TESTED='724fad1dbeaa698ed929d61a834e4c0aec4f72cf';
const SEED=11, REPLAY_DAYS=149, FORK_TICKS=200;
function directScoring(state,mode){
 const sample=structuredClone(state);
 sample.ruminationCouplingDisabled=(mode==='disabled');
 const candidates=scores(sample);
 assert.deepEqual(sample.ruminationCouplingDisabled,mode==='disabled');
 const text=JSON.stringify(candidates);
 return {tick:sample.clock.centibeats,mode,winner:candidates[0]?.kind||null,
   winnerScore:candidates[0]?.score??null,candidates,
   candidatesSha256:sha(text)};
}
function fork(snapshot,mode){
 const s=structuredClone(snapshot),prior=s.events.length;
 s.ruminationCouplingDisabled=(mode==='disabled');
 advance(s,archive,FORK_TICKS);
 const events=s.events.slice(prior);
 const physical=events.filter(e=>e.type==='completed'||e.type==='action_failed'||
   e.type==='death'||e.type==='commitment_progress'||e.type==='commitment_resumed'||
   e.type==='series_outcome'||e.type==='commitment_interrupted');
 const decision=events.find(e=>e.type==='decision');
 return {mode,fromTick:snapshot.clock.centibeats,toTick:s.clock.centibeats,
  firstDecision:decision?{id:decision.id,tick:decision.t,chosen:decision.chosen,
    score:decision.score,foregone:decision.foregone,
    foregoneScore:decision.foregoneScore,candidates:decision.candidates}:null,
  events,physicalReceipts:physical,worldEventCount:events.length,
  rawEventsSha256:sha(events.map(e=>JSON.stringify(e)).join('\n')+'\n'),
  finalWorldSummary:{room:s.location,activity:s.activity,
    needs:s.needs,stores:s.stores,health:s.health,dead:s.dead}};
}
function main(){
 fs.mkdirSync(ROOT,{recursive:true});
 let state=fresh(SEED);
 state.recurrenceArm='coupled';
 for(let day=0;day<REPLAY_DAYS;day++)advance(state,archive,1000);
 assert.equal(state.clock.centibeats,14925000);
 assert.equal(state.activity,null,'Forensic timestamp must be a free-action boundary');
 assert.equal(state.events.at(-1)?.type,'completed');
 assert.equal(state.events.at(-1)?.id,'L18778');
 const snapshotRaw=JSON.stringify(state);
 const snapshotSha=sha(snapshotRaw);
 const originatingThought=state.events.find(e=>e.id==='L18774');
 assert(originatingThought&&originatingThought.type==='rumination');
 assert.equal(originatingThought.sourceId,'C150');
 assert.equal(originatingThought.t,14917500);
 // All three assessments are of this same exact state.
 const enabled=directScoring(state,'enabled');
 const removed=directScoring(state,'disabled');
 const restored=directScoring(state,'restored');
 assert.equal(enabled.candidatesSha256,restored.candidatesSha256,'Restoration must be exact');
 assert.equal(enabled.winner,'prepare');
 assert.equal(removed.winner,'work');
 const [on,off,restore]=['enabled','disabled','restored'].map(x=>fork(state,x));
 assert.deepEqual(on.events,restore.events,'Restoration must reproduce all 200 ticks exactly');
 assert.equal(on.firstDecision?.tick,14925100);
 assert.equal(on.firstDecision?.chosen,'prepare');
 assert.equal(off.firstDecision?.chosen,'work');
 const observed=(on.firstDecision.candidates||[])[0];
 assert.equal(observed.recurrenceFactor.bonus,2.62);
 assert.equal(on.firstDecision.score,33.32);
 assert.equal(on.firstDecision.foregoneScore,32.85);
 const sourceAgeSnapshot=state.clock.centibeats-originatingThought.t;
 const sourceAgeDecision=on.firstDecision.tick-originatingThought.t;
 const data={
  schema:'pretorius.recurrent-lesion-forensic.v1',
  auditType:'post-hoc archival reproduction of preregistered lesion, not new discovery or retuned trial',
  frozenExperiment:{baselineExecutableSha:BASELINE,originalRunHeadSha:TESTED,
    originalActionsRunId:44854991267,originalJobId:136694983250,
    originalEvidenceArtifactId:14687730005,originalEvidenceZipSha256:'c03d16cf50736ff3f633d02cfcdbc5039d87fe31b15afdefde06a5c22810041d'},
  forensicExecution:{sourceRevision:process.env.GITHUB_SHA||'unidentified-local-source',
    sourceHashes:{engine:fileSha('src/engine.js'),world:fileSha('src/world.js'),
     cognition:fileSha('src/cognition.js'),actions:fileSha('src/actions.js'),
     coupling:fileSha('src/recurrent_coupling.js'),
     preregistration:fileSha('research/RECURRENT_COUPLING_PREREG_2026-11-20.md'),
     forensicScript:fileSha('scripts/recurrent_lesion_forensic.js')},
    nodeVersion:process.version,command:'node scripts/recurrent_lesion_forensic.js'},
  identicalStateSnapshot:{id:'sha256:'+snapshotSha,
    jsonUtf8Sha256:snapshotSha,seed:SEED,arm:'coupled',simulatedDays:REPLAY_DAYS,
    tick:state.clock.centibeats,rawSnapshotGzipFile:'same-state-14925000.json.gz',
    rawJsonByteCount:Buffer.byteLength(snapshotRaw),
    lastEventId:state.events.at(-1).id,lastEventType:state.events.at(-1).type,
    lastEventTick:state.events.at(-1).t,
    activeCommitment:{id:'C150',seriesId:'DAILY-HEARTH'},
    sourceThought:originatingThought},
  scoringAtExactlySameState:{enabled,removed,restored},
  nextDecisionAfterOneWorldTick:{
    tick:14925100,
    enabled:on.firstDecision,disabled:off.firstDecision,restored:restore.firstDecision},
  sourceDecayExplanation:{gain:GAIN,window:WINDOW,cap:CAP,
    ageAtSnapshot:sourceAgeSnapshot,bonusAtSnapshot:GAIN*Math.max(0,1-sourceAgeSnapshot/WINDOW),
    ageAtNextDecision:sourceAgeDecision,
    bonusAtNextDecision:GAIN*Math.max(0,1-sourceAgeDecision/WINDOW),
    note:'At the next tick the clock and ordinary bodily conditions advance before choosing. It is not a rescoring of the preceding snapshot.'},
  fork200Ticks:{
   fromTick:state.clock.centibeats,toTick:state.clock.centibeats+FORK_TICKS*100,
   enabled:{eventLogFile:'fork-enabled-200-ticks.jsonl',rawEventSha256:on.rawEventsSha256,
     eventsCount:on.events.length,physicalReceipts:on.physicalReceipts,
     finalWorldSummary:on.finalWorldSummary},
   disabled:{eventLogFile:'fork-disabled-200-ticks.jsonl',rawEventSha256:off.rawEventsSha256,
     eventsCount:off.events.length,physicalReceipts:off.physicalReceipts,
     finalWorldSummary:off.finalWorldSummary},
   restored:{eventLogFile:'fork-restored-200-ticks.jsonl',rawEventSha256:restore.rawEventsSha256,
     eventsCount:restore.events.length,physicalReceipts:restore.physicalReceipts,
     finalWorldSummary:restore.finalWorldSummary},
   restorationByteIdentical:JSON.stringify(on.events)===JSON.stringify(restore.events),
   physicalKindSequences:{enabled:on.physicalReceipts.filter(e=>e.type==='completed').map(e=>e.kind),
      disabled:off.physicalReceipts.filter(e=>e.type==='completed').map(e=>e.kind)},
   conclusion:'Decision and physical action order differed; eventual action-kind multiset was identical in the 200-tick window.'}
 };
 const out=path.join(ROOT,'forensic-lesion.json');
 const serialized=JSON.stringify(data,null,2)+'\n';
 fs.writeFileSync(out,serialized,{flag:'wx'});
 fs.writeFileSync(path.join(ROOT,'same-state-14925000.json.gz'),zlib.gzipSync(snapshotRaw,{level:9}),{flag:'wx'});
 for(const [name,result] of [['enabled',on],['disabled',off],['restored',restore]])
  fs.writeFileSync(path.join(ROOT,'fork-'+name+'-200-ticks.jsonl'),
   result.events.map(e=>JSON.stringify(e)).join('\n')+'\n',{flag:'wx'});
 const readback=zlib.gunzipSync(fs.readFileSync(path.join(ROOT,'same-state-14925000.json.gz'))).toString('utf8');
 assert.equal(sha(readback),snapshotSha);
 console.log('FORENSIC_VERIFIED '+JSON.stringify({
  snapshotId:data.identicalStateSnapshot.id,tick:data.identicalStateSnapshot.tick,
  atSameState:[enabled,removed,restored].map(x=>({mode:x.mode,winner:x.winner,score:x.winnerScore})),
  nextDecision:[on,off,restore].map(x=>({mode:x.mode,winner:x.firstDecision.chosen,
    score:x.firstDecision.score,foregone:x.firstDecision.foregoneScore})),
  receiptSequences:data.fork200Ticks.physicalKindSequences,restorationByteIdentical:true,
  evidenceSha256:sha(serialized)
 }));
}
if(require.main===module)main();
module.exports={main};
