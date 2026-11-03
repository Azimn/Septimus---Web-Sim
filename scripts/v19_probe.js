'use strict';
// v1.9 matched 180-day re-runs against untouched v1.8 annual evidence.
// No post-hoc seeded repairs. Any missed threshold remains visible.
const fs=require('node:fs'),path=require('node:path');
const {life}=require('./v18_probe');
const B11=JSON.parse(fs.readFileSync(path.join(__dirname,'../evidence/v1.8/year-seed-11.json'),'utf8'));
const B14=JSON.parse(fs.readFileSync(path.join(__dirname,'../evidence/v1.8/half-year-seed-14.json'),'utf8'));
const sum=(rows,key)=>rows.reduce((n,x)=>n+(x[key]||0),0);
function seriesAt(r,id,n=6){
 const e=r.series.find(x=>x.id===id);
 const c=e.instances.filter(x=>x.ordinal<=n);
 return {id,opened:c.length,kept:c.filter(x=>x.status==='kept').length,
  broken:c.filter(x=>x.status==='broken').length,
  instances:c.map(x=>({id:x.id,status:x.status,progress:x.progress,
   required:x.required,breakCause:x.cause||null}))};
}
function one(seed,baseline){
 const newer=life(seed,180),pre=baseline.monthly.slice(0,6),post=newer.monthly.slice(0,6);
 const getSeries=(r)=>['MONTH-FOLIO','MONTH-INSTRUMENT','MONTH-PROVISIONS'].map(id=>seriesAt(r,id));
 const before={seed,months:6,science:baseline.snapshots.find(x=>x.elapsedDay===180)?.skills.science,
  household:baseline.snapshots.find(x=>x.elapsedDay===180)?.skills.household,
  expiredPreserved:sum(pre,'expiredPreserved'),preservedEaten:sum(pre,'preservedEaten'),
  harvestWaste:sum(pre,'harvestWaste'),series:getSeries(baseline),
  varietyCollapse:pre.flatMap(x=>x.sustainedNarrowDays).length,
  finalHealth:baseline.snapshots.find(x=>x.elapsedDay===180)?.health};
 const after={seed,months:6,science:newer.development.end.skills.science,
  household:newer.development.end.skills.household,
  expiredPreserved:sum(post,'expiredPreserved'),preservedEaten:sum(post,'preservedEaten'),
  harvestWaste:sum(post,'harvestWaste'),series:getSeries(newer),
  varietyCollapse:post.flatMap(x=>x.sustainedNarrowDays).length,
  fullDaySoftlocks:post.flatMap(x=>x.softlockedDays).length,
  finalHealth:newer.development.end.health,
  scienceCurve:[30,60,90,120,150,180].map(d=>({
   day:d,science:newer.snapshots.find(s=>s.elapsedDay===d)?.skills.science})),
  householdCurve:[30,60,90,120,150,180].map(d=>({
   day:d,household:newer.snapshots.find(s=>s.elapsedDay===d)?.skills.household})),
  skillChoiceInfluence:newer.skillChoiceInfluence,
  trustComposition:newer.trustComposition};
 const provisions=after.series.find(x=>x.id==='MONTH-PROVISIONS');
 const beforeProv=before.series.find(x=>x.id==='MONTH-PROVISIONS');
 const criteria={
  survived180:!newer.finalDead&&newer.physicalDaysAdvanced===180&&after.finalHealth>=50,
  preservedEaten:after.preservedEaten>0,
  preservedExpiryHalved:after.expiredPreserved<=before.expiredPreserved/2,
  noNewVarietyCollapse:after.varietyCollapse<=before.varietyCollapse,
  provisionFiveOfSix:provisions.kept>=5&&provisions.opened===6,
  otherSeriesUndegraded:['MONTH-FOLIO','MONTH-INSTRUMENT'].every(id=>
   after.series.find(x=>x.id===id).kept>=before.series.find(x=>x.id===id).kept),
  scienceUnder600:after.science<600,
  visiblyBendingScienceCurve:after.scienceCurve.at(-1).science-after.scienceCurve.at(-2).science<
   after.scienceCurve[1].science-after.scienceCurve[0].science,
  skillDecisionFactorsNonzero:after.skillChoiceInfluence.decisionsWithPositiveSkillFactor>0,
  physicalInventoryConserved:newer.invariants.nonnegativeStores&&newer.invariants.noSilentTopups
 };
 return {seed,before,after,criteria,
  unalteredPriorEvidence:baseline.sourceHead||'v1.8_source_locked',
  noSilentAdjustments:true};
}
function emit(prefix,value){
 const raw=Buffer.from(JSON.stringify(value),'utf8').toString('base64');
 console.log(prefix+'_BEGIN '+raw.length);
 for(let i=0;i<raw.length;i+=1800)console.log(prefix+'_PART '+Math.floor(i/1800)+' '+raw.slice(i,i+1800));
 console.log(prefix+'_END '+Math.ceil(raw.length/1800));
}
function main(){
 const results=[one(11,B11),one(14,B14)],pair={
  schema:'v1.9-part-A-matched-v1',sourceHead:process.env.GITHUB_SHA||'unversioned',
  baselines:{seed11:'frozen evidence/v1.8/year-seed-11.json, first six periods',
   seed14:'frozen evidence/v1.8/half-year-seed-14.json'},
  constants:require('../src/skill_growth').SKILL_RULES,
  rotation:require('../src/economy').ROTATION,
  provisions:require('../src/commitments').SERIES_TEMPLATES.find(x=>x.id==='MONTH-PROVISIONS'),
  runs:results};
 emit('V19_PART_A',pair);
 for(const r of results)console.log('V19_RERUN '+JSON.stringify({
  seed:r.seed,before:{expired:r.before.expiredPreserved,eaten:r.before.preservedEaten,
   provisions:r.before.series.at(-1).kept,science:r.before.science},
  after:{expired:r.after.expiredPreserved,eaten:r.after.preservedEaten,
   provisions:r.after.series.at(-1).kept,science:r.after.science},
  criteria:r.criteria}));
}
if(require.main===module)main();
module.exports={one,main};
