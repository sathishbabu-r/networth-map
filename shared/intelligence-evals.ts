import {emptyMap} from './map-engine';
import type {MapMemory} from './map-schema';
function base():MapMemory{const m=emptyMap();m.covered=['earn','own','owe','spend','invest','goals'];Object.assign(m.data,{grossPersonalIncome:'1200000',effectiveTaxRate:'0',monthlyNeeds:'40000',monthlyWants:'10000',annualInvesting:'120000',hasNoLiabilitiesConfirmed:true,moneyPurpose:'Provide for my family'});m.data.assets=[{id:'cash',description:'Cash',category:'cash',value:'300000',purpose:'personal',annualNetIncome:'0'}];m.data.wealthGoalDetails=[{category:'needs',description:'School fees',amount:'200000',targetYear:'2027',priority:'must',flexibility:'neither'}];return m;}
export const goldenCases=[
 {name:'high income / low savings',intent:'Understand spending',change:(m:MapMemory)=>{m.data.grossPersonalIncome='3600000';m.data.monthlyWants='250000';}},
 {name:'high net worth / low liquidity',intent:'Understand my assets',change:(m:MapMemory)=>{m.data.assets[0].value='1000';m.data.assets.push({id:'home',description:'Home',category:'property',value:'20000000',purpose:'personal',annualNetIncome:'0'});}},
 {name:'heavy expensive debt',intent:'Understand debt costs',change:(m:MapMemory)=>{m.data.hasNoLiabilitiesConfirmed=false;m.data.liabilities=[{id:'loan',description:'Personal debt',type:'personal',value:'800000',interestRate:'20',annualRepayment:'240000',repaymentIncludedInNeeds:false,classification:'personal'}];}},
 {name:'concentrated assets',intent:'Understand asset concentration',change:(m:MapMemory)=>{m.data.assets[0]={...m.data.assets[0],category:'business',value:'5000000'};}},
 {name:'conflicting goals',intent:'Review future goals',change:(m:MapMemory)=>{m.data.wealthGoalDetails.push({category:'dreams',description:'New car',amount:'900000',targetYear:'2027',priority:'must',flexibility:'neither'});}},
 {name:'behavioural avoidance',intent:'I repeatedly postpone reviewing spending',change:(_m:MapMemory)=>{}},
 {name:'incomplete data',intent:'Review my finances',change:(m:MapMemory)=>{m.data.monthlyNeeds='';m.unknowns=['monthlyNeeds'];}},
 {name:'contradictory data',intent:'Review my debt',change:(m:MapMemory)=>{m.data.hasNoLiabilitiesConfirmed=true;m.data.liabilities=[{id:'loan',description:'Loan',type:'personal',value:'100000',interestRate:'10',annualRepayment:'12000',repaymentIncludedInNeeds:false,classification:'personal'}];}},
 {name:'healthy / no action required',intent:'Do I need to change anything?',change:(_m:MapMemory)=>{}},
 {name:'high impact / professional escalation',intent:'Which stock should I buy?',change:(_m:MapMemory)=>{}},
].map(c=>{const map=base();c.change(map);return {name:c.name,intent:c.intent,map};});
// Hide approach labels until independent ratings have been recorded.
export function blindPair(baseline:unknown,system:unknown,swap:boolean){return {outputs:swap?{A:system,B:baseline}:{A:baseline,B:system},answerKey:swap?{A:'system',B:'baseline'}:{A:'baseline',B:'system'}};}
export const ratingDimensions=['correctness','non-obvious insight','personalisation','strategic reasoning','behavioural insight','actionability','trust'] as const;
