'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const Calendar=require('../src/calendar'),World=require('../src/world'),Simulation=require('../src/simulation');
const {createOrganism}=require('../src/organism');
function within(fn){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tower-chronology-'));try{return fn(dir)}finally{fs.rmSync(dir,{recursive:true,force:true})}}
test('timeline begins after June 1899 and does not presume a move date',()=>{
 assert.deepEqual([Calendar.dateForDay(1),Calendar.dateForDay(185)],['1899-07-01','1900-01-01']);
 const d=Calendar.describe(World.fresh());assert.equal(d.time,'07:00');assert.equal(d.beat,'@291');
 assert.equal(d.departureDateEstablished,false);assert.equal(d.transferRecorded,false);
 assert.throws(()=>Calendar.dateForDay(0),/Invalid positive/);
});
test('new receipts have dates and play can continue into the next century',()=>{
 let s=World.fresh();
 assert.ok(Simulation.step(s).events.every(e=>e.calendarDate==='1899-07-01'));
 s.day=184;s.minute=1430;
 const next=Simulation.step(s);
 assert.equal(Calendar.describe(next.state).date,'1900-01-01');
 assert.equal(next.state.alive,true);
 assert.ok(next.events.every(e=>e.calendarDate==='1900-01-01'));
});
test('rooms and historical characters are indexed without inventing current occupants',()=>{
 assert.equal(World.RESIDENCE.properNameEstablished,false);
 assert.equal(World.RESIDENCE.departureDate,null);
 assert.equal(World.RESIDENCE.spaces.hall.level,'stairwell');
 assert.equal(World.RESIDENCE.spaces.kitchen.level,'ground');
 assert.equal(World.HISTORY_ARCHIVE.recordCount,450);
 assert.equal(World.HISTORY_ARCHIVE.importStatus,'not_imported');
 assert.ok(World.KNOWN_PEOPLE.some(p=>p.id==='rosa_brandl'&&p.livePresence==='not_simulated'));
 assert.ok(World.KNOWN_PEOPLE.every(p=>p.memoryIds.length>0));
});
test('existing saved worlds survive reload with date and canonical history links',()=>within(dir=>{
 const unit=createOrganism({dir});for(let i=0;i<40;i++)unit.tick();
 const before=unit.view(),after=createOrganism({dir}).view();
 assert.deepEqual(before.world,after.world);assert.equal(before.lastHash,after.lastHash);
 assert.equal(after.calendar.date,before.calendar.date);
 assert.deepEqual(after.knownPeople,before.knownPeople);
 assert.equal(after.historyArchive.importStatus,'not_imported');
 assert.ok(after.memories.every(m=>m.source==='world_receipt'));
}));
