'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sha = item => crypto.createHash('sha256').update(typeof item === 'string' ? item : JSON.stringify(item)).digest('hex');
const DEFAULT_ARCHIVE = path.join(__dirname, '..', 'canon', 'Pretorius_v12_450_Events_Complete.jsonl');
const PINNED_SOURCE_GIT_BLOB='718dcc2d5ba4feccdef1690d447edfcebaa9bfb5';
function gitBlob(text){return crypto.createHash('sha1').update(`blob ${Buffer.byteLength(text)}\0`).update(text).digest('hex')}
function loadArchive(filename = DEFAULT_ARCHIVE) {
  if (!fs.existsSync(filename)) return {status:'missing', records:[], source:'Pretorius-Connectome:v12', message:'Place the source-verified v12 archive in canon/ to enable all historical folios.'};
  const text=fs.readFileSync(filename,'utf8');
  if(gitBlob(text)!==PINNED_SOURCE_GIT_BLOB)throw Error('Canonical autobiographical archive hash differs from frozen v12 Git blob');
  const records=text.trim().split(/\r?\n/).map(line=>JSON.parse(line));
  const ids=new Set(records.map(r=>r.event_id));
  if(records.length!==450||ids.size!==450||!records.every(r=>r.event_id&&r.memory_text&&r.provenance==='reconstructed')||records.at(-1).event_id!=='E05-021')throw Error('Invalid or incomplete reconstructed autobiography archive');
  return {status:'verified_structure',records,source:'Pretorius-Connectome:v12',digest:sha(text)};
}
// These are first-person recollections, NOT edits to verified world facts.
const subjective={
 drink_sink:'I drank water from the kitchen vessel. I recall the coolness more clearly than the hour.',
 eat_meal:'I took my meal at the table. I remember my hunger becoming less troublesome.',
 cook:'I prepared a meal at the kitchen range; the small domestic labor was necessary.',
 sleep:'I slept, though I cannot place the exact hour of waking.',
 toilet:'I attended to my bodily necessities.',
 repair:'I made a practical repair to an instrument. The result, rather than my satisfaction, must stand as evidence.',
 experiment:'I completed an observation at the bench and made a report of what occurred.',
 plant:'I put seeds into the garden soil, with hopes which are not yet results.',
 harvest:'I gathered what had ripened in the garden.',
 catalog_order:'I placed an order for supplies, which are not in my possession merely because I paid.',
 collect_parcel:'I collected a parcel from the letter box.',
 book_completed:'I completed a book and retained a few observations which may prove useful.',
 read_section:'I continued my reading.',
 journal_read:'I opened my notebook to an earlier passage. Its account is not the same thing as an event happening again.',
 journal_write:'I returned to the private notebook, attempting to distinguish what occurred from what I infer.',
 check_clock:'I glanced at the dial. Its reading is a perception, not an innate knowledge of time.'
};
function recollect(event){
 const text=subjective[event.kind]||`I recall an occurrence in the ${event.room||'tower'}, but the particulars require checking against my notes.`;
 return {text,confidence:'recollected_not_exact',observerTime:null,sourceEventId:event.id,objectiveText:event.description};
}
// E03-002, E22-001, E22-012 and E18-010: a diary of observed household pressures.
// This first-person prose is deterministic templating, not inference or exact recollection.
function incident(event){
 const d=event.details||{},place=event.room||'tower',kind=event.kind;
 if(kind==='catalog_order')return `I ordered ${Object.entries(d.goods||{}).map(([item,count])=>`${count} ${item}`).join(', ')||'goods'} from ${d.supplierId==='rosa_brandl'?'Rosa Brandl’s firm':'the supplier'} for ${d.price??'an uncertain amount'} crowns; purchase is not delivery.`;
 if(kind==='delivery_arrived')return `The cart or post brought ${d.type||'goods'} from ${d.source||'a supplier'}; I cannot swear I witnessed its arrival.`;
 if(kind==='coal_collected')return `At the porch I handled ${d.quantity} baskets of ${d.wet?'wet':'dry'} coal, supplied by Rosa Brandl’s firm.`;
 if(kind==='inspect_coal')return `I counted ${d.quantity} coal baskets near the entrance; ${d.wet||0} remained damp.`;
 if(kind==='burn_coal')return `I stoked the kitchen hearth with ${d.wet?'damp':'dry'} coal, and observed the difference in warmth.`;
 if(kind==='inspect_fabric')return `I examined the ${d.subject||'tower'} and found ${d.observation||'signs of wear'}.`;
 if(kind==='roof_repair')return `I had the roof repaired using ${d.roofingUsed||1} packet of material; the chamber appeared dry again.`;
 if(kind==='floor_repair')return `I had the stair boards renewed using ${d.boardsUsed||1} board.`;
 if(kind==='garden_tended')return `I cut back the nettles along the garden path; the passage is clear for now.`;
 if(kind==='cook')return `I prepared ${d.recipe||'a meal'} upon the kitchen range, a necessary domestic labour.`;
 if(kind==='harvest')return `The garden yielded ${JSON.stringify(d.carried||{})}; I brought the crop indoors.`;
 if(kind==='journal_read')return `I read an old passage in my private notebook, and judged my present circumstances against it.`;
 if(kind==='collect_payment')return `I received ${d.amount||'some'} crowns for a report I had sent away.`;
 if(kind==='sleep')return `I slept in the ${place}, with ${d.coldRoom?'little comfort from the chill':'comparative comfort'}.`;
 if(kind==='eat_meal')return `I ate at the table and noted that ${d.mealsRemaining??'some'} meals remained.`;
 if(kind==='repair')return `I repaired an instrument in the ${place} and found ${d.damageRemaining??'less'} damage remaining.`;
 return recollect(event).text;
}
function makePage(writeEvent,observedEvent,sourceHash,otherEvents=[],folio=null){
 if(writeEvent.kind!=='journal_write'||writeEvent.details?.sourceEventId!==observedEvent.id)throw Error('A physical writing receipt and matching source event are required');
 const selected=[observedEvent,...otherEvents.filter(e=>e&&e.id!==observedEvent.id)].slice(0,5);
 const sourceEventIds=selected.map(e=>e.id),sourceHashes=selected.map(e=>sha(e));
 const response=folio?` I have also read in my old journal a passage entitled “${folio.title}.” It describes an earlier account, not an occurrence of today; I find myself considering ${folio.sourceEventId} without asserting that the past has returned.`:'';
 return {id:`PAGE-${writeEvent.id}`,writtenBy:'Septimus Pretorius',authorshipMode:'deterministic_first_person_draft',
 evidenceKind:'verified_world_receipt',writingReceiptId:writeEvent.id,sourceEventId:observedEvent.id,sourceHash,
 sourceEventIds,sourceHashes,responseFolioId:folio?.sourceEventId||null,writingDay:writeEvent.day,
 approximateWhen:'This evening, as best I recall; no precise hour asserted',
 text:`I set down these particulars at the end of the day, aware that my account is fallible. ${selected.map(incident).join(' ')}${response} These notes are impressions, not corrections to the physical ledger.`,
 memoryEligible:false,mechanicalTimeNotInText:true};
}
function makeFolioAccess(readEvent,folio){
 if(readEvent.kind!=='journal_read'||!folio||readEvent.details?.folioIndex===undefined)throw Error('A physical reading receipt is required');
 return {id:`FOLIO-${readEvent.id}`,source:'Pretorius-Connectome:v12',sourceProvenance:'reconstructed',
   readingReceiptId:readEvent.id,sourceEventId:folio.event_id,sourceHash:sha(folio),title:folio.title,
   approximateHistoricalDate:folio.approximate_date,firstPersonText:folio.memory_text,
   note:'A reconstructed historical notebook folio accessed in the world, not a newly lived past event.'};
}
module.exports={loadArchive,recollect,makePage,makeFolioAccess,sha};
