import type { MapMemory } from './map-schema';
export const FINANCIAL_POLICY_VERSION = 'financial-integrity-v2';
export type FinancialState = 'UNKNOWN' | 'CONFIRMED_ZERO' | 'ESTIMATED' | 'CONFIRMED_AMOUNT';
export type FinancialValue = {status:FinancialState; value:number|null; missing:string[]};
import {hasFinancialMarker} from './uncertainty.mjs';
export function pathMarked(markers:string[],path:string):boolean{return hasFinancialMarker(markers,path);}
const unknown=(path:string):FinancialValue=>({status:'UNKNOWN',value:null,missing:[path]});
export function combineFinancial(values:FinancialValue[],compute:(numbers:number[])=>number):FinancialValue{
 const missing=[...new Set(values.flatMap(v=>v.missing))];
 if(values.some(v=>v.value===null))return {status:'UNKNOWN',value:null,missing};
 const value=compute(values.map(v=>v.value!));
 if(!Number.isFinite(value))return {status:'UNKNOWN',value:null,missing};
 return {status:values.some(v=>v.status==='ESTIMATED')?'ESTIMATED':value===0?'CONFIRMED_ZERO':'CONFIRMED_AMOUNT',value,missing:[]};
}
export function financialStatus(map:MapMemory){
 const d=map.data,inputs:Record<string,FinancialValue>={};
 const field=(path:string,value:string|undefined)=>{
  const amount=value?.trim();
  return inputs[path]=!amount||!Number.isFinite(Number(amount))||Number(amount)<0||Number(amount)>Number.MAX_SAFE_INTEGER||pathMarked(map.unknowns,path)?unknown(path):{status:pathMarked(map.estimates,path)?'ESTIMATED':Number(amount)===0?'CONFIRMED_ZERO':'CONFIRMED_AMOUNT',value:Number(amount),missing:[]};
 };
 for(const k of ['grossPersonalIncome','effectiveTaxRate','monthlyNeeds','monthlyWants','annualInvesting','desiredLifestyleMonthly','targetNetworth','currentAge','targetAge','targetYear'] as const)field(k,d[k]);
 for(const [collection,fields] of [['assets',['value','annualNetIncome']],['liabilities',['value','interestRate','annualRepayment']],['lifestyleChanges',['monthlyAmount']],['wealthGoalDetails',['amount','targetYear']]] as const){
  for(const row of d[collection])for(const k of fields)field(`${collection}.${'id' in row?row.id:row.category}.${k}`,(row as any)[k]);
 }
 const sum=(values:FinancialValue[])=>combineFinancial(values,ns=>ns.reduce((a,b)=>a+b,0));
 const own=d.assets.length>0&&map.covered.includes('own')&&!pathMarked(map.unknowns,'assets');
 const owe=!pathMarked(map.unknowns,'liabilities')&&!pathMarked(map.unknowns,'hasNoLiabilitiesConfirmed')&&!(d.hasNoLiabilitiesConfirmed&&d.liabilities.length>0)&&(d.hasNoLiabilitiesConfirmed||map.covered.includes('owe')&&d.liabilities.length>0);
 const assets=own?sum(d.assets.map(a=>inputs[`assets.${a.id}.value`])):unknown('own');
 const liabilities=owe?sum(d.liabilities.map(l=>inputs[`liabilities.${l.id}.value`])):unknown('owe');
 const repayments=owe?sum(d.liabilities.map(l=>inputs[`liabilities.${l.id}.annualRepayment`])):unknown('owe');
 const deducted=owe?sum(d.liabilities.filter(l=>!l.repaymentIncludedInNeeds).map(l=>inputs[`liabilities.${l.id}.annualRepayment`])):unknown('owe');
 const takehome=combineFinancial([inputs.grossPersonalIncome,inputs.effectiveTaxRate],([gross,tax])=>gross*(1-tax/100));
 const needs=combineFinancial([inputs.monthlyNeeds],([n])=>n*12),wants=combineFinancial([inputs.monthlyWants],([n])=>n*12);
 const lifestyle=sum([needs,wants]);
 const included = sum(d.liabilities.filter(l=>l.repaymentIncludedInNeeds).map(l=>inputs[`liabilities.${l.id}.annualRepayment`]));
 const contradictions:string[]=[];
 if (included.value !== null && needs.value !== null && included.value > needs.value) contradictions.push('Loan repayments marked included exceed annual household needs. Correct repayment amounts or household needs, or remove the inclusion flag.');
 const surplus=contradictions.length ? unknown('owe: included repayments exceed household needs') : combineFinancial([takehome,lifestyle,liabilities,deducted],([income,cost,_debt,repayment])=>income-cost-repayment);
 const afterinvesting=combineFinancial([surplus,inputs.annualInvesting],([available,invest])=>available-invest);
 const assetincome=own?sum(d.assets.map(a=>inputs[`assets.${a.id}.annualNetIncome`])):unknown('own');
 const interest=owe?sum(d.liabilities.map(l=>combineFinancial([inputs[`liabilities.${l.id}.value`],inputs[`liabilities.${l.id}.interestRate`]],([balance,rate])=>balance*rate/100))):unknown('owe');
 const networth=combineFinancial([assets,liabilities],([a,l])=>a-l);
 const changes=sum(d.lifestyleChanges.map(l=>combineFinancial([inputs[`lifestyleChanges.${l.id}.monthlyAmount`]],([n])=>n*(l.direction==='decrease'?-1:1)*12)));
 const baseline=d.visionLevel==='security'?needs:d.visionLevel==='freedom'&&!d.lifestyleChanges.length?combineFinancial([inputs.desiredLifestyleMonthly],([n])=>n*12):lifestyle;
 const visioncost=d.visionChoiceConfirmed&&d.visionLevel&&!pathMarked(map.unknowns,'visionChoiceConfirmed')&&!pathMarked(map.unknowns,'visionLevel')?combineFinancial([baseline,changes],([a,b])=>Math.max(0,a+b)):unknown('lifestyle');
 const metrics={assets,liabilities,networth,takehome,lifestyle,surplus,afterinvesting,visioncost,needs,wants,investing:inputs.annualInvesting,assetincome,interest,repayments,deducted};
 const missing=[...new Set([assets,liabilities,takehome,lifestyle,inputs.annualInvesting,repayments,assetincome,interest].flatMap(v=>v.missing))];
 if(d.assets.some(a=>!a.purpose))missing.push('own: asset purpose');
 return {inputs,metrics,missing,contradictions,ready:missing.length===0 && contradictions.length===0};
}
export function formatFinancial(v:FinancialValue){return v.value===null?'Not provided':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:0,maximumFractionDigits:2}).format(v.value)+(v.status==='ESTIMATED'?' (estimate)':'');}
export function missingMapSection(path:string){return /^(own|assets)/.test(path)?'Assets':/^(owe|liabilities|hasNoLiabilities)/.test(path)?'Liabilities':/^(grossPersonalIncome|effectiveTaxRate|earn)/.test(path)?'Personal Profiling':/^(monthlyNeeds|monthlyWants|spend)/.test(path)?'Spending':/^(annualInvesting|invest)/.test(path)?'Investing':/^(lifestyle|desiredLifestyle|vision)/.test(path)?'Lifestyle':/^(wealthGoal|goals)/.test(path)?'Goals':/^(target|currentAge|milestone)/.test(path)?'Milestone':path==='userType'?'Personal Profiling':path;}

