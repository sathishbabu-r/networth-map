import {hasFinancialMarker} from "./uncertainty.mjs";
// Compare the chosen commitment by its content, independent of object-key order.
export function sameAction(a,b) {
 return (!a&&!b)||Boolean(a&&b&&a.text===b.text&&a.dueDate===b.dueDate);
}

// Reuse one supplied MAP amount for the existing v1 snapshot requirement.
// No totals, inferred dates, assumed amounts or missing-as-zero conversions.
export function mapSnapshotFact(map) {
 if(!map)return null;
 const d=map.data;
 const amounts=[
  ['grossPersonalIncome','income','Gross personal annual income',d.grossPersonalIncome,'personal','annual'],
  ['monthlyNeeds','monthly_needs','Monthly needs',d.monthlyNeeds,'personal','monthly'],
  ['monthlyWants','monthly_wants','Monthly wants',d.monthlyWants,'personal','monthly'],
  ['annualInvesting','annual_investing','Annual investing',d.annualInvesting,'personal','annual'],
  ...d.assets.map(a=>[`assets.${a.id}.value`,`asset_${a.id}`,a.description,a.value,'personal','point_in_time']),
  ...d.liabilities.map(l=>[`liabilities.${l.id}.value`,`liability_${l.id}`,l.description,l.value,l.classification,'point_in_time']),
 ];
 for(const [path,key,label,value,scope,period] of amounts){
  if(!value?.trim()||hasFinancialMarker(map.unknowns,path))continue;
  const amount=Number(value);if(!Number.isFinite(amount)||amount<0||amount>Number.MAX_SAFE_INTEGER)continue;
  return {key:key.slice(0,80),label:label.trim().slice(0,100)||'Supplied MAP amount',kind:hasFinancialMarker(map.estimates,path)?'estimate':'exact',amount,lower:null,upper:null,scope,period,currency:'INR',asOf:'',note:'Amount supplied in your MAP. Timing has not been specified.'};
 }
 return null;
}
