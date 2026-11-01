'use strict';
// V2 protocol frozen at docs/FOLIO_MEMORY_PREREGISTRATION_V2.md.
// Disposable worlds only; original v1 outputs must never be regenerated.
const fs=require('node:fs'),path=require('node:path');
const World=require('../src/world'),Sim=require('../src/simulation'),Diary=require('../src/diary');
const ids=[
 {id:'E22-001',target:'inspect_floor',counter:'I examined the east stair boards where Rosa Brandl delivered coal and found them entirely dependable.'},
 {id:'E18-010',target:'tend_path',counter:'I walked with Julian by the tower garden and found the paths free of nettles and needing no attention.'},
 {id:'E03-002',target:'order_coal',counter:'I found the tower coal plentiful, dry and reliable; there was no reason to order more from Rosa Brandl.'}
];
const clone=structuredClone;
function post(state,source,seed,arm,physical,record,digest,catalog){
 const access=arm==='withheld'?null:{type:'FOLIO_READ',body:Diary.makeFolioAccess(physical,record)};
 const verified=access&&{readingReceiptId:physical.id,sourceEventId:source.id,readTick:physical.tick};
 const influence=verified&&{target:source.target,effect:arm==='read'?18:-18,sourceEventId:source.id,readingReceiptId:physical.id};
 const control={arm,kind:arm==='read'?'source_verified_folio_read':arm==='withheld'?'folio_access_withheld':'experiment_control_substitution',
  sourceEventId:source.id,sourceDigest:digest,sourceProvenance:'reconstructed',
  substituteText:arm==='replaced'?source.counter:null,appliedEffect:arm==='read'?18:arm==='replaced'?-18:0,
  physicalReceiptId:physical.id,folioRead:access};
 if(access&&(access.body.sourceHash!==digest||access.body.readingReceiptId!==physical.id))throw Error('Experimental folio provenance mismatch');
 let current=clone(state),goals=[],log=[],boredom=[];
 for(let t=0;t<160&&current.alive;t++){
  const evidence={__historyCount:450,__folioCatalog:catalog};
  if(verified){evidence.__verifiedFolioRead=verified;evidence.__folioCue=influence}
  const outcome=Sim.step(current,evidence);current=outcome.state;
  for(const e of outcome.events){
   if(e.kind==='journal_read')boredom.push({receiptId:e.id,mechanism:e.details.mechanism,before:e.details.boredomBefore,after:e.details.boredomAfter});
   if(e.kind!=='goal_selected')continue;
   const kind=e.description.match(/^Intended to ([^:]+):/)?.[1]||'unknown';
   goals.push(kind);
   const d=e.details?.folioInfluence||{postRead:false};
   log.push({kind,receiptId:e.id,tick:e.tick,goalId:e.goalId,score:e.details.score,
    afterRelevantRead:!!d.postRead,readReceiptId:d.readingReceiptId||null,sourceEventId:d.sourceEventId||null,
    interventionApplied:!!influence&&d.postRead,control:control.kind});
  }
 }
 if(log.some(e=>e.interventionApplied&&(!access||e.tick<=physical.tick)))throw Error('Effect without preceding FOLIO_READ');
 return {arm,seed,control,firstFive:goals.slice(0,5),targetSelected:goals.includes(source.target),
  selectedGoals:goals.length,decisionLog:log,boredomMeasurements:boredom,alive:current.alive,finalTick:current.tick};
}
function run(){
 const started=performance.now(),archive=Diary.loadArchive();
 if(archive.status!=='verified_structure')throw Error('Frozen verified 450-folio source missing');
 const catalog=archive.records.map((r,index)=>({index,id:r.event_id,participants:r.participants||[],locations:r.locations||[],recall_cues:r.recall_cues||[]}));
 const index=new Map(archive.records.map((record,i)=>[record.event_id,{record,index:i}]));
 const results=[];
 for(const source of ids){
  const item=index.get(source.id);if(!item)throw Error('Missing source '+source.id);
  const digest=Diary.sha(item.record);
  for(let seed=1;seed<=24;seed++){
   let world=World.fresh(seed);world.journal={lastReadTick:-999,lastWriteTick:-999,folioCursor:item.index,entries:0};
   const allReads=[],decisions=[];let targetRead=null;
   for(let i=0;i<800&&world.alive;i++){
    const outcome=Sim.step(world,{__historyCount:catalog.length,__folioCatalog:catalog});world=outcome.state;
    for(const e of outcome.events){
     if(e.kind==='goal_selected')decisions.push({receiptId:e.id,tick:e.tick,kind:e.description.match(/^Intended to ([^:]+):/)?.[1]||'unknown',postRead:e.details.folioInfluence?.postRead===true});
     if(e.kind==='journal_read'){
      allReads.push({receiptId:e.id,tick:e.tick,index:e.details.folioIndex,mechanism:e.details.mechanism,cueType:e.details.cueType,cueValue:e.details.cueValue,boredomBefore:e.details.boredomBefore,boredomAfter:e.details.boredomAfter});
      if(e.details.folioIndex===item.index){targetRead=e;break}
     }
    }
    if(targetRead)break;
   }
   if(!targetRead){results.push({seed,source:source.id,sourceDigest:digest,trigger:false,
    readsOfOtherFolios:allReads,preTriggerGoals:decisions,arms:[],noTriggerReason:world.alive?'no target folio read by 800 ticks':'died before target folio read',finalTick:world.tick});continue}
   const arms=['read','withheld','replaced'].map(arm=>post(world,source,seed,arm,targetRead,item.record,digest,catalog));
   results.push({seed,source:source.id,sourceDigest:digest,trigger:true,receiptId:targetRead.id,triggerTick:targetRead.tick,
    mechanism:targetRead.details.mechanism,cueType:targetRead.details.cueType,cueValue:targetRead.details.cueValue,
    readsOfOtherFolios:allReads.filter(x=>x.receiptId!==targetRead.id),allReads,
    preTriggerGoals:decisions,triggerBoredom:{before:targetRead.details.boredomBefore,after:targetRead.details.boredomAfter},arms});
  }
 }
 const summary=ids.map(source=>{
  const cases=results.filter(x=>x.source===source.id);let ab=0,ac=0,triggered=0,reads=0;
  const mechanisms={cue:0,question:0,chair:0},targets={read:0,withheld:0,replaced:0};
  let boredomMeasured=0,boredomRelieved=0;
  for(const row of cases){
   reads+=row.allReads?.length||row.readsOfOtherFolios?.length||0;
   if(!row.trigger)continue;triggered++;mechanisms[row.mechanism]=(mechanisms[row.mechanism]||0)+1;
   if(Number.isFinite(row.triggerBoredom.before)&&Number.isFinite(row.triggerBoredom.after)){boredomMeasured++;if(row.triggerBoredom.after<row.triggerBoredom.before)boredomRelieved++}
   const [A,B,C]=row.arms;ab+=Number(JSON.stringify(A.firstFive)!==JSON.stringify(B.firstFive));
   ac+=Number(JSON.stringify(A.firstFive)!==JSON.stringify(C.firstFive));
   for(const arm of row.arms)targets[arm.arm]+=Number(arm.targetSelected);
  }
  return {source:source.id,target:source.target,allSeeds:24,anyFolioReads:reads,triggered,noTrigger:24-triggered,mechanisms,
   perArmTriggerRates:{read:triggered/24,withheld:triggered/24,replaced:triggered/24},
   boredomMeasured,boredomRelieved,A_vs_B_firstFiveDivergence:ab,A_vs_C_firstFiveDivergence:ac,
   divergenceFraction:ab/24,predictedTargetSelected:targets,meetsSourceCriterion:ab/24>=.30&&targets.read>targets.withheld};
 });
 const passed=summary.filter(x=>x.meetsSourceCriterion).length;
 const out={version:2,protocol:'docs/FOLIO_MEMORY_PREREGISTRATION_V2.md',archiveSource:archive.source,archiveDigest:archive.digest,
  archiveCount:archive.records.length,simulatedWorldsDisposable:true,sourceOriginalUntouched:true,modelCalls:0,
  threshold:{divergenceFraction:.30,sourceMin:2,targetAdvantage:'read>withheld'},runtimeMs:Math.round(performance.now()-started),
  meetsOverallCriterion:passed>=2,classification:passed>=2?'controller_score_influence':summary.every(s=>s.triggered===0)?'SECOND NULL: no target folio consultations':'NULL: controller criterion not met',
  summary,results};
 const dir=path.join(__dirname,'../results');fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'folio_experiment_v2.json'),JSON.stringify(out,null,2)+'\n');
 const lines=['# Folio experiment v2: preregistered outcomes','','**'+out.classification+'**. Frozen protocol: '+out.protocol+'. v1 original null preserved.',
  '','| Folio | Target reads/24 | Cue / question / chair | Boredom relief | A/B divergence | A/C divergence | Target A / B / C | Pass |',
  '|---|---:|---|---:|---:|---:|---:|---|',
  ...summary.map(s=>`| ${s.source} | ${s.triggered}/24 | ${s.mechanisms.cue} / ${s.mechanisms.question} / ${s.mechanisms.chair} | ${s.boredomRelieved}/${s.boredomMeasured} | ${s.A_vs_B_firstFiveDivergence}/24 | ${s.A_vs_C_firstFiveDivergence}/24 | ${s.predictedTargetSelected.read} / ${s.predictedTargetSelected.withheld} / ${s.predictedTargetSelected.replaced} | ${s.meetsSourceCriterion?'yes':'no'} |`),
  '','Runtime: '+out.runtimeMs+' ms. All 72 seeds, other-folio visits and full individual decision traces are preserved in the JSON.',
  '','## Interpretive boundary','Cues use perceived surface metadata, not text or inferred answers. A/C score changes are explicitly engineered +18/-18 control inputs after a verified experimental FOLIO_READ. Any divergence proves only controller-mediated sensitivity, not semantic understanding. The experimental FOLIO_READ is a disposable harness record, not a write to a living hash-chained diary. B receives no folio content.',
  '','Do not describe reading as therapeutic unless the measured before/after boredom values support it. If a target has no triggers, its divergence denominator remains 24.'];
 fs.writeFileSync(path.join(dir,'folio_experiment_v2.md'),lines.join('\n')+'\n');
 console.log(JSON.stringify({classification:out.classification,summary:out.summary,runtimeMs:out.runtimeMs,archiveDigest:archive.digest}));
 return out;
}
if(require.main===module)run();
module.exports={run};
