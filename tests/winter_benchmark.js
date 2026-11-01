'use strict';
// Measurement only: no change to the household, weather, price or survival policies.
const fs=require('node:fs'),path=require('node:path');
const World=require('../src/world'),Sim=require('../src/simulation'),Diary=require('../src/diary'),Calendar=require('../src/calendar');
const FULL_LIFE=['drink_sink','eat_meal','cook','harvest','catalog_order','collect_parcel','read_section','experiment'];
function run(){
 const start=performance.now(),archive=Diary.loadArchive();
 if(archive.status!=='verified_structure')throw Error('Frozen folio source not verified');
 const catalog=archive.records.map((r,index)=>({index,id:r.event_id,participants:r.participants||[],locations:r.locations||[],recall_cues:r.recall_cues||[]}));
 const seeds=[];
 for(let seed=1;seed<=10;seed++){
  let w=World.fresh(seed);w.day=124;const startTick=w.tick,kinds=new Set(),days=[{date:Calendar.dateForDay(w.day),wallet:w.wallet,health:w.health,coal:w.household.coal.dry+w.household.coal.wet,libraryDry:w.household.fabric.dryRooms.library}];
  const dryLosses=[],dryRecoveries=[],coalStockouts=[];let stockoutStart=null,emptyTicks=0,death=null;
  const before=performance.now();
  for(let i=0;i<60*144&&w.alive;i++){
   const prevDry=w.household.fabric.dryRooms.library;
   const out=Sim.step(w,{__historyCount:catalog.length,__folioCatalog:catalog});w=out.state;
   out.events.forEach(e=>kinds.add(e.kind));
   const dry=w.household.fabric.dryRooms.library,coal=w.household.coal.dry+w.household.coal.wet;
   if(prevDry&&!dry)dryLosses.push({tick:w.tick,date:Calendar.dateForDay(w.day)});
   if(!prevDry&&dry)dryRecoveries.push({tick:w.tick,date:Calendar.dateForDay(w.day)});
   if(coal===0){emptyTicks++;if(stockoutStart===null)stockoutStart=w.tick;}
   else if(stockoutStart!==null){coalStockouts.push({startTick:stockoutStart,endTick:w.tick-1,durationTicks:w.tick-stockoutStart});stockoutStart=null}
   if(days.at(-1).date!==Calendar.dateForDay(w.day))days.push({date:Calendar.dateForDay(w.day),wallet:w.wallet,health:w.health,coal,libraryDry:dry});
   if(!w.alive)death={tick:w.tick,date:Calendar.dateForDay(w.day),cause:w.deathCause,health:w.health};
  }
  if(stockoutStart!==null)coalStockouts.push({startTick:stockoutStart,endTick:w.tick,durationTicks:w.tick-stockoutStart+1});
  seeds.push({seed,startDate:'1899-11-01',startDay:124,requestedDays:60,completedTicks:w.tick-startTick,
   finalDate:Calendar.dateForDay(w.day),alive:w.alive,death,finalHealth:w.health,
   initialWallet:days[0].wallet,finalWallet:w.wallet,walletTrajectory:days,
   dryRoomLosses:dryLosses,dryRoomRecoveries:dryRecoveries,libraryDryAtEnd:w.household.fabric.dryRooms.library,
   coalStockouts,coalEmptyTicks:emptyTicks,coalAtEnd:w.household.coal.dry+w.household.coal.wet,
   roofRepairs:w.household.fabric.roofRepaired,floorRepairs:w.household.fabric.floorRepaired,
   fullLife:FULL_LIFE.every(k=>kinds.has(k)),fullLifeMissing:FULL_LIFE.filter(k=>!kinds.has(k)),
   eventKinds:[...kinds].sort(),runtimeMs:Math.round(performance.now()-before)});
 }
 const elapsed=Math.round(performance.now()-start);
 const alive=seeds.filter(s=>s.alive).length;
 const out={version:1,kind:'winter_observation_untuned',protocol:'docs/FOLIO_MEMORY_PREREGISTRATION_V2.md',
  requestedStart:'1899-11-01',actualStart:'1899-11-01',window:'60 days',ticksPerDay:144,
  seedsRun:10,runtimeMs:elapsed,modelCalls:0,uneditedPhysics:true,
  summary:{alive,dead:10-alive,fullLife:seeds.filter(s=>s.fullLife).length,
   deathsByCause:seeds.reduce((a,s)=>{if(s.death)a[s.death.cause]=(a[s.death.cause]||0)+1;return a},{}),
   totalCoalEmptyTicks:seeds.reduce((a,s)=>a+s.coalEmptyTicks,0),
   dryRoomLosses:seeds.reduce((a,s)=>a+s.dryRoomLosses.length,0),
   dryRoomRecoveries:seeds.reduce((a,s)=>a+s.dryRoomRecoveries.length,0)},
  seeds};
 const dir=path.join(__dirname,'../results');fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'winter_60_day.json'),JSON.stringify(out,null,2)+'\n');
 const lines=['# Winter survival benchmark: 60 days (no tuning)','','Measurement: November 1, 1899 (calendar day 124) through 60 simulated days, 10 fixed seeds. Runtime '+elapsed+' ms.',
  '','Survived '+alive+'/10, full-life '+out.summary.fullLife+'/10. Death causes: '+JSON.stringify(out.summary.deathsByCause)+'. Total coal-empty ticks '+out.summary.totalCoalEmptyTicks+'. Library dry-room losses '+out.summary.dryRoomLosses+', recoveries '+out.summary.dryRoomRecoveries+'.',
  '','| Seed | Ticks | Alive / death | Final wallet | Dry losses / recovery | Coal stock-outs | Full-life | Runtime ms |',
  '|---|---:|---|---:|---|---:|---|---:|',
  ...seeds.map(s=>`| ${s.seed} | ${s.completedTicks} | ${s.alive?'alive':s.death?.cause} | ${s.finalWallet} | ${s.dryRoomLosses.length} / ${s.dryRoomRecoveries.length} | ${s.coalStockouts.length} | ${s.fullLife} | ${s.runtimeMs} |`),
  '','Full daily wallet and health trajectories, cold-stock intervals and damage transitions for each seed are in winter_60_day.json.',
  '','Limitations: these are simplified 1899 scenario dynamics, starting with July-style initial supplies shifted to November; the model does not simulate every exposure consequence or real historical prices. The winter benchmark is an observation, not a gate and no survival tuning was done.'];
 fs.writeFileSync(path.join(dir,'winter_60_day.md'),lines.join('\n')+'\n');
 console.log(JSON.stringify({summary:out.summary,runtimeMs:out.runtimeMs,seeds:seeds.map(s=>({seed:s.seed,alive:s.alive,death:s.death?.cause,ticks:s.completedTicks,wallet:s.finalWallet,fullLife:s.fullLife}))}));
 return out;
}
if(require.main===module)run();
module.exports={run};
