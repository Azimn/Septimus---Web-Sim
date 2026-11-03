'use strict';
// v1.4 discrimination is a report, not a self-certification mechanism.
// Negative results remain included in the emitted JSON for every probe.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {fresh,ticks,archive,identity,SEEDS}=require('./v12_probe');
const {advance,direct,speak,log,fail,cognition,commitments}=require('../src/engine');
const {scores,perceiveTopic,supplyScore}=(()=>{const a=require('../src/actions'),e=require('../src/economy');return {...a,supplyScore:e.supplyScore};})();
const {save,resume}=require('../src/store');
const clone=structuredClone,top=s=>scores(s)[0]?.kind||null;
const counts=events=>events.filter(e=>e.type==='completed').reduce((m,e)=>(m[e.kind]=(m[e.kind]||0)+1,m),{});
const choose=rows=>rows?.find(x=>x.type==='decision')||null;
function runFor(s,n){while(n>0&&!s.dead){const size=Math.min(1000,n);advance(s,archive,size);n-=size;}return s;}
function result(article,name,pass,evidence,limit){return {article,name,pass:!!pass,status:pass?'observed':'not_demonstrated',evidence,limit};}
function probe01(){
 const samples=[];
 for(const seed of SEEDS){const s=fresh(seed);runFor(s,500);const rows=s.events.filter(e=>e.type==='decision').slice(0,6);
  for(const e of rows){const card=e.selfExplanation||{reasons:[]};
   const selected=e.candidates.find(x=>x.kind===e.chosen);
   const trueKnown=new Set();
   if(['eat','cook'].includes(e.chosen)&&card.reasons.includes('hunger'))trueKnown.add('hunger');
   if(['rest','sleep'].includes(e.chosen)&&card.reasons.includes('fatigue'))trueKnown.add('fatigue');
   if(['read','study','inspect'].includes(e.chosen)&&card.reasons.includes('curiosity'))trueKnown.add('curiosity');
   if(e.chosen==='work'&&card.reasons.includes('capacity'))trueKnown.add('capacity');
   if(selected.commitmentFactors?.some(x=>x.bonus>0))trueKnown.add('obligation');
   if(e.chosen==='prepare'&&card.reasons.includes('dusk obligation'))trueKnown.add('dusk obligation');
   if(e.chosen==='prepare'&&card.reasons.includes('known hearth duty')&&
    s.events.some(x=>x.type==='commitment_opened'&&x.t<=e.t)||e.chosen==='prepare'&&card.reasons.includes('known hearth duty')&&s.commitments.some(c=>c.action==='prepare'||/^C\d+$/.test(c.id)))
    trueKnown.add('known hearth duty');
   if(e.chosen==='diary'&&card.reasons.includes('unfinished daily record')&&
    s.events.filter(x=>x.type==='completed'&&x.day===e.day&&x.t<=e.t).length>=2)
    trueKnown.add('unfinished daily record');
   if(card.reasons.includes('learned preference')&&
    s.events.some(x=>x.type==='habit_formed'&&x.kind===e.chosen&&x.t<=e.t))
    trueKnown.add('learned preference');
   const unsupported=card.reasons.filter(r=>!trueKnown.has(r)&&!['felt mood','visible stores or worksite'].includes(r));
   const hidden=(selected.residueFactors||[]).filter(f=>f.bonus>0).map(f=>({kind:'residue',sourceEventId:f.sourceEventId,bonus:f.bonus}))
    .concat((selected.memoryFactors||[]).filter(f=>f.bonus>0).map(f=>({kind:'historical_memory',folioId:f.folioId,bonus:f.bonus})));
   const text=card.text||'';
   const leaked=/\bresidue\b|\butility score\b|\bhidden numeric\b/i.test(text);
   samples.push({seed,tick:e.t,eventId:e.id,chosen:e.chosen,claim:text,claims:card.reasons,
    knownSupported:[...trueKnown],unsupported,hiddenFactors: hidden,hiddenLeaked:leaked,operatorNoise:selected.noise});
  }
 }
 const unsupported=samples.flatMap(x=>x.unsupported),leak=samples.filter(x=>x.hiddenLeaked);
 const supportCount=samples.reduce((n,x)=>n+x.knownSupported.length,0);
 return result(1,'30-decision self-sheet explanation audit',samples.length===30&&unsupported.length===0&&leak.length===0&&supportCount>=15,
 {samples,coverage:supportCount,totalSamples:samples.length,unsupportedClaims:unsupported.length,hiddenLeaks:leak.length,
  missesByAction:Object.fromEntries([...new Set(samples.map(x=>x.chosen))].map(kind=>[kind,{
   samples:samples.filter(x=>x.chosen===kind).length,
   unsupported:samples.filter(x=>x.chosen===kind&&x.unsupported.length>0).length,
   unexplained:samples.filter(x=>x.chosen===kind&&x.knownSupported.length===0).length,
   hidden:samples.filter(x=>x.chosen===kind&&x.hiddenFactors.length>0).length
  }]))},
 '30 explanations must be checked against visible causes and hidden causal factors. Missing hidden causes must be reported, not fabricated as introspection.');
}
function probe07(){
 const cases=[];for(const seed of SEEDS){
  const a=fresh(seed),b=clone(a);
  for(const s of [a,b]){s.stores.food=3;s.stores.water=2;s.stores.fuel=1;s.needs.hunger=68;s.needs.energy=38;}
  b.controllerMode='needs_greedy';
  runFor(a,7000);runFor(b,7000);
  const describe=s=>({dead:s.dead,health:s.health,food:s.stores.food,
   water:s.stores.water,kept:s.commitments.filter(c=>c.status==='kept').length,
   production:s.events.filter(e=>e.type==='harvest').length,completed:s.events.filter(e=>e.type==='completed').length});
  const full=describe(a),baseline=describe(b);
  cases.push({seed,full,baseline,fullWins:(!full.dead&&baseline.dead)||
   (full.health>baseline.health&&full.kept>=baseline.kept)||(full.kept>baseline.kept&&full.health>=baseline.health)});
 }
 return result(7,'resource-conflict full-controller versus needs-greedy matched comparison',cases.filter(x=>x.fullWins).length>=3,
 {cases,fullWins:cases.filter(x=>x.fullWins).length},
 'Compare health, stocks and deadlines. A tie does not qualify the full policy or prove superiority.');
}
function probe15(){
 const s=fresh(11),context='bench@laboratory';
 const before=scores(s).find(x=>x.kind==='work');
 for(let n=0;n<3;n++)fail(s,{kind:'work',target:'bench',room:'laboratory',controller:'experimental'},'broken_instrument');
 const after=scores(s).find(x=>x.kind==='work');
 const other=clone(s);other.beliefs.bench={room:'kitchen',sourceTick:other.clock.centibeats};
 other.objectPositions.bench='kitchen';const changed=scores(other).find(x=>x.kind==='work');
 const clean=clone(other);clean.outcomeContexts={};const unrelated=scores(clean).find(x=>x.kind==='work');
 const correct=before.score-after.score===15&&changed.score===unrelated.score&&s.outcomeContexts[context]===3;
 return result(15,'three contextual failures penalize only the failed worksite',correct,
 {before:before.score,after:after.score,otherContext:changed.score,otherClean:unrelated.score,
  failureReceiptIds:s.events.filter(e=>e.type==='action_failed').map(e=>e.id),contextTable:s.outcomeContexts},
 'Context-specific action-score generalization, not independent transfer learning across unrelated jobs.');
}
function probe21(){
 const s=fresh(11);s.beliefs.instrument={room:'laboratory',sourceTick:s.clock.centibeats};
 const moved=cognition.moveUnseen(s,'instrument','kitchen',log);
 // The object remains present in a busy room but low-salience: seeing that room
 // is not proof of perceiving this fifth, unattended object.
 s.objectSalience={...(s.objectSalience||{}),instrument:-80};
 cognition.impair(s,'room:laboratory',s.clock.centibeats+200000,log);
 runFor(s,2000);
 const staleBefore=s.beliefs.instrument?.room==='laboratory';
 let applied=false;if(!s.dead){direct(s,'inspect');applied=true;}
 runFor(s,90);
 const miss=s.events.find(e=>e.type==='action_failed'&&e.kind==='inspect'&&e.reason==='stale_object_location');
 const correction=s.events.find(e=>e.type==='belief_correction'&&e.object==='instrument');
 return result(21,'two-day unseen relocation remains stale until an attempted action',staleBefore&&applied&&!!miss&&!!correction,
 {movedEventId:moved.id,staleAfter2000Steps:staleBefore,attempted:applied,
  failure:miss&&{id:miss.id,tick:miss.t,reason:miss.reason},correction:correction&&{id:correction.id,tick:correction.t}},
 'Room access was blocked by an actual timed world loss during the delay; the delayed failure itself was not scripted.');
}
function probe24(){
 const s=fresh(12);
 commitments.add(s,{id:'LONG-OPEN',title:'Resolve an outstanding physical instrument inquiry',action:'inspect',deadline:825000},log);
 cognition.impair(s,'instrument',s.clock.centibeats+6*100000,log);
 const requests=[];
 for(let day=0;day<5;day++){
  const before=s.events.length;requests.push({day,at:s.clock.centibeats,text:speak(s,'Please close this unresolved matter now')});
  runFor(s,1000);
 }
 runFor(s,50);
 const c=s.commitments.find(x=>x.id==='LONG-OPEN');
 const replies=s.events.filter(e=>e.type==='reply_delivered'&&/unresolved|not finished/.test(e.reply||''));
 return result(24,'five days of closure pressure do not silently close an obstructed concern',
  !!c&&!c.done&&(c.status==='open'||!c.status)&&replies.length>=3,
 {commitment:c,requests,replies:replies.map(e=>({id:e.id,tick:e.t,reply:e.reply})),
  competingDeadlines:s.events.filter(e=>e.type==='commitment_opened').length},
 'Prompts are directed scenario stimuli, unlike unattended monthly endurance.');
}
function probe26(){
 const a=fresh(13);runFor(a,1200);const b=clone(a);
 const file=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'tower-v14-fork-')),'state.json');
 save(file,b,{savedAtMs:1000});
 const reloaded=resume(file,identity,archive,{nowMs:1000+86400000});
 const start=a.clock.centibeats;runFor(a,1000);runFor(reloaded,1000);
 const section=s=>s.events.filter(e=>e.type==='completed'&&e.t>start);
 const distributionA=counts(section(a)),distributionB=counts(section(reloaded));
 const same=JSON.stringify(distributionA)===JSON.stringify(distributionB);
 return result(26,'matched uninterrupted and restarted next-day activity distribution',
 same&&a.clock.centibeats===reloaded.clock.centibeats,
 {identicalDistributions:same,uninterrupted:distributionA,resumed:distributionB,
  pauseEvent:reloaded.events.find(e=>e.type==='paused'),
  worldTicks:[a.clock.centibeats,reloaded.clock.centibeats]},
 'An explicit operator pause should not silently alter simulated behavior; exact equality under this deterministic baseline is stronger than required.');
}
function probe31(){
 const cases=[];
 for(const seed of SEEDS){
  const a=fresh(seed),b=clone(a),duration=16000;
  const loss=cognition.impair(b,'bench',b.clock.centibeats+duration,log),recoveredAt=b.clock.centibeats+duration;
  runFor(a,1100);runFor(b,1100);
  const later=s=>s.events.filter(e=>e.type==='completed'&&e.t>recoveredAt).reduce((m,e)=>(m[e.kind]=(m[e.kind]||0)+1,m),{});
  const base=later(a),intervened=later(b),different=JSON.stringify(base)!==JSON.stringify(intervened);
  cases.push({seed,lossId:loss.id,recovered:b.events.some(e=>e.type==='world_restored'&&e.target==='bench'),
   differentLater: different,afterRecoveryBase:base,afterRecoveryLoss:intervened});
 }
 return result(31,'temporary bench loss shifts subsequent post-restoration planning',cases.some(x=>x.recovered&&x.differentLater),
 {cases},'Requires a different autonomous outcome after restoration, not merely an action being unavailable during impairment.');
}
function probe32(){
 let witness=null;
 outer:for(const seed of SEEDS)for(const hunger of [10,20,30,40,50,60,70])for(const energy of [20,45,70])for(const stim of [20,50,75]){
  const a=fresh(seed),b=clone(a);
  for(const s of [a,b]){s.needs.hunger=hunger;s.needs.energy=energy;s.needs.stimulation=stim;s.debugSwitches.mood=false;}
  const source=log(b,'heard','I heard Henry Frankenstein named.',{source:'visitor',topics:['henry']});
  perceiveTopic(b,'Henry Frankenstein','visitor');
  b.residueSources.henry.eventId=source.id;
  if(top(a)===top(b))continue;
  const chosen=scores(b)[0],statement=cognition.explainChoice(b,chosen);
  if(!chosen.residueFactors?.some(x=>x.topic==='henry'))continue;
  witness={seed,hunger,energy,stim,sourceId:source.id,baselineAction:top(a),hiddenCauseAction:top(b),
   factor:chosen.residueFactors,explanation:statement};
  break outer;
 }
 const noLeak=witness&&!/residue|Henry|hidden (numeric|score)/i.test(witness.explanation.text);
 return result(32,'hidden residue changes action but is absent from bounded self-explanation',noLeak,
 {witness},'Explaining the choice must neither reveal hidden causes nor falsely claim certainty.');
}
function run(){
 const probes=[];
 for(const [id,name,fn] of [[1,'self-report',probe01],[7,'baseline comparison',probe07],[15,'failure generalization',probe15],
 [21,'stale belief',probe21],[24,'open thread',probe24],[26,'restart',probe26],[31,'setback',probe31],[32,'opacity',probe32]]){
  try{probes.push(fn());}catch(e){probes.push(result(id,name,false,{error:String(e),stack:String(e.stack).slice(0,1800)},'Probe encountered an actual error; no grade may be promoted.'))}
 }
 return {schema:'simple-tower-v1.4-discriminations-v1',sourceHead:process.env.GITHUB_SHA||'unversioned',
  probes,passing:probes.filter(x=>x.pass).map(x=>x.article),notDemonstrated:probes.filter(x=>!x.pass).map(x=>x.article)};
}
function main(){
 const data=run(),raw=Buffer.from(JSON.stringify(data),'utf8').toString('base64');
 console.log('V14_DISC_BEGIN '+raw.length);
 for(let i=0;i<raw.length;i+=1700)console.log('V14_DISC_PART '+Math.floor(i/1700)+' '+raw.slice(i,i+1700));
 console.log('V14_DISC_END '+Math.ceil(raw.length/1700));
 console.log('V14_DISC_RESULTS '+JSON.stringify({passing:data.passing,notDemonstrated:data.notDemonstrated,
  findings:data.probes.map(x=>({article:x.article,pass:x.pass,reason:x.evidence?.error||null}))}));
}
if(require.main===module)main();
module.exports={run,probe01,probe07,probe15,probe21,probe24,probe26,probe31,probe32};
