'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const CANON_GIT_SHA='718dcc2d5ba4feccdef1690d447edfcebaa9bfb5';
function gitBlobSha(bytes){return crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');}
function sha256(bytes){return crypto.createHash('sha256').update(bytes).digest('hex');}
function readCanon(file,expected=CANON_GIT_SHA,count=450){
 const bytes=fs.readFileSync(file),digest=gitBlobSha(bytes);
 if(digest!==expected)throw Error('Canonical folio byte integrity failure');
 const records=bytes.toString('utf8').trim().split('\n').map(x=>JSON.parse(x));
 if(records.length!==count||new Set(records.map(x=>x.event_id)).size!==count)throw Error('Canonical folio cardinality/id failure');
 if(records.some(r=>!r.event_id||!r.memory_text||!r.provenance))throw Error('Incomplete canonical record');
 return {sha:digest,records};
}
function findFolios(archive,query='',limit=5){
 const terms=String(query).toLowerCase().split(/\s+/).filter(Boolean);
 return archive.records.map((r,i)=>{const index=[r.title,...(r.recall_cues||[]),...(r.participants||[]),...(r.locations||[]),r.approximate_date||''].join(' ').toLowerCase();return {r,i,score:terms.reduce((n,t)=>n+(index.includes(t)?1:0),0)};})
 .filter(x=>!terms.length||x.score>0).sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,limit).map(x=>x.r);
}
function externalIdentity(file){const raw=fs.readFileSync(file),record=JSON.parse(raw.toString('utf8'));if(record.name!=='Septimus Pretorius'||!String(record.home).includes('tower'))throw Error('Incorrect external identity');return {record,sha:sha256(raw)};}
module.exports={readCanon,findFolios,externalIdentity,gitBlobSha,CANON_GIT_SHA};
