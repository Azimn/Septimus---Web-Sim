'use strict';
// E03-002, E22-012: damp coal and competing heating, food, science costs.
// E03-001, E22-001, E03-020: unreliable roof, stairs and repaired landings.
// E18-010: unmaintained tower-garden paths grow nettles over weeks.
const clamp=n=>Math.max(0,Math.min(100,n));
function hash(seed,n,salt=0){let x=(seed^Math.imul(n+1,2654435761)^Math.imul(salt+1,1597334677))>>>0;x^=x>>>16;x=Math.imul(x,2246822507);x^=x>>>13;return x>>>0}
function month(day){const d=new Date(Date.UTC(1899,6,1)+(day-1)*86400000);return d.getUTCMonth()+1}
function winter(day){return [11,12,1,2,3].includes(month(day))}
function price(base,day,kind){const m=month(day);const factor=kind==='coal'?(winter(day)?1.35:1):kind==='groceries'?([12,1,2].includes(m)?1.20:1):kind==='science'?(winter(day)?1.10:1):1;return Math.ceil(base*factor)}
function forecast(seed,day){return {rain:hash(seed,day,13)%100<(winter(day)?38:26),season:winter(day)?'cold':'mild'};}
function create(){return {coal:{dry:3,wet:0,storage:'coal_pile'},heat:{fuelledUntil:0,room:'kitchen',warmth:0},fabric:{roof:62,floor:53,roofRepaired:0,floorRepaired:0,leaking:false,dryRooms:{bedroom:true,library:true,kitchen:true},roomGoods:{library:{paper:3}}},garden:{pathTendedTick:0,nettles:0,lastEncroachDay:0},lastFabricDay:0,lastWeatherDay:0,weather:{rain:false,season:'mild'},observed:{coal:null,roof:null,floor:null,nettles:null}};}
function migrate(state){state.household??=create();const h=state.household;h.observed??={coal:null,roof:null,floor:null,nettles:null};return h}
function comfort(state,room){const h=migrate(state),cold=winter(state.day),heated=room==='kitchen'&&h.heat.fuelledUntil>=state.tick;
 const dry=h.fabric.dryRooms[room]!==false;
 const pipeBoost=heated?60:h.heat.fuelledUntil>=state.tick?(room==='bedroom'?34:room==='library'?24:8):0;
 return {heated,dry,warmth:clamp((cold?25:63)+pipeBoost+(dry?0:-22)-(h.fabric.roof<30?12:0))};
}
function transit(seed,orderId){const n=hash(seed,orderId,41);return {late:1+(n%9),wet:(hash(seed,orderId,42)%100)<37};}
function applyDay(state,emit){const h=migrate(state);if(h.lastFabricDay===state.day)return;
 const weather=forecast(state.seed,state.day);h.weather=weather;h.lastFabricDay=state.day;
 const rain=weather.rain;h.fabric.floor=clamp(h.fabric.floor-(state.day%3===0?.27:.11));
 h.fabric.roof=clamp(h.fabric.roof-(rain?.50:.16));
 const leaking=rain&&h.fabric.roof<47;
 if(leaking){h.fabric.dryRooms.library=false;h.fabric.leaking=true;
 // Weather damage is an objective world event, NOT automatically a perceived memory.
 if(state.day%3===0&&h.fabric.roomGoods.library.paper>0){h.fabric.roomGoods.library.paper--;emit('water_damage','A roof leak ruined a packet of papers in the tower library',{room:'library',good:'paper',lost:1},false);}
 }else if(!rain){h.fabric.leaking=false;}
 // E18-010: gradual encroachment begins after a week of neglect, with no arbitrary instant punishment.
 const daysSinceCare=state.day-Math.max(1,Math.floor(h.garden.pathTendedTick/144)+1);
 if(daysSinceCare>=7)h.garden.nettles=clamp(h.garden.nettles+Math.min(3,.35+daysSinceCare*.045));
 if(!rain&&h.coal.wet>0&&hash(state.seed,state.day,74)%4!==0){h.coal.wet--;h.coal.dry++;}
 if(state.day%5===0)emit('fabric_weather','Weather and wear altered the neglected tower',{rain,roofCondition:h.fabric.roof,floorCondition:h.fabric.floor,nettles:h.garden.nettles},false);
}
function traffic(state,emit){const h=migrate(state);h.fabric.floor=clamp(h.fabric.floor-.012);if(h.fabric.floor<12&&hash(state.seed,state.tick,68)%23===0){state.health=clamp(state.health-3);emit('floor_hazard','The stair boards shifted underfoot',{floor:'hall',healthLost:3},true);}}
function exposure(state,room,emit){const c=comfort(state,room);if(c.warmth<34){if(room==='bedroom'&&state.tick%4===0)state.health=clamp(state.health-.65);if(state.tick%18===0)emit('cold_exposure','The chamber was cold enough to disturb rest and strength',{room},true);}return c}
module.exports={create,migrate,month,winter,price,forecast,transit,applyDay,traffic,comfort,exposure,hash};
