'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {initialState,OBJECTS}=require('../src/world');
const {advance,direct,speak,view,log,social,cognition,voice}=require('../src/engine');
const {scores,available,applyMood}=require('../src/actions');
const archive={sha:'test-v11',records:[
 {event_id:'E09-001',title:'The Magistrate and the Tower',participants:['Septimus Pretorius'],locations:['Ingolstadt'],recall_cues:['magistrate'],provenance:'reconstructed',memory_text:'I remember the waiting room.'},
 {event_id:'E22-001',title:'The broken ladder',participants:['Septimus Pretorius'],locations:['Tower'],recall_cues:['ladder'],provenance:'reconstructed',memory_text:'I recall the broken step.'}
]};
const make=()=>initialState('identity-for-v11',archive.sha);
const count=(s,type)=>s.events.filter(e=>e.type===type).length;
function until(s,predicate,n=350){for(let i=0;i<n;i++){advance(s,archive,1);if(predicate())return;}throw Error('never reached state');}
test('scripted visitor arrives and leaves; only nearby subject perceives them',()=>{
 const s=make();s.clock.centibeats=43900;advance(s,archive,1);
 assert.equal(s.people.visitor_01.present,true);assert.equal(s.events.find(x=>x.type==='visitor_arrival').perceived,false);
 s.location='library';cognition.observe(s,log);assert.ok(s.perception.some(x=>x.id==='visitor_01'));
 s.clock.centibeats=59900;advance(s,archive,1);assert.equal(s.people.visitor_01.present,false);
});
test('gift/insult order affects derived per-person trust with logged factors',()=>{
 const a=make(),b=make();social.shared(a,log,'gift');social.shared(a,log,'insult');
 social.shared(b,log,'insult');social.shared(b,log,'gift');
 assert.notEqual(a.people.visitor_01.trust,b.people.visitor_01.trust);
 assert.ok(a.events.filter(x=>x.type==='social').every(x=>typeof x.delta==='number'));
});
test('private visitor testimony does not confer player knowledge',()=>{
 const s=make();const e=social.shared(s,log,'told',{fact:'The old lock has been altered.',privateToVisitor:true});
 assert.ok(s.people.visitor_01.witnessed.includes(e.id));
 assert.ok(s.people.visitor_01.knowledge.some(x=>x.sourceEventId===e.id));
 assert.ok(!s.people.player.witnessed.includes(e.id));assert.ok(!s.people.player.knowledge.length);
});
test('custom must be observed twice before its violation produces surprise and mood',()=>{
 const s=make();social.observeCustom(s,log);assert.equal(social.violateCustom(s,log),null);
 social.observeCustom(s,log);const e=social.violateCustom(s,log);
 assert.equal(e.type,'surprise');assert.equal(e.sourceIds.length,2);assert.ok(s.mood.some(x=>x.tag==='custom breached'));
});
test('humor callback refers to real shared event exactly once',()=>{
 const s=make(),source=social.markFunny(s,log),first=social.callback(s,log);
 assert.equal(first.sourceEventId,source.id);assert.equal(social.callback(s,log),null);
});
test('prediction ledger records hit/miss and exposes its actual ratio',()=>{
 const s=make();advance(s,archive,30);const v=view(s);
 assert.ok(v.predictionAccuracy.count>0);
 assert.equal(v.predictionAccuracy.hits,s.predictions.filter(x=>x.hit).length);
 assert.ok(v.predictionAccuracy.rate>=0&&v.predictionAccuracy.rate<=1);
});
test('unattended rumination references a real open commitment',()=>{
 const s=make();advance(s,archive,60);
 assert.ok(s.thoughts.some(x=>s.commitments.some(c=>c.id===x.sourceId)||s.events.some(e=>e.id===x.sourceId)));
 assert.ok(s.events.some(x=>x.type==='rumination'&&x.private));
});
test('room perception ranks movement/noise and caps four, not insertion order',()=>{
 const s=make();s.location='kitchen';const ids=['sound1','sound2'].map(x=>log(s,'ambient_sound','I heard a small disturbance.',{marker:x}).id);
 s.roomSignals=[{sourceEventId:ids[0],room:'kitchen',label:'Steps',movement:true,noise:true},{sourceEventId:ids[1],room:'kitchen',label:'Hiss',noise:true}];
 const seen=cognition.observe(s,log);assert.equal(seen.length,4);
 assert.equal(seen[0].id,'signal:'+ids[0]);
 assert.equal(seen[1].id,'signal:'+ids[1]);
 assert.ok(!seen.some(x=>x.id==='stove')||!seen.some(x=>x.id==='hearth'));
});
test('deliberation budget and its rate respond to tiredness',()=>{
 const rested=make(),tired=make();rested.seenObjects=['bed'];tired.seenObjects=['bed'];tired.needs.energy=5;
 const ranked=[{kind:'work',score:80},{kind:'read',score:30}];
 for(let i=0;i<20;i++){cognition.deliberate(rested,ranked,log);cognition.deliberate(tired,ranked,log);}
 assert.ok(rested.deliberation.rate>tired.deliberation.rate);
 assert.ok(tired.events.some(x=>x.type==='reflex'&&x.tired));
});
test('failed outcome reduces subsequent contextual score; success remains recorded',()=>{
 const s=make(),before=scores(s).find(x=>x.kind==='eat').score;
 direct(s,'eat');s.stores.food=0;until(s,()=>count(s,'action_failed')>0,60);
 assert.equal(s.outcomes.eat.failure,1);s.stores.food=5;
 const after=scores(s).find(x=>x.kind==='eat').score;assert.ok(after<before);
 direct(s,'eat');until(s,()=>s.outcomes.eat.success===1,60);assert.equal(s.outcomes.eat.failure,1);
});
test('unseen moved instrument produces real stale belief failure and correction',()=>{
 const s=make();s.beliefs.instrument={room:'laboratory',sourceTick:s.clock.centibeats};
 cognition.moveUnseen(s,'instrument','kitchen',log);direct(s,'inspect');
 until(s,()=>count(s,'action_failed')>0,90);
 assert.ok(s.events.some(x=>x.type==='belief_correction'&&x.object==='instrument'));
 assert.equal(s.outcomes.inspect.failure,1);
});
test('all five named state lesions change a relevant score and report intervention',()=>{
 const cases=[['needs','eat',s=>s.needs.hunger=90],['mood','work',s=>applyMood(s,'test',25)],
 ['residue','work',s=>s.residue.work=27],['habits','work',s=>s.habits.work=8],
 ['commitments','prepare',s=>{s.clock.centibeats=64000;}]];
 for(const [name,kind,setup] of cases){const s=make();setup(s);
  const before=scores(s).find(x=>x.kind===kind).score;cognition.lesion(s,name,false,log);
  const after=scores(s).find(x=>x.kind===kind).score;
  assert.notEqual(before,after,name);assert.ok(s.events.some(x=>x.type==='state_switch'&&x.name===name));}
});
test('busy and sleeping incoming speech queues until activity ends',()=>{
 const s=make();direct(s,'work');speak(s,'What can you do?');
 assert.equal(s.replyQueue.length,1);assert.equal(count(s,'reply_delivered'),0);
 until(s,()=>!s.activity&&s.replyQueue.length===0,150);
 assert.ok(s.deliveredReplies.length>0);
 direct(s,'sleep');speak(s,'Tell me about the tower.');assert.equal(s.replyQueue.length,1);
 until(s,()=>!s.activity&&s.replyQueue.length===0,350);
 assert.equal(s.deliveredReplies.length,2);assert.ok(s.events.some(e=>e.type==='reply_delivered'&&e.delay>0));
});
test('unresolved dialogue never closes its own commitment',()=>{
 const s=make();const reply=speak(s,'Please resolve this now');
 assert.match(reply,/not finished|unresolved/);assert.equal(s.commitments[0].done,false);
});
test('formed contextual habit can misfire when its physical cue disappears',()=>{
 const s=make();s.habitProfiles.inspect={cue:'instrument@laboratory',count:5,formed:true};
 s.beliefs.instrument={room:'laboratory',sourceTick:25000};
 cognition.moveUnseen(s,'instrument','kitchen',log);
 direct(s,'inspect');until(s,()=>count(s,'action_failed')>0,90);
 assert.ok(s.events.some(x=>x.type==='action_failed'&&x.reason==='habit_cue_missing'));
});
test('real consulted folio anchors each generated quirk origin',()=>{
 const s=make();direct(s,'read','magistrate');until(s,()=>s.folioReads.length>0,90);
 assert.ok(s.quirks.length>0);assert.ok(s.quirks.every(x=>s.folioReads.some(r=>r.id===x.originEventId)));
});
test('temporary loss genuinely removes and restores an available object action',()=>{
 const s=make();assert.equal(available(s,'inspect'),true);
 cognition.impair(s,'instrument',s.clock.centibeats+1000,log);assert.equal(available(s,'inspect'),false);
 advance(s,archive,11);assert.equal(available(s,'inspect'),true);
 assert.ok(s.events.some(x=>x.type==='world_restored'&&x.target==='instrument'));
});
test('each autonomous choice logs runner up, score and margin',()=>{
 const s=make();advance(s,archive,1);
 const d=s.events.find(x=>x.type==='decision');assert.ok(d);
 assert.equal(typeof d.score,'number');assert.equal(d.margin,d.score-d.foregoneScore);
 assert.ok(d.candidates.length>1);
});
test('template voice goes through claims socket; unauthenticated memory claim fails',()=>{
 const s=make(),card=voice.stateCard(s);
 assert.equal(voice.claimsCheck('I remember a visit to Mars.',card).ok,false);
 speak(s,'What can you do for me?');
 assert.ok(s.events.some(x=>x.type==='claims_check'&&x.ok));
});
test('attention and open threads remain non-omniscient, with no model calls',()=>{
 const s=make();s.location='library';cognition.observe(s,log);
 const card=voice.stateCard(s);assert.ok(!card.visible.includes('instrument'));
 assert.ok(card.open.includes('C1'));assert.equal(typeof s.model,'undefined');
});
