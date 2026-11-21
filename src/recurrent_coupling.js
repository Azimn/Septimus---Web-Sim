'use strict';
// Reversible research-only source-typed rumination influence.
// Predeclared parameters: research/RECURRENT_COUPLING_PREREG_2026-11-20.md.
// This module has no clock, persistence, speech, goal authoring, or motor authority.
const GAIN=6,WINDOW=13500,CAP=12;
const ARMS=new Set(['record_only','coupled','simple']);
function pressure(state,action){
 const arm=state.recurrenceArm||'record_only';
 if(!ARMS.has(arm))throw Error('Unsupported preregistered rumination arm');
 const now=state.clock.centibeats;
 const empty={arm,bonus:0,sourceCommitmentId:null,sourceThoughtIds:[]};
 if(arm==='record_only'||state.debugSwitches?.commitments===false||
    (arm==='coupled'&&state.ruminationCouplingDisabled===true))return empty;
 // One source-linked, currently open physical commitment can contribute.
 // Taking MAX, never summing, enforces CAP across simultaneous obligations.
 const active=(state.commitments||[]).filter(c=>!c.done&&
  (c.status===undefined||c.status==='open')&&c.action===action&&
  c.deadline>=now);
 let best=empty;
 for(const c of active){
  let bonus=0,ids=[];
  if(arm==='coupled'){
   for(const t of state.thoughts||[]){
    const age=now-t.t;
    if((t.sourceId!==c.id&&t.sourceId!==c.seriesId)||
       !Number.isFinite(age)||age<0||age>WINDOW||typeof t.id!=='string')continue;
    bonus+=GAIN*Math.max(0,1-age/WINDOW);
    ids.push(t.id);
   }
   bonus=Math.min(CAP,bonus);
  }else{
   const streak=Math.min(2,Math.max(0,state.series?.[c.seriesId]?.brokenStreak||0));
   bonus=Math.min(CAP,6+3*streak);
  }
  bonus=Math.round(bonus*100)/100;
  if(bonus>best.bonus)best={arm,bonus,sourceCommitmentId:c.id,
    sourceSeriesId:c.seriesId||null,sourceThoughtIds:ids};
 }
 return best;
}
module.exports={GAIN,WINDOW,CAP,pressure};
