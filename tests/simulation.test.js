'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {fresh,OBJECTS,pathBetween,roomAt}=require('../src/world');const {step,choose}=require('../src/simulation');const {createOrganism}=require('../src/organism');
const tmp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'septimus-test-'));
function within(fn){const dir=tmp();try{return fn(dir)}finally{fs.rmSync(dir,{recursive:true,force:true})}}
function advance(s,n){let current=s,events=[];for(let i=0;i<n&&current.alive;i++){const o=step(current);current=o.state;events.push(...o.events)}return {state:current,events}}
test('map has actual anchored objects and real paths through doorways',()=>{for(const ob of OBJECTS){assert.equal(roomAt(ob.x,ob.y)!==null,true);const a=pathBetween({x:2,y:2},ob);assert.ok(Array.isArray(a),ob.id);assert.ok(a.length<40,ob.id)}assert.equal(pathBetween({x:2,y:2},{x:0,y:0}),null);assert.equal(pathBetween({x:2,y:2},{x:2,y:2}).length,0)});
test('initial deterministic run reaches food, sink, books, work, garden and mail',()=>{
 const a=advance(fresh(),850);const types=new Set(a.events.map(e=>e.kind));for(const key of ['drink_sink','eat_meal','cook','plant','water_garden','harvest','repair','experiment','read_section','catalog_order','delivery_arrived','collect_parcel','put_away'])assert.ok(types.has(key),key);assert.equal(a.state.alive,true);assert.ok(a.state.counters.deliveries>0);assert.ok(a.state.wallet>=0);
});
test('same initial world yields identical goals and receipts',()=>{let a=fresh(41),b=fresh(41);for(let n=0;n<80;n++){a=step(a).state;b=step(b).state;assert.deepEqual(a,b)}});
test('a catalog order debits real money, arrives at the mailbox, and remains unavailable until collected and put away',()=>{
 let w=fresh();w.position={x:13,y:7};w.stock.meals=0;w.stock.vegetables=0;w.stock.milk=0;w.stock.grain=0;w.wallet=40;w.needs.hunger=65;w.needs.thirst=5;
 const choice=choose(w).find(x=>x.kind==='order_groceries');assert.ok(choice);const o=step(w);const placed=o.state.orders.find(x=>x.type==='staples');assert.ok(placed);assert.equal(o.state.wallet,14);assert.equal(o.state.stock.vegetables,0);assert.equal(o.state.stock.grain,0);
 let current=o.state,received=null;for(let i=0;i<20;i++){const v=step(current);current=v.state;received??=v.events.find(e=>e.kind==='delivery_arrived');if(received)break}assert.ok(received);assert.equal(current.stock.vegetables,0);assert.equal(current.orders[0].arrived,true);
});
test('death from physical starvation/dehydration is irreversible and not fixed by narration',()=>{
 let w=fresh();w.needs.hunger=100;w.needs.thirst=100;w.wallet=0;w.health=12;w.stock={...w.stock,meals:0,vegetables:0,milk:0,grain:0};w.position={x:12,y:7};
 let r=advance(w,10);assert.equal(r.state.alive,false);assert.ok(r.events.some(e=>e.kind==='death'));assert.equal(r.state.health,0);const t=step(r.state);assert.equal(t.state.tick,r.state.tick);
});
test('vegetable and tea crops require actual planting, water, elapsed time and physical harvest',()=>{
 const r=advance(fresh(),850);const e=r.events;for(const crop of ['vegetables','tea']){
   const planted=e.find(x=>x.kind==='plant'&&x.details.crop===crop),water=e.find(x=>x.kind==='water_garden'&&x.details.crop===crop),ripe=e.find(x=>x.kind==='crop_ripened'&&x.details.crop===crop),harvest=e.find(x=>x.kind==='harvest'&&(crop==='tea'?x.description.includes('tea'):x.description.includes('vegetables')));
   assert.ok(planted,crop);assert.ok(water,crop);assert.ok(ripe,crop);assert.ok(harvest,crop);assert.ok(planted.tick<water.tick);assert.ok(water.tick<ripe.tick);assert.ok(ripe.tick<=harvest.tick);
 }
});
test('archived event chain and all world source receipts survive cold restart',()=>within(dir=>{
 const unit=createOrganism({dir});for(let i=0;i<115;i++)unit.tick();const initial=unit.view();const next=createOrganism({dir});assert.deepEqual(next.view().world,initial.world);assert.equal(next.view().lastHash,initial.lastHash);assert.ok(next.view().memories.every(m=>m.source==='world_receipt'));
 next.tick();assert.equal(next.view().world.tick,116);
}));
test('tampered journal is rejected rather than silently rewritten',()=>within(dir=>{
 const a=createOrganism({dir});for(let i=0;i<4;i++)a.tick();const f=path.join(dir,'events.jsonl');let v=fs.readFileSync(f,'utf8');const existing=JSON.parse(v.split('\n')[0]).body.world.lastAction;assert.ok(v.includes(existing));v=v.replace(existing,'I am secretly immortal.');fs.writeFileSync(f,v);assert.throws(()=>createOrganism({dir}),/Journal hash/);
}));
test('external identity cannot be silently edited on reload',()=>within(dir=>{
 const original=path.join(__dirname,'../identity.json'),identityPath=path.join(dir,'identity.json');fs.copyFileSync(original,identityPath);const world=path.join(dir,'world');createOrganism({dir:world,identityPath});const v=JSON.parse(fs.readFileSync(identityPath,'utf8'));v.name='Joe';fs.writeFileSync(identityPath,JSON.stringify(v));assert.throws(()=>createOrganism({dir:world,identityPath}),/Immutable external identity/);
}));
test('narration never becomes a world event or verified memory; contradictions are marked',()=>within(dir=>{
 const a=createOrganism({dir});const e=a.recordNarration('I am in the laboratory. My name is Joe. I have repaired the instrument.');assert.equal(e.memoryEligible,false);assert.ok(e.divergence.length>=2);assert.equal(a.view().memories.length,0);assert.equal(a.view().recentEvents.length,0);
}));
test('shuffled and removed memory produce different score evidence without source rewrites',()=>within(dir=>{
 const unit=createOrganism({dir});let control,observed=false;for(let i=0;i<900;i++){unit.tick();control=unit.compareMemory();const linked=control.linked.scores,none=control.none.scores;if(Object.keys(linked).some(k=>linked[k]!==none[k])){observed=true;break}}assert.ok(observed,'at least one authentic memory changes a live candidate score');assert.deepEqual(control.shuffled.memoryIds,[]);assert.deepEqual(unit.compareMemory(),control);
}));
test('saved running toggle survives restart without the browser',()=>within(dir=>{
 const u=createOrganism({dir});assert.equal(u.view().running,false);u.setRunning(true);assert.equal(createOrganism({dir}).view().running,true);u.setRunning(false);assert.equal(createOrganism({dir}).view().running,false)
}));
test('catalog purchases, receipts and inventory never go negative over long-run seeds',()=>{
 for(let seed=1;seed<=15;seed++){let state=fresh(seed);for(let i=0;i<1200&&state.alive;i++){const result=step(state);state=result.state;assert.ok(state.wallet>=0,`${seed} wallet`);for(const [k,v] of Object.entries(state.stock))assert.ok(v>=0,`${seed} ${k}`)}}
});