// Reject declarative balance/ratio claims when their required data is unavailable.
export function unsupportedFinancialClaim(map:MapMemory,text:string):string|null {
 const m=financialStatus(map).metrics;
 const checks:[RegExp,FinancialValue,string][]=[
  [/(?:net\s*worth|networth)\s*(?:is|of|stands at|totals?|equals?|:)\s*(?:exact(?:ly)?\s*|estimated?\s*|approximately\s*)?(?:₹|Rs\.?|INR|[-\d])/i,m.networth,'Assets and Liabilities'],
  [/(?:surplus|cash after investing|available cash flow)\s*(?:is|of|totals?|equals?|:)\s*(?:₹|Rs\.?|INR|[-\d])/i,m.surplus,'Personal Profiling, Spending and Liabilities'],
  [/(?:assets?|liabilities|debt)\s*(?:total|totals|is|are|of|:)\s*(?:₹|Rs\.?|INR|\d)/i,/assets?/i.test(text)?m.assets:m.liabilities,/assets?/i.test(text)?'Assets':'Liabilities'],
 ];
 for(const [pattern,state,section] of checks)if(pattern.test(text)&&state.value===null)return section;
 if(/\b(?:no debt|no liabilities|zero debt|zero liabilities|debt[- ]free)\b/i.test(text)&&(m.liabilities.value!==0||m.liabilities.status==='ESTIMATED'))return 'Liabilities';
 if(/\b(?:savings|investing) rate\b/i.test(text)&&(/%|percent/i.test(text))&&(m.takehome.value===null||m.takehome.value<=0||m.investing.value===null))return 'Personal Profiling and Investing';
 if(/financial health score|financially healthy|healthy financial position/i.test(text))return 'the missing financial evidence';
 return null;
}
