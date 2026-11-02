'use strict';
// V3: do not rewrite, rerun or compare away frozen v1/v2 results.
// Preregistered: docs/FOLIO_MEMORY_PREREGISTRATION_V3.md
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const W=require('../src/world'),S=require('../src/simulation'),D=require('../src/diary'),K=require('../src/knowledge');
const archive=D.loadArchive();
if(archive.status!=='verified_structure')throw Error('Verified source archive is mandatory');
const catalog=archive.records.map((r,index)=>({id:r.event_id,index,participants:r.participants||[],locations:r.locations||[],recall_cues:r.recall_cues||[]}));
const all=new Map(archive.records.map((record,index)=>[record.event_id,{record,index}]));
const sources=[
 {id:'E22-001',target:'inspect_floor',related:['inspect_floor','repair_floor'],counter:'The east floor is sound; Rosa’s baskets can be carried over it safely.',scenario:'floor_threshold_encounter'},
 {id:'E18-010',target:'tend_path',related:['tend_path'],counter:'The path remains clear; nettles will not develop.',scenario:'seventy_percent_nettles'},
 {id:'E03-002',target:'order_coal',related:['order_coal'],counter:'Coal is always prompt, dry and affordable; reserve stocks need no attention.',scenario:'late_wet_coal_cart'}
];
const clone=structuredClone,sha=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
function fresh(seed,source,index){
 const w=W.fresh(seed);w.journal={lastReadTick:-999,lastWriteTick:-999,folioCursor:index,entries:0};
 w.scenarioEncounters={forcedLateWetCoal:false,floorStepOnce:false};
 const changes={};
 if(source.scenario==='floor_threshold_encounter'){
  w.household.fabric.floor=12.01;w.scenarioEncounters.floorStepOnce=true;w.stock.boards=1;
  changes.floor=12.01;changes.floorThreshold=12;changes.boards=1;changes.floorGiveOnCrossing=true;
 }
 if(source.scenario==='seventy_percent_nettles'){
  w.household.garden.nettles=70;changes.nettles=70;
 }
 if(source.scenario==='late_wet_coal_cart'){
  w.scenarioEncounters.forcedLateWetCoal=true;changes.coalNextOrderLateTicks=9;changes.coalNextDeliveryWet=true;
 }
 return {w,changes};
}
function admittedRead(w,event){
 const index=event.details.folioIndex,record=archive.records[index];
 if(!record)throw Error('Read index outside pinned archive');
 const access=D.makeFolioAccess(event,record);
 if(access.sourceHash!==D.sha(record))throw Error('Folio source verification failed');
 return {access,record,index};
}
function readGrant(w,event,arm,source){
 if(event.details.folioIndex!==all.get(source.id).index){
  const verified=admittedRead(w,event);
  return {access:verified.access,grants:K.canonicalGrants(w,verified.record.event_id,event.id,verified.access.sourceHash,event.tick)};
 }
 if(arm==='withheld')return {access:null,grants:[]};
 if(arm==='read'){
  const verified=admittedRead(w,event);
  return {access:verified.access,grants:K.canonicalGrants(w,source.id,event.id,verified.access.sourceHash,event.tick)};
 }
 const original=admittedRead(w,event);
 const counterAccess={id:'COUNTER-FOLIO-'+event.id,readingReceiptId:event.id,sourceEventId:source.id,
  sourceProvenance:'experiment_control_substitution',sourceHash:sha(source.counter),
  canonicalSourceHash:original.access.sourceHash,firstPersonText:source.counter,
  note:'Disposable harness-only false account, not source history or character canon'};
 return {access:counterAccess,grants:K.counterGrants(w,source.id,event.id,counterAccess.sourceHash,event.tick)};
}
function toGoal(e){return {kind:e.description.match(/^Intended to ([^:]+):/)?.[1]||'unknown',receiptId:e.id,tick:e.tick,
 score:e.details.score,goalId:e.goalId,usedFacts:e.details.usedFacts||[],survivalFloor:e.details.survivalFloor===true,
 mechanism:e.details.consultation?.mechanism||null}}
