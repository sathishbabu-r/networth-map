// Conservatively retain uncertainty from the latest answer; confirmation does not turn an estimate into an exact figure.
export function preserveUncertainty(proposal,confirmed,answer){
 if(!proposal||! /\b(?:around|roughly|approximately|about|estimates?|estimated|maybe|circa)\b/i.test(answer))return proposal;
 return {...proposal,facts:proposal.facts.map(f=>{
  const previous=confirmed?.facts.find(a=>a.key===f.key&&a.scope===f.scope&&a.period===f.period);
  const changed=!previous||previous.amount!==f.amount||previous.asOf!==f.asOf||previous.kind!==f.kind;
  return changed&&f.kind==='exact'?{...f,kind:'estimate'}:f;
 })};
}
