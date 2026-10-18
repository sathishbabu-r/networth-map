import { test, expect } from "vitest";
import { emptyMap, validateMap, supportedMapMetrics, progressFromHistory, assessmentFromMemory, memoryFromAssessment } from "../shared/map-engine";
test("an empty or partial MAP never reports missing balances as zero net worth", () => {
  const map=emptyMap();
  expect(supportedMapMetrics(map)).toEqual([]);
  map.data.assets=[{id:"cash",description:"Cash",category:"cash",value:"500000",purpose:"personal",annualNetIncome:""}];
  expect(supportedMapMetrics(map).find(m=>m.key==="networth")).toBeUndefined();
  map.covered=["own","owe"]; map.unknowns=["owe"];
  expect(supportedMapMetrics(map).find(m=>m.key==="networth")).toBeUndefined();
});
test("MAP engine preserves the old asset-minus-liability formula with estimate labels", () => {
  const map=emptyMap(); map.covered=["own","owe"];
  map.data.assets=[{id:"home",description:"Home",category:"property",value:"9000000",purpose:"personal",annualNetIncome:"0"}];
  map.data.liabilities=[{id:"loan",description:"Home loan",type:"property",value:"3000000",interestRate:"8",annualRepayment:"480000",repaymentIncludedInNeeds:false,classification:"personal"}];
  map.estimates=["assets.home.value"];
  const networth=supportedMapMetrics(map).find(m=>m.key==="networth");
  expect(networth?.value).toBe(6000000); expect(networth?.estimated).toBe(true);
  expect(networth?.formula).toContain("9000000 assets − 3000000 liabilities");
});
test("surplus excludes repayments already included in needs, and does not assume tax", () => {
  const map=emptyMap();map.covered=["own","owe","spend","earn","invest"];
  Object.assign(map.data,{grossPersonalIncome:"2400000",effectiveTaxRate:"20",monthlyNeeds:"100000",monthlyWants:"20000",annualInvesting:"120000"});
  map.data.liabilities=[{id:"loan",description:"Loan",type:"personal",value:"1000000",interestRate:"8",annualRepayment:"240000",repaymentIncludedInNeeds:true,classification:"personal"}];
  expect(supportedMapMetrics(map).find(m=>m.key==="surplus")?.value).toBe(480000);
  expect(supportedMapMetrics(map).find(m=>m.key==="afterinvesting")?.value).toBe(360000);
  map.data.effectiveTaxRate="";
  expect(supportedMapMetrics(map).find(m=>m.key==="surplus")).toBeUndefined();
});
test("invalid MAP amounts, duplicate assets and impossible dates are rejected",()=>{
  const map=emptyMap();map.data.monthlyNeeds="NaN";expect(()=>validateMap(map)).toThrow();
  map.data.monthlyNeeds="";map.data.proposedActions=[{id:"call",category:"other",description:"Call",targetDate:"2026-02-31"}];expect(()=>validateMap(map)).toThrow("calendar");
  map.data.proposedActions=[];const asset={id:"cash",description:"Cash",category:"cash" as const,value:"1",purpose:"personal" as const,annualNetIncome:"0"};map.data.assets=[asset,asset];expect(()=>validateMap(map)).toThrow("Duplicate");
});
test("progress retains earlier actions and uses the latest reported result without duplicate savings",()=>{
  const a={text:"Call customers",dueDate:"2026-10-04"},b={text:"Review spending",dueDate:"2026-10-05"};
  const out={text:"Collected two lakh",actionStatus:"completed",amount:200000,impactType:"receivables_collection",occurredOn:"2026-10-04"};
  const rows=[{revision:1,newContent:{action:a}},{revision:2,newContent:{action:a,outcome:out}},{revision:3,newContent:{action:a,outcome:out}},{revision:4,newContent:{action:b,outcome:null}}];
  const result=progressFromHistory(rows,null);expect(result).toHaveLength(2);expect(result.find(r=>r.text===a.text).outcome.amount).toBe(200000);expect(result.find(r=>r.text===b.text).outcome).toBeNull();
});


test("review and reflection completion survives revisiting profile without changing financial amounts or unknowns",()=>{
 const map=emptyMap();map.step=11;map.covered=["earn","own","owe","spend","invest","lifestyle","goals","milestone"];
 Object.assign(map.data,{userType:"salaried",grossPersonalIncome:"1800000",effectiveTaxRate:"15"});
 map.unknowns=["liabilities.loan.interestRate"];map.estimates=["grossPersonalIncome"];
 const saved=memoryFromAssessment(assessmentFromMemory(map),map,1);
 expect(saved.step).toBe(1);expect(saved.covered).toContain("blueprint");expect(saved.covered).toContain("reflect");
 expect(saved.data).toEqual(map.data);expect(saved.unknowns).toEqual(map.unknowns);expect(saved.estimates).toEqual(map.estimates);
 expect(supportedMapMetrics(saved)).toEqual(supportedMapMetrics(map));
 expect(validateMap(saved).covered).toEqual(saved.covered);
});