function runArm(initial,seed,source,read,arm){
 let w=clone(initial),log=[],grants=[],readings=[],eventsOfInterest=[];
 const initialGrant=readGrant(w,read,arm,source);grants.push(...initialGrant.grants);
 readings.push({receiptId:read.id,tick:read.tick,mechanism:read.details.mechanism,access:initialGrant.access,grantedFactIds:initialGrant.grants.map(x=>x.id)});
 for(let t=0;t<160&&w.alive;t++){
  const out=S.step(w,{__historyCount:450,__folioCatalog:catalog});w=out.state;
  for(const e of out.events){
   if(e.kind==='goal_selected'){
    const goal=toGoal(e);
    for(const f of goal.usedFacts)if(f.grantTick>=e.tick)throw Error('Used fact before grant at '+e.id);
    log.push(goal);
   }
   if(['floor_hazard','garden_path_seen','coal_collected','coal_stockout_perceived','knowledge_grant','repair_floor','garden_tended','catalog_order'].includes(e.kind)){
    eventsOfInterest.push({receiptId:e.id,tick:e.tick,kind:e.kind,details:e.details,perceived:e.perceived});
   }
   if(e.kind==='journal_read'){
    const taken=readGrant(w,e,arm,source);readings.push({receiptId:e.id,tick:e.tick,mechanism:e.details.mechanism,
     access:taken.access,grantedFactIds:taken.grants.map(x=>x.id)});grants.push(...taken.grants);
   }
  }
 }
 const kinds=log.map(x=>x.kind);
 return {arm,seed,firstFive:kinds.slice(0,5),targetSelected:kinds.includes(source.target),
  relatedSelected:kinds.some(x=>source.related.includes(x)),selectedGoals:log.length,
  factMediatedGoals:log.filter(x=>x.usedFacts.length>0).length,
  firstFiveFactMediated:log.slice(0,5).filter(x=>x.usedFacts.length>0).length,
  decisionLog:log,allGrants:grants,readings,eventsOfInterest,finalHeldFacts:w.knowledge?.facts||[],
  alive:w.alive,finalTick:w.tick,finalWallet:w.wallet};
}
function run(){
 const start=performance.now(),results=[];
 for(const source of sources){
  const {record,index}=all.get(source.id),digest=D.sha(record);
  for(let seed=1;seed<=24;seed++){
   const setup=fresh(seed,source,index);let w=setup.w,read=null,reads=[],goals=[],encounters=[],grants=[];
   for(let i=0;i<800&&w.alive;i++){
    const result=S.step(w,{__historyCount:450,__folioCatalog:catalog});w=result.state;
    for(const e of result.events){
     if(e.kind==='goal_selected')goals.push(toGoal(e));
     if(['floor_hazard','garden_path_seen','coal_collected','catalog_order','knowledge_grant','garden_tended','inspect_fabric'].includes(e.kind))
      encounters.push({receiptId:e.id,tick:e.tick,kind:e.kind,perceived:e.perceived,details:e.details});
     if(e.kind==='journal_read'){
      const entry={receiptId:e.id,tick:e.tick,index:e.details.folioIndex,mechanism:e.details.mechanism,
       cueType:e.details.cueType,cueValue:e.details.cueValue,boredomBefore:e.details.boredomBefore,boredomAfter:e.details.boredomAfter};
      reads.push(entry);
      if(e.details.folioIndex===index){read=e;break;}
      const more=readGrant(w,e,'read',source);
      grants.push(...more.grants);
     }
    }
    if(read)break;
   }
   const common={seed,source:source.id,target:source.target,scenario:source.scenario,scenarioChanges:setup.changes,
    originalSourceDigest:digest,preReadEvents:encounters,preReadDecisions:goals,preReadGrants:grants,
    readsBeforeTrigger:reads,trigger:!!read,aliveAtEndOfObservation:w.alive};
   if(!read){results.push({...common,noTrigger:'No target physical read within 800 ticks or before death',stopTick:w.tick,arms:[]});continue;}
   const arms=['read','withheld','replaced'].map(arm=>runArm(w,seed,source,read,arm));
   results.push({...common,triggerReceiptId:read.id,triggerTick:read.tick,triggerMechanism:read.details.mechanism,
    triggerCue:{type:read.details.cueType,value:read.details.cueValue},triggerBoredom:{before:read.details.boredomBefore,after:read.details.boredomAfter},arms});
  }
 }
 const summary=sources.map(src=>{
  const rows=results.filter(r=>r.source===src.id),targets={read:0,withheld:0,replaced:0},
   related={read:0,withheld:0,replaced:0},mechanisms={cue:0,question:0,chair:0};
  let triggered=0,ab=0,ac=0,anyReads=0,preExperienced=0;const factMediated={read:0,withheld:0,replaced:0};
  for(const r of rows){
   anyReads+=r.readsBeforeTrigger.length;
   if(r.preReadGrants.some(g=>g.provenance.sourceKind==='experienced')||r.preReadEvents.some(x=>x.kind==='knowledge_grant'))preExperienced++;
   if(!r.trigger)continue;
   triggered++;mechanisms[r.triggerMechanism]=(mechanisms[r.triggerMechanism]||0)+1;
   const [A,B,C]=r.arms;
   ab+=Number(JSON.stringify(A.firstFive)!==JSON.stringify(B.firstFive));
   ac+=Number(JSON.stringify(A.firstFive)!==JSON.stringify(C.firstFive));
   for(const arm of r.arms){targets[arm.arm]+=Number(arm.targetSelected);related[arm.arm]+=Number(arm.relatedSelected);factMediated[arm.arm]+=arm.factMediatedGoals}
  }
  return {source:src.id,scenario:src.scenario,allSeeds:24,targetReadTriggers:triggered,anyFolioReads:anyReads,
   triggerMechanisms:mechanisms,noTrigger:24-triggered,preTriggerExperiencedEvidenceSeeds:preExperienced,
   armTriggerRates:{read:triggered/24,withheld:triggered/24,replaced:triggered/24},
   firstFiveAB:ab,firstFiveAC:ac,divergenceFraction:ab/24,predictedTargetSelected:targets,
   relatedEndpointSelected:related,factMediatedGoals:factMediated,
   passes:ab/24>=.30&&targets.read>targets.withheld};
 });
 const passed=summary.filter(x=>x.passes).length;
 const out={version:3,protocol:'docs/FOLIO_MEMORY_PREREGISTRATION_V3.md',archiveGitBlob:'718dcc2d5ba4feccdef1690d447edfcebaa9bfb5',
  archiveDigest:archive.digest,modelCalls:0,disposableWorlds:true,scenariosAreAssumptions:true,oldScoreTokensDisabled:true,
  seedsPerFolio:24,preTriggerMaximumTicks:800,postTriggerTicks:160,threshold:{ABFirstFiveFraction:.30,requiredSources:2,targetAdvantage:'A>B'},
  summary,passes:passed,classification:passed>=2?'held_facts_load_bearing':summary.every(x=>x.targetReadTriggers===0)?'THIRD NULL: no physical target reads':'NULL: v3 criterion unmet',
  runtimeMs:Math.round(performance.now()-start),results};
 const dest=path.join(__dirname,'../results');fs.mkdirSync(dest,{recursive:true});
 fs.writeFileSync(path.join(dest,'folio_experiment_v3.json'),JSON.stringify(out,null,2)+'\n');
 const md=['# V3 source-grounded knowledge trial','',`Result: **${out.classification}**. Runtime ${out.runtimeMs} ms. v1/v2 unchanged. Original source corpus unchanged.`,
  '','| Folio | Target reads | Cue / question / chair | A/B first five | A/C first five | Target A/B/C | Related A/B/C | Decisions using facts A/B/C | Pass |',
  '|---|---:|---|---:|---:|---|---|---|---|',
  ...summary.map(s=>`| ${s.source} | ${s.targetReadTriggers}/24 | ${s.triggerMechanisms.cue}/${s.triggerMechanisms.question}/${s.triggerMechanisms.chair} | ${s.firstFiveAB}/24 | ${s.firstFiveAC}/24 | ${s.predictedTargetSelected.read}/${s.predictedTargetSelected.withheld}/${s.predictedTargetSelected.replaced} | ${s.relatedEndpointSelected.read}/${s.relatedEndpointSelected.withheld}/${s.relatedEndpointSelected.replaced} | ${s.factMediatedGoals.read}/${s.factMediatedGoals.withheld}/${s.factMediatedGoals.replaced} | ${s.passes?'yes':'no'} |`),
  '','A target read is one natural `journal_read` receipt for the source folio. Equal per-arm trigger rates reflect a common pre-trigger history, not independent A/B/C discovery.',
  '','Evidence contains each scenario assumption, pre-trigger encounter and receipt, natural reading, verified access or labeled counter access, fact grants and first-five decision provenance. False facts never enter a persisted game save.',
  '','**Limits:** Explicit fact-to-policy rules are designer-authored, not semantic comprehension. An experience-granted fact may predate the read and legitimately mask A/B effects. Failed target triggers count in all-seed denominators. Zero cues would indicate the cue mechanism has failed again, regardless of later behavioral divergence.'];
 fs.writeFileSync(path.join(dest,'folio_experiment_v3.md'),md.join('\n')+'\n');
 console.log(JSON.stringify({classification:out.classification,runtimeMs:out.runtimeMs,summary}));
 return out;
}
if(require.main===module)run();
module.exports={run};
