'use strict';
// Speech and diary share one fail-closed ingress. No provider or network client.
const Gate=require('./proposal_gateway');
const POLICY=Object.freeze({maxDeferredCentibeats:100000,fallback:'sourced_template'});
function stateCard(s,opts){return Gate.buildCard(s,opts);}
function claimsCheck(proposal,card){return Gate.check(proposal,card);}
function compose(s,text,card=stateCard(s)){
 const current=card.source.find(x=>x.predicate==='open_commitment');
 if(/resolve|finished|forget (about|it)|all done|close (it|this)/i.test(text)&&current)
  return Gate.fromFact(card,current,{id:'TEMPLATE-COMMIT-'+card.revision});
 const decision=card.source.filter(x=>x.predicate==='decision_receipt').at(-1);
 if(/why did you|why (did|choose)/i.test(text)&&decision)
  return Gate.fromFact(card,decision,{id:'TEMPLATE-DECISION-'+card.revision});
 return Gate.envelope(card,{id:'TEMPLATE-NEUTRAL-'+card.revision,
  utterance:Gate.NEUTRAL[0]});
}
function metadata(s,kind,fields){
 s.operatorMetadata??=[];
 const entry={id:'O'+(s.operatorMetadata.length+1),tick:s.clock.centibeats,
  provenance:'operator_metadata',memoryEligible:false,kind,...fields};
 s.operatorMetadata.push(entry);return entry;
}
function fallback(s,message,card,reason,log){
 let safe=compose(s,message.text,card),check=Gate.check(safe,card);
 if(!check.ok){safe=Gate.envelope(card,{id:'FALLBACK-'+message.id,
  utterance:Gate.NEUTRAL[2]});check=Gate.check(safe,card);}
 metadata(s,'proposal_fallback',{messageId:message.id,reason});
 log(s,'reply_fallback','The unavailable proposal was replaced by sourced template speech.',{
  messageId:message.id,reason,sourceIds:check.verified?.map(x=>x.sourceId)||[],
  provenance:'operator_metadata',memoryEligible:false});
 return {safe,check};
}
function consume(s,message,proposal,log,{mode='ok',card=null}={}){
 s.proposalResults??={};
 if(proposal?.proposalId&&s.proposalResults[proposal.proposalId])
  return {...s.proposalResults[proposal.proposalId],duplicate:true};
 const deliveryCard=card||stateCard(s,{audience:message.audience||'player',
  contextKey:message.contextKey||'speech:player'});
 let check=mode==='ok'?Gate.check(proposal,deliveryCard):
  {ok:false,reason:mode==='refuse'?'source_refusal':mode==='timeout'?'source_timeout':'source_garbled'};
 if(mode==='garble')check={ok:false,reason:'malformed_envelope'};
 let used=proposal,fallbackUsed=false;
 if(!check.ok){
  if(mode==='ok'&&proposal){
   metadata(s,'model_rejected',{proposalId:proposal.proposalId||null,messageId:message.id,
    reason:check.reason,rejectedTextPreview:String(proposal.utterance||'').slice(0,90)});
  }
  const f=fallback(s,message,deliveryCard,check.reason,log);
  used=f.safe;fallbackUsed=true;
 }
 log(s,'claims_check','The source-bound proposal was checked before rendering.',{
  messageId:message.id,proposalId:proposal?.proposalId||null,ok:check.ok,
  reason:check.reason,fallbackUsed,sourceIds:used.claims.map(c=>c.sourceId),
  provenance:'operator_metadata',memoryEligible:false});
 const reply=used.utterance;s.surface.lastWords=reply;
 const e=log(s,'reply_delivered','I answered only with bounded source-checked language.',{
  messageId:message.id,proposalId:proposal?.proposalId||null,reply,
  sourceIds:used.claims.map(c=>c.sourceId),fallbackUsed,
  delay:s.clock.centibeats-message.receivedAt});
 const result={reply,check,fallbackUsed,eventId:e.id,messageId:message.id};
 if(proposal?.proposalId)s.proposalResults[proposal.proposalId]=result;
 s.deliveredReplies.push({messageId:message.id,reply,eventId:e.id,fallbackUsed});
 return result;
}
function deliver(s,message,log){
 const card=stateCard(s,{audience:message.audience||'player',
  contextKey:message.contextKey||'speech:player'});
 const fixture=message.fixture||{};
 const mode=s.clock.centibeats-message.receivedAt>POLICY.maxDeferredCentibeats?
  'timeout':fixture.mode||'ok';
 let proposal=fixture.proposal||null;
 if(!proposal&&fixture.recipe==='neutral-at-delivery')
  proposal=Gate.envelope(card,{id:'DELIVERY-FIXTURE-'+message.id,
   utterance:Gate.NEUTRAL[0]});
 if(!proposal)proposal=compose(s,message.text,card);
 // Delayed requests may not borrow an earlier state card. Always recheck at
 // delivery. Templates are constructed at delivery and never become stale.
 const result=consume(s,message,proposal,log,{mode,card});
 return result.reply;
}
function receive(s,text,log,fixture=null){
 const e=log(s,'speech_received','I received a question at the tower.',{
  source:'player',messageText:String(text).slice(0,200)});
 const message={id:e.id,text:String(text).slice(0,300),receivedAt:s.clock.centibeats,
  audience:'player',contextKey:'speech:player:'+e.id};
 if(s.activity){
  s.replyQueue.push(message);
  log(s,'reply_queued','I could not answer while occupied or asleep.',{
   messageId:e.id,busy:s.activity.kind});
 } 
 // The caller may provide a fixture proposal or failure mode, never a client.
 // The proposal is stamped only after all receipt writes at submission.
 if(fixture&&typeof fixture==='object'){
  const card=stateCard(s,{audience:message.audience,contextKey:message.contextKey});
  const proposal=typeof fixture.factory==='function'?fixture.factory(card):fixture.proposal;
  message.fixture={mode:fixture.mode||'ok',proposal:proposal||null,
   recipe:fixture.recipe||null};
 }
 if(s.activity)return s.surface.lastWords;
 return deliver(s,message,log);
}
function flush(s,log){if(s.activity)return null;
 const next=s.replyQueue.shift();if(next)return deliver(s,next,log);return null;}
module.exports={POLICY,stateCard,claimsCheck,compose,consume,receive,flush,deliver,metadata};
