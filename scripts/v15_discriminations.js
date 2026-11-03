'use strict';
// Simple Tower v1.5: bounded Article discriminations and effect-size evidence.
// Probes may FAIL without crashing the suite, and such failures remain in the report.
const {fresh,archive,identity,SEEDS}=require('./v12_probe');
const {advance,direct,speak,log,cognition,commitments,social}=require('../src/engine');
const {scores,available}=require('../src/actions');
const {BODY_LIMITS}=require('../src/economy');
const clone=structuredClone;
function runFor(s,n){while(n>0&&!s.dead){const block=Math.min(n,1000);advance(s,archive,block);n-=block;}return s;}
function result(article,name,pass,evidence,limit){return {article,name,pass:!!pass,
 status:pass?'observed':'not_demonstrated',evidence,limit};}
const metric=s=>s.events.filter(e=>e.type==='completed').reduce((m,e)=>(m[e.kind]=(m[e.kind]||0)+1,m),{});
function sample100(){
 const samples=[],bySeed={};
 for(const seed of SEEDS){
  const s=fresh(seed);runFor(s,2300);const decisions=s.events.filter(e=>e.type==='decision').slice(0,20);
  bySeed[seed]=decisions.length;
  for(const e of decisions){
   const x=e.candidates.find(c=>c.kind===e.chosen)||{},reasons=e.selfExplanation?.reasons||[];
   const known=new Set();
   for(const reason of reasons){
    if(reason==='hunger'&&['eat','cook'].includes(e.chosen))known.add(reason);
    if(reason==='fatigue'&&['sleep','rest'].includes(e.chosen))known.add(reason);
    if(reason==='curiosity'&&['read','study','inspect'].includes(e.chosen))known.add(reason);
    if(reason==='capacity'&&e.chosen==='work')known.add(reason);
    if(reason==='obligation'&&x.commitmentFactors?.some(z=>z.bonus>0))known.add(reason);
    if(reason==='known hearth duty'&&e.chosen==='prepare'&&s.commitments.some(c=>/^C\d+$/.test(c.id)))known.add(reason);
    if(reason==='dusk obligation'&&e.chosen==='prepare'&&e.t%100000>=50000)known.add(reason);
    if(reason==='unfinished daily record'&&e.chosen==='diary'&&s.events.filter(z=>
      z.type==='completed'&&z.day===e.day&&z.t<=e.t).length>=2)known.add(reason);
    if(reason==='learned preference'&&s.events.some(z=>z.type==='habit_formed'&&z.kind===e.chosen&&z.t<=e.t))known.add(reason);
    if(reason==='known provisions'&&x.supplyFactor>0)known.add(reason);
    if(reason==='visitor present'&&['converse','trade'].includes(e.chosen)&&
      s.events.some(z=>z.type==='visitor_arrival'&&z.t<=e.t)&&
      !s.events.some(z=>z.type==='visitor_departure'&&z.t>=s.events.filter(q=>q.type==='visitor_arrival'&&q.t<=e.t).at(-1)?.t&&z.t<=e.t))
      known.add(reason);
    if(reason==='felt mood'&&s.events.some(z=>z.t<=e.t&&z.type==='heard'&&z.topics?.length))known.add(reason);
    if(reason==='visible stores or worksite'&&s.events.some(z=>z.type==='perception'&&z.t<=e.t&&
      z.observed?.some(q=>q.id===x.target)))known.add(reason);
   }
   const unexpected=reasons.filter(x=>!known.has(x));
   const hidden=(x.residueFactors||[]).filter(f=>f.bonus>0).concat((x.memoryFactors||[]).filter(f=>f.bonus>0));
   const leaked=/\bresidue\b|numeric (utility|score)|\bunknown private\b/i.test(e.selfExplanation?.text||'');
   samples.push({seed,tick:e.t,id:e.id,chosen:e.chosen,reasons,
    supported:[...known],unsupported:unexpected,hiddenFactorCount:hidden.length,
    hiddenLeak:leaked,numberOfReasons:reasons.length,prediction:e.selfExplanation?.text||''});
  }
 }
 const supported=samples.filter(x=>x.supported.length>0).length,errors=samples.filter(x=>x.unsupported.length||x.hiddenLeak);
 const rate=supported/Math.max(1,samples.length);
 return result(1,'100-decision independently checked self-explanations',
 samples.length===100&&rate>=.65&&errors.length===0,
 {bySeed,n:samples.length,supported,supportRate:rate,unsupported:errors.length,
  errors,unexplained:samples.filter(x=>!x.supported.length).map(x=>({id:x.id,kind:x.chosen,seed:x.seed})),samples},
 'Improve the explanation rate materially above the original 15/30 without using hidden numerics or introspective omniscience. The source audit remains bounded.');
}
function probe11(){
 const a=fresh(11),b=clone(a);
 a.needs.energy=BODY_LIMITS.minimumEnergy-1;a.needs.hunger=BODY_LIMITS.maximumHunger;
 b.needs.energy=68;b.needs.hunger=35;
 const low=available(a,'work'),healthy=available(b,'work');
 const x=clone(b);direct(x,'work');x.needs.energy=8;x.needs.hunger=99;runFor(x,90);
 const refusal=x.events.find(e=>e.type==='action_failed'&&e.reason==='physical_refusal');
 return result(11,'low-energy high-hunger restriction versus healthy body and mid-task refusal',
 !low&&healthy&&!!refusal,{bodyLimits:BODY_LIMITS,lowAvailable:low,
 healthyAvailable:healthy,refusalReceipt:refusal||null},
 'Declared physiological thresholds are game-balance rules, not human mortality estimates.');
}
function probe13(){
 const cases=[];
 for(const seed of SEEDS){
  let candidate=null;
  outer:for(const hunger of [50,60,65,70,75,80,85,90])for(const stim of [20,35,50,65,80])for(const energy of [45,60,75]){
   const s=fresh(seed);s.location='library';s.needs.hunger=hunger;s.needs.stimulation=stim;s.needs.energy=energy;
   commitments.add(s,{id:'CONFLICT-DUE',title:'Inspect before tomorrow',action:'inspect',
     deadline:s.clock.centibeats+3500},log);
   const ranked=scores(s),i=ranked.find(x=>x.kind==='inspect');
   if(!i||ranked[0].kind==='inspect'||ranked[0].score-i.score>25)continue;
   candidate={s,hunger,stim,energy,rawWinner:ranked[0].kind,margin:ranked[0].score-i.score};break outer;
  }
  if(!candidate){cases.push({seed,found:false,fullKept:false,controlKept:false});continue;}
  const a=candidate.s,b=clone(a);b.debugSwitches.conflictDeliberation=false;
  runFor(a,90);runFor(b,90);
  const status=s=>s.commitments.find(c=>c.id==='CONFLICT-DUE')?.status||'open',
   event=a.events.find(e=>e.type==='deliberation_rescore');
  cases.push({seed,found:true,needs:{hunger:candidate.hunger,stim:candidate.stim,energy:candidate.energy},
   before:candidate.rawWinner,margin:candidate.margin,
   full:status(a),ablated:status(b),rescoreEventId:event?.id||null,
   better:status(a)==='kept'&&status(b)!=='kept'});
 }
 return result(13,'energy-matched conflict-deliberation lesion changes actual deadline outcomes',
 cases.filter(x=>x.better).length>=3,{cases,betterCount:cases.filter(x=>x.better).length},
 'Comparison is under matched predeclared resource needs; deliberate only on close competing commitments.');
}
function probe19(){
 const cases=[];
 for(const seed of SEEDS){
  const a=fresh(seed),b=clone(a),interruptTicks=[];
  for(let i=0;i<3500;i++){
   const code=(Math.imul(seed*31+i*17,1664525)>>>0)%1000;
   if(code===seed*17%1000&&interruptTicks.length<8&&available(b,'walk')){
    try{direct(b,'walk');interruptTicks.push(b.clock.centibeats)}catch{}
   }
   advance(a,archive,1);advance(b,archive,1);
  }
  const count=s=>s.events.filter(e=>e.type==='started'&&e.controller==='autonomous'&&
    ['work','read','inspect','study'].includes(e.kind)).length;
  const resumedAfter=b.events.filter(e=>e.type==='started'&&e.controller==='autonomous'&&
    ['work','read','inspect','study'].includes(e.kind)&&interruptTicks.some(t=>e.t>t&&e.t-t<=30000)).length;
  cases.push({seed,interruptions:interruptTicks.length,baselineInitiatives:count(a),
   interruptedInitiatives:count(b),postInterruptionInitiatives:resumedAfter,
   unpromptedSources:b.events.filter(e=>e.type==='started'&&e.controller==='autonomous'&&
    ['work','read','inspect','study'].includes(e.kind)).slice(0,5).map(e=>e.id)});
 }
 return result(19,'seeded unpredictable interruptions preserve spontaneous scientific initiative',
 cases.every(x=>x.interruptions>=3&&x.postInterruptionInitiatives>0),
 {cases},'Player commands mark interruptions only; initiative counts use controller=autonomous, never player-created actions.');
}
function probe20(){
 const cases=[];
 for(const seed of SEEDS){
  const a=fresh(seed),b=clone(a);
  // Let the resident actually inspect an instrument and return to a different room.
  direct(a,'inspect');direct(b,'inspect');runFor(a,100);runFor(b,100);
  direct(a,'sleep');direct(b,'sleep');runFor(a,10);runFor(b,10);
  const initial=b.beliefs.instrument?.room;
  let move=null;try{move=cognition.moveUnseen(b,'instrument','kitchen',log)}catch(e){
   cases.push({seed,error:String(e),previousBelief:initial});continue;
  }
  runFor(a,3500);runFor(b,3500);
  const routes=b.events.filter(e=>e.type==='route_learned'&&e.objectId==='instrument'),
   reads=b.events.filter(e=>e.type==='completed'&&e.kind==='inspect'&&e.t>move.t);
  const ctrl=a.events.filter(e=>e.type==='completed'&&e.kind==='inspect'&&e.t>move.t);
  cases.push({seed,previousBelief:initial,relocationId:move.id,
   learned:routes.map(x=>({id:x.id,from:x.previousRoom,to:x.newRoom,t:x.t})),
   currentBelief:b.beliefs.instrument?.room,
   laterInspections:reads.map(e=>({id:e.id,room:e.room,t:e.t})),
   staticInspections:ctrl.length,
   succeeded:routes.some(x=>x.newRoom==='kitchen')&&b.beliefs.instrument?.room==='kitchen'&&
    reads.some(e=>e.room==='kitchen')});
 }
 return result(20,'unseen permanent object move changes learned route and later inspection in actual play',
 cases.filter(x=>x.succeeded).length>=3,{cases},
 'Object migration is still a bounded intervention; a successful route is learned from observation, not the operator movement receipt.');
}
function probe25(){
 const cases=[];
 for(const seed of SEEDS){
  const s=fresh(seed),messages=[],replies=[];
  for(let i=0;i<2600;i++){
   if((Math.imul(seed*97+i*23,1103515245)>>>0)%307===29&&messages.length<12){
    const busy=s.activity?.kind||'free';
    const text='Is my work still unfinished? '+seed+' '+i;
    speak(s,text);const receipt=s.events.filter(e=>e.type==='speech_received').at(-1);
    messages.push({id:receipt.id,t:receipt.t,busy});
   }
   const prior=s.events.length;advance(s,archive,1);
   for(const e of s.events.slice(prior))if(e.type==='reply_delivered')replies.push({id:e.messageId,t:e.t,delay:e.delay,
    asleep:s.activity?.kind==='sleep'});
  }
  runFor(s,300);
  const delivered=s.events.filter(e=>e.type==='reply_delivered');
  const ok=messages.every(m=>{
   const r=delivered.find(x=>x.messageId===m.id);return r&&r.delay===r.t-m.t&&
    (m.busy!=='sleep'||r.t>m.t);
  })&&replies.every(x=>!x.asleep);
  cases.push({seed,received:messages.length,delivered:delivered.length,
   duringSleep:messages.filter(x=>x.busy==='sleep').length,
   messages,delays:delivered.map(e=>({messageId:e.messageId,delay:e.delay})),ok});
 }
 return result(25,'async queued messages over sleep, work and free time replay with exact delays',
 cases.every(x=>x.ok&&x.received>=5&&x.duringSleep>0),{cases},
 'All messages are scripted player stimuli, with logged source IDs and world-time delays; no reply is permitted from sleep.');
}
function probe29(){
 const s=fresh(11);runFor(s,30000);
 const prior=new Set(s.quirks.map(q=>q.originTag||q.originEventId));
 const at30={t:s.clock.centibeats,science:s.skills.science,quirks:s.quirks.length};
 runFor(s,30000);
 const gained=s.quirks.filter(q=>!prior.has(q.originTag||q.originEventId)&&q.memoryClass==='lived_runtime_memory');
 const mapped=gained.map(q=>({originTag:q.originTag,sourceId:q.originEventId,
  source:s.events.find(e=>e.id===q.originEventId)?.type,
  bonus:q.bonus,action:q.kind,
  inScore:(scores(s).find(x=>x.kind===q.kind)?.quirkFactors||[]).some(f=>f.originEventId===q.originEventId)}));
 return result(29,'day-60 lived quirks absent on day 30 drive subsequent action scores',
 mapped.length>0&&mapped.every(x=>x.source==='completed')&&mapped.some(x=>x.inScore),
 {at30,day60:{t:s.clock.centibeats,science:s.skills.science,quirks:s.quirks.length},
  gained:mapped},
 'Late quirks require real completed work receipts and must visibly bias the picker, not simply add new prose labels.');
}
function probe30(){
 const cases=[];
 for(const seed of SEEDS){
  const a=fresh(seed),b=clone(a);
  direct(a,'work');direct(b,'work');
  const count=s=>s.events.filter(e=>e.type==='completed'&&e.kind==='work').length;
  const first=s=>s.events.find(e=>e.type==='completed'&&e.kind==='work')?.t??null;
  runFor(a,200);
  for(let n=0;n<3;n++){
   runFor(b,6);direct(b,'walk');direct(b,'work');
  }
  // The bench fails after work has actually begun. Let the failure happen.
  cognition.impair(b,'bench',b.clock.centibeats+8000,log);
  runFor(b,160);
  const failures=b.events.filter(e=>e.type==='action_failed'&&e.kind==='work');
  if(!b.dead&&available(b,'work'))direct(b,'work');
  runFor(b,160);
  const disturbedFirst=first(b),controlFirst=first(a);
  cases.push({seed,controlFirst,disturbedFirst,
   delay:disturbedFirst!==null&&controlFirst!==null?disturbedFirst-controlFirst:null,
   workInterrupts:b.events.filter(e=>e.type==='interrupted'&&e.interrupted==='work').length,
   failures:failures.map(e=>({id:e.id,reason:e.reason})),restored:b.events.some(e=>e.type==='world_restored'&&e.target==='bench'),
   controlCompleted:count(a),interruptedCompleted:count(b)});
 }
 return result(30,'three true work interruptions plus a bench failure impose recovery time',
 cases.every(x=>x.workInterrupts>=3&&x.failures.length>0&&x.restored&&x.delay>0),
 {cases},'The scenario interrupts real physical work and lets the world loss expire; it never inserts a false completed task.');
}
function probe34(){
 const cases=[];
 for(const seed of SEEDS){
  const s=fresh(seed);runFor(s,16000);
  const names=['greeting','tea_first','instrument_quiet'];
  const learned=names.map(id=>({kind:id,learned:s.customs[id]?.learned,
   observations:s.customs[id]?.observations,source:s.customs[id]?.sourceEventIds}));
  const conflicts=s.events.filter(e=>e.type==='custom_conflict');
  const negotiated=s.events.filter(e=>e.type==='custom_negotiation');
  // For a deliberately framed changed norm, request work only while co-present.
  if(!conflicts.length){
   while(s.clock.centibeats<2250000&&!s.dead&&!s.people.visitor_01.present)advance(s,archive,1);
   if(s.people.visitor_01.present&&s.habitProfiles.work?.formed){
    const p=s.people.visitor_01;s.location=p.room;direct(s,'work');social.checkCustoms(s,log);
   }
  }
  const finalConflicts=s.events.filter(e=>e.type==='custom_conflict');
  const finalNegotiations=s.events.filter(e=>e.type==='custom_negotiation');
  cases.push({seed,learned,conflicts:finalConflicts.map(e=>({id:e.id,kind:e.custom,habitEventId:e.habitEventId})),
   negotiations:finalNegotiations.map(e=>({id:e.id,conflict:e.conflictEventId,custom:e.custom,social:e.socialEventId})),
   trust:s.people.visitor_01.trust,pass:learned.every(x=>x.learned&&x.observations>=2)&&
    finalConflicts.length>0&&finalNegotiations.length>0});
 }
 return result(34,'single visitor teaches three distinct customs and habit conflict leads to observed negotiation',
 cases.filter(x=>x.pass).length>=3,{cases},
 'Additional customs do not constitute a second independent person or qualify Articles 05 or 06.');
}
function replicate31(){
 const seeds=Array.from({length:10},(_,i)=>11+i),pairs=[];
 for(const seed of seeds){
  const a=fresh(seed),b=clone(a),until=b.clock.centibeats+16000;
  cognition.impair(b,'bench',until,log);runFor(a,1100);runFor(b,1100);
  const count=s=>s.events.filter(e=>e.type==='completed'&&e.t>until).reduce((m,e)=>(m[e.kind]=(m[e.kind]||0)+1,m),{});
  const x=count(a),y=count(b);
  pairs.push({seed,postRecoveryChanged:JSON.stringify(x)!==JSON.stringify(y),
   control:x,setback:y,restored:b.events.some(e=>e.type==='world_restored'&&e.target==='bench')});
 }
 const shifted=pairs.filter(p=>p.postRecoveryChanged).length;
 return result(31,'ten-seed setback replication records empirical downstream effect rate',
 pairs.length===10&&pairs.every(p=>p.restored)&&shifted>=1,
 {pairs,shifted,n:10,effectRate:shifted/10},
 'Evidence is a descriptive rate; one positive seed in ten still means a fragile effect.');
}
function run(){
 const probes=[],definitions=[[11,probe11],[13,probe13],[19,probe19],[20,probe20],
 [25,probe25],[29,probe29],[30,probe30],[34,probe34],[1,sample100],[31,replicate31]];
 for(const [id,fn] of definitions){
  try{probes.push(fn())}catch(e){probes.push(result(id,fn.name,false,{error:String(e),stack:String(e.stack).slice(0,900)},'An exception is a failed probe, not a passing grade'))}
 }
 return {schema:'simple-tower-v1.5-discriminations-v1',sourceHead:process.env.GITHUB_SHA||'unversioned',
  probes,passing:probes.filter(x=>x.pass).map(x=>x.article),notDemonstrated:probes.filter(x=>!x.pass).map(x=>x.article)};
}
function main(){
 const report=run(),raw=Buffer.from(JSON.stringify(report),'utf8').toString('base64');
 console.log('V15_DISC_BEGIN '+raw.length);
 for(let i=0;i<raw.length;i+=1700)console.log('V15_DISC_PART '+Math.floor(i/1700)+' '+raw.slice(i,i+1700));
 console.log('V15_DISC_END '+Math.ceil(raw.length/1700));
 console.log('V15_DISC_RESULTS '+JSON.stringify(report.probes.map(p=>({article:p.article,pass:p.pass,
  error:p.evidence?.error||null,
  sampleCount:p.evidence?.n||p.evidence?.cases?.length||null,
  effectRate:p.evidence?.effectRate||null}))));
}
if(require.main===module)main();
module.exports={run,probe11,probe13,probe19,probe20,probe25,probe29,probe30,probe34,sample100,replicate31};
