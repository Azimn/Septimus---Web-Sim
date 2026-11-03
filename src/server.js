'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {readCanon,externalIdentity,findFolios}=require('./history');
const {advance,direct,speak,view,log}=require('./engine');
const {save,resume}=require('./store');
const root=path.resolve(__dirname,'..'),port=Number(process.env.PORT||8765);
const identity=externalIdentity(path.join(root,'identity.json'));
const archive=readCanon(path.join(root,'canon/Pretorius_v12_450_Events_Complete.jsonl'));
const savePath=process.env.TOWER_SAVE||path.join(root,'data/tower-save.json');
let state=resume(savePath,identity,archive);state.running=false;state.wallMs=Date.now();
const persist=()=>save(savePath,state);
function progress(){if(!state.running)return;const now=Date.now(),due=Math.floor((now-state.wallMs)/1000);if(due<=0)return;
 const n=Math.min(1000,due);advance(state,archive,n);state.wallMs+=n*1000;
 if(due>1000){state.running=false;log(state,'catchup_paused','I paused the accelerated timeline at the one-day unattended catch-up limit.',{deferredSeconds:due-1000});}
 persist();}
progress();setInterval(()=>{try{progress();}catch(e){state.running=false;console.error('Tower paused:',e);}},1000);
function json(res,data,status=200){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));}
const html=fs.readFileSync(path.join(root,'public/index.html'));
http.createServer((req,res)=>{
 if(req.method==='GET'&&req.url==='/'){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html);return;}
 if(req.method==='GET'&&req.url==='/api/state'){json(res,{...view(state),running:state.running,archiveCount:archive.records.length,identity:identity.record.name});return;}
 if(req.method==='GET'&&req.url?.startsWith('/api/folios')){const url=new URL(req.url,'http://localhost'),q=url.searchParams.get('q')||'';
  if(state.location!=='library')return json(res,{error:'The folios are accessible only in the library.'},403);
  const records=findFolios(archive,q,5).map(r=>({event_id:r.event_id,title:r.title,provenance:r.provenance,approximate_date:r.approximate_date,read:state.folioReads.some(e=>e.id===r.event_id)}));json(res,records);return;}
 if(req.method==='GET'&&req.url?.startsWith('/api/folio?')){const url=new URL(req.url,'http://localhost'),id=url.searchParams.get('id')||'';
  if(!state.folioReads.some(e=>e.id===id))return json(res,{error:'Folio has not been physically consulted.'},403);
  const record=archive.records.find(r=>r.event_id===id);if(!record)return json(res,{error:'Missing folio'},404);
  json(res,{id:record.event_id,title:record.title,provenance:record.provenance,account:record.memory_text,classification:String(record.provenance)+' pre-awakening record'});return;}
 if(req.method!=='POST'||req.url!=='/api/command')return json(res,{error:'Not found'},404);
 let body='';req.on('data',chunk=>{body+=chunk;if(body.length>4096)req.destroy();});req.on('end',()=>{
  try{const input=JSON.parse(body||'{}');switch(input.command){
   case 'step':if(state.running)throw Error('Pause before stepping manually');advance(state,archive,input.steps??1);break;
   case 'direct':if(state.running)throw Error('Pause before directing an action');direct(state,String(input.kind||''),String(input.query||'').slice(0,100));break;
   case 'speak':speak(state,String(input.text||'').slice(0,300));break;
   case 'toggle':state.running=!state.running;state.wallMs=Date.now();break;
   default:throw Error('Unknown command');}
   persist();json(res,{...view(state),running:state.running,archiveCount:archive.records.length,identity:identity.record.name});
  }catch(e){json(res,{error:e.message},400);}
 });
}).listen(port,'127.0.0.1',()=>console.log(`Simple Tower: http://127.0.0.1:${port} (${archive.records.length} verified folios)`));
