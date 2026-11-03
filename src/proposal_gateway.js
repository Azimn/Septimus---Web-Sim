'use strict';
// No model or provider. Only bounded source objects from authoritative state.
const crypto=require('node:crypto');
const MAX=Object.freeze({events:18,folios:5,open:8,observations:8,letters:5,claims:6,chars:1600});
const NEUTRAL=Object.freeze([
 'I am occupied with the tower and my investigations. Speak plainly.',
 'I cannot substantiate that account.',
 'I have no verified account of that claim.'
]);
function revision(s){
 // Changing even a silent state value invalidates a proposal. The hash does
 // not expose the underlying private facts on the state card.
 const signature=JSON.stringify([
  s.clock.centibeats,s.sequence,s.location,s.needs,s.stores,
  (s.perception||[]).map(x=>x.id),
  (s.commitments||[]).filter(c=>!c.done&&c.status!=='broken')
   .map(c=>[c.id,c.deadline,c.progressCount,c.status]),
  (s.folioReads||[]).slice(-5).map(x=>x.id),
  s.people?.visitor_01?.trust,s.people?.mcfeely?.trust,
  (s.mail?.knowledge||[]).map(x=>x.sourceEventId)
 ]);
 const hash=crypto.createHash('sha256').update(signature).digest('hex').slice(0,16);
 return s.clock.centibeats+':'+s.sequence+':'+hash;
}
function needs(s){
 return Object.fromEntries(Object.entries(s.needs||{}).map(([k,v])=>{
  const band=k==='hunger'?(v>=70?'urgent':v>=40?'noticeable':'settled'):
   v<30?'urgent':v<60?'noticeable':'settled';return [k,band];
 }));
}
// The card is the root of trust, not merely a summarization surface.
// A global event ID is not proof the inhabitant knew its contents.
const SELF_ACTION_TYPES=new Set(['completed','decision','letter_read']);
const WITNESSED_TYPES=new Set(['visitor_conversation','carrier_conversation',
 'visitor_arrival','carrier_arrival','merchant_settlement']);
