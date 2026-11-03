'use strict';
// Observational v1.2 research runner. Does not modify canonical state or reinterpret failed probes.
// Use: node scripts/v12_probe.js
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {initialState,DAY,STEP,ROOMS,OBJECTS}=require('../src/world');
const {advance,log,speak,social,cognition}=require('../src/engine');
const {scores,applyMood}=require('../src/actions');
const {save,load}=require('../src/store');
const {readCanon,externalIdentity}=require('../src/history');
const archive=readCanon(path.join(__dirname,'../canon/Pretorius_v12_450_Events_Complete.jsonl'));
const identity=externalIdentity(path.join(__dirname,'../identity.json'));
const SEEDS=[11,12,13,14,15];
const clone=structuredClone;
const fresh=(seed)=>{const s=initialState(identity.sha,archive.sha);s.seed=seed;return s;};
const ticks=(s,n)=>{while(n>0){const b=Math.min(1000,n);advance(s,archive,b);n-=b;}return s;};
const choose=s=>(scores(s)[0]||{}).kind||null;
const dist=events=>{const out={};for(const e of events){if(e.type==='completed')out[e.kind]=(out[e.kind]||0)+1;}return out;};
const band=x=>x<30?'urgent':x<60?'noticeable':'settled';
const context=(s,e)=>({seed:s.seed,tick:e.t,day:e.day,eventId:e.id,kind:e.kind||e.chosen||null,
 eventType:e.type,firstPersonText:e.description,room:e.room,controller:e.controller||null,
 operatorNeeds:Object.fromEntries(Object.entries(s.needs).map(([k,v])=>[k,Math.round(v*10)/10])),
 perceived:(s.perception||[]).map(x=>x.id),commitments:s.commitments.map(x=>({id:x.id,done:x.done})),
 sourceFolioIds:s.folioReads.slice(-2).map(x=>x.id),chosenScore:e.score??null,margin:e.margin??null});
