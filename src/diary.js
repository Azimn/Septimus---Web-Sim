'use strict';
const Gate=require('./proposal_gateway'),Voice=require('./voice');
// s.diary is the factual journal; s.renderedDiary is an interpretation store.
// No rendered interpretation is a source candidate in the state card.
function render(s,receipt,{proposal=null,mode='ok'}={}){
 // Diary renderings may interpret only authoritative own/witnessed receipts.
 // No global-log event or private third-party fact may enter via the diary.
 const admitted=receipt&&Gate.ownReceipt(s,receipt.id);
 if(!admitted)throw Error('Diary citation lacks an inhabited receipt');
 s.renderedDiary??=[];
 const card=Gate.buildCard(s,{audience:'private',contextKey:'diary:private'});
 const fact=card.source.findLast(x=>x.id===admitted.id&&
  (x.predicate==='completed_action'||x.predicate==='witnessed_event'||
   x.predicate==='read_letter'||x.predicate==='decision_receipt'));
 const safe=fact?Gate.fromFact(card,fact,{id:'DIARY-TEMPLATE-'+receipt.id}):
  Gate.envelope(card,{id:'DIARY-TEMPLATE-'+receipt.id,utterance:Gate.NEUTRAL[2]});
 const candidate=proposal||safe;
 const check=mode==='ok'?Gate.check(candidate,card):{ok:false,reason:'source_'+mode};
 if(!check.ok)Voice.metadata(s,'model_rejected',{
  proposalId:candidate.proposalId,contextKey:'diary:private',reason:check.reason});
 const chosen=check.ok?candidate:safe;
 const sources=chosen.claims.map(c=>c.sourceId);
 const entry={id:'RD'+(s.renderedDiary.length+1),day:s.clock.day,t:s.clock.centibeats,
  text:chosen.utterance,sourceReceiptIds:[...new Set([admitted.id,...sources])],
  provenance:'rendered_interpretation',memoryEligible:false,
  stateRevision:card.revision,fallback:!check.ok};
 s.renderedDiary.push(entry);
 return {entry,check};
}
module.exports={render};
