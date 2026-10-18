import {test,expect} from 'vitest';
import {goldenCases} from '../shared/intelligence-evals';
import {supportedMapMetrics} from '../shared/map-engine';
import {runIntelligence,contextFor,type Specialist} from '../shared/intelligence';
const map=()=>structuredClone(goldenCases[0].map);
const output=(agent:string):Specialist=>({agent:agent as any,insights:[],risks:[],opportunities:[],questions_for_user:[],cross_agent_challenges:[],assumptions:[],missing_information:[],confidence:.9,escalation:null});
const cfo=()=>({story:'Your reported picture needs review.',insights:[] as any[],strategic_gap:'Review priorities',tradeoffs:[],attention_now:'Clarify priorities',no_action:'No transaction required',behaviour:null as string|null,coach_questions:[],confidence:.9,caveats:[] as string[]});
test('an explicitly unknown income section cannot produce take-home income or surplus',()=>{const m=map();m.unknowns=['earn'];expect(supportedMapMetrics(m).map(x=>x.key)).not.toContain('takehome');expect(supportedMapMetrics(m).map(x=>x.key)).not.toContain('surplus');});
test('confirmed no debt is not missing liability information',()=>{expect(contextFor(map(),'liabilities').missing).not.toContain('liabilities');});
test('CFO cannot borrow an amount from an unrelated calculation to justify an insight',async()=>{
 const result=await runIntelligence(map(),'income',false,async<T>(name:string)=>{
  if(name==='income')return {...output(name),insights:[{id:'income-a',text:'Your annual take-home income is ₹36,00,000.',evidence:['calc:takehome'],topic:'income',position:'attention'}]} as T;
  if(name==='cfo')return {...cfo(),insights:[{text:'Your annual income is ₹1,20,000.',finding_ids:['income-a']}]} as T;
  return output(name) as T;
 });expect(result.cfo.insights).toEqual([]);
});
test('unsupported amounts cannot escape through CFO caveats',async()=>{
 const result=await runIntelligence(map(),'income',false,async<T>(name:string)=>name==='cfo'?{...cfo(),caveats:['Your missing loan is ₹9,87,654.']} as T:output(name) as T);
 expect(result.cfo.caveats.join(' ')).not.toContain('9,87,654');
});
test('conflicts found in risks receive an evidence challenge, not just conflicts in insights',async()=>{
 const calls:string[]=[];await runIntelligence(map(),'income',false,async<T>(name:string)=>{
  calls.push(name);if(name==='cfo')return cfo() as T;
  return {...output(name),risks:[{id:name+'-risk',text:'Review this timing consideration',evidence:[name==='income'?'calc:takehome':'calc:surplus'],topic:'timing',position:name==='income'?'attention':'no_action'}]} as T;
 });expect(calls.filter(n=>n==='income')).toHaveLength(2);expect(calls.filter(n=>n==='cashflow')).toHaveLength(2);
});
import {verify,roles} from '../shared/intelligence';
import {ratingDimensions} from '../shared/intelligence-evals';
const expected=[
 {networth:300000,takehome:3600000,lifestyle:3480000,surplus:120000,afterinvesting:0},
 {networth:20001000,takehome:1200000,lifestyle:600000,surplus:600000,afterinvesting:480000},
 {networth:-500000,takehome:1200000,lifestyle:600000,surplus:360000,afterinvesting:240000},
 {networth:5000000,takehome:1200000,lifestyle:600000,surplus:600000,afterinvesting:480000},
 {networth:300000,takehome:1200000,lifestyle:600000,surplus:600000,afterinvesting:480000},
 {networth:300000,takehome:1200000,lifestyle:600000,surplus:600000,afterinvesting:480000},
 {networth:300000,takehome:1200000,lifestyle:null,surplus:null,afterinvesting:null},
 {networth:null,takehome:1200000,lifestyle:600000,surplus:null,afterinvesting:null},
 {networth:300000,takehome:1200000,lifestyle:600000,surplus:600000,afterinvesting:480000},
 {networth:300000,takehome:1200000,lifestyle:600000,surplus:600000,afterinvesting:480000},
];
for(const [i,c] of goldenCases.entries())test('known synthetic calculation: '+c.name,()=>{const metrics=Object.fromEntries(supportedMapMetrics(c.map).map(x=>[x.key,x.value]));for(const [key,value] of Object.entries(expected[i])){if(value===null)expect(metrics).not.toHaveProperty(key);else expect(metrics[key]).toBe(value);}const v=verify(c.map,roles.map(output),c.intent);if(i===6||i===7)expect(v.state).toBe('INSUFFICIENT_DATA');if(i===9)expect(v.state).toBe('ESCALATE');});
test('income marked unknown cannot serve as specialist fact evidence',()=>{const m=map();m.unknowns=['earn'];const r={...output('income'),insights:[{id:'income',text:'Annual income ₹36,00,000',evidence:['fact:grossPersonalIncome'],topic:'income',position:'attention' as const}]};expect(verify(m,[r],'income').findings).toEqual([]);});
test('parent unknown markers and blank whitespace do not silently become zero',()=>{const m=map();m.unknowns=['assets'];expect(supportedMapMetrics(m).map(x=>x.key)).not.toContain('networth');m.data.monthlyNeeds=' ';expect(supportedMapMetrics(m).map(x=>x.key)).not.toContain('surplus');});
test('debt repayments included in needs are not counted twice',()=>{const m=structuredClone(goldenCases[2].map);m.data.liabilities[0].repaymentIncludedInNeeds=true;expect(supportedMapMetrics(m).find(x=>x.key==='surplus')?.value).toBe(600000);m.data.effectiveTaxRate='20';expect(supportedMapMetrics(m).find(x=>x.key==='surplus')?.value).toBe(360000);});
test('baseline rubric contains all seven requested dimensions',()=>{expect(ratingDimensions).toEqual(['correctness','non-obvious insight','personalisation','strategic reasoning','behavioural insight','actionability','trust']);});
test('generated missing-information text cannot append unsupported money to checked caveats',async()=>{
 const result=await runIntelligence(map(),'income',false,async<T>(name:string)=>name==='cfo'?cfo() as T:{...output(name),missing_information:['A loan of ₹9,87,654 is missing']} as T);
 expect(result.cfo.caveats.join(' ')).not.toContain('9,87,654');
});
test('unsupported amounts are blocked in all nine CFO output sections',async()=>{
 const bogus='Your loan is ₹9,87,654.';
 const result=await runIntelligence(map(),'income',false,async<T>(name:string)=>name==='cfo'?{...cfo(),story:bogus,insights:[{text:bogus,finding_ids:['income-a']}],strategic_gap:bogus,tradeoffs:[bogus],attention_now:bogus,no_action:bogus,behaviour:bogus,coach_questions:[bogus],caveats:[bogus]} as T:{...output(name),insights:name==='income'?[{id:'income-a',text:'Review income',evidence:['calc:takehome'],topic:'income',position:'attention'}]:[]} as T);
 expect(JSON.stringify(result.cfo)).not.toContain('9,87,654');
});
import {numericGrounded} from '../shared/intelligence';
test('unparsed written and non-ASCII currency amounts cannot silently pass verification',()=>{
 expect(numericGrounded('You have eleven lakh of surplus.',[])).toBe(false);
 expect(numericGrounded('You have ₹twenty of surplus.',[])).toBe(false);
 expect(numericGrounded('You have ₹९८७६५४ of surplus.',[])).toBe(false);
});
test('unknown debt is not the same as confirmed zero debt',()=>{const m=map();m.data.hasNoLiabilitiesConfirmed=false;m.data.liabilities=[];expect(contextFor(m,'liabilities').missing).toContain('liabilities');expect(supportedMapMetrics(m).map(x=>x.key)).not.toContain('liabilities');m.data.hasNoLiabilitiesConfirmed=true;expect(contextFor(m,'liabilities').missing).not.toContain('liabilities');expect(supportedMapMetrics(m).find(x=>x.key==='liabilities')?.value).toBe(0);});
test('supported INR formatting remains usable after rejecting unparsed amounts',()=>{expect(numericGrounded('Rs. 6,00,000',[600000])).toBe(true);expect(numericGrounded('INR 600000',[600000])).toBe(true);expect(numericGrounded('₹0.5',[.5])).toBe(true);expect(numericGrounded('₹.5',[5])).toBe(false);expect(numericGrounded('−500000 deficit',[-500000])).toBe(true);expect(numericGrounded('$600000',[600000])).toBe(false);});

test('complete MAP review does not treat optional milestones or absent behaviour history as missing financial facts',async()=>{
 const m=map();m.data.wealthMilestoneChoice='not-yet';m.data.targetNetworth='';m.data.targetYear='';
 const result=await runIntelligence(m,'income',true,async<T>(name:string)=>name==='cfo'?{...cfo(),caveats:['Your income and spending are missing.']} as T:{...output(name),missing_information:['grossPersonalIncome','monthlyNeeds']} as T);
 expect(result.verified.missing).not.toContain('grossPersonalIncome');expect(result.verified.missing).not.toContain('targetNetworth');expect(result.verified.missing).not.toContain('user-confirmed behavioural evidence');expect(result.cfo.caveats.join(' ')).not.toContain('income and spending are missing');
});
test('unavailable analysis explains the failure without an empty completion instruction',async()=>{
 const result=await runIntelligence(map(),'income',false,async<T>(name:string)=>{if(name==='cfo')return cfo() as T;throw Error('Unavailable');});
 expect(result.cfo.attention_now).not.toContain(': .');expect(result.cfo.story).toContain('analysis');expect(result.cfo.attention_now).toContain('retry');
});
