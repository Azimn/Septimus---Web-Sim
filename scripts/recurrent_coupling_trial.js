'use strict';
// Exact frozen trial plan: research/RECURRENT_COUPLING_PREREG_2026-11-20.md
// Run: node scripts/recurrent_coupling_trial.js [--quick]
// Outputs are disposable in research-results/ and never overwrite archived evidence.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {fresh,archive}=require('./v12_probe');
const {advance}=require('../src/engine');
const {scores}=require('../src/actions');
const {CAP,GAIN,WINDOW}=require('../src/recurrent_coupling');
const PRE='af899b25212df4c55f55e9a9758b4a94d33f6079';
const ARMS=['record_only','coupled','simple'], SEEDS=[11,12,13,14,15],DAY=100000;
const ROOT=path.resolve(process.env.RECURRENT_OUT||path.join(__dirname,'../research-results/recurrent-20261120'));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const fileHash=p=>hash(fs.readFileSync(path.join(__dirname,'..',p)));
const count=(items,pred)=>items.filter(pred).length;
const byType=(rows,t)=>rows.filter(x=>x.type===t);
const round=n=>Math.round(n*100)/100;
function metric(s,arm,seed,days,checkpoints){
 const events=s.events;
 const resolved=s.commitments.filter(c=>c.status==='kept'||c.status==='broken');
 const started=byType(events,'commitment_progress'),resumed=byType(events,'commitment_resumed');
 const interrupted=byType(events,'commitment_interrupted');
 const outcome=byType(events,'series_outcome');
 const completed=byType(events,'completed');
 const waste=events.filter(e=>e.type==='spoilage').reduce((n,e)=>n+(Number(e.amount)||0),0)+
  events.filter(e=>e.type==='harvest').reduce((n,e)=>n+(Number(e.wasted)||0),0);
 const fixation=[];
 // Consecutive selections for same commitment ACTION, not merely many thoughts.
 // Receipt of actual progress resets a run. Six consecutive unproductive starts are fixation.
 let active=null,streak=0;
 for(const e of events){
  if(e.type==='commitment_progress'||e.type==='commitment_resumed'||
     e.type==='series_outcome'||e.type==='completed'){active=null;streak=0;}
  if(e.type!=='decision')continue;
  const first=(e.candidates||[]).find(x=>x.kind===e.chosen);
  const id=first?.recurrenceFactor?.sourceCommitmentId||
    first?.commitmentFactors?.find(x=>x.bonus>0)?.id||null;
  if(id){if(active===id)streak++;else{active=id;streak=1;}
   if(streak===6)fixation.push({id,tick:e.t,eventId:e.id});}
  else{active=null;streak=0;}
 }
 const opened=s.commitments.filter(c=>c.generationEventId||c.origin==='calendar_bootstrap').length;
 const kept=resolved.filter(c=>c.status==='kept').length,broken=resolved.filter(c=>c.status==='broken').length;
 const abandoned=resolved.filter(c=>['released','superseded'].includes(c.status)).length;
 const rel=events.filter(e=>e.type==='visitor_conversation'||e.type==='carrier_conversation');
 const impacts=events.filter(e=>e.type==='decision'&&e.candidates?.some(c=>c.recurrenceFactor?.bonus>0));
 const simplePhysicalCompleted=count(completed,e=>e.controller==='autonomous'||!e.controller);
 return {arm,seed,daysRequested:days,actualDaysAdvanced:(s.clock.centibeats-25000)/DAY,
  dead:s.dead,health:s.health,opened,terminal:resolved.length,kept,broken,
  releasedOrSuperseded:abandoned,appropriateAbandonmentsVerified:0,
  appropriateAbandonmentNote:'No first-class justified-abandonment receipt in current source; not assessed',
  activityStarts:started.length,resumes:resumed.length,
  interruptions:interrupted.length,interruptionRate:round(interrupted.length/Math.max(1,started.length+resumed.length)),
  bodilyPreemptions:byType(events,'autonomous_need_preemption').length,
  actionFailures:byType(events,'action_failed').length,
  physicalCompletions:completed.length,autonomousCompletions:simplePhysicalCompleted,
  beliefCorrections:byType(events,'belief_correction').length,
  relationshipConversations:rel.length,ruminations:byType(events,'rumination').length,
  decisions:byType(events,'decision').length,decisionsWithNonzeroInfluence:impacts.length,
  fixationEpisodes:fixation.length,fixationSample:fixation.slice(0,6),
  wasteUnits:round(waste),endingStores:{...s.stores},verifiedSeriesOutcomes:outcome.length,
  checks:checkpoints,firstAndLastReceipt:[events[0]?.id||null,events.at(-1)?.id||null],
  fullEventLogHash:hash(events.map(e=>JSON.stringify(e)).join('\n')+'\n'),
  eventCount:events.length};
}
function ablationCheck(s){
 if(s.recurrenceArm!=='coupled'||s.activity||s.dead)return null;
 const p=structuredClone(s);
 p.ruminationCouplingDisabled=false;const normal=scores(p)[0];
 const b=normal?.recurrenceFactor?.bonus||0;
 if(!b)return null;
 p.ruminationCouplingDisabled=true;const removed=scores(p)[0];
 p.ruminationCouplingDisabled=false;const restored=scores(p)[0];
 const sameRestore=restored?.kind===normal?.kind&&restored?.score===normal?.score;
 const changed=normal?.kind!==removed?.kind;
 let effect=null;
 if(changed){
  // The two cloned physical futures are authorized by original world rules.
  const on=structuredClone(s),off=structuredClone(s),before=on.events.length;
  on.ruminationCouplingDisabled=false;off.ruminationCouplingDisabled=true;
  advance(on,archive,200);advance(off,archive,200);
  const receipt=x=>x.events.slice(before).filter(e=>e.type==='completed').map(e=>({type:e.type,kind:e.kind,target:e.target||null}));
  effect={on:receipt(on),off:receipt(off),changed:JSON.stringify(receipt(on))!==JSON.stringify(receipt(off))};
 }
 return {tick:s.clock.centibeats,source:normal?.recurrenceFactor?.sourceCommitmentId||null,
  enabled:{action:normal?.kind,score:normal?.score,bonus:b},
  removed:{action:removed?.kind,score:removed?.score},restored:{action:restored?.kind,score:restored?.score},
  restoreExact:sameRestore,decisionChanged:changed,physicalFork:effect};
}
function life(seed,arm,days){
 const s=fresh(seed);s.recurrenceArm=arm;
 const label=arm+'-seed-'+seed+'-'+days+'d';
 const raw=path.join(ROOT,label+'.jsonl');
 let start=0,checks=[],firstDeath=null;
 // File is created once and never overwritten; day-by-day append avoids a huge buffer.
 fs.writeFileSync(raw,'',{flag:'wx'});
 for(let d=0;d<days;d++){
  if(s.dead){firstDeath??=d+1;break;}
  advance(s,archive,1000);
  const newEvents=s.events.slice(start);start=s.events.length;
  if(newEvents.length)fs.appendFileSync(raw,newEvents.map(e=>JSON.stringify(e)).join('\n')+'\n');
  if(arm==='coupled'&&checks.length<10){
   const q=ablationCheck(s);
   if(q&&(q.decisionChanged||checks.length===0))checks.push(q);
  }
 }
 let summary=metric(s,arm,seed,days,checks);
 summary.firstDeathDay=firstDeath;
 summary.rawLogRelative=path.basename(raw);
 summary.rawLogSha256=hash(fs.readFileSync(raw));
 fs.writeFileSync(path.join(ROOT,label+'.summary.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
 return summary;
}
function evaluate(results){
 const data=results.filter(x=>x.daysRequested===90),pairs=[];
 for(const seed of SEEDS){
  const r=Object.fromEntries(ARMS.map(a=>[a,data.find(x=>x.seed===seed&&x.arm===a)]));
  if(!r.coupled||!r.simple||!r.record_only)continue;
  const B=r.coupled,C=r.simple,A=r.record_only;
  const sameOrBetter=B.kept>=C.kept;
  const extraDeath=B.dead&&!C.dead,extraWaste=B.wasteUnits>(C.wasteUnits?C.wasteUnits*1.1:C.wasteUnits+2);
  const extraInterruptions=B.interruptions>(C.interruptions?C.interruptions*1.2:C.interruptions+2);
  const fixationNoGain=B.fixationEpisodes>C.fixationEpisodes&&B.kept<=C.kept;
  pairs.push({seed,A:{kept:A.kept,broken:A.broken},B:{kept:B.kept,broken:B.broken},C:{kept:C.kept,broken:C.broken},
   sameOrBetter,strictlyBetter:B.kept>C.kept,extraDeath,extraWaste,extraInterruptions,fixationNoGain,
   actualChoiceDifferenceEvidence:B.checks.some(q=>q.decisionChanged),physicalForkDifferenceEvidence:B.checks.some(q=>q.physicalFork?.changed)});
 }
 return {pairs,provisionalAdvantageGate:pairs.length===5&&
  pairs.filter(p=>p.sameOrBetter).length>=4&&pairs.some(p=>p.strictlyBetter)&&pairs.every(p=>!p.extraDeath),
  note:'This is an engineering criterion, not statistical or phenomenological proof.'};
}
function main(){
 const quick=process.argv.includes('--quick');
 fs.mkdirSync(ROOT,{recursive:true});
 const metadata={schema:'pretorius.recurrent-coupling-trial.v1',
  frozenBaseline:PRE,initialSource:'Simple Tower v1.8 verified executable',
  executionSha:process.env.GITHUB_SHA||'local-unpinned',node:process.version,
  preregSha256:fileHash('research/RECURRENT_COUPLING_PREREG_2026-11-20.md'),
  codeHashes:{coupling:fileHash('src/recurrent_coupling.js'),actions:fileHash('src/actions.js'),
   trial:fileHash('scripts/recurrent_coupling_trial.js')},
  parameters:{CAP,GAIN,WINDOW},seedList:SEEDS,arms:ARMS,
  horizons:quick?[{seed:11,days:7}]:[...SEEDS.map(seed=>({seed,days:90})),{seed:11,days:365}],
  command:'node scripts/recurrent_coupling_trial.js'+(quick?' --quick':''),
  caveats:['No new messages, model calls or fictional rescues','The physical receipts diverge only after action differences']};
 fs.writeFileSync(path.join(ROOT,'metadata.json'),JSON.stringify(metadata,null,2)+'\n',{flag:'wx'});
 const rows=[];
 try{
  for(const {seed,days} of metadata.horizons)for(const arm of ARMS){
   const x=life(seed,arm,days);rows.push(x);
   console.log('RECURRENT_ARM '+JSON.stringify({arm,seed,days,kept:x.kept,broken:x.broken,
    interrupted:x.interruptions,fixation:x.fixationEpisodes,waste:x.wasteUnits,dead:x.dead,
    influenced:x.decisionsWithNonzeroInfluence,choiceLesion:x.checks.some(y=>y.decisionChanged)}));
  }
 }finally{
  fs.writeFileSync(path.join(ROOT,'summary.json'),JSON.stringify({metadata,results:rows,analysis:evaluate(rows)},null,2)+'\n');
 }
 if(!quick&&rows.length!==18)process.exitCode=2;
}
if(require.main===module)main();
module.exports={main,life,metric,evaluate,ablationCheck};
