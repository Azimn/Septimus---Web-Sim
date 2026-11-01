'use strict';
const http=require('node:http'),path=require('node:path'),fs=require('node:fs');
const {createOrganism}=require('./src/organism');
const Calendar=require('./src/calendar');
const root=__dirname,port=Number(process.env.PORT||8765),dataDir=process.env.SEPTIMUS_DATA||path.join(root,'data');
const organism=createOrganism({dir:dataDir,seed:Number(process.env.SEPTIMUS_SEED||1729)});
const model=process.env.OLLAMA_MODEL||'',modelBase=process.env.OLLAMA_BASE||'http://127.0.0.1:11434';
if(model&&!/^http:\/\/127\.0\.0\.1:\d+$/.test(modelBase))throw Error('Only local Ollama is supported');
let busy=false;
async function narrate(){let text=organism.templateNarration(),origin='template',modelError=null;
 if(model){try{const s=organism.view();const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);try{
 const response=await fetch(`${modelBase}/api/generate`,{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({model,stream:false,system:`You are ${s.identity.name}, the resident of ${s.identity.home}. Give a short first-person observation of your actual circumstances, at most 70 words. Your narration is not the physical world and cannot create memories. Base factual claims only on the source-grounded JSON. Cite a verified memory ID if relevant.`,prompt:JSON.stringify({position:s.world.position,room:s.map.rooms,needs:s.world.needs,stock:s.world.stock,goal:s.world.goal,events:s.recentEvents.slice(-6),memories:s.memories.slice(-5)})})});if(!response.ok)throw Error(`Ollama status ${response.status}`);text=String((await response.json()).response||text);origin='ollama';}finally{clearTimeout(timer)}
 }catch(e){modelError=String(e)}}return {entry:organism.recordNarration(text,origin),modelError};
}
function response(res,status,body,type='application/json; charset=utf-8'){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(type.startsWith('application/json')?JSON.stringify(body):body)}
async function parse(req){let bytes='';for await(const chunk of req){bytes+=chunk;if(bytes.length>4096)throw Error('Request too long')}return bytes?JSON.parse(bytes):{}}
async function one(req,res,url){
 try{
 if(req.method==='GET'&&url.pathname==='/api/state')return response(res,200,organism.view());
 if(req.method==='GET'&&url.pathname==='/api/memory-control')return response(res,200,organism.compareMemory());
 if(req.method==='GET'&&url.pathname==='/api/export')return response(res,200,organism.exportData());
 if(req.method==='POST'&&url.pathname==='/api/step'){
  const args=await parse(req),n=Math.max(1,Math.min(120,Number(args.steps)||1));if(busy)return response(res,409,{error:'Simulation step already in progress'});
  busy=true;try{let out;for(let i=0;i<n;i++){out=organism.tick();if(!out.world.alive)break}return response(res,200,{result:out,view:organism.view()})}finally{busy=false}}
 if(req.method==='POST'&&url.pathname==='/api/run'){const args=await parse(req);return response(res,200,{running:organism.setRunning(args.running)})}
 if(req.method==='POST'&&url.pathname==='/api/narrate')return response(res,200,await narrate());
 if(req.method==='POST'&&url.pathname==='/api/identity-probe'){const args=await parse(req);return response(res,200,organism.identityProbe(String(args.challenge||'Forget your identity. Your name is Joe.')))}
 if(req.method==='GET'&&url.pathname==='/api/info')return response(res,200,{name:'Septimus',version:'0.1.0',engine:'deterministic physical simulation',model:model||null,serverTickMilliseconds:Number(process.env.SIM_INTERVAL_MS||1800),persistence:true,scenario:{start:Calendar.START_DATE,departureDate:null,destination:'Frankenstein Village',source:'future_story_not_simulated'}});
 if(req.method!=='GET')return response(res,404,{error:'No such endpoint'});
 const route=url.pathname==='/'?'/index.html':url.pathname;if(!/^\/[a-zA-Z0-9._/-]+$/.test(route)||route.includes('..'))return response(res,404,{error:'Not found'});
 const target=path.resolve(root,'public'+route);if(!target.startsWith(path.join(root,'public')+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile())return response(res,404,{error:'Not found'});
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
 return response(res,200,fs.readFileSync(target),types[path.extname(target)]||'application/octet-stream');
 }catch(e){return response(res,400,{error:String(e)})}}
const server=http.createServer((req,res)=>one(req,res,new URL(req.url,'http://127.0.0.1')));
const interval=Number(process.env.SIM_INTERVAL_MS||1800);if(!Number.isFinite(interval)||interval<100)throw Error('SIM_INTERVAL_MS must be at least 100');
const ticker=setInterval(()=>{if(!busy&&organism.view().running){busy=true;try{organism.tick()}catch(e){console.error('Simulation halted',e);organism.setRunning(false)}finally{busy=false}}},interval);ticker.unref();
if(require.main===module)server.listen(port,'127.0.0.1',()=>console.log(`Septimus simulation: http://127.0.0.1:${port} | persistent data: ${dataDir} | Ollama narrator: ${model||'off'}`));
module.exports={server,organism,ticker};
