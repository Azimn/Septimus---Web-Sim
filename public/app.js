'use strict';
const $=id=>document.getElementById(id);let last=null,busy=false,selected='';
const icon={bed:'🛏',bookshelf:'📚',bench:'⚗',lamp:'🪔',sink:'🚰',stove:'🍲',pantry:'🫙',table:'🍽',toilet:'🚽',vegetable_plot:'🥕',tea_plot:'🌿',mailbox:'📬',catalog:'📖'};
const labels={hunger:'Hunger',thirst:'Thirst',fatigue:'Fatigue',bladder:'Bladder',boredom:'Boredom'};
const nice=s=>s.replace(/_/g,' ').replace(/\b\w/g,x=>x.toUpperCase());
const time=(s,c)=>c?`${c.date} · ${c.time} ${c.beat}`:`Day ${s.day} · ${String(Math.floor(s.minute/60)).padStart(2,'0')}:${String(s.minute%60).padStart(2,'0')}`;
function toast(s){const n=$('toast');n.textContent=s;n.style.display='block';setTimeout(()=>n.style.display='none',2500)}
async function api(method,url,payload){const r=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:payload===undefined?undefined:JSON.stringify(payload),cache:'no-store'});const out=await r.json();if(!r.ok)throw Error(out.error||`HTTP ${r.status}`);return out}
function tileMap(data){const m=data.map,s=data.world,coord=`${s.position.x},${s.position.y}`,bypos=Object.fromEntries(m.objects.map(o=>[`${o.x},${o.y}`,o]));
 const html=[];for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++){const room=m.cells[y][x],o=bypos[`${x},${y}`];const here=coord===`${x},${y}`;html.push(`<div class="tile ${room||'empty'} ${o?'object':''}" data-obj="${o?.id||''}" title="${o?`${o.name} (${x},${y})`:`${m.rooms[room]||'Wall'} (${x},${y})`}" aria-label="${here?'Septimus at ':''}${o?.name||m.rooms[room]||'Wall'}"><span>${o?icon[o.id]||'◈':''}</span>${here?'<span class="occupant">◆</span>':''}</div>`)}$('map').innerHTML=html.join('');
 for(const el of document.querySelectorAll('.tile.object'))el.addEventListener('click',()=>{const o=m.objects.find(i=>i.id===el.dataset.obj);selected=o.id;$('object-info').textContent=`${o.name} · ${m.rooms[m.cells[o.y][o.x]]} · physical position (${o.x}, ${o.y}) · ${o.kind}`});
}
function render(data){last=data;const s=data.world;$('clock').textContent=time(s,data.calendar);$('status').textContent=!s.alive?'DECEASED':data.running?'LIVING':'PAUSED';$('status').classList.toggle('live',data.running);$('play').textContent=data.running?'Ⅱ Pause world':'▶ Begin life';$('play').disabled=!s.alive;
 $('step').disabled=!s.alive;$('ten').disabled=!s.alive;$('hundred').disabled=!s.alive;
 tileMap(data);$('activity').textContent=`${data.map.rooms[data.map.cells[s.position.y][s.position.x]]}. ${s.lastAction}`;
 $('needs').innerHTML=Object.entries(s.needs).map(([k,v])=>`<div><div class="need-name"><span>${labels[k]}</span><span>${Math.round(v)} / 100</span></div><div class="bar"><div class="fill ${v>=85?'critical':v>=65?'high':''}" style="width:${v}%"></div></div></div>`).join('');
 $('life').innerHTML=`<strong style="color:${s.alive?'#a2c5aa':'#e98777'}">${s.alive?'ALIVE':'DECEASED'}</strong> · Health ${Math.round(s.health)} / 100 · Position (${s.position.x}, ${s.position.y}) · ${s.completed.length} completed goals${s.deathCause?` · Cause: ${s.deathCause}`:''}`;
 $('goal').textContent=s.goal?nice(s.goal.kind):'No active intention';$('reason').textContent=s.goal?`${s.goal.reason}. Phase: ${s.goal.phase}. Goal ${s.goal.id}`:'Choosing what to do next, without an imposed activity sequence.';
 $('memory-controls').textContent=s.lastDecision?`Last choice: ${nice(s.lastDecision.kind)} · priority ${s.lastDecision.score.toFixed(1)} · verified memory references: ${s.lastDecision.memoryIds.join(', ')||'none'}`:'The autonomous chooser has not yet run.';
 $('money').textContent=`£${s.wallet}`;$('stock').innerHTML=Object.entries(s.stock).map(([k,v])=>`<div class="item"><span>${nice(k)}</span><b>${v}</b></div>`).join('');
 $('orders').innerHTML=s.orders.filter(x=>!x.collected).length?s.orders.filter(x=>!x.collected).map(o=>`<div class="shipment"><strong>${nice(o.type)}</strong> · ${o.source}<div><span>${o.arrived?'DELIVERED: waiting at mailbox':`Expected on day ${Math.floor((o.dueTick*10+420)/1440)+1}, tick ${o.dueTick}`}</span></div></div>`).join(''):'<p class="support">The letter box is empty.</p>';
 $('garden').innerHTML=Object.entries(s.garden).map(([crop,plot])=>`<div class="garden-row"><span>${nice(crop)}</span><span>${nice(plot.stage)}${plot.stage==='growing'?(plot.watered?' · watered':' · dry'):''}</span></div>`).join('');
 $('research').textContent=`Repairs ${s.lab.repairs} · experiments ${s.lab.experiments} · damage ${s.lab.damage} · clutter ${s.lab.clutter} · books finished ${s.booksRead.length} / 8 · research reports to post ${s.researchReports}`;
 $('catalogs').innerHTML=Object.entries(data.map.catalog).map(([k,c])=>`<div class="catalog"><span>${c.name}<br><span class="support">${Object.entries(c.goods).map(([n,v])=>`${v} ${nice(n)}`).join(', ')}</span></span><b>£${c.price}</b></div>`).join('');
 $('events').innerHTML=data.recentEvents.slice().reverse().filter(e=>e.kind!=='walk'||e.tick%5===0).slice(0,55).map(e=>`<div class="ev ${e.kind}"><div class="seq">${String(e.id).slice(-5)}<br>D${e.day}</div><div class="note"><div class="what">${e.description.replaceAll('<','&lt;')}</div><div class="where">${nice(e.kind)} · (${e.position.x}, ${e.position.y}) · ${e.goalId||'world event'}</div></div></div>`).join('');
 $('integrity').textContent=`Journal ${data.recordCount} records · ${data.lastHash.slice(0,12)}…`;
}
async function refresh(){if(busy)return;try{render(await api('GET','/api/state'))}catch(e){toast(e.message)}}
async function call(fn){if(busy)return;busy=true;try{await fn();render(await api('GET','/api/state'))}catch(e){toast(e.message)}finally{busy=false}}
$('play').onclick=()=>call(()=>api('POST','/api/run',{running:!last?.running}));
$('step').onclick=()=>call(()=>api('POST','/api/step',{steps:1}));
$('ten').onclick=()=>call(()=>api('POST','/api/step',{steps:10}));
$('hundred').onclick=()=>call(()=>api('POST','/api/step',{steps:120}));
$('narrate').onclick=()=>call(async()=>{const result=await api('POST','/api/narrate',{});$('object-info').textContent=`THOUGHT, NOT VERIFIED MEMORY: ${result.entry.text}${result.entry.divergence.length?` | Discrepancy: ${result.entry.divergence.join('; ')}`:''}`});
$('export').onclick=async()=>{try{const x=await api('GET','/api/export'),blob=new Blob([JSON.stringify(x,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='septimus-world-evidence.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){toast(e.message)}};
refresh();setInterval(refresh,1500);
