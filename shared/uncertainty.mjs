// Confirmation keeps estimates as estimates. Preserve metadata for unchanged saved numbers.
const scalarFields=['grossPersonalIncome','effectiveTaxRate','monthlyNeeds','monthlyWants','annualInvesting','desiredLifestyleMonthly','targetNetworth'];
const sectionFields={earn:['grossPersonalIncome','effectiveTaxRate'],own:['assets'],owe:['liabilities','hasNoLiabilitiesConfirmed'],spend:['monthlyNeeds','monthlyWants'],invest:['annualInvesting'],lifestyle:['visionLevel','visionChoiceConfirmed','desiredLifestyleMonthly','lifestyleChanges'],milestone:['targetNetworth','currentAge','targetAge','targetYear'],goals:['wealthGoalDetails']};
function entries(map){
 const values=new Map();if(!map)return values;
 for(const key of scalarFields)values.set(key,map.data[key]);
 for(const [collection,fields] of [['assets',['value','annualNetIncome']],['liabilities',['value','interestRate','annualRepayment']],['lifestyleChanges',['monthlyAmount']],['wealthGoalDetails',['amount']]])for(const row of map.data[collection]??[])for(const field of fields)values.set(`${collection}.${row.id??row.category}.${field}`,row[field]);
 return values;
}
const matches=(marker,path)=>marker===path||path.startsWith(marker+'.')||(sectionFields[marker]??[]).some(key=>key===path||path.startsWith(key+'.'));
export const hasFinancialMarker=(markers,path)=>markers.some(marker=>matches(marker,path));
export function preserveUncertainty(proposal,confirmed,answer,inferredFields=[]){
 if(!proposal)return proposal;
 const estimated=/\b(?:around|roughly|approximately|about|estimates?|estimated|maybe|circa)\b/i.test(answer);
 const exact=/\b(?:exact|exactly|verified|confirmed amount)\b/i.test(answer);
 const inferred=inferredFields.map(path=>path.replace(/^proposal\./,'').replace(/^map\.data\./,''));
 const facts=proposal.facts.map((f,index)=>{
  const previous=confirmed?.facts.find(a=>a.key===f.key&&a.scope===f.scope&&a.period===f.period);
  const changed=!previous||previous.amount!==f.amount||previous.asOf!==f.asOf||previous.kind!==f.kind;
  if(previous?.kind==='estimate'&&f.kind==='exact'&&!exact&&previous.amount===f.amount)return {...f,kind:'estimate'};
  return (estimated||inferred.some(path=>path===`facts.${index}`||path.startsWith(`facts.${index}.`)))&&changed&&f.kind==='exact'?{...f,kind:'estimate'}:f;
 });
 if(!proposal.map)return {...proposal,facts};
 const old=entries(confirmed?.map),next=entries(proposal.map);
 const changed=[...next].filter(([path,value])=>value?.trim()&&value!==old.get(path)).map(([path])=>path);
 if(proposal.map.data.hasNoLiabilitiesConfirmed!==confirmed?.map?.data.hasNoLiabilitiesConfirmed)changed.push('hasNoLiabilitiesConfirmed');
 const retainedEstimates=(confirmed?.map?.estimates??[]).filter(marker=>!exact||!changed.some(path=>matches(marker,path)));
 const retainedUnknowns=(confirmed?.map?.unknowns??[]).filter(marker=>!changed.some(path=>matches(marker,path)));
 const map={...proposal.map,estimates:[...new Set([...proposal.map.estimates,...retainedEstimates,...changed.filter(path=>path!=='hasNoLiabilitiesConfirmed'&&inferred.some(marker=>matches(marker,path))),...(estimated?changed.filter(path=>path!=='hasNoLiabilitiesConfirmed'):[])])],unknowns:[...new Set([...proposal.map.unknowns,...retainedUnknowns])]};
 return {...proposal,facts,map};
}
