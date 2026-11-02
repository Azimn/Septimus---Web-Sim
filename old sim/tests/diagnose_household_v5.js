'use strict';
// Diagnostic ONLY. Never modifies archived experimental data or supplies.
// Run: node tests/diagnose_household_v5.js
const World=require('../src/world'),Sim=require('../src/simulation'),Cal=require('../src/calendar'),Pantry=require('../src/pantry');
const scenarios=[{id:'september',day:63},{id:'november',day:124,stores:true}];
function run(seed,scenario){
 let w=World.fresh(seed);w.day=scenario.day;w.policyOptions={survivalFloor:true};w.scenarioEconomy={reportPaymentDelay:22};
 if(scenario.stores){w.household.coal.dry+=20;w.stock.vegetables+=8;w.stock.grain+=6;w.stock.milk+=4;w.stock.meals+=6;}
 const counts={},trip={},spend={},money=[],lastDays=[],trajectory=[];
 const beginning=w.day,MAX=(scenario.stores?60:121)*144;
 for(let t=0;t<MAX&&w.alive;t++){
  const {state:s,events}=Sim.step(w);w=s;
  for(const e of events){
   counts[e.kind]=(counts[e.kind]||0)+1;
   if(e.kind==='walk'){const key=e.details.objectId;trip[key]=(trip[key]||0)+1;}
   if(e.kind==='catalog_order'){const kind=e.description.match(/to (.+)$/)?.[1]||'?';spend[kind]=(spend[kind]||0)+e.details.price;}
   if(['collect_payment','report_posted','catalog_order','collect_parcel','put_away','coal_collected','eat_meal','experiment'].includes(e.kind)){
    money.push({tick:w.tick,date:Cal.dateForDay(w.day),kind:e.kind,details:e.details,wallet:w.wallet,food:Pantry.portions(w.stock),pending:w.orders.filter(o=>!o.collected).map(o=>o.type),goal:w.goal?.kind});
   }
  }
  if(w.tick%144===0){trajectory.push({date:Cal.dateForDay(w.day),wallet:w.wallet,food:Pantry.portions(w.stock),hunger:+w.needs.hunger.toFixed(1),coal:w.household.coal.dry+w.household.coal.wet,reagents:w.stock.reagents,spares:w.stock.spares,reports:w.researchReports,pending:w.orders.filter(o=>!o.collected).map(o=>o.type),goal:w.goal?.kind});
  }
 }
 const end=trajectory.at(-1)?.date||Cal.dateForDay(w.day);
 const tail=money.slice(-35).map(({tick,date,kind,wallet,food,pending,goal})=>({tick,date,kind,wallet,food,pending,goal}));
 return {scenario:scenario.id,seed,alive:w.alive,lastDate:Cal.dateForDay(w.day),days:+((w.tick/144).toFixed(2)),wallet:w.wallet,health:w.health,need:w.needs,food:Pantry.portions(w.stock),coal:w.household.coal.dry+w.household.coal.wet,reagents:w.stock.reagents,spares:w.stock.spares,reports:w.researchReports,counters:counts,travelTargets:trip,spending:spend,daysTail:trajectory.slice(-14),moneyTail:tail};
}
for(const scenario of scenarios)for(const seed of [1,2])console.log('HOUSEHOLD_V5_TRACE '+JSON.stringify(run(seed,scenario)));
