'use strict';
function stateCard(s){return {visible:(s.perception||[]).map(x=>x.id),open:(s.commitments||[]).filter(x=>!x.done).map(x=>x.id),
 sourceEvents:(s.events||[]).slice(-50).map(x=>x.id),readFolios:(s.folioReads||[]).map(x=>x.id),room:s.location};}
function claimsCheck(utterance,card,{trustedTemplate=false,sourceIds=[]}={}){
 const text=String(utterance),claims=/\bI (remember|did|felt|own|have|was|know)\b/i.test(text);
 const valid=sourceIds.every(x=>card.sourceEvents.includes(x)||card.readFolios.includes(x)||card.open.includes(x));
 const ok=valid&&(!claims||trustedTemplate&&sourceIds.length>0);
 return {ok,claimDetected:claims,sourceIds,reason:ok?'template_sources_verified':'unsupported_claim'};
}
function compose(s,text){const open=s.commitments.find(x=>!x.done);
 if(/resolve|finished|forget (about|it)|all done|close (it|this)/i.test(text)&&open)return {text:'I have not finished that matter. It remains unresolved.',sourceIds:[open.id]};
 if(/why did you|why (did|choose)/i.test(text)&&s.decisions.length){const d=s.decisions.at(-1);return {text:`I chose ${d.chosen} with score ${d.candidates[0]?.score}, ahead of ${d.runnerUp?.kind||'no alternative'}.`,sourceIds:[d.sourceEventId].filter(Boolean)};}
 if(/funny|joke|remember that/i.test(text)&&s.humor.some(x=>!x.used))return {text:'I recall that earlier absurdity, but I shall not make a performance of it.',sourceIds:s.humor.filter(x=>!x.used).slice(0,1).map(x=>x.sourceEventId)};
 return {text:'I am occupied with the tower and my investigations. Speak plainly.',sourceIds:[]};
}
function deliver(s,message,log){const output=compose(s,message.text),card=stateCard(s),check=claimsCheck(output.text,card,{trustedTemplate:true,sourceIds:output.sourceIds});
 log(s,'claims_check','I checked the template against my accessible records.',{ok:check.ok,reason:check.reason,sourceIds:check.sourceIds});
 const value=check.ok?output.text:'I cannot substantiate that account.';
 s.surface.lastWords=value;const e=log(s,'reply_delivered','I answered after attending to the matter at hand.',{messageId:message.id,reply:value,delay:s.clock.centibeats-message.receivedAt});
 s.deliveredReplies.push({messageId:message.id,reply:value,eventId:e.id});return value;}
function receive(s,text,log){const e=log(s,'speech_received','I received a question at the tower.',{source:'player',messageText:String(text).slice(0,200)});
 const message={id:e.id,text:String(text).slice(0,300),receivedAt:s.clock.centibeats};
 if(s.activity){s.replyQueue.push(message);log(s,'reply_queued','I could not answer while occupied or asleep.',{messageId:e.id,busy:s.activity.kind});return s.surface.lastWords;}
 return deliver(s,message,log);
}
function flush(s,log){if(s.activity)return;const next=s.replyQueue.shift();if(next)return deliver(s,next,log);return null;}
module.exports={stateCard,claimsCheck,compose,receive,flush,deliver};