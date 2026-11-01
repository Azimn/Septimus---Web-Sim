'use strict';
// PRE-REGISTERED in docs/FOLIO_MEMORY_PREREGISTRATION.md before trial outcomes.
// This harness uses disposable worlds only. It never rewrites canon or a lived journal.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const World=require('../src/world'),Simulation=require('../src/simulation'),Diary=require('../src/diary');
const ids=[
 {id:'E22-001',target:'inspect_floor',counter:'I examined the east stair boards where Rosa Brandl delivered coal and found them entirely dependable.'},
 {id:'E18-010',target:'tend_path',counter:'I walked with Julian by the tower garden and found the paths free of nettles and needing no attention.'},
 {id:'E03-002',target:'order_coal',counter:'I found the tower coal plentiful, dry and reliable; there was no reason to order more from Rosa Brandl.'}
];
const clone=structuredClone;
function sequenceAfter(state,source,seed,arm,trigger,sourceDigest){
 const targetEffect={read:18,withheld:0,replaced:-18}[arm];
 const cue=arm==='withheld'?null:{target:source.target,effect:targetEffect,sourceEventId:source.id,sourceDigest};
 const control={arm,kind:arm==='read'?'source_verified_folio_read':arm==='withheld'?'folio_access_withheld':'experiment_control_substitution',
  sourceEventId:source.id,sourceDigest,sourceProvenance:'reconstructed',
  substituteText:arm==='replaced'?source.counter:null,appliedEffect:targetEffect,
  triggerReceiptId:trigger.id,triggerWorldTick:trigger.tick};
 let current=clone(state),decisionLog=[],kinds=[];
 for(let tick=0;tick<160&&current.alive;tick++){
  const e={__historyCount:450};if(cue)e.__folioCue=cue;
  const r=Simulation.step(current,e);current=r.state;
  for(const rec of r.events.filter(x=>x.kind==='goal_selected')){
   kinds.push(rec.description.match(/^Intended to ([^:]+):/)?.[1]||'unknown');
   decisionLog.push({kind:kinds.at(-1),receiptId:rec.id,worldTick:rec.tick,reason:rec.description,physicalGoalId:rec.goalId,control:control.kind});
  }
 }
 return {arm,seed,control,firstFive:kinds.slice(0,5),targetSelected:kinds.includes(source.target),
  selectedGoals:kinds.length,decisionLog,alive:current.alive,finalTick:current.tick};
}
function main(){
 const archive=Diary.loadArchive();if(archive.status!=='verified_structure')throw Error('Verified 450-record corpus required. No proxy or substitute corpus is allowed for final research.');
 const corpus=new Map(archive.records.map((r,i)=>[r.event_id,{record:r,index:i}]));
 const results=[];
 for(const source of ids){const item=corpus.get(source.id);if(!item)throw Error('Historical source missing: '+source.id);
  const sourceDigest=Diary.sha(item.record);
  for(let seed=1;seed<=24;seed++){
   let w=World.fresh(seed);w.journal={lastReadTick:-999,lastWriteTick:-999,folioCursor:item.index,entries:0};
   let trigger=null,observed=null;
   for(let t=0;t<800&&w.alive;t++){
    const r=Simulation.step(w,{__historyCount:450});w=r.state;
    const x=r.events.find(e=>e.kind==='journal_read');if(x){trigger=x;break;}
   }
   if(!trigger){results.push({seed,source:source.id,sourceDigest,trigger:false,arms:[],note:'no-trigger within 800 ticks, included as failure in 24-seed denominator'});continue;}
   if(trigger.details.folioIndex!==item.index)throw Error('Wrong physical folio index selected');
   const arms=['read','withheld','replaced'].map(arm=>sequenceAfter(w,source,seed,arm,trigger,sourceDigest));
   results.push({seed,source:source.id,sourceDigest,trigger:true,receiptId:trigger.id,triggerTick:trigger.tick,arms});
  }
 }
 const summary=ids.map(source=>{
  const cases=results.filter(r=>r.source===source.id);let ab=0,ac=0,triggered=0,targets={read:0,withheld:0,replaced:0};
  for(const row of cases){if(!row.trigger)continue;triggered++;
   const [A,B,C]=row.arms;ab+=JSON.stringify(A.firstFive)!==JSON.stringify(B.firstFive)?1:0;ac+=JSON.stringify(A.firstFive)!==JSON.stringify(C.firstFive)?1:0;
   for(const a of row.arms)targets[a.arm]+=Number(a.targetSelected);
  }
  return {source:source.id,target:source.target,allSeeds:24,triggered,noTrigger:24-triggered,
   A_vs_B_firstFiveDivergence:ab,A_vs_C_firstFiveDivergence:ac,
   divergenceFraction:ab/24,predictedTargetSelected:targets,
   meetsSourceCriterion:ab/24>=.30&&targets.read>targets.withheld};
 });
 const totalPassing=summary.filter(s=>s.meetsSourceCriterion).length;
 const output={version:1,protocol:'docs/FOLIO_MEMORY_PREREGISTRATION.md',archiveSource:archive.source,archiveDigest:archive.digest,
  archiveCount:archive.records.length,simulatedWorldsDisposable:true,sourceOriginalUntouched:true,
  modelCalls:0,threshold:{divergenceFraction:.30,sourceMin:2,targetAdvantage:'read>withheld'},
  meetsOverallCriterion:totalPassing>=2,classification:totalPassing>=2?'controller_score_influence':'NULL: memory present but not load-bearing under preregistered criterion',summary,results};
 const dest=path.join(__dirname,'../results');fs.mkdirSync(dest,{recursive:true});
 fs.writeFileSync(path.join(dest,'folio_experiment_v1.json'),JSON.stringify(output,null,2)+'\n');
 const md=['# Preregistered folio experiment v1: original protocol and unaltered outcome','',
  `Result: **${output.classification}**. Source-confirmed 450 reconstructed events. No LLM was used.`,
  '', '| Folio | Triggered / 24 | A/B first-five divergence | A target / B target / C target | Preregistered criterion |',
  '|---|---:|---:|---:|---|',
  ...summary.map(s=>`| ${s.source} -> ${s.target} | ${s.triggered}/24 | ${s.A_vs_B_firstFiveDivergence}/24 (${(100*s.divergenceFraction).toFixed(1)}%) | ${s.predictedTargetSelected.read} / ${s.predictedTargetSelected.withheld} / ${s.predictedTargetSelected.replaced} | ${s.meetsSourceCriterion?'met':'NOT MET'} |`),
  '', 'Every no-trigger seed remains in the denominator and all goal decisions, provenance IDs and counter-folio controls are recorded in `folio_experiment_v1.json`.',
  'The effect values (+18, 0, -18) are an engineered controller intervention: even a positive result is **not semantic comprehension**. The original source corpus and ongoing world are unchanged.',
  '', '## Limitations',
  'The mechanism changes policy scores after receipt of an authentic folio, and the counter-folio is an explicit experiment-only substitution. The deterministic decision policy does not interpret first-person prose. The natural trigger could fail and repeated action patterns might obscure differences. Neither a model-based memory claim nor a persistent-human-range continuity claim is justified by this experiment.'
 ].join('\n');fs.writeFileSync(path.join(dest,'folio_experiment_v1.md'),md+'\n');
 console.log(JSON.stringify({classification:output.classification,summary,archiveDigest:archive.digest,resultsPath:'results/folio_experiment_v1.json'}));
}
if(require.main===module)main();
module.exports={main};
