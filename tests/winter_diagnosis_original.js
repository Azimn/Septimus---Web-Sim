'use strict';
// Frozen v2 winter replay. Run before ANY balance or Maslow modifications.
const fs=require('node:fs'),path=require('node:path');
const W=require('../src/world'),S=require('../src/simulation'),D=require('../src/diary'),H=require('../src/household'),Cal=require('../src/calendar');
const archive=D.loadArchive(),catalog=archive.records.map((f,index)=>({index,id:f.event_id,participants:f.participants||[],locations:f.locations||[],recall_cues:f.recall_cues||[]}));
const DEST=path.join(__dirname,'../results');
const spendingKind=e=>{
 if(e.kind!=='catalog_order')return null;
 const d=e.details||{};
 return d.supplierId==='rosa_brandl'?'coal':e.description.includes('grocer')||e.description.includes('tea merchant')||e.description.includes('seed house')?'food':e.description.includes('scientific catalog')?'science':'other';
};
const runs=[];
for(let seed=1;seed<=10;seed++){
 const started=performance.now();let w=W.fresh(seed);w.day=124;
 const purchases=[],income=[],goals=[],observations=[],byDay={},deaths=[];
 for(let t=0;t<60*144&&w.alive;t++){
  const previous={wallet:w.wallet,hunger:w.needs.hunger,thirst:w.needs.thirst,health:w.health};
  const result=S.step(w,{__historyCount:450,__folioCatalog:catalog});w=result.state;
  for(const e of result.events){
   const cat=spendingKind(e);
   if(cat){purchases.push({tick:e.tick,date:e.calendarDate,category:cat,amount:e.details.price,receipt:e.id,description:e.description,goalId:e.goalId});}
   if(e.kind==='collect_payment')income.push({tick:e.tick,date:e.calendarDate,amount:e.details.amount,receipt:e.id});
   if(e.kind==='goal_selected')goals.push({tick:e.tick,date:e.calendarDate,kind:e.description.match(/^Intended to ([^:]+):/)?.[1]||'unknown',score:e.details.score,receipt:e.id,goalId:e.goalId});
   if(e.kind==='death')deaths.push(e);
  }
  if(w.tick%6===0||!w.alive){
   const room=W.roomAt(w.position.x,w.position.y);
   observations.push({tick:w.tick,date:Cal.dateForDay(w.day),minute:w.minute,wallet:w.wallet,
    hunger:w.needs.hunger,thirst:w.needs.thirst,fatigue:w.needs.fatigue,bladder:w.needs.bladder,boredom:w.needs.boredom,
    health:w.health,warmth:H.comfort(w,room).warmth,coal:w.household.coal.dry+w.household.coal.wet,
    meals:w.stock.meals,vegetables:w.stock.vegetables,grain:w.stock.grain,milk:w.stock.milk,room,goal:w.goal?.kind||null});
  }
 }
 const finalDay=w.day;
 const finalSevenStart=finalDay-6,finalSeven=observations.filter(x=>x.date>=Cal.dateForDay(finalSevenStart));
 const lastPurchases=purchases.filter(x=>x.date>=Cal.dateForDay(finalSevenStart));
 const totals={food:0,coal:0,science:0,other:0};
 for(const p of lastPurchases)totals[p.category]+=p.amount;
 const lastIncome=income.filter(x=>x.date>=Cal.dateForDay(finalSevenStart));
 const lastGoals=goals.filter(x=>x.date>=Cal.dateForDay(finalSevenStart));
 runs.push({seed,endDate:Cal.dateForDay(w.day),finalTick:w.tick,alive:w.alive,deathCause:w.deathCause,deathReceipts:deaths,
  finalNeeds:{...w.needs,health:w.health,localWarmth:H.comfort(w,W.roomAt(w.position.x,w.position.y)).warmth},
  finalWallet:w.wallet,final7DaySpending:totals,final7DayPurchases:lastPurchases,
  final7DayIncome:lastIncome,final7DayGoals:lastGoals,
  final7DayNeedTrajectory:finalSeven,final20Goals:goals.slice(-20),
  allTimePurchases:purchases,allTimeIncome:income,
  totalIncome:income.reduce((a,e)=>a+e.amount,0),totalSpent:purchases.reduce((a,e)=>a+e.amount,0),
  runtimeMs:Math.round(performance.now()-started)});
}
const summary={seeds:10,allDead:runs.every(x=>!x.alive),last7Totals:{food:0,coal:0,science:0,other:0},
 deathCauses:runs.reduce((a,r)=>(a[r.deathCause]=(a[r.deathCause]||0)+1,a),{})};
for(const r of runs)for(const k of Object.keys(summary.last7Totals))summary.last7Totals[k]+=r.final7DaySpending[k];
const out={kind:'original_v2_replay_diagnostic',originalEvidence:'results/winter_60_day.json',
 protocol:'docs/FOLIO_MEMORY_PREREGISTRATION_V3.md',preChangeEngine:true,
 archiveDigest:archive.digest,runWindow:'1899-11-01 until death, max 60 days',
 sampleIntervalTicks:6,categoryMethod:'catalog_order paid receipts, not changes inferred from daily wallet',summary,runs};
fs.mkdirSync(DEST,{recursive:true});fs.writeFileSync(path.join(DEST,'winter_diagnosis_original.json'),JSON.stringify(out,null,2)+'\n');
const rows=['# Winter v2 original policy: deterministic replay diagnosis','','This script reran the original November-start seeds before any balance or controller modification. v2 result JSON only held daily wallet and health, not purchases and needs. This is independently generated receipt-level replay, not data retroactively present in v2.',
'','| Seed | Death date | Final hunger | Final thirst | Final warmth | Food (last 7d) | Coal | Science | Other | Last goal |',
'|---|---|---:|---:|---:|---:|---:|---:|---:|---|',
...runs.map(r=>`| ${r.seed} | ${r.endDate} | ${r.finalNeeds.hunger.toFixed(1)} | ${r.finalNeeds.thirst.toFixed(1)} | ${r.finalNeeds.localWarmth.toFixed(1)} | ${r.final7DaySpending.food} | ${r.final7DaySpending.coal} | ${r.final7DaySpending.science} | ${r.final7DaySpending.other} | ${r.final20Goals.at(-1)?.kind||'none'} |`),
'',`Category totals (10 seeds, each final 7 lived days): ${JSON.stringify(summary.last7Totals)}.`,
'','All recorded physical purchases, income receipts, hourly needs and final seven-day goals appear in the JSON; death labels remain the engine’s own and are not causal diagnoses.'];
fs.writeFileSync(path.join(DEST,'winter_diagnosis_original.md'),rows.join('\n')+'\n');
console.log(JSON.stringify({summary,perSeed:runs.map(r=>({seed:r.seed,tick:r.finalTick,death:r.deathCause,needs:r.finalNeeds,spending:r.final7DaySpending,lastGoal:r.final20Goals.at(-1)?.kind,finalWallet:r.finalWallet}))}));
