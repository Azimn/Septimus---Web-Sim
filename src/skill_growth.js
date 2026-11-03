'use strict';
// Diminishing practice and nonuse decay are deterministic, declared once.
const SKILL_RULES=Object.freeze({
 science:{softLevel:480,baseGain:1,decayPerUnusedDay:.04},
 household:{softLevel:120,baseGain:1,decayPerUnusedDay:.02}
});
const round=n=>Math.round(n*1000)/1000;
function practice(s,kind,log,sourceAction){
 const rule=SKILL_RULES[kind];if(!rule)throw Error('Unknown skill');
 s.skillUseDays??={};const before=s.skills[kind]||0;
 const gain=round(rule.baseGain*Math.max(0,1-before/rule.softLevel));
 s.skills[kind]=Math.min(rule.softLevel,round(before+gain));
 s.skillUseDays[kind]=s.clock.day;
 log(s,'skill_practice','I practiced and retained some new fluency.',{
  skill:kind,sourceAction,before,delta:round(s.skills[kind]-before),
  after:s.skills[kind],softLevel:rule.softLevel});
 return s.skills[kind];
}
function daily(s,log){
 s.skillLastDecayDay??=s.clock.day-1;
 if(s.skillLastDecayDay>=s.clock.day)return;
 const start=Math.max(1,s.skillLastDecayDay+1);
 for(let day=start;day<=s.clock.day;day++)for(const [kind,rule] of Object.entries(SKILL_RULES)){
  if((s.skillUseDays?.[kind]??-1)>=day-1)continue;
  const before=s.skills[kind]||0,after=Math.max(0,round(before-rule.decayPerUnusedDay));
  if(after>=before)continue;s.skills[kind]=after;
  log(s,'skill_nonuse_decay','I had lost a small measure of unused fluency.',{
   skill:kind,before,after,delta:round(after-before),day});
 }
 s.skillLastDecayDay=s.clock.day;
}
function choiceFactor(s,kind){
 // Immediate physical triage must not be overridden by apprenticeship progress.
 // Longer-lived competence becomes a separate, sourced utility signal.
 if(s.clock.day<30)return {kind:null,bonus:0};
 const skill=['work','study','inspect'].includes(kind)?'science':
  ['preserve','cook'].includes(kind)?'household':null;
 if(!skill)return {kind:null,bonus:0};
 const value=s.skills[skill]||0;
 return {kind:skill,bonus:Math.round(180*value/(value+70))/100,
  value,source:'lived_practice'};
}
module.exports={SKILL_RULES,practice,daily,choiceFactor};
