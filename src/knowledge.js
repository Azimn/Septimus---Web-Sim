'use strict';
// Small inventory of beliefs. No semantic parsing, no extra organ, no unread-folio access.
const RULES=Object.freeze({
 'E22-001':[{id:'floor_east_rotten',text:'The east stair floor is rotten; Rosa would not set baskets on it.'},
             {id:'floor_inspection_warranted',text:'The stair floor warrants inspection.'}],
 'E03-002':[{id:'coal_unreliable',text:'Coal may be late and wet; order before need.'}],
 'E18-010':[{id:'paths_nettle_untended',text:'Untended garden paths grow nettles; tend early.'}]
});
const COUNTER=Object.freeze({'E22-001':['floor_sound'],'E03-002':['coal_reliable'],'E18-010':['paths_clear']});
const EXPERIENTIAL=Object.freeze({
 floor_hazard:['floor_east_rotten','floor_inspection_warranted'],
 inspect_fabric:['floor_inspection_warranted'],
 coal_collected:['coal_unreliable'],
 coal_stockout_perceived:['coal_unreliable'],
 garden_path_seen:['paths_nettle_untended']
});
function inventory(state){state.knowledge??={facts:[]};return state.knowledge}
function held(state,id){return (state.knowledge?.facts||[]).find(x=>x.id===id)||null}
function grant(state,{id,sourceKind,sourceId,sourceReceiptId,sourceHash=null,grantTick,readTick=null,control=null}){
 if(!id||!['folio','experienced','experiment_control_substitution'].includes(sourceKind))throw Error('Unknown knowledge grant');
 if(!Number.isInteger(grantTick)||grantTick<0||!sourceReceiptId)throw Error('Knowledge grant requires a physical receipt and tick');
 if(sourceKind==='folio'&&!(RULES[sourceId]||[]).some(x=>x.id===id))throw Error('Undeclared canonical folio fact');
 if(sourceKind==='experiment_control_substitution'&&!(COUNTER[sourceId]||[]).includes(id))throw Error('Undeclared false counter-folio fact');
 if(sourceKind==='experienced'&&!(EXPERIENTIAL[sourceId]||[]).includes(id))throw Error('Undeclared direct-experience fact');
 if(sourceKind!=='experienced'&&(!Number.isInteger(readTick)||readTick>grantTick||!sourceHash))throw Error('Folio grant is missing verified read or digest');
 const k=inventory(state),prior=held(state,id);
 if(prior)return null;
 const entry={id,grantTick,provenance:{sourceKind,sourceId,sourceReceiptId,sourceHash,readTick,control}};
 k.facts.push(entry);return entry;
}
function canonicalGrants(state,folioId,readingReceiptId,sourceHash,readTick){
 const items=RULES[folioId]||[];return items.map(f=>grant(state,{id:f.id,sourceKind:'folio',sourceId:folioId,sourceReceiptId:readingReceiptId,sourceHash,readTick,grantTick:readTick})).filter(Boolean);
}
function counterGrants(state,folioId,readingReceiptId,sourceHash,readTick){
 return (COUNTER[folioId]||[]).map(id=>grant(state,{id,sourceKind:'experiment_control_substitution',sourceId:folioId,sourceReceiptId:readingReceiptId,sourceHash,readTick,grantTick:readTick,control:'harness_only'})).filter(Boolean);
}
function experiencedGrants(state,event){
 if(event.perceived===false)return [];
 const d=event.details||{};
 if(event.kind==='inspect_fabric'&&d.subject!=='floor')return [];
 if(event.kind==='coal_collected'&&!d.wet)return [];
 if(event.kind==='garden_path_seen'&&!(d.nettles>=40))return [];
 return (EXPERIENTIAL[event.kind]||[]).map(id=>grant(state,{id,sourceKind:'experienced',sourceId:event.kind,sourceReceiptId:event.id,grantTick:event.tick})).filter(Boolean);
}
function validatePersisted(grantEntry,access,reading,record,digest){
 if(!access||access.readingReceiptId!==grantEntry.provenance.sourceReceiptId||access.sourceEventId!==grantEntry.provenance.sourceId||access.sourceHash!==digest||reading?.id!==access.readingReceiptId||reading.kind!=='journal_read'||record?.event_id!==grantEntry.provenance.sourceId||
 grantEntry.provenance.sourceHash!==digest||grantEntry.provenance.readTick!==reading.tick||grantEntry.grantTick!==reading.tick||
 !(RULES[grantEntry.provenance.sourceId]||[]).some(x=>x.id===grantEntry.id)||grantEntry.provenance.sourceKind!=='folio')throw Error('Invalid persisted folio knowledge grant');
}
module.exports={RULES,COUNTER,inventory,held,grant,canonicalGrants,counterGrants,experiencedGrants,validatePersisted};
