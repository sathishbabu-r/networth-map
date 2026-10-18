import {emptyMap} from '../../shared/map-engine';
export const question="What are the three most important things about this person's financial life that they may not have realised? Explain why each matters, quantify where possible, identify important trade-offs, and state assumptions or missing information that could change the conclusion.";
export const map=emptyMap();
map.covered=['earn','own','owe','spend','invest','goals'];
Object.assign(map.data,{grossPersonalIncome:'2580000',effectiveTaxRate:'20',monthlyNeeds:'75000',monthlyWants:'25000',annualInvesting:'240000',hasNoLiabilitiesConfirmed:false,moneyPurpose:'Family stability and sustainable independent income'});
map.estimates=['grossPersonalIncome','effectiveTaxRate'];
map.data.assets=[
 {id:'cash',description:'Liquid savings',category:'cash',value:'450000',purpose:'personal',annualNetIncome:'0'},
 {id:'investments',description:'Diversified financial investments',category:'financial',value:'1200000',purpose:'personal',annualNetIncome:'0'},
 {id:'home',description:'Family home',category:'property',value:'4800000',purpose:'personal',annualNetIncome:'0'},
 {id:'rental',description:'Rental property; income already included in total income',category:'property',value:'2400000',purpose:'personal',annualNetIncome:'180000'}
];
map.data.liabilities=[
 {id:'home-loan',description:'Home loan',type:'property',value:'1800000',interestRate:'9',annualRepayment:'216000',repaymentIncludedInNeeds:false,classification:'personal'},
 {id:'personal-loan',description:'Personal loan',type:'personal',value:'300000',interestRate:'18',annualRepayment:'144000',repaymentIncludedInNeeds:false,classification:'personal'}
];
map.data.wealthGoalDetails=[
 {category:'needs',description:'School fees',amount:'180000',targetYear:'2027',priority:'must',flexibility:'neither'},
 {category:'needs',description:'Total emergency reserve target (not additional saving)',amount:'650000',targetYear:'2027',priority:'important',flexibility:'date'},
 {category:'dreams',description:'Equipment for consulting; income benefit not yet evidenced',amount:'300000',targetYear:'2027',priority:'aspirational',flexibility:'both'}
];
export const history=[
 {revision:1,action:{text:'Review discretionary subscriptions',dueDate:'2026-09-01'},outcome:{text:'I postponed this because work felt more urgent.',actionStatus:'not_done'}},
 {revision:2,action:{text:'Review discretionary subscriptions',dueDate:'2026-10-01'},outcome:{text:'I postponed this again; I have limited time.',actionStatus:'not_done'}}
];
export const expected={assets:8850000,liabilities:2100000,networth:6750000,takehome:2064000,lifestyle:1200000,surplus:504000,afterinvesting:264000};
