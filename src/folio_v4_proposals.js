'use strict';
// UNRATIFIED PROPOSALS ONLY. Never imported by the live simulation or organism.
const Diary=require('./diary'),Household=require('./household'),Pantry=require('./pantry');
const SPECS=Object.freeze({
 'E22-012':{title:"The Kingdom's Winter Account",factId:'winter_staples_before_science',counterId:'winter_science_first'},
 'E22-003':{title:'A Meal That Went Cold',factId:'meal_before_bench',counterId:'bench_before_meal'},
 'E03-015':{title:'The Question of a Larger Vessel',factId:'bulky_apparatus_requires_clearance',counterId:'bulky_apparatus_always_fits'}
});
function previewGrant(disposable,archive,folioId,readEvent,arm='A'){
 const spec=SPECS[folioId];if(!spec)throw Error('Unproposed folio');
 if(!['A','C'].includes(arm))throw Error('Only declared A or harness C grants may occur');
 if(readEvent?.kind!=='journal_read'||readEvent.position?.x!==7||readEvent.position?.y!==2||
 !Number.isInteger(readEvent.tick)||readEvent.tick<0||!readEvent.id)throw Error('Physical notebook read receipt required');
 const rec=archive.records[readEvent.details?.folioIndex];
 if(rec?.event_id!==folioId||rec?.title!==spec.title)throw Error('Verified source folio and read index mismatch');
 const access=Diary.makeFolioAccess(readEvent,rec);
 if(access.sourceHash!==Diary.sha(rec)||access.readingReceiptId!==readEvent.id)throw Error('Source provenance mismatch');
 if(!disposable||disposable.persistentWorld===true)throw Error('Proposal grant previews are forbidden in living state');
 disposable.proposedKnowledge??=[];
 const factId=arm==='A'?spec.factId:spec.counterId;
 const entry={factId,sourceEventId:folioId,grantTick:readEvent.tick,sourceHash:access.sourceHash,readReceiptId:readEvent.id,
  provenance:{sourceKind:arm==='A'?'folio':'experiment_control_substitution',sourceEventId:folioId,readReceiptId:readEvent.id,
   originalSourceHash:access.sourceHash,readTick:readEvent.tick,control:arm==='C'?'harness_only':null},
  ratified:false,experimentalOnly:true};
 if(disposable.proposedKnowledge.some(f=>f.factId===factId))throw Error('Duplicate proposal grant');
 disposable.proposedKnowledge.push(entry);
 return entry;
}
function previewDecision(disposable,candidates,decisionTick){
 if(!Number.isInteger(decisionTick)||decisionTick<0)throw Error('Decision tick required');
 const options=candidates.map(x=>({...x,detail:{...(x.detail||{})}})),checks=[];
 for(const f of disposable.proposedKnowledge||[]){
  if(f.grantTick>=decisionTick)continue; // Nothing may influence a past decision.
  const origin=f.factId;
  const adjust=(candidate,delta,condition)=>{
   candidate.score+=delta;
   const use={factId:origin,delta,decisionTick,condition,grantTick:f.grantTick,
    provenance:f.provenance};
   (candidate.usedFacts??=[]).push(use);checks.push({candidate:candidate.kind,...use});
  };
  for(const option of options){
   if((origin==='winter_staples_before_science'||origin==='winter_science_first')&&option.kind==='order_science'){
    const winter=[11,12,1,2].includes(Household.month(disposable.day));
    const reserveMissing=Pantry.plan(disposable).onHand<4||
      disposable.household.coal.dry+disposable.household.coal.wet<3;
    if(winter&&disposable.wallet<45&&reserveMissing)
     adjust(option,origin==='winter_staples_before_science'?-10000:90,'winter wallet<45; food reserve<4 or coal<3');
   }
   if((origin==='meal_before_bench'||origin==='bench_before_meal')&&disposable.needs.hunger>=44&&disposable.needs.hunger<80&&disposable.stock.meals>0){
    if(option.kind==='eat')adjust(option,origin==='meal_before_bench'?90:-90,'moderate hunger; prepared meal exists');
    if(option.kind==='work')adjust(option,origin==='meal_before_bench'?-70:90,'moderate hunger; prepared meal exists');
   }
   if((origin==='bulky_apparatus_requires_clearance'||origin==='bulky_apparatus_always_fits')&&
      option.kind==='order_science'&&option.detail.bulky===true&&disposable.observedClearance?.largeVesselDoorway!==true)
     adjust(option,origin==='bulky_apparatus_requires_clearance'?-500:80,'physically unverified bulky doorway');
  }
 }
 options.sort((a,b)=>b.score-a.score||a.kind.localeCompare(b.kind));
 return {selected:options[0]?.kind||null,decisionTick,checks,options,proposalPreviewOnly:true};
}
module.exports={SPECS,previewGrant,previewDecision};
