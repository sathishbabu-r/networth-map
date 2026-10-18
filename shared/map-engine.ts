import { mapSchema, type MapMemory } from "./map-schema";
import { calculateMap, emptyAssessment, type AssessmentData } from "./networth-engine";
import { financialStatus, combineFinancial, pathMarked, type FinancialValue } from "./financial-status";
export const mapSections = ["earn", "own", "owe", "spend", "invest", "lifestyle", "goals", "milestone"] as const;
export const emptyMap = (): MapMemory => ({ step: 0, data: { ...emptyAssessment, effectiveTaxRate: "", assets: [], liabilities: [], proposedActions: [], wealthGoalDetails: [] }, covered: [], estimates: [], unknowns: [] });
export function validateMap(value: unknown): MapMemory {
  const map = mapSchema.parse(value && typeof value === "object" ? {step:0,...value} : value), d = map.data;
  const numeric = [d.grossPersonalIncome,d.effectiveTaxRate,d.monthlyNeeds,d.monthlyWants,d.annualInvesting,d.desiredLifestyleMonthly,d.currentAge,d.targetAge,d.targetYear,d.targetNetworth,
    ...d.assets.flatMap(a => [a.value,a.annualNetIncome]), ...d.liabilities.flatMap(l => [l.value,l.interestRate,l.annualRepayment]),
    ...d.wealthGoalDetails.flatMap(g => [g.amount,g.targetYear]), ...d.lifestyleChanges.map(l => l.monthlyAmount)];
  if (numeric.some(s => s !== "" && (!Number.isFinite(Number(s)) || Number(s) < 0 || Number(s) > Number.MAX_SAFE_INTEGER))) throw Error("Financial amounts must be valid non-negative numbers or left unknown.");
  if (Number(d.effectiveTaxRate) > 100 || d.liabilities.some(l => Number(l.interestRate) > 100)) throw Error("Rates must be between 0 and 100 percent.");
  for (const list of [d.assets,d.liabilities,d.lifestyleChanges,d.proposedActions]) if (new Set(list.map(x=>x.id)).size !== list.length) throw Error("Duplicate MAP entries need to be resolved.");
  const dates = [...d.lifestyleChanges.map(x=>x.startDate), ...d.proposedActions.map(x=>x.targetDate)];
  if(dates.some(s=>s && (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s)) || new Date(s).toISOString().slice(0,10)!==s))) throw Error("MAP dates must be real calendar dates.");
  return map;
}
export function supportedMapMetrics(map: MapMemory | null | undefined) {
  if (!map) return [];
  const d = map.data;
  const states = financialStatus(map).metrics;
  const metrics: { key:string; label:string; value:number; formula:string; estimated:boolean; status:FinancialValue["status"] }[] = [];
  const add = (key:keyof typeof states,label:string,formula:string) => {const state=states[key];if(state.value!==null)metrics.push({key,label,value:state.value,formula,estimated:state.status==="ESTIMATED",status:state.status});};
  add("assets","Total assets","Sum of the assets you listed. Business ownership must use your share of equity after business debt; underlying business assets are excluded.");
  add("liabilities","Total liabilities","Sum of the outstanding personally borne liabilities you listed, or your explicit no-debt confirmation.");
  add("networth","Net worth",`${states.assets.value} assets − ${states.liabilities.value} liabilities`);
  add("takehome","Annual take-home income",`${d.grossPersonalIncome} gross annual income × (1 − ${d.effectiveTaxRate}% estimated tax)`);
  add("lifestyle","Annual lifestyle costs",`(${d.monthlyNeeds} monthly needs + ${d.monthlyWants} monthly wants) × 12`);
  add("surplus","Annual surplus before investing","Take-home income − annual needs − annual wants − loan repayments not already included in needs");
  add("afterinvesting","Annual cash after investing",`Annual surplus − ${d.annualInvesting} annual investing`);
  add("visioncost","Annual cost of your vision","Chosen lifestyle baseline plus the recurring changes you listed, annualised");
  return metrics;
}
export function progressFromHistory(rows: any[], current: any) {
  const actions = new Map<string, any>();
  for (const row of [...rows].sort((a,b)=>a.revision-b.revision)) {
    const c=row.newContent;
    if (!c?.action) continue;
    const key=c.action.text.trim().toLowerCase()+"|"+c.action.dueDate;
    actions.set(key,{...c.action, goal:c.goal?.text, outcome:c.outcome??null, updatedAt:row.confirmedAt});
  }
  if(current?.content?.action) {
    const c=current.content,key=c.action.text.trim().toLowerCase()+"|"+c.action.dueDate;
    actions.set(key,{...c.action,goal:c.goal?.text,outcome:c.outcome??null,updatedAt:current.confirmedAt});
  }
  return [...actions.values()].sort((a,b)=>b.dueDate.localeCompare(a.dueDate));
}

