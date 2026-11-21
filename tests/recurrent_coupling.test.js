'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {fresh}=require('../scripts/v12_probe');
const {scores}=require('../src/actions');
const {pressure,CAP,GAIN,WINDOW}=require('../src/recurrent_coupling');
function prepared(){
 const s=fresh(11); s.clock.centibeats=27000;
 s.thoughts.push({id:'LTEST1',sourceId:'C1',t:26500});
 return s;
}
test('Preregistration constants, authoritative baseline default and no shadow selector',()=>{
 assert.deepEqual([GAIN,WINDOW,CAP],[6,13500,12]);
 const s=prepared(),base=scores(s).map(x=>[x.kind,x.score]);
 assert.equal(pressure(s,'prepare').bonus,0);
 s.recurrenceArm='record_only';
 assert.deepEqual(scores(s).map(x=>[x.kind,x.score]),base);
});
test('Coupled effect requires recent source-typed thought, is bounded and disappears with lesion',()=>{
 const s=prepared();s.recurrenceArm='coupled';
 const p=pressure(s,'prepare');
 assert(p.bonus>0&&p.bonus<=12);
 assert.equal(p.sourceCommitmentId,'C1');
 assert.deepEqual(p.sourceThoughtIds,['LTEST1']);
 const result=scores(s).find(x=>x.kind==='prepare');
 assert.equal(result.recurrenceFactor.bonus,p.bonus);
 const normal=result.score;
 s.ruminationCouplingDisabled=true;
 assert.equal(pressure(s,'prepare').bonus,0);
 const off=scores(s).find(x=>x.kind==='prepare').score;
 assert.equal(Math.round((normal-off)*100)/100,p.bonus);
 s.ruminationCouplingDisabled=false;
 assert.equal(scores(s).find(x=>x.kind==='prepare').score,normal);
});
test('Source mismatch, stale thought, completed commitment, disabled commitments cannot influence scoring',()=>{
 const s=prepared();s.recurrenceArm='coupled';
 s.thoughts=[{id:'LWRONG',sourceId:'unrelated',t:27000}];
 assert.equal(pressure(s,'prepare').bonus,0);
 s.thoughts=[{id:'LSTALE',sourceId:'C1',t:27000-WINDOW-1}];
 assert.equal(pressure(s,'prepare').bonus,0);
 s.thoughts=[{id:'LFRESH',sourceId:'C1',t:27000}];
 s.commitments[0].done=true;
 assert.equal(pressure(s,'prepare').bonus,0);
 s.commitments[0].done=false;
 s.debugSwitches.commitments=false;
 assert.equal(pressure(s,'prepare').bonus,0);
});
test('Simple same-information comparator never reads thought records',()=>{
 const s=prepared();s.recurrenceArm='simple';s.series={'DAILY-HEARTH':{brokenStreak:2}};
 const a=pressure(s,'prepare');
 s.thoughts=[];
 const b=pressure(s,'prepare');
 assert.equal(a.bonus,12);assert.deepEqual(a,b);
 assert.equal(pressure(s,'read').bonus,0);
});
test('Neither arm creates a new feasible action nor mutates world state when scoring',()=>{
 const s=prepared();const frozen=structuredClone(s);
 s.recurrenceArm='coupled';const a=scores(s);
 assert.deepEqual({...s,recurrenceArm:undefined},{...frozen,recurrenceArm:undefined});
 s.recurrenceArm='record_only';const b=scores(s);
 assert.deepEqual(new Set(a.map(x=>x.kind)),new Set(b.map(x=>x.kind)));
});
