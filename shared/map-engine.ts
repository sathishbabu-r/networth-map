import { mapSchema, type MapMemory } from "./map-schema";
import { calculateMap, emptyAssessment, type AssessmentData } from "./networth-engine";
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
  const data: AssessmentData = { ...d, wealthGoalDetails: Object.fromEntries(d.wealthGoalDetails.map(({ category, ...detail }) => [category, detail])) };
  const computed = calculateMap(data);
  const known = (path: string, value: string) => value !== "" && !map.unknowns.includes(path);
  const own = map.covered.includes("own") && !map.unknowns.includes("own") && d.assets.every(a => known(`assets.${a.id}.value`, a.value));
  const owe = map.covered.includes("owe") && !map.unknowns.includes("owe") && (d.liabilities.length > 0 || d.hasNoLiabilitiesConfirmed) && d.liabilities.every(l=>known(`liabilities.${l.id}.value`,l.value));
  const spend = known("monthlyNeeds",d.monthlyNeeds) && known("monthlyWants",d.monthlyWants);
  const gross = known("grossPersonalIncome",d.grossPersonalIncome) && known("effectiveTaxRate",d.effectiveTaxRate);
  const repayment = map.covered.includes("owe") && d.liabilities.every(l=>known(`liabilities.${l.id}.annualRepayment`,l.annualRepayment));
  const metrics: { key:string; label:string; value:number; formula:string; estimated:boolean }[] = [];
  const add = (key:string,label:string,value:number,formula:string) => metrics.push({key,label,value,formula,estimated:map.estimates.length>0});
  if(own) add("assets","Total assets",computed.totalAssets,"Sum of the assets you listed. Business ownership must use your share of equity after business debt; underlying business assets are excluded.");
  if(owe) add("liabilities","Total liabilities",computed.totalLiabilities,"Sum of the outstanding personally borne liabilities you listed.");
  if(own&&owe) add("networth","Net worth",computed.networth,`${computed.totalAssets} assets − ${computed.totalLiabilities} liabilities`);
  if(gross) add("takehome","Annual take-home income",computed.takeHomeIncome,`${d.grossPersonalIncome} gross annual income × (1 − ${d.effectiveTaxRate}% estimated tax)`);
  if(spend) add("lifestyle","Annual lifestyle costs",computed.currentLifestyle,`(${d.monthlyNeeds} monthly needs + ${d.monthlyWants} monthly wants) × 12`);
  if(gross&&spend&&owe&&repayment) add("surplus","Annual surplus before investing",computed.availableSurplus,"Take-home income − annual needs − annual wants − loan repayments not already included in needs");
  if(gross&&spend&&owe&&repayment&&known("annualInvesting",d.annualInvesting)) add("afterinvesting","Annual cash after investing",computed.cashAfterInvesting,`Annual surplus − ${d.annualInvesting} annual investing`);
  if(d.visionChoiceConfirmed && d.visionLevel && spend && (d.visionLevel!=="freedom" || known("desiredLifestyleMonthly",d.desiredLifestyleMonthly)) && d.lifestyleChanges.every(l=>known(`lifestyleChanges.${l.id}.monthlyAmount`,l.monthlyAmount))) add("visioncost","Annual cost of your vision",computed.visionAnnualCost,"Chosen lifestyle baseline plus the recurring changes you listed, annualised");
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
  if (!map) return { ...emptyAssessment };
  return {...map.data, wealthGoalDetails:Object.fromEntries(map.data.wealthGoalDetails.map(({category,...detail})=>[category,detail]))};
}
export function memoryFromAssessment(data: AssessmentData, previous: MapMemory | null | undefined, step: number): MapMemory {
  const existing=previous??emptyMap();
  const result:MapMemory={...existing,covered:[...existing.covered],estimates:[...existing.estimates],unknowns:[...existing.unknowns],step,data:{...data,assets:data.assets.map(a=>({...a,annualNetIncome:a.annualNetIncome??""})),liabilities:data.liabilities.map(l=>({...l,interestRate:l.interestRate??"",annualRepayment:l.annualRepayment??"",repaymentIncludedInNeeds:l.repaymentIncludedInNeeds??false})),proposedActions:data.proposedActions.map(a=>({...a,targetDate:a.targetDate??""})),wealthGoalDetails:Object.entries(data.wealthGoalDetails).filter(([,v])=>v).map(([category,detail])=>({category:category as any,...detail!}))}};
  const stepSection:Record<number,typeof mapSections[number]>={1:"earn",2:"own",3:"owe",4:"spend",5:"invest",7:"lifestyle",8:"goals",9:"milestone"};
  for (const [n,name] of Object.entries(stepSection)) if (Number(n)<step&&!result.covered.includes(name)) result.covered.push(name);
  return validateMap(result);
}