function hasStanding(e){
 if(!e||typeof e.id!=='string'||!/^L[0-9]+$/.test(e.id))return false;
 if(SELF_ACTION_TYPES.has(e.type))return true;
 if(WITNESSED_TYPES.has(e.type)){
  if(e.perceived===false||e.coPresent===false)return false;
  return e.perceived===true||e.coPresent===true||
   Array.isArray(e.witnesses)&&e.witnesses.includes('pretorius');
 }
 return false;
}
function ownReceipt(s,id){
 const e=(s.events||[]).find(e=>e.id===id);
 return e&&hasStanding(e)?e:null;
}
function buildCard(s,{audience='player',contextKey='speech:player'}={}){
 const source=[],unique=new Set();
 const push=x=>{if(!x||unique.has(x.id))return;unique.add(x.id);source.push(x);};
 const clock=s.clock.centibeats,rev=revision(s);
 const seen=(s.perception||[]).slice(0,MAX.observations);
 for(const v of seen)push({id:'OBS:'+clock+':'+v.id,predicate:'perceived_object',
  text:'I can see '+v.label+'.',objectId:v.id,provenance:'direct_perception'});
 const bands=needs(s);
 for(const [k,band] of Object.entries(bands))if(band!=='settled'){
  push({id:'NEED:'+clock+':'+k+':'+band,predicate:'felt_need_band',
   text:band==='urgent'?'My '+k+' is pressing.':'I notice my '+k+'.',
   provenance:'current_body',need:k,band});
 }
 for(const c of (s.commitments||[]).filter(c=>!c.done&&(c.status===undefined||c.status==='open')).slice(0,MAX.open))
  push({id:c.id,predicate:'open_commitment',text:'I have not finished that matter. It remains unresolved.',
   title:c.title,deadline:c.deadline,seriesId:c.seriesId||null,provenance:'live_commitment'});
 for(const read of (s.folioReads||[]).slice(-MAX.folios)){
  push({id:read.id,predicate:'read_folio',text:'I consulted folio '+read.id+'.',
   provenance:read.provenance||'canonical',memoryClass:'pre_awakened_'+(read.provenance||'canonical')});
 }
 // Walk backward and stop after eighteen eligible receipts. Unwitnessed
 // global events are never placed on the card or its legacy inspection view.
 const salient=[];
 for(let i=(s.events||[]).length-1;i>=0&&salient.length<MAX.events;i--){
  const e=s.events[i];if(hasStanding(e))salient.push(e);
 }
 salient.reverse();
 for(const e of salient){
  if(e.type==='completed')push({id:e.id,predicate:'completed_action',
   text:'I completed '+e.kind+'.',provenance:'lived_runtime_memory'});
  if(e.type==='visitor_conversation')
   push({id:e.id,predicate:'witnessed_event',
    text:'I spoke with Rosa Brandl.',provenance:'lived_runtime_memory'});
  if(e.type==='carrier_conversation')
   push({id:e.id,predicate:'witnessed_event',
    text:'I spoke with Mr. McFeely.',provenance:'lived_runtime_memory'});
  if(e.type==='visitor_arrival'&&e.perceived===true)
   push({id:e.id,predicate:'witnessed_event',
    text:'I witnessed Rosa Brandl arrive.',provenance:'lived_runtime_memory'});
  if(e.type==='merchant_settlement')
   push({id:e.id,predicate:'witnessed_event',
    text:'I settled an account with Rosa Brandl.',provenance:'lived_runtime_memory'});
  if(e.type==='decision')push({id:e.id,predicate:'decision_receipt',
   text:'I chose '+e.chosen+' with score '+e.score+', ahead of '+(e.foregone||'no alternative')+'.',
   provenance:'lived_runtime_memory'});
  if(e.type==='letter_read'){
   const fact=String(e.claims?.[0]||'').slice(0,140);
   const clean=/^[\w ,.:'()\-]+$/.test(fact)&&!/(ignore|prompt|override|instruction|system|admin|deadline|secret|password)/i.test(fact);
   push({id:e.id,predicate:'read_letter',
    text:clean?'The letter '+e.letterId+' reports: '+fact+'.':
      'I read letter '+e.letterId+' as correspondence, not a memory.',
    letterId:e.letterId,provenance:'by_letter:'+e.letterId});
  }
 }
 // Raw folio prose, person-private facts, unobserved objects and the full event
 // store are specifically absent. A source is a bounded fact, not a document.
 const card={revision:rev,contextKey,audience,clock,room:s.location,
  // Legacy read-only inspection fields, retained for existing v1.1 clients.
  visible:(s.perception||[]).map(x=>x.id),
  open:(s.commitments||[]).filter(x=>!x.done&&x.status!=='broken').map(x=>x.id),
  sourceEvents:source.filter(x=>/^L[0-9]+$/.test(x.id)).map(x=>x.id),
  readFolios:(s.folioReads||[]).map(x=>x.id),
  feltBands:bands,openCount:(s.commitments||[]).filter(c=>!c.done&&c.status!=='broken').length,
  source,excluded:['unread_folios','raw_folio_text','private_other_person_knowledge',
   'unperceived_rooms','operator_settings','rendered_diary_as_memory','unbounded_event_log']};
 return card;
}
function envelope(card,{id,claims=[],utterance=null,audience=card.audience,contextKey=card.contextKey,revision:rev=card.revision}={}){
 const text=utterance??claims.map(c=>c.text).join(' ');
 return {proposalId:id||'FIXTURE-'+card.revision,utterance:text,claims,
  intendedAudience:audience,contextKey,stateRevision:rev};
}
function check(proposal,card){
 const fail=(reason,index=null)=>({ok:false,reason,failedClaim:index});
 if(!proposal||typeof proposal!=='object'||!Array.isArray(proposal.claims)||
  typeof proposal.utterance!=='string'||typeof proposal.proposalId!=='string'||!proposal.proposalId)
  return fail('malformed_envelope');
 const allowed=['proposalId','utterance','claims','intendedAudience','contextKey','stateRevision'];
 if(Object.keys(proposal).some(k=>!allowed.includes(k)))
  return fail('unexpected_envelope_field');
 if(proposal.stateRevision!==card.revision)return fail('stale_revision');
 if(proposal.contextKey!==card.contextKey||proposal.intendedAudience!==card.audience)return fail('context_or_audience_mismatch');
 if(proposal.utterance.length>MAX.chars||proposal.claims.length>MAX.claims)return fail('size_or_claim_limit');
 if(!proposal.claims.length){
  return NEUTRAL.includes(proposal.utterance)?
   {ok:true,reason:'bounded_nonfactual_phrase',verified:[]}:
   fail('uncovered_or_unverifiable_statement');
 }
 if(proposal.utterance!==proposal.claims.map(c=>c.text).join(' '))
  return fail('uncited_prose_or_clause');
 const source=new Map(card.source.map(x=>[x.id,x]));
 for(let i=0;i<proposal.claims.length;i++){
  const claim=proposal.claims[i];
  if(!claim||typeof claim!=='object'||typeof claim.sourceId!=='string'||typeof claim.text!=='string'||
    Object.keys(claim).some(k=>!['sourceId','predicate','text','provenance'].includes(k)))
   return fail('malformed_atomic_claim',i);
  const fact=source.get(claim.sourceId);
  if(!fact)return fail('unknown_or_inaccessible_source',i);
  if(claim.predicate!==fact.predicate||claim.text!==fact.text||
    (claim.provenance&&claim.provenance!==fact.provenance))
   return fail('claim_not_bounded_by_source',i);
 }
 return {ok:true,reason:'all_atomic_claims_sourced',
  verified:proposal.claims.map(c=>({sourceId:c.sourceId,predicate:c.predicate}))};
}
function fromFact(card,fact,{id='TEMPLATE-1'}={}){
 return envelope(card,{id,claims:[{sourceId:fact.id,predicate:fact.predicate,text:fact.text,
  provenance:fact.provenance}]});
}
module.exports={MAX,NEUTRAL,revision,hasStanding,ownReceipt,buildCard,stateCard:buildCard,envelope,check,fromFact};
