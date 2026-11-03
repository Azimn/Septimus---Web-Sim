'use strict';
// Post-correction real-engine oracle. No policy, price or pantry modifications.
const fs=require('node:fs'),path=require('node:path');
const W=require('../src/world'),S=require('../src/simulation'),H=require('../src/household');
function run(name){
 let s=W.fresh(133);s.day=124;s.health=100;s.stock.meals=100;
 s.booksRead=[...W.BOOKS];s.needs={hunger:0,thirst:0,fatigue:0,bladder:0,boredom:0};
 s.position=name==='boredom'?{x:5,y:5}:{x:2,y:2};
 let high=0,low=100,restoration=0,actions=0,shortfallTicks=0,healthLoss=0,healthRestored=0;
 const max=8640,started=performance.now();let startHealth=s.health;
 for(let i=0;i<max&&s.alive;i++){
  if(name!=='fatigue'&&name!=='health_cold_sleep')s.needs.fatigue=0;
  if(name!=='boredom')s.needs.boredom=0;
  s.needs.hunger=0;s.needs.thirst=0;s.needs.bladder=0;
  if(name!=='health_cold_sleep')s.health=100; // isolate from cold damage
  if(!s.goal){
   const act=name==='boredom'?(s.needs.boredom>=52?'reflect':'wait'):(s.needs.fatigue>=50?'sleep':'wait');
   s.goal={id:'ORACLE-'+i,kind:act,target:act==='sleep'?'bed':act==='reflect'?'table':name==='boredom'?'hearth':'bed',detail:{}};
  }
  const before=s.health;const out=S.step(s,{});s=out.state;
  const meter=name==='boredom'?s.needs.boredom:s.needs.fatigue;
  high=Math.max(high,meter);low=Math.min(low,meter);
  if(meter>=80)shortfallTicks++;
  healthLoss+=Math.max(0,before-s.health);
  healthRestored+=Math.max(0,s.health-before);
  for(const e of out.events){
   if(e.kind==='sleep'||e.kind==='reflection'){
    actions++;restoration+=e.kind==='sleep'?e.details.restRelief:23;
   }
  }
 }
 return {name,requestedTicks:max,completedTicks:s.tick,alive:s.alive,deathCause:s.deathCause,
  peakNeed:high,lowestNeed:low,ticksCritical:shortfallTicks,completedRestorativeActions:actions,
  restorativeUnits:restoration,restorationPerDay:restoration/(Math.max(s.tick,1)/144),
  finalNeed:name==='boredom'?s.needs.boredom:s.needs.fatigue,finalHealth:s.health,
  totalHealthDamage:healthLoss,totalHealthRecovery:healthRestored,
  runtimeMs:Math.round(performance.now()-started)};
}
const runs=['fatigue','boredom','health_cold_sleep'].map(run);
const out={kind:'corrected_real_engine_need_equilibrium',audit:'docs/NEEDS_ARITHMETIC_AUDIT.md',
 isolatedExternalControls:'unrelated needs set to zero, nonhealth control health restored externally; cold health case retains genuine cold damage',
  corrections:['A03/E03 sleep cold 42->44','A05/E05 reflect 22->23','A07/E07 health +10 per completed sleep'],
 totalSimulatedTicks:runs.reduce((a,x)=>a+x.completedTicks,0),runs};
const dir=path.join(__dirname,'../results');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'needs_equilibrium_corrected.json'),JSON.stringify(out,null,2)+'\n');
const lines=['# Corrected physiological equilibrium, observed with actual actions','','This experiment is *not* a resource-limited survival game. Unrelated needs are silenced and the ordinary simulator executes every action and travel tick.',
'','| Loop | Reached ticks | Alive | Peak measured need | Critical ticks | Restorations | Restoration per day | End health |',
'|---|---:|---|---:|---:|---:|---:|---:|',
...runs.map(x=>`| ${x.name} | ${x.completedTicks}/8640 | ${x.alive} | ${x.peakNeed.toFixed(2)} | ${x.ticksCritical} | ${x.completedRestorativeActions} | ${x.restorationPerDay.toFixed(3)} | ${x.finalHealth.toFixed(2)} |`),
'','These are finite 60-day demonstrations. Arithmetic closure remains a separate rate-bound argument in the pre-correction audit; no outcome here justifies adjusting prices or canon.'];
fs.writeFileSync(path.join(dir,'needs_equilibrium_corrected.md'),lines.join('\n')+'\n');
console.log(JSON.stringify(out));
