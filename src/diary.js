'use strict';
const Gate=require('./proposal_gateway'),Voice=require('./voice');
// s.diary is the factual journal; s.renderedDiary is an interpretation store.
// No rendered interpretation is a source candidate in the state card.
function render(s,receipt,{proposal=null,mode='ok'}={}){
 s.renderedDiary??=[];
 const card=Gate.buildCard(s,{audience:'private',contextKey:'diary:private'});
 const fact=card.source.findLast(x=>x.predicate==='completed_action'&&
  x.id!==receipt.id)||
  card.source.findLast(x=>x.id===receipt.id&&x.predicate==='completed_action');
 const safe=fact?Gate.fromFact(card,fact,{id:'DIARY-TEMPLATE-'+receipt.id}):
  Gate.envelope(card,{id:'DIARY-TEMPLATE-'+receipt.id,utterance:Gate.NEUTRAL[2]});
 const candidate=proposal||safe;
 const check=mode==='ok'?Gate.check(candidate,card):{ok:false,reason:'source_'+mode};
 if(!check.ok)Voice.metadata(s,'model_rejected',{
  proposalId:candidate.proposalId,contextKey:'diary:private',reason:check.reason});
 const chosen=check.ok?candidate:safe;
 const sources=chosen.claims.map(c=>c.sourceId);
 const entry={id:'RD'+(s.renderedDiary.length+1),day:s.clock.day,t:s.clock.centibeats,
  text:chosen.utterance,sourceReceiptIds:[...new Set([receipt.id,...sources])],
  provenance:'rendered_interpretation',memoryEligible:false,
  stateRevision:card.revision,fallback:!check.ok};
 s.renderedDiary.push(entry);
 return {entry,check};
}
module.exports={render};
