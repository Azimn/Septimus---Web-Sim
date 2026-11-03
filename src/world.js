'use strict';
const ROOMS = Object.freeze({
  bedchamber: {label:'Bedchamber', exits:['library'], objects:['bed']},
  library: {label:'Library', exits:['bedchamber','kitchen','laboratory'], objects:['notebook','folios']},
  kitchen: {label:'Kitchen and Hearth', exits:['library','garden'], objects:['hearth','stove','kettle','stores']},
  laboratory: {label:'Laboratory', exits:['library'], objects:['bench','instrument','specimens']},
  garden: {label:'Garden Path', exits:['kitchen'], objects:['path','plot']}
});
const OBJECTS = Object.freeze({
  bed:{label:'Bed',room:'bedchamber',actions:['sleep','rest']},
  notebook:{label:'Private notebook',room:'library',actions:['diary']},
  folios:{label:'Historical folios',room:'library',actions:['read']},
  hearth:{label:'Hearth',room:'kitchen',actions:['prepare']},
  stove:{label:'Stove',room:'kitchen',actions:['cook']},
  kettle:{label:'Kettle',room:'kitchen',actions:['tea']},
  stores:{label:'Stores shelf',room:'kitchen',actions:['eat']},
  bench:{label:'Work bench',room:'laboratory',actions:['work']},
  instrument:{label:'Instrument',room:'laboratory',actions:['inspect']},
  specimens:{label:'Specimen jars',room:'laboratory',actions:['study']},
  path:{label:'Garden path',room:'garden',actions:['walk','gather_fuel','draw_water']},
  plot:{label:'Garden plot',room:'garden',actions:['tend']}
});
const TRAITS=Object.freeze({curious:1.5,industrious:1.4,stubborn:1.3,nervous:.7,gentle:.8,sociable:.6});
const TRIGGERS=Object.freeze({henry:{salience:12,mood:3},victor:{salience:7,mood:-2},bride:{salience:10,mood:3},university:{salience:8,mood:-4},homunculi:{salience:12,mood:4}});
const START=25000, DAY=100000, STEP=100;
function initialState(identitySha,archiveSha){return {
  schema:1,owner:'simple-tower',identitySha,archiveSha,clock:{centibeats:START,step:STEP,day:0},
  location:'bedchamber', needs:{energy:78,hunger:42,comfort:70,stimulation:49,company:45},
  stores:{food:7,water:9,fuel:5,tea:4}, health:100,dead:false,garden:{plantedAt:null,ripeAt:null,harvests:0},skills:{science:2,household:1},
  traits:{...TRAITS},mood:[],residue:{},habits:{},outcomes:{},events:[],diary:[],folioReads:[],
  commitments:[{id:'C1',title:'Secure the hearth before dusk',deadline:65000,done:false}],
  activity:null,proposed:null,decisions:[],seed:1729,sequence:0,completedDays:0,
  people:{visitor_01:{id:'visitor_01',marker:'regular caller at the tower',present:false,trust:0,affinity:0,grievance:0,events:[],witnessed:[],knowledge:[]},player:{id:'player',witnessed:[],knowledge:[]}},
  customs:{greeting:{observations:0,sourceEventIds:[],learned:false}},humor:[],replyQueue:[],deliveredReplies:[],
  thoughts:[],predictions:[],beliefs:{},objectPositions:{},perception:[],seenObjects:[],lastPerceptionIds:[],
  deliberation:{checks:0,performed:0,skipped:0,rate:0},debugSwitches:{needs:true,mood:true,residue:true,habits:true,commitments:true},
  habitProfiles:{},quirks:[],worldLosses:{},utilityWeights:{},residueSources:{},commitmentProgress:{},outcomeContexts:{},controllerMode:'full',pendingNeedAction:null,
  surface:{lastObservation:[],lastWords:'I have work to do.'},
  calendar:{date:'1899-07-01',upcoming:'Dusk inspection',triggeredDays:[]}
};}
function distance(from,to){if(from===to)return 0;let q=[[from,0]],visited=new Set([from]);while(q.length){const [r,d]=q.shift();for(const n of ROOMS[r].exits){if(n===to)return d+1;if(!visited.has(n)){visited.add(n);q.push([n,d+1]);}}}throw Error('Disconnected tower');}
function context(state){const nearby=ROOMS[state.location].objects.map(id=>OBJECTS[id].label);return {room:ROOMS[state.location].label,objects:(state.perception?.length?state.perception.map(p=>p.label):nearby.slice(0,4)),needs:Object.fromEntries(Object.entries(state.needs).map(([k,v])=>[k,v<25?'urgent':v<55?'noticeable':'settled']))};}
function ensureHooks(s){
 const defaults=initialState(s.identitySha||'',s.archiveSha||'');
 for(const key of ['people','customs','humor','replyQueue','deliveredReplies','thoughts','predictions',
 'beliefs','objectPositions','perception','seenObjects','lastPerceptionIds','deliberation',
 'debugSwitches','habitProfiles','quirks','worldLosses'])
  if(s[key]===undefined)s[key]=structuredClone(defaults[key]);
 if(s.health===undefined)s.health=100;
 if(s.dead===undefined)s.dead=false;
 if(!s.garden)s.garden=structuredClone(defaults.garden);
 for(const key of ['utilityWeights','residueSources','commitmentProgress','outcomeContexts'])if(!s[key])s[key]={};
 if(!s.controllerMode)s.controllerMode='full';
 if(!s.people.player)s.people.player=structuredClone(defaults.people.player);
 if(!s.people.visitor_01)s.people.visitor_01=structuredClone(defaults.people.visitor_01);
 for(const [name,value] of Object.entries(defaults.debugSwitches))if(!(name in s.debugSwitches))s.debugSwitches[name]=value;
 return s;
}
module.exports={ROOMS,OBJECTS,TRAITS,TRIGGERS,DAY,STEP,START,initialState,ensureHooks,distance,context};
