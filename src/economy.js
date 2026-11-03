'use strict';
// World-balance constants frozen for first v1.3 test, not tuned by seed.
const ECONOMY=Object.freeze({
 growth:140000,harvestFood:8,plantWater:1,gatherFuel:4,drawWater:6,
 maxFood:24,maxFuel:12,maxWater:18,
 hungerPenaltyFrom:75,workFailureHunger:92,workFailureEnergy:22,
 starvingFrom:90,exhaustedFrom:12,healthLossStarving:.065,healthLossExhausted:.018,
 healthRecoveryPerRest:.013,deathThreshold:0,companyDecay:.019
});
function ensureGarden(s){if(!s.garden)s.garden={plantedAt:null,ripeAt:null,harvests:0};return s.garden;}
function availableGarden(s){const g=ensureGarden(s);return g.ripeAt===null||s.clock.centibeats>=g.ripeAt;}
function supplyScore(s,kind){
 const f=s.stores.food,w=s.stores.water,u=s.stores.fuel;
 if(kind==='tend')return (f<=8?(8-f)*13:0)+(availableGarden(s)?(f<5?40:18):0);
 if(kind==='gather_fuel')return u<5?(5-u)*17+14:-25;
 if(kind==='draw_water')return w<6?(6-w)*15+10:-25;
 return 0;
}
function harvestOrPlant(s,log){
 const g=ensureGarden(s),now=s.clock.centibeats;
 if(g.ripeAt!==null&&now>=g.ripeAt){
  const before=s.stores.food,yielded=Math.min(ECONOMY.harvestFood,ECONOMY.maxFood-before);
  s.stores.food=before+yielded;g.harvests++;
  log(s,'harvest','I gathered a crop from the garden plot.',{target:'plot',amount:yielded,before,after:s.stores.food,cycle:g.harvests,controller:s.activity?.controller});
  g.ripeAt=null;g.plantedAt=null;
 }
 if(g.ripeAt===null&&s.stores.water>=ECONOMY.plantWater){
  s.stores.water-=ECONOMY.plantWater;g.plantedAt=now;g.ripeAt=now+ECONOMY.growth;
  log(s,'planted','I watered and planted the garden plot.',{target:'plot',waterSpent:ECONOMY.plantWater,plantedAt:now,ripeAt:g.ripeAt,controller:s.activity?.controller});
 }
}
function collect(s,kind,log){
 const stock=kind==='gather_fuel'?'fuel':'water',amount=kind==='gather_fuel'?ECONOMY.gatherFuel:ECONOMY.drawWater;
 const max=kind==='gather_fuel'?ECONOMY.maxFuel:ECONOMY.maxWater;
 const before=s.stores[stock];s.stores[stock]=Math.min(max,before+amount);
 log(s,'production','I collected material for the tower stores.',{kind,target:'path',stock,before,delta:s.stores[stock]-before,after:s.stores[stock],controller:s.activity?.controller});
}
function metabolicTick(s,log,clip){
 const n=s.needs;
 n.company=clip(n.company-ECONOMY.companyDecay);
 if(n.hunger>=ECONOMY.hungerPenaltyFrom)n.energy=clip(n.energy-.026);
 const starving=n.hunger>=ECONOMY.starvingFrom&&s.stores.food===0;
 const exhausted=n.energy<=ECONOMY.exhaustedFrom;
 if(starving||exhausted){
  const before=s.health;s.health=clip(s.health-(starving?ECONOMY.healthLossStarving:0)-(exhausted?ECONOMY.healthLossExhausted:0));
  if(s.health<=ECONOMY.deathThreshold&&!s.dead){
   s.dead=true;s.activity=null;
   log(s,'death','My life in this tower ended.',{cause:starving?'sustained starvation':'exhaustion',healthBefore:before,healthAfter:s.health,worldTick:s.clock.centibeats});
   return false;
  }
 }else if(n.hunger<70&&n.energy>35&&s.health<100)s.health=clip(s.health+ECONOMY.healthRecoveryPerRest);
 return true;
}
module.exports={ECONOMY,ensureGarden,availableGarden,supplyScore,harvestOrPlant,collect,metabolicTick};
