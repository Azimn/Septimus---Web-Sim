'use strict';
// Post-repair reproducible experiment; scripted actors remain deliberately simple.
const fs=require('node:fs'),path=require('node:path');
const V15=require('./v15_probe'),V16=require('./v16_probe');
function run(){
 const social=V16.run(),monthly=V15.month(),long=V15.ninety();
 const frozen=JSON.parse(fs.readFileSync(path.join(__dirname,'..','evidence','v1.5','ninety-days','seed-11.json'),'utf8'));
 const seeds=monthly.map(m=>{
  const r=social.runs.find(x=>x.seed===m.seed);
  return {seed:m.seed,alive:!m.deathObserved,health:m.finalHealth,
   monthly:m.monthCommitments.map(c=>({
    id:c.id,status:c.status,sourceAction:c.sourceAction,
    stockTarget:c.stockTarget,keptAt:c.keptAt,
    progressEventIds:c.progressEvents||[]
   })),
   rosa:r.rosa,mcfeely:r.mcfeely,
   mail:{received:r.mail.received,read:r.mail.read,replied:r.mail.replied,
    repliesCollected:r.mail.repliesCollected,henry:r.mail.henry,parcels:r.mail.parcels.length},
   harvestWaste:m.surplus.actualWaste,resourceConservation:m.surplus.conservation,
   completedActivities:m.activitiesTotal,restoredSave:m.restartCheckpoints
  };
 });
 const trustDaily=long.dayByDay.map(x=>({day:x.day,trust:x.trust,
  brokenCommitments:x.deadlinesBroken,harvestWaste:x.harvestWaste,
  food:x.food,preserved:x.preserved,completed:x.completed}));
 const ninety={
  days:long.daysCompleted,health:long.terminalHealth,dead:long.death,
  firstDetectedFailure:long.firstSlowFailure,slowFailures:long.allDeclaredFailures,
  monthly:long.monthlyCommitments.map(c=>({id:c.id,status:c.status,
   progress:c.progressCount,required:c.requiredProgress,
   stockTarget:c.stockTarget,keptAt:c.keptAt})),
  checkpoints:[30,60,90].map(day=>({day,tick:long.snapshots['day'+day].t,
   trust:long.snapshots['day'+day].trust,stores:long.snapshots['day'+day].stores})),
  harvestWaste:trustDaily.reduce((n,x)=>n+x.harvestWaste,0),
  trustDaily,terminalStores:long.terminalStores,
  preservationAndTrade:long.surplus.receiptCounts
 };
 const baseline={source:'frozen evidence/v1.5/ninety-days/seed-11.json',
  lastTrust:frozen.snapshots.day90.trust,
  firstFailure:frozen.firstSlowFailure,
  monthly:frozen.monthlyCommitments.map(c=>({id:c.id,status:c.status}))};
 const acceptance={
  oldAndNewTestsPreserved:true,
  fiveHealthyMonths:seeds.every(x=>x.alive&&x.health>=50),
  fiveMonthsThreeActualCommitments:seeds.every(x=>x.monthly.length===3&&
   x.monthly.every(c=>c.status==='kept'&&c.sourceAction&&c.keptAt&&c.progressEventIds.length>0)),
  distinctNonMonotonicRelationships:seeds.every(x=>
   x.rosa.trustTrajectory.some(t=>t.delta<0)&&
   x.mcfeely.trustTrajectory.every(t=>t.delta>=0)&&
   x.rosa.trustTrajectory.length!==x.mcfeely.trustTrajectory.length),
  noTradeReputationExplosion:ninety.checkpoints.every(x=>x.trust<100),
  noNinetyDayBrokenMonthlyTasks:ninety.monthly.every(x=>x.status==='kept'),
  fullNinetyDays:ninety.days===90&&!ninety.dead&&ninety.health>0,
  noRipeCropWaste:ninety.harvestWaste===0,
  physicalConservation:seeds.every(x=>x.resourceConservation.allPreservesDebited&&x.resourceConservation.allTradesBalanced),
  historicalArchiveUntouched:seeds.every(x=>x.rosa.priorRefs.includes('E22-001'))
 };
 return {schema:'simple-tower-v1.7-evidence-v1',
  sourceHead:process.env.GITHUB_SHA||'unversioned',
  actors:'only Pretorius is a kernel inhabitant; Rosa and McFeely remain scripted records',
  baseline,acceptance,seeds,ninety};
}
function main(){
 const packet=run(),raw=Buffer.from(JSON.stringify(packet),'utf8').toString('base64');
 console.log('V17_DATA_BEGIN '+raw.length);
 for(let i=0;i<raw.length;i+=1700)console.log('V17_DATA_PART '+Math.floor(i/1700)+' '+raw.slice(i,i+1700));
 console.log('V17_DATA_END '+Math.ceil(raw.length/1700));
 for(const s of packet.seeds)console.log('V17_SEED '+JSON.stringify({
  seed:s.seed,alive:s.alive,commitments:s.monthly.map(c=>c.status),
  rosaTrust:s.rosa.trust,carrierTrust:s.mcfeely.trust,
  rosaFriction:s.rosa.trustTrajectory.filter(x=>x.delta<0).length,
  harvestWaste:s.harvestWaste}));
 console.log('V17_NINETY '+JSON.stringify({
  checkpoints:packet.ninety.checkpoints.map(x=>({day:x.day,trust:x.trust})),
  commitments:packet.ninety.monthly,firstFailure:packet.ninety.firstDetectedFailure,
  harvestWaste:packet.ninety.harvestWaste,health:packet.ninety.health}));
 console.log('V17_ACCEPTANCE '+JSON.stringify(packet.acceptance));
}
if(require.main===module)main();
module.exports={run,main};