export function assessmentFromMemory(map: MapMemory | null | undefined): AssessmentData {
  if (!map) return { ...emptyMap().data, wealthGoalDetails: {} };
  return {...map.data, proposedActions:map.data.proposedActions.map(a=>({...a,category:a.category || 'other'})), wealthGoalDetails:Object.fromEntries(map.data.wealthGoalDetails.map(({category,...detail})=>[category,detail]))};
}
export function memoryFromAssessment(data: AssessmentData, previous: MapMemory | null | undefined, step: number): MapMemory {
  const existing=previous??emptyMap();
  const result:MapMemory={...existing,covered:[...existing.covered],estimates:[...existing.estimates],unknowns:[...existing.unknowns],step,data:{...data,assets:data.assets.map(a=>({...a,annualNetIncome:a.annualNetIncome??""})),liabilities:data.liabilities.map(l=>({...l,interestRate:l.interestRate??"",annualRepayment:l.annualRepayment??"",repaymentIncludedInNeeds:l.repaymentIncludedInNeeds??false})),proposedActions:data.proposedActions.map(a=>({...a,targetDate:a.targetDate??""})),wealthGoalDetails:Object.entries(data.wealthGoalDetails).filter(([,v])=>v).map(([category,detail])=>({category:category as any,...detail!}))}};
  const before=financialStatus(existing),priorAmounts=financialStatus({...existing,unknowns:[]}),after=financialStatus({...result,unknowns:[]});
  const edited=Object.keys(after.inputs).filter(path=>after.inputs[path].value!==null && (!before.inputs[path] || after.inputs[path].value!==priorAmounts.inputs[path]?.value));
  result.unknowns=result.unknowns.filter(path=>!edited.includes(path));
  if(data.hasNoLiabilitiesConfirmed&&!existing.data.hasNoLiabilitiesConfirmed&&!data.liabilities.length)result.unknowns=result.unknowns.filter(path=>path!=="owe"&&path!=="liabilities"&&path!=="hasNoLiabilitiesConfirmed");
  // A previously unknown section is cleared only when its edited inputs are all supplied and the user leaves that section.
  const sections:Record<number,string>={1:"earn",2:"own",3:"owe",4:"spend",5:"invest"};
  const completedSection=sections[existing.step];
  if(completedSection&&step===existing.step+1&&edited.some(path=>pathMarked([completedSection],path))){
    const required=completedSection==="own"?data.assets.map(a=>`assets.${a.id}.value`):completedSection==="owe"?data.liabilities.map(l=>`liabilities.${l.id}.value`):completedSection==="earn"?["grossPersonalIncome","effectiveTaxRate"]:completedSection==="spend"?["monthlyNeeds","monthlyWants"]:["annualInvesting"];
    if(required.length&&required.every(path=>after.inputs[path]?.value!==null))result.unknowns=result.unknowns.filter(path=>path!==completedSection);
  }
  const stepSection:Record<number,MapMemory["covered"][number]>={1:"earn",2:"own",3:"owe",4:"spend",5:"invest",6:"blueprint",7:"lifestyle",8:"goals",9:"milestone",10:"reflect"};
  for (const [n,name] of Object.entries(stepSection)) if ((Number(n)<step || ((name==="blueprint" || name==="reflect") && Number(n)<existing.step))&&!result.covered.includes(name)) result.covered.push(name);
  return validateMap(result);
}

