'use strict';
// Post-June-1899 scenario date, not a recovered autobiographical event.
const START_DATE='1899-07-01',START_UTC=Date.UTC(1899,6,1);
function dateForDay(day){
 if(!Number.isSafeInteger(day)||day<1)throw Error('Invalid positive simulation day');
 const stamp=START_UTC+(day-1)*86400000,dt=new Date(stamp);
 if(!Number.isFinite(stamp)||Number.isNaN(dt.valueOf()))throw Error('Simulation date overflow');
 return dt.toISOString().slice(0,10);
}
function describe(state){
 const date=dateForDay(state.day),minute=state.minute;
 if(!Number.isInteger(minute)||minute<0||minute>=1440)throw Error('Invalid simulation clock');
 const time=`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
 // @beats are a project-facing clock convention, treated as fixed UTC+1 BMT.
 const beat=`@${String(Math.floor(minute*1000/1440)).padStart(3,'0')}`;
 return {date,time,beat,startDate:START_DATE,period:'post-June-1899, pre-village',
  destination:'Frankenstein Village (separate future game)',departureDateEstablished:false,transferRecorded:false};
}
module.exports={START_DATE,dateForDay,describe};
