'use strict';
// World-balance constants frozen for first v1.3 test, not tuned by seed.
const ECONOMY=Object.freeze({
 growth:140000,harvestFood:8,plantWater:1,gatherFuel:4,drawWater:6,
 maxFood:24,maxFuel:12,maxWater:18,
 hungerPenaltyFrom:75,workFailureHunger:92,workFailureEnergy:22,
 starvingFrom:90,exhaustedFrom:12,healthLossStarving:.065,healthLossExhausted:.018,
 healthRecoveryPerRest:.013,deathThreshold:0,companyDecay:.019
});
// v1.5 surplus options are additive: the v1.3 ECONOMY object above is unchanged.
// Food is tracked as physical batches; resource receipts are the only writer of gains.
// These declared scenario constants are frozen before endurance, not silently tuned.
const SURPLUS=Object.freeze({
 preserveInput:6,preserveOutput:5,preserveFuel:1,preserveDuration:3000,
 maxPreserved:144,freshShelfLifeDays:12,preservedShelfLifeDays:90,
 tradeInputPreserved:5,tradeInputFresh:5,tradeFuelOutput:2,tradeTeaOutput:2,
 maxTea:18,keepFreshForTrade:7,tradeDuration:1300,
 prioritizeFuelBelow:10,prioritizeTeaBelow:14
});
const {DAY}=require('./world');
function batches(s){
 s.stores.preserved??=0;
 s.freshBatches??=[{quantity:s.stores.food,createdAt:s.clock.centibeats}].filter(x=>x.quantity>0);
 s.preservedBatches??=[{quantity:s.stores.preserved,createdAt:s.clock.centibeats}].filter(x=>x.quantity>0);
 // Legacy test fixtures can directly assign store numbers. Reconcile these explicit
 // interventions rather than manufacturing or hiding resources during normal gameplay.
 for(const [key,array] of [['food',s.freshBatches],['preserved',s.preservedBatches]]){
  let total=array.reduce((v,x)=>v+x.quantity,0),want=s.stores[key]||0;
  if(total<want)array.push({quantity:want-total,createdAt:s.clock.centibeats,source:'legacy_intervention'});
  else if(total>want)removeBatches(array,total-want);
 }
}
function removeBatches(array,amount){
 let remaining=amount;
 while(remaining>0&&array.length){
  const current=array[0],used=Math.min(remaining,current.quantity);
  current.quantity-=used;remaining-=used;
  if(current.quantity===0)array.shift();
 }
 if(remaining!==0)throw Error('Insufficient physical batch stock');
}
function drawStock(s,kind,count){
 batches(s);if((s.stores[kind]||0)<count)throw Error('Insufficient '+kind);
 removeBatches(kind==='food'?s.freshBatches:s.preservedBatches,count);
 s.stores[kind]-=count;
}
function putFresh(s,count,sourceEventTick){
 batches(s);
 const allowed=Math.max(0,Math.min(count,ECONOMY.maxFood-s.stores.food));
 if(allowed>0){s.stores.food+=allowed;s.freshBatches.push({quantity:allowed,createdAt:sourceEventTick});}
 return allowed;
}
function preserve(s,log){
 batches(s);
 if(s.stores.food<SURPLUS.preserveInput||s.stores.fuel<SURPLUS.preserveFuel||
   s.stores.preserved+SURPLUS.preserveOutput>SURPLUS.maxPreserved)throw Error('Preservation materials or capacity missing');
 const before={food:s.stores.food,preserved:s.stores.preserved,fuel:s.stores.fuel};
 drawStock(s,'food',SURPLUS.preserveInput);
 s.stores.fuel-=SURPLUS.preserveFuel;
 s.stores.preserved+=SURPLUS.preserveOutput;
 s.preservedBatches.push({quantity:SURPLUS.preserveOutput,createdAt:s.clock.centibeats});
 const receipt=log(s,'preservation','I put fresh produce into preserved stores using fuel and time.',{
  target:'stove',before,after:{food:s.stores.food,preserved:s.stores.preserved,fuel:s.stores.fuel},
  inputs:{food:SURPLUS.preserveInput,fuel:SURPLUS.preserveFuel},
  output:{preserved:SURPLUS.preserveOutput},controller:s.activity?.controller,
  economyContract:'v1.5-surplus-v1'});
 return receipt;
}
function tradeOffer(s){
 const p=s.people?.visitor_01;
 if(!p?.present||p.manuallyIntroduced)return null;
 const payment=s.stores.preserved>=SURPLUS.tradeInputPreserved?'preserved':
   s.stores.food>=SURPLUS.keepFreshForTrade+SURPLUS.tradeInputFresh?'food':null;
 if(!payment)return null;
 if(s.stores.fuel<=SURPLUS.prioritizeFuelBelow-1&&s.stores.fuel+SURPLUS.tradeFuelOutput<=ECONOMY.maxFuel)
  return {payment,count:payment==='preserved'?SURPLUS.tradeInputPreserved:SURPLUS.tradeInputFresh,
   receive:'fuel',gain:SURPLUS.tradeFuelOutput};
 if(s.stores.tea<=SURPLUS.prioritizeTeaBelow-1&&s.stores.tea+SURPLUS.tradeTeaOutput<=SURPLUS.maxTea)
  return {payment,count:payment==='preserved'?SURPLUS.tradeInputPreserved:SURPLUS.tradeInputFresh,
   receive:'tea',gain:SURPLUS.tradeTeaOutput};
 return null;
}
function trade(s,log){
 const offer=tradeOffer(s);
 if(!offer)throw Error('No legal surplus offer');
 const before={food:s.stores.food,preserved:s.stores.preserved,fuel:s.stores.fuel,tea:s.stores.tea};
 drawStock(s,offer.payment,offer.count);
 s.stores[offer.receive]+=offer.gain;
 return log(s,'trade_receipt','I exchanged actual surplus provisions for another finite household good.',{
  personId:'visitor_01',target:'visitor_01',payment:offer.payment,unitsGiven:offer.count,
  received:offer.receive,unitsReceived:offer.gain,
  before,after:{food:s.stores.food,preserved:s.stores.preserved,fuel:s.stores.fuel,tea:s.stores.tea},
  controller:s.activity?.controller,economyContract:'v1.5-surplus-v1'});
}
function consumeMeal(s,log,kind='eat'){
 batches(s);
 const source=s.stores.food>0?'food':'preserved';
 if(s.stores[source]<1)throw Error('All edible stores exhausted');
 const before=s.stores[source];drawStock(s,source,1);
 log(s,'meal_stock','I drew one actual portion from household stores.',{
  sourceStock:source,amount:1,before,after:s.stores[source],kind,
  rule:'fresh_first_preserved_when_fresh_empty'});
 return source;
}
function spoil(s,log){
 batches(s);
 if(s.surplusAgeDay===s.clock.day)return;
 s.surplusAgeDay=s.clock.day;
 for(const [stock,list,shelf] of [
  ['food',s.freshBatches,SURPLUS.freshShelfLifeDays],
  ['preserved',s.preservedBatches,SURPLUS.preservedShelfLifeDays]]){
  const before=s.stores[stock],expired=list.filter(batch=>s.clock.centibeats-batch.createdAt>=shelf*DAY);
  const amount=expired.reduce((sum,b)=>sum+b.quantity,0);
  if(!amount)continue;
  const old=new Set(expired);const keep=list.filter(batch=>!old.has(batch));list.splice(0,list.length,...keep);
  s.stores[stock]-=amount;
  log(s,'spoilage','Stored provisions became unusable after their recorded shelf life.',{
   stock,amount,before,after:s.stores[stock],shelfLifeDays:shelf,
   economyContract:'v1.5-surplus-v1'});
 }
}
function ensureGarden(s){if(!s.garden)s.garden={plantedAt:null,ripeAt:null,harvests:0};return s.garden;}
function availableGarden(s){const g=ensureGarden(s);return g.ripeAt===null||s.clock.centibeats>=g.ripeAt;}
function supplyScore(s,kind){
 const f=s.stores.food,w=s.stores.water,u=s.stores.fuel;
 if(kind==='tend')return (f<=8?(8-f)*13:0)+(availableGarden(s)?(f<5?40:18):0);
 if(kind==='gather_fuel')return u<5?(5-u)*17+14:-25;
 if(kind==='draw_water')return w<6?(6-w)*15+10:-25;
 if(kind==='preserve'){
  const ripe=ensureGarden(s).ripeAt,soon=ripe!==null&&ripe-s.clock.centibeats<22000;
  return Math.max(-40,(f-9)*11+(soon?25:0));
 }
 if(kind==='trade'){
  const offer=tradeOffer(s);if(!offer)return -100;
  return 68+(offer.receive==='fuel'?(10-u)*8:(14-(s.stores.tea||0))*7)+
   (offer.payment==='preserved'?Math.min(50,s.stores.preserved*0.8):0);
 }
 return 0;
}
function harvestOrPlant(s,log){
 const g=ensureGarden(s),now=s.clock.centibeats;
 if(g.ripeAt!==null&&now>=g.ripeAt){
  const before=s.stores.food,yielded=putFresh(s,ECONOMY.harvestFood,now),wasted=ECONOMY.harvestFood-yielded;
  g.harvests++;
  log(s,'harvest','I gathered a crop from the garden plot.',{
   target:'plot',amount:yielded,before,after:s.stores.food,cycle:g.harvests,
   potential:ECONOMY.harvestFood,wasted,controller:s.activity?.controller});
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
 const starving=n.hunger>=ECONOMY.starvingFrom&&s.stores.food===0&&(s.stores.preserved||0)===0;
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
module.exports={ECONOMY,SURPLUS,batches,drawStock,putFresh,preserve,tradeOffer,trade,consumeMeal,spoil,ensureGarden,availableGarden,supplyScore,harvestOrPlant,collect,metabolicTick};
