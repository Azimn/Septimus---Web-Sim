'use strict';
// Septimus v0.1: no model is allowed to change physical state. Coordinates are physical.
const WIDTH=16,HEIGHT=10;
const rooms={bedroom:'Bedroom',library:'Library',workshop:'Laboratory',hall:'Hall',kitchen:'Kitchen',bathroom:'Washroom',garden:'Kitchen garden',porch:'Front porch'};
const OBJECTS=[
{id:'bed',name:'Iron bedstead',x:2,y:2,kind:'rest'},
{id:'bookshelf',name:'Library shelves',x:6,y:2,kind:'read'},
{id:'bench',name:'Laboratory workbench',x:11,y:2,kind:'work'},
{id:'lamp',name:'Oil lamp',x:12,y:2,kind:'light'},
{id:'sink',name:'Plumbed sink',x:2,y:5,kind:'drink'},
{id:'stove',name:'Kitchen range',x:4,y:5,kind:'cook'},
{id:'pantry',name:'Pantry cupboard',x:6,y:5,kind:'store'},
{id:'table',name:'Dining table',x:7,y:5,kind:'eat'},
{id:'toilet',name:'Water closet',x:10,y:5,kind:'toilet'},
{id:'vegetable_plot',name:'Vegetable plot',x:3,y:8,kind:'grow'},
{id:'tea_plot',name:'Tea bushes',x:6,y:8,kind:'grow'},
{id:'mailbox',name:'Letter box',x:12,y:7,kind:'mail'},
{id:'catalog',name:'Mail-order catalogs',x:13,y:7,kind:'order'}
];
const BY_ID=Object.fromEntries(OBJECTS.map(x=>[x.id,x]));
const CATALOG={
  groceries:{name:'Grocer delivery',source:'grocer',price:12,delay:9,goods:{vegetables:4,grain:4,milk:2}},
  tea:{name:'Tea merchant parcel',source:'tea merchant',price:5,delay:18,goods:{tea_leaves:3}},
  seeds:{name:'Seed catalog',source:'seed house',price:7,delay:24,goods:{vegetable_seeds:4,tea_seeds:2}},
  science:{name:'Scientific instrument supplier',source:'scientific catalog',price:16,delay:36,goods:{spares:2,reagents:2,lamp_oil:2}}
};
const BOOKS=['The Atlas of Quiet Machines','An Inquiry into Ash','The Astronomer\'s Garden','Small Experiments in Light','A History of Copper','The Clockmaker\'s Notes','On Dreams of Rain','A Dictionary of Night'];
function roomAt(x,y){
 if(x<1||x>14||y<1||y>8)return null;
 if(y<=3)return x<=4?'bedroom':x<=8?'library':'workshop';
 if(y===4)return 'hall';
 if(y<=6)return x<=8?'kitchen':x<=11?'bathroom':'hall';
 return x<=8?'garden':'porch';
}
// Inter-room movement is only possible through actual doorways, not through drawn walls.
const DOORS=new Set(['bedroom:hall:2,3:2,4','library:hall:6,3:6,4','workshop:hall:11,3:11,4','hall:kitchen:4,4:4,5','hall:bathroom:10,4:10,5','hall:porch:13,6:13,7','kitchen:garden:4,6:4,7','garden:porch:8,7:9,7']);
function canCross(a,b){const ar=roomAt(a.x,a.y),br=roomAt(b.x,b.y);if(!ar||!br)return false;if(ar===br)return true;
 const k=`${ar}:${br}:${a.x},${a.y}:${b.x},${b.y}`,rev=`${br}:${ar}:${b.x},${b.y}:${a.x},${a.y}`;return DOORS.has(k)||DOORS.has(rev);
}
function pathBetween(from,to){if(from.x===to.x&&from.y===to.y)return [];
 const todo=[[from]],seen=new Set([`${from.x},${from.y}`]);for(let i=0;i<todo.length;i++){const path=todo[i],current=path[path.length-1];for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]){const next={x:current.x+dx,y:current.y+dy},key=`${next.x},${next.y}`;if(seen.has(key)||!canCross(current,next))continue;const candidate=path.concat([next]);if(next.x===to.x&&next.y===to.y)return candidate.slice(1);seen.add(key);todo.push(candidate)}}return null;
}
function fresh(seed=1729){return {
 version:1,seed,tick:0,minute:420,day:1,alive:true,deathCause:null,
 position:{x:2,y:2},needs:{hunger:24,thirst:26,fatigue:24,bladder:14,boredom:28},health:100,wallet:72,
 stock:{vegetables:2,grain:3,milk:1,tea_leaves:1,meals:1,tea_cups:0,vegetable_seeds:2,tea_seeds:1,spares:2,reagents:1,lamp_oil:2},
 carried:null,orders:[],nextOrder:1,researchReports:0,unpaidLetters:0,
 garden:{vegetables:{stage:'empty',plantedTick:null,watered:false},tea:{stage:'empty',plantedTick:null,watered:false}},
 lab:{lampLit:false,clutter:2,damage:2,repairs:0,experiments:0},booksRead:[],bookProgress:{},
 goal:null,suspendedGoal:null,nextGoal:1,completed:[],recentKinds:[],lastDecision:null,lastAction:'The day begins in the bedroom.',
 counters:{drinks:0,meals:0,tea:0,harvests:0,orders:0,deliveries:0,work:0},
 nextReceipt:1
};}
module.exports={WIDTH,HEIGHT,rooms,OBJECTS,BY_ID,CATALOG,BOOKS,roomAt,pathBetween,fresh};