// The legacy arithmetic engine is used only behind this data-status guard.
export function assessedMap(map:MapMemory) {
 const raw=calculateMap(assessmentFromMemory(map)),status=financialStatus(map),m=status.metrics;
 const blueprint={...raw}, values:Record<string,FinancialValue>={};
 const direct:Record<string,FinancialValue>={totalAssets:m.assets,totalLiabilities:m.liabilities,networth:m.networth,takeHomeIncome:m.takehome,annualNeeds:m.needs,annualWants:m.wants,currentLifestyle:m.lifestyle,availableSurplus:m.surplus,cashAfterInvesting:m.afterinvesting,annualInvesting:m.investing,totalAssetIncome:m.assetincome,totalAnnualInterest:m.interest,totalAnnualDebtRepayment:m.repayments,annualDebtRepaymentDeducted:m.deducted,visionAnnualCost:m.visioncost};
 for(const [key,state] of Object.entries(direct)){values[key]=state;(blueprint as any)[key]=state.value??Number.NaN;}
 const timeline=map.data.targetTiming==='year'?[status.inputs.targetYear]:[status.inputs.currentAge,status.inputs.targetAge];
 const target=map.data.wealthMilestoneChoice==='yes'?status.inputs.targetNetworth:m.visioncost;
 const dependencies:Record<string,FinancialValue[]>={
  estimatedTax:[m.takehome],wealthAssets:[m.assets],personalAssets:[m.assets],incomeGeneratingAssets:[m.assets,m.assetincome],accessibleAssets:[m.assets],
  investingRate:[m.investing,m.takehome],wealthAssetPercent:[m.assets],personalAssetPercent:[m.assets],debtPercent:[m.assets,m.liabilities],propertyPercent:[m.assets],accessibleMonths:[m.assets,m.lifestyle],largestAssetPercent:[m.assets],assetIncomeYield:[m.assets,m.assetincome],networthIncomeYield:[m.assetincome,m.networth],lifestyleFundedByAssetIncome:[m.assetincome,m.lifestyle],assetIncomeInterestCoverage:[m.assetincome,m.interest],lifestyleCostShareOfTakeHome:[m.lifestyle,m.takehome],
  yearsToVision:timeline,visionFundingGap:[m.networth,target],requiredMonthlyInvestment:[m.networth,target,...timeline],
 };
 const denominators:Record<string,number|null>={investingRate:m.takehome.value,wealthAssetPercent:m.assets.value,personalAssetPercent:m.assets.value,debtPercent:m.assets.value,propertyPercent:m.assets.value,accessibleMonths:m.lifestyle.value,largestAssetPercent:m.assets.value,assetIncomeYield:raw.incomeGeneratingAssets,networthIncomeYield:m.networth.value,lifestyleFundedByAssetIncome:m.lifestyle.value,assetIncomeInterestCoverage:m.interest.value,lifestyleCostShareOfTakeHome:m.takehome.value,requiredMonthlyInvestment:raw.yearsToVision};
 for(const [key,inputs] of Object.entries(dependencies)){
  const denominator=denominators[key];
  values[key]=combineFinancial(inputs,()=>denominator!==undefined&&(denominator===null||denominator<=0)?Number.NaN:(raw as any)[key]??Number.NaN);
  (blueprint as any)[key]=values[key].value??((raw as any)[key]===null?null:Number.NaN);
 }
 if(m.assets.value===null)blueprint.largestAsset=null;
 if(!status.ready){blueprint.findings=[];blueprint.nextFindings=[];blueprint.unaddressedFindings=[];blueprint.actionAssessments=[];}
 return {blueprint,status,values};
}
