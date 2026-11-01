'use strict';
const {roomAt,rooms,OBJECTS}=require('./world');
const {recollect}=require('./diary');
const Household=require('./household');
// External, read-only self, not an editable session instruction or an in-world clock.
function firstPersonPerception(identity,world,events=[],lastFolio=null){
 const where=roomAt(world.position.x,world.position.y);
 const here=OBJECTS.filter(o=>roomAt(o.x,o.y)===where).map(o=>o.name);
 const bodily=[];
 const c=Household.comfort(world,where);
 if(c.warmth<34)bodily.push('I feel the cold of this room.');
 if(!c.dry)bodily.push('I can see signs of damp here.');
 if(where==='porch'&&world.household?.observed?.coal)bodily.push('The coal pile stands by the cart entrance.');
 if(world.needs.thirst>=65)bodily.push('My mouth is dry.');
 if(world.needs.hunger>=65)bodily.push('I feel hungry.');
 if(world.needs.fatigue>=65)bodily.push('My limbs feel weary.');
 const seen=events.filter(e=>e.perceived!==false&&e.room===where&&!['goal_selected','delivery_arrived','crop_ripened','goal_suspended','goal_resumed'].includes(e.kind)).slice(-3);
 const observed=seen.map(e=>recollect(e).text);
 const recollection=lastFolio?`I recently read a passage titled "${lastFolio.title}" in my notebook. Its wording is a reconstructed memory, not a newly occurred event.`:null;
 return {person:'first_person',self:`I am ${identity.name}.`,place:`I am in the ${rooms[where]}.`,visibleObjects:here,
  sensations:bodily,perceivedEvents:observed,accessibleHistoricalFolio:recollection,
  observedClock:null,timeKnowledge:'No clock has been checked in this observation.',
  epistemicScope:'Only actions seen or bodily experienced are presented.'};
}
function externalSelf(identity,identityHash){return {identityHash,name:identity.name,home:identity.home,
  commitments:structuredClone(identity.commitments),values:structuredClone(identity.values),
  writePermission:'external_authority_only',sessionMayPropose:true,
  sessionMayRewrite:false,source:'identity.json; hash-checked on journal replay'};}
module.exports={firstPersonPerception,externalSelf};
