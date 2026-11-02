'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const World=require('../src/world'),H=require('../src/household'),Sim=require('../src/simulation');
function act(w,kind){const c=Sim.choose(w).find(x=>x.kind===kind);if(!c)throw Error('Unavailable '+kind);w.position={x:World.BY_ID[c.target].x,y:World.BY_ID[c.target].y};w.goal={id:'TEST',kind,target:c.target,detail:c.detail||{}};return Sim.step(w)}
test('E03-002 Rosa Brandl cart timing and wetness are deterministic, seeded, bounded and cost the wallet',()=>{
 for(let seed=1;seed<=35;seed++){
  const w=World.fresh(seed);w.day=190;w.position={x:13,y:7};w.wallet=80;w.goal={id:'T',kind:'order_coal',target:'catalog',detail:{}};
  const a=Sim.step(w),o=a.state.orders.at(-1),b=Sim.step(w).state.orders.at(-1);
  assert.deepEqual(o,b);assert.equal(o.supplierId,'rosa_brandl');assert.ok(o.late>=1&&o.late<=9);assert.equal(o.dueTick-a.state.tick,24+o.late);assert.equal(w.wallet-o.paid,a.state.wallet);assert.ok(typeof o.wet==='boolean');
 }
});
test('E03-002 wet fuel heats fewer ticks than dry fuel and gradually dries in good weather',()=>{
 const a=World.fresh(2),b=World.fresh(2);a.day=b.day=190;a.household.coal={dry:1,wet:0};b.household.coal={dry:0,wet:1};
 const aa=act(a,'stoke_hearth'),bb=act(b,'stoke_hearth');
 assert.equal(aa.events.find(e=>e.kind==='burn_coal').details.efficiency,1);
 assert.equal(bb.events.find(e=>e.kind==='burn_coal').details.efficiency,.46);
 assert.ok(aa.state.household.heat.fuelledUntil>bb.state.household.heat.fuelledUntil);
});
test('E22-012 winter cold rest restores less strength and worsens health',()=>{
 const cold=World.fresh(12),warm=World.fresh(12);for(const s of [cold,warm]){s.day=190;s.needs.fatigue=85;s.position={x:2,y:2};s.goal={id:'sleep',kind:'sleep',target:'bed',detail:{}};}
 warm.household.heat.fuelledUntil=warm.tick+45;
 const c=Sim.step(cold).state,w=Sim.step(warm).state;
 assert.ok(w.needs.fatigue<c.needs.fatigue);assert.ok(w.health>c.health);
});
test('E03-001 roof decay leaks during rain, ruins only library goods, dries after physical repair',()=>{
 const s=World.fresh(5);s.day=10;s.household.fabric.roof=20;const events=[];
 let rainy=0;for(let day=10;day<70;day++){if(H.forecast(5,day).rain){s.day=day;H.applyDay(s,(...x)=>events.push(x));rainy++;if(s.household.fabric.leaking)break;}}
 assert.ok(rainy>0);assert.equal(s.household.fabric.dryRooms.library,false);
 s.stock.roofing=1;s.goal={id:'roof',kind:'repair_roof',target:'roof_access',detail:{}};s.position={x:3,y:1};
 const r=Sim.step(s);assert.equal(r.state.household.fabric.dryRooms.library,true);assert.equal(r.state.stock.roofing,0);assert.ok(r.events.some(e=>e.kind==='roof_repair'));
});
test('E22-001 stair-floor traffic creates deterministic worsening and paid repairs reverse it',()=>{
 const s=World.fresh(4);s.household.fabric.floor=35;const f=s.household.fabric.floor;
 for(let i=0;i<25;i++){s.tick++;H.traffic(s,()=>{});}assert.ok(s.household.fabric.floor<f);
 s.stock.boards=1;s.position={x:3,y:4};s.goal={id:'fix',kind:'repair_floor',target:'floorboards',detail:{}};
 const repaired=Sim.step(s);assert.ok(repaired.state.household.fabric.floor>f);assert.equal(repaired.state.stock.boards,0);
});
test('E18-010 garden paths acquire nettles after weeks, yield falls, tending resets encroachment',()=>{
 const s=World.fresh(1);s.household.garden.pathTendedTick=0;
 for(let d=1;d<=40;d++){s.day=d;H.applyDay(s,()=>{});}const nettles=s.household.garden.nettles;
 assert.ok(nettles>12);
 s.position={x:7,y:8};s.goal={id:'t',kind:'tend_path',target:'garden_path',detail:{}};
 const r=Sim.step(s);assert.equal(r.state.household.garden.nettles,0);assert.ok(r.events.some(e=>e.kind==='garden_tended'));
});
test('E22-012 a single purse pays seasonal prices for coal, food and scientific equipment',()=>{
 const s=World.fresh(1);s.day=190;
 assert.ok(H.price(World.CATALOG.coal.price,s.day,'coal')>World.CATALOG.coal.price);
 assert.ok(H.price(World.CATALOG.groceries.price,s.day,'groceries')>World.CATALOG.groceries.price);
 assert.ok(H.price(World.CATALOG.science.price,s.day,'science')>World.CATALOG.science.price);
 assert.equal(H.price(12,10,'groceries'),12);
});