function dayCounters(events){
 const per={};
 for(const e of events){const d=String(e.day);const x=per[d]??(per[d]={activities:{},visitorArrivals:0,visitorConversations:0,ruminations:0,decisionCount:0,diaryWrites:0,preparedDusk:0,unpreparedDusk:0,failures:0});
 if(e.type==='completed'){x.activities[e.kind]=(x.activities[e.kind]||0)+1;if(e.kind==='diary')x.diaryWrites++;}
 if(e.type==='visitor_arrival')x.visitorArrivals++;
 if(e.type==='visitor_conversation')x.visitorConversations++;
 if(e.type==='decision')x.decisionCount++;
 if(e.type==='rumination')x.ruminations++;
 if(e.type==='calendar')e.prepared?x.preparedDusk++:x.unpreparedDusk++;
 if(e.type==='action_failed')x.failures++;
 }
 return per;
}
function endurance(seed,restarts=false){
 let s=fresh(seed),start=s.clock.centibeats,end=start+7*DAY,binSamples=Array(6).fill(null);
 const restartTargets=restarts?[start+2*DAY+30000,start+5*DAY+30000]:[];
 let restartIndex=0;const restartsObserved=[];
 const stock=[{tick:start,food:s.stores.food,water:s.stores.water,fuel:s.stores.fuel,tea:s.stores.tea}];
 let lastBoundary=-1,scenes=0;
 const temp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'tower-v12-')),'saved.json');
 while(s.clock.centibeats<end){
  const previous=s.events.length;ticks(s,1);
  for(let i=previous;i<s.events.length;i++){
   const e=s.events[i];
   if(e.type==='decision'||e.type==='completed'){
    const bin=Math.min(5,Math.floor((e.t-start)/(7*DAY)*6));
    const want=bin%2===0?'decision':'completed';
    if(!binSamples[bin]||binSamples[bin].eventType!==want&&e.type===want)binSamples[bin]=context(s,e);
   }
  }
  const boundary=Math.floor(s.clock.centibeats/DAY);
  if(boundary!==lastBoundary&&s.clock.centibeats%DAY===0){lastBoundary=boundary;stock.push({tick:s.clock.centibeats,food:s.stores.food,water:s.stores.water,fuel:s.stores.fuel,tea:s.stores.tea});}
  if(restartIndex<restartTargets.length&&s.clock.centibeats>=restartTargets[restartIndex]&&s.activity){
   const original=clone(s),target=restartTargets[restartIndex];
   save(temp,s);s=load(temp,identity,archive);
   const equal=JSON.stringify(s)===JSON.stringify(original);
   const paused=s.events.slice(original.events.length).some(x=>x.type==='PAUSED'||x.type==='paused');
   restartsObserved.push({plannedTarget:target,restartTick:s.clock.centibeats,day:s.clock.day,
    hadInProgressActivity:!!original.activity,activityKind:original.activity?.kind,
    identicalStateOnLoad:equal,identitySame:s.identitySha===original.identitySha,
    commitmentsSame:JSON.stringify(s.commitments)===JSON.stringify(original.commitments),
    habitsSame:JSON.stringify(s.habitProfiles)===JSON.stringify(original.habitProfiles),
    pausedWorldEventPresent:paused,pausedIntervalsPresent:!!s.clock.pausedIntervals?.length});
   restartIndex++;
  }
  scenes++;
 }
 const per=dayCounters(s.events),all=dist(s.events),unique=Object.keys(all);
 const daywindows=[];for(let i=0;i<7;i++){const a=start+i*DAY,b=a+DAY;
  const c=s.events.filter(e=>e.type==='completed'&&e.t>=a&&e.t<b);
  const kinds=[...new Set(c.map(e=>e.kind))];daywindows.push({elapsedDay:i+1,completed:c.length,distinctActions:kinds.length,kinds,
   noUsefulCompletion:c.length===0,narrowLoop:kinds.length<=2});}
 const collapse=daywindows.filter((d,i)=>i>0&&d.narrowLoop&&daywindows[i-1].narrowLoop).map(x=>x.elapsedDay);
 const events=s.events;
 const summary={seed,startTick:start,endTick:end,elapsedWorldDays:7,worldDayIndices:Object.keys(per).map(Number),
  ticksExecuted:scenes,totalEvents:events.length,decisions:events.filter(e=>e.type==='decision').length,
  activitiesTotal:events.filter(e=>e.type==='completed').length,activityDistribution:all,
  activitiesByWorldDay:per,elapsedDayWindows:daywindows,
  varietyCollapseConsecutiveDays:collapse,
  declaredCommitmentsOpened:1+events.filter(e=>e.type==='day').length,
  commitmentsKept:events.filter(e=>e.type==='completed'&&e.kind==='prepare').length,
  commitmentsBroken:events.filter(e=>e.type==='calendar'&&!e.prepared).length,
  commitmentsReleased:events.filter(e=>e.type==='commitment_released').length,
  commitmentOpenedCountIsInferred:true,
  storesTrajectory:stock.concat([{tick:s.clock.centibeats,...s.stores}]),
  finalStores:s.stores,finalNeeds:s.needs,finalLocation:s.location,
  diaryEntries:s.diary.length,folioReads:s.folioReads.length,
  visitorArrivals:events.filter(e=>e.type==='visitor_arrival').length,
  visitorWitnessedConversations:events.filter(e=>e.type==='visitor_conversation'&&e.perceived!==false).length,
  formedHabits:events.filter(e=>e.type==='habit_formed').map(e=>({tick:e.t,kind:e.kind,cue:e.cue,eventId:e.id})),
  habitMisfires:events.filter(e=>e.type==='action_failed'&&e.reason==='habit_cue_missing').map(e=>({tick:e.t,kind:e.kind})),
  worldLosses:events.filter(e=>e.type==='world_loss').length,
  actionFailures:events.filter(e=>e.type==='action_failed').length,
  deathStateModeled:false,deathObserved:false,
  softlocks:daywindows.filter(x=>x.noUsefulCompletion).map(x=>x.elapsedDay),
  restartCheckpoints:restartsObserved,
  pausedEventRequirementMet:!restarts||restartsObserved.length===2&&restartsObserved.every(x=>x.pausedWorldEventPresent),
  eventLogFirstId:events[0]?.id||null,eventLogLastId:events.at(-1)?.id||null,
  samplingNote:'Seven elapsed 24-hour windows from 1899-07-01 at @250; world-day 0 and day 7 are partial. No outside stimuli or scripted player commands.'};
 return {summary,samples:binSamples.filter(Boolean)};
}
function record(id,pass,evidence,limit){return {article:id,status:pass?'observed':'not_demonstrated',pass:!!pass,evidence,interpretation:limit||null};}
function stateAt({seed=11,hunger=45,energy=75,stimulation=50,comfort=65,time=25000}){
 const s=fresh(seed);s.needs.hunger=hunger;s.needs.energy=energy;s.needs.stimulation=stimulation;s.needs.comfort=comfort;
 s.clock.centibeats=time;s.clock.day=Math.floor(time/DAY);s.commitments[0].deadline=Math.floor(time/DAY)*DAY+65000;return s;
}
function switches22(){
 const names=['needs','mood','residue','habits','commitments'],out={};
 for(const name of names){
 let found=null;
 outer:for(const seed of SEEDS)for(const time of [25000,45000,62000,71000])for(const hunger of [15,30,45,60,75,90])for(const energy of [20,42,65,85])for(const stimulation of [20,48,75]){
  const a=stateAt({seed,time,hunger,energy,stimulation});
  a.mood=[{tag:'controlled',value:42,until:time+80000}];a.residue.eat=45;
  a.habits.eat=5;a.habitProfiles.eat={cue:'stores@kitchen',count:5,formed:true};
  const b=clone(a);cognition.lesion(b,name,false,log);
  if(choose(a)===choose(b))continue;
  ticks(a,1);ticks(b,1);
  const ea=a.events.find(x=>x.type==='decision'),eb=b.events.find(x=>x.type==='decision');
  if(ea&&eb&&ea.chosen!==eb.chosen){
   found={name,seed,time,hunger,energy,stimulation,enabled:ea.chosen,disabled:eb.chosen,
    enabledScore:ea.score,disabledScore:eb.score,interventionId:b.events.find(x=>x.type==='state_switch')?.id};
   break outer;
  }
 }
 out[name]=found;
 }
 return record(22,names.every(n=>out[n]),{switches:out},'One matched chosen-action contrast per named switch. Does not prove universal causal isolation.');
}
function traits16(){
 const runs=[];for(const seed of SEEDS){const a=fresh(seed),b=clone(a);b.traits.curious=.25;ticks(a,1000);ticks(b,1000);
 const ca=dist(a.events),cb=dist(b.events),all=new Set([...Object.keys(ca),...Object.keys(cb)]);
 const totalDiff=[...all].reduce((v,k)=>v+Math.abs((ca[k]||0)-(cb[k]||0)),0);
 runs.push({seed,trait:'curious',base:1.5,swapped:.25,baseActions:ca,changedActions:cb,l1Counts:totalDiff});}
 return record(16,runs.some(x=>x.l1Counts>0),{runs},'Distribution contrast from a matched trait swap across five one-day simulated seeds.');
}
function affect10(){
 const runs=[];for(const seed of SEEDS){const a=fresh(seed),b=clone(a);applyMood(b,'controlled_positive',45,100000);
 const before=scores(a).find(x=>x.kind==='work'),after=scores(b).find(x=>x.kind==='work');
 ticks(a,1000);ticks(b,1000);
 const ca=dist(a.events),cb=dist(b.events);const difference=[...new Set([...Object.keys(ca),...Object.keys(cb)])].reduce((v,k)=>v+Math.abs((ca[k]||0)-(cb[k]||0)),0);
 runs.push({seed,workScoreBefore:before.score,workScoreAfter:after.score,scoreDirectionCorrect:after.score>before.score,actionCountL1:difference,baseActions:ca,moodActions:cb});
 }
 return record(10,runs.every(x=>x.scoreDirectionCorrect)&&runs.some(x=>x.actionCountL1>0),{runs},'Matched one-day mood intervention; requires both predicted score direction and actual choice-distribution changes.');
}
function memory4(){
 const a=fresh(11),b=clone(a);cognition.impair(b,'folios',b.clock.centibeats+DAY,log);ticks(a,1000);ticks(b,1000);
 const decisionCites=a.events.filter(x=>x.type==='decision'&&JSON.stringify(x).includes('E'));
 const chosenDiff=JSON.stringify(dist(a.events))!==JSON.stringify(dist(b.events));
 const readCited=a.folioReads.length>0;
 const noFalseReading=b.folioReads.length===0;
 return record(4,readCited&&noFalseReading&&decisionCites.length>0&&chosenDiff,
 {originalRead:a.folioReads.map(x=>x.id),withheldReads:b.folioReads.length,baselineDecisionCitedFolio:decisionCites.length,
  actionCountDistributionChanged:chosenDiff,deniedSpeechClaim:noFalseReading,reason:'Read action denial is not proof a retrieved memory shaped an independent decision.'},
 'Requires decision-level folio evidence and a counterfactual change attributable to that evidence, not just locked library access.');
}
function residue9(){
 const a=fresh(11);speak(a,'Henry Frankenstein');ticks(a,2000);
 const b=clone(a);b.residue.henry=0;
 const scoreA=scores(a),scoreB=scores(b),different=scoreA.some((x,i)=>x.kind!==scoreB[i]?.kind||x.score!==scoreB[i]?.score);
 const eventsNoNewReminder=a.events.filter(e=>e.type==='heard').length===1;
 return record(9,different&&eventsNoNewReminder,
 {twoDayTick:a.clock.centibeats,sourceTopic:'henry',persistedResidue:a.residue.henry||0,
  activeMood:a.mood.filter(x=>x.tag==='henry').length,scoreDifferenceAfterResidueAblation:different,
  choices:[scoreA[0]?.kind,scoreB[0]?.kind],newTopicReminders:a.events.filter(e=>e.type==='heard').length-1},
 'Two-day no-reminder residue lesion must change chosen action; mere retained numeric residue is insufficient.');
}
function prospection18(){
 const a=stateAt({time:58000}),b=clone(a);
 b.commitments.push({id:'C-extra',title:'Check instrument before visitor',deadline:61000,done:false});
 const sa=scores(a),sb=scores(b),changed=JSON.stringify(sa)!==JSON.stringify(sb);
 return record(18,changed&&sa[0]?.kind!==sb[0]?.kind,
 {addedCommitment:'C-extra',scoreChanged:changed,chosenBefore:sa[0]?.kind,chosenAfter:sb[0]?.kind,addedDeadline:61000},
 'A new, previously unseen deadline must alter independent preparation; current scoring consults only the original commitment.');
}
function competing17(){
 const s=fresh(11);s.commitments.push({id:'C-extra',title:'Finish a separate experiment',deadline:160000,done:false});
 ticks(s,2000);
 const kept=s.commitments.some(x=>x.id==='C-extra');
 return record(17,kept&&s.events.some(x=>x.type==='interrupted')&&s.events.some(x=>x.type==='commitment_resumed'),
 {start:['C1','C-extra'],end:s.commitments.map(x=>x.id),extraSurvived:kept,dayEvents:s.events.filter(x=>x.type==='day').length},
 'Both original commitments must survive day transitions and one be resumed without prompting.');
}
function pause3(){
 const s=fresh(11);ticks(s,30);
 const temp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'tower-pause-')),'save.json');
 const oldCount=s.events.length;save(temp,s);
 const restored=load(temp,identity,archive);
 const same=restored.clock.centibeats===s.clock.centibeats;
 const interval=restored.events.slice(oldCount).some(e=>e.type==='PAUSED'||e.type==='paused')||!!restored.clock.pausedIntervals?.length;
 return record(3,same&&interval,
 {clockPreserved:same,extraLivedEvents:restored.events.length-oldCount,PAUSEDRecorded:interval,activityPreserved:JSON.stringify(restored.activity)===JSON.stringify(s.activity)},
 'Pause must be explicit and world time must stay frozen; no code modification to invent the missing PAUSED event.');
}
function attention12(){
 const s=fresh(11);s.location='kitchen';const sourceIds=[];
 for(let i=0;i<3;i++)sourceIds.push(log(s,'ambient_signal','I heard a distinct ambient sound.',{id:i}).id);
 s.roomSignals=sourceIds.map((id,i)=>({sourceEventId:id,room:'kitchen',label:'Distinct disturbance '+i,movement:true,noise:true}));
 const first=cognition.observe(s,log),high=first.some(x=>x.id==='signal:'+sourceIds[0]),kettleSeen=first.some(x=>x.id==='kettle');
 ticks(s,3000);
 const used=s.events.filter(e=>e.type==='started'&&e.kind==='tea').length;
 const returns=s.events.filter(e=>e.type==='perception'&&e.observed?.some(o=>o.id==='kettle')).length;
 return record(12,high&&!kettleSeen&&used===0&&returns===0,
 {highSalienceSeenInitially:high,lowSalienceKettleSeenInitially:kettleSeen,threeDayTeaStarts:used,
  lowSalienceKettlePerceptionEvents:returns,dayEvents:s.events.filter(x=>x.type==='day').length},
 'Low-salience kettle must neither be observed nor independently selected/used; high-salience arrival must be registered.');
}
function rumination2(){
 const counts=[];for(const seed of SEEDS){const s=fresh(seed);ticks(s,70);
 const thoughts=s.events.filter(x=>x.type==='rumination');const realIds=new Set([...s.events.map(x=>x.id),...s.commitments.map(x=>x.id)]);
 const valid=thoughts.filter(x=>realIds.has(x.sourceId)).length;
 const open=thoughts.filter(x=>s.commitments.some(c=>!c.done&&c.id===x.sourceId)).length;
 const candidates=[...realIds],chosen=thoughts.map((_,i)=>candidates[(i*7+seed)%candidates.length]);
 const shuffledOpen=chosen.filter(id=>s.commitments.some(c=>!c.done&&c.id===id)).length;
 counts.push({seed,thoughts:thoughts.length,validSources:valid,openCommitmentSources:open,shuffledOpenSources:shuffledOpen});}
 const n=counts.reduce((x,r)=>x+r.thoughts,0),real=counts.reduce((x,r)=>x+r.openCommitmentSources,0),shuffled=counts.reduce((x,r)=>x+r.shuffledOpenSources,0);
 return record(2,n>0&&real>shuffled&&counts.every(x=>x.validSources===x.thoughts),
 {runs:counts,realOpenFraction:real/(n||1),shuffledOpenFraction:shuffled/(n||1)},
 'This is a weak shuffled-source baseline; verifies anchored rumination frequency, not rich independent cognition.');
}
function habit8(){
 const runs=[];for(const seed of SEEDS){
  const s=fresh(seed);const max=s.clock.centibeats+7*DAY;
  let displaced=null;while(s.clock.centibeats<max){
   ticks(s,1);
   if(!displaced){
    const candidates=['work','inspect','study','tend','walk','rest','tea'].filter(k=>s.habitProfiles[k]?.formed);
    for(const kind of candidates){const target={work:'bench',inspect:'instrument',study:'specimens',tend:'plot',walk:'path',rest:'bed',tea:'kettle'}[kind];
     const original=OBJECTS[target].room;
     if(s.location===original||s.activity?.target===target)continue;
     const newRoom=Object.keys(ROOMS).find(r=>r!==original&&r!==s.location);
     if(!newRoom)continue;
     const e=cognition.moveUnseen(s,target,newRoom,log);
     displaced={kind,target,oldRoom:original,newRoom,sourceEventId:e.id,tick:s.clock.centibeats};
     break;
    }
   }
   if(displaced&&s.events.some(e=>e.type==='action_failed'&&e.reason==='habit_cue_missing'&&e.controller==='autonomous'))break;
  }
  const failures=s.events.filter(e=>e.type==='action_failed'&&e.reason==='habit_cue_missing'&&e.controller==='autonomous');
  runs.push({seed,formedCount:s.events.filter(e=>e.type==='habit_formed').length,intervention:displaced,
   autonomousCueMisfires:failures.map(e=>({id:e.id,tick:e.t,kind:e.kind})),lastTick:s.clock.centibeats});
 }
 return record(8,runs.some(x=>x.intervention&&x.autonomousCueMisfires.length>0),
 {runs},'At least one natural habit forms under autonomous play and is later defeated by an unseen physical cue relocation, without directed action.');
}
function probe(){
 const results=[switches22(),traits16(),affect10(),record(14,false,
   {availableWeightInterface:false,actualWeightConfig:'hard-coded base values and coefficients in src/actions.js'},
   'Declared parameter-only utility weight interface absent; direct editing of global action definitions would violate the test.'),
 memory4(),residue9(),prospection18(),competing17(),pause3(),attention12(),rumination2(),habit8()];
 return {results,observedArticles:results.filter(x=>x.pass).map(x=>x.article),notDemonstrated:results.filter(x=>!x.pass).map(x=>x.article)};
}
function main(){
 const summaries=[],samples=[];
 for(const seed of SEEDS){const r=endurance(seed,seed===13);summaries.push(r.summary);samples.push(...r.samples);}
 const discriminations=probe();
 const output={schema:'simple-tower-v1.2-evidence-v1',referenceHead:process.env.GITHUB_SHA||'unknown',
  sourceContract:{archiveGitBlob:archive.sha,identityRawSHA256:identity.sha,dayCentibeats:DAY,stepCentibeats:STEP,
   seeds:SEEDS,sevenElapsedDaysEach:true,unattendedBaseline:true,noLLM:true},
  runs:summaries,fidelityPacket:samples,discriminations};
 const bytes=Buffer.from(JSON.stringify(output),'utf8').toString('base64');
 console.log('V12_DATA_BEGIN '+bytes.length);
 for(let i=0;i<bytes.length;i+=1700)console.log('V12_DATA_PART '+(i/1700)+' '+bytes.slice(i,i+1700));
 console.log('V12_DATA_END '+Math.ceil(bytes.length/1700));
 for(const r of summaries)console.log('V12_SEED '+r.seed+' '+JSON.stringify({actions:r.activitiesTotal,distinct:Object.keys(r.activityDistribution).length,softlocks:r.softlocks,collapses:r.varietyCollapseConsecutiveDays,restarts:r.restartCheckpoints.length,paused:r.pausedEventRequirementMet,folios:r.folioReads,diary:r.diaryEntries,habits:r.formedHabits.length,misfires:r.habitMisfires.length}));
 console.log('V12_DISCRIMINATIONS '+JSON.stringify({passed:discriminations.observedArticles,notDemonstrated:discriminations.notDemonstrated}));
}
main();
