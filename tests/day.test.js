'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {initialState}=require('../src/world');
const {advance,direct}=require('../src/engine');
const {save,load}=require('../src/store');
const archive={sha:'historical-fixture',records:[{event_id:'E09-001',title:'The Magistrate’s Waiting Room',participants:['Septimus Pretorius'],locations:['Ingolstadt'],recall_cues:['magistrate'],provenance:'reconstructed',memory_text:'I remember the waiting room.'}]};
const identity={sha:'fixed-external-identity'};
function untilCompleted(s,kind,max=300){for(let i=0;i<max;i++){advance(s,archive,1);if(s.events.some(e=>e.type==='completed'&&e.kind===kind))return;}throw Error('Could not finish '+kind);}
test('a complete directed July tower day retains origin, interruption, diary, sleep and physical receipts',()=>{
 let s=initialState(identity.sha,archive.sha),dir=fs.mkdtempSync(path.join(os.tmpdir(),'tower-day-'));
 direct(s,'eat');untilCompleted(s,'eat');assert.equal(s.stores.food,6);
 direct(s,'work');advance(s,archive,12);assert.equal(s.activity.kind,'work');
 const file=path.join(dir,'save.json');save(file,s);s=load(file,identity,archive);
 assert.equal(s.activity.kind,'work');direct(s,'read','magistrate');untilCompleted(s,'read');
 assert.equal(s.folioReads[0].id,'E09-001');assert.equal(s.folioReads[0].provenance,'reconstructed');
 direct(s,'work');untilCompleted(s,'work');assert.ok(s.skills.science>2);
 direct(s,'prepare');untilCompleted(s,'prepare');assert.equal(s.commitments[0].done,true);
 direct(s,'diary');untilCompleted(s,'diary');assert.match(s.diary[0].text,/^I /);
 direct(s,'sleep');untilCompleted(s,'sleep');
 const before=s.clock.centibeats;advance(s,archive,Math.floor((100000-before)/100)+1);
 assert.equal(s.clock.day,1);assert.equal(s.calendar.date,'1899-07-02');assert.equal(s.calendar.triggeredDays[0],0);
 assert.ok(s.events.some(e=>e.type==='calendar'&&e.prepared===true));
 assert.ok(s.events.some(e=>e.type==='interrupted'));
 assert.ok(s.events.filter(e=>e.type==='completed').every(e=>e.description.startsWith('I ')));
 assert.equal(s.events.filter(e=>e.type==='completed'&&e.kind==='read').length,1);
 save(file,s);assert.deepEqual(load(file,identity,archive),s);
});
