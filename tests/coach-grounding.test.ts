import capturedReply from './fixtures/coach-live-surplus-reply.json';
import {test,expect} from 'vitest';
import {emptyMap} from '../shared/map-engine';
import {coachFinancialSources,coachDates,renderCoachFinancialText} from '../shared/coach-grounding';
import {financialStatus} from '../shared/financial-status';

export function failingPersonaMap(){
 const map=emptyMap();map.covered=['earn','own','owe','spend','invest'];map.step=10;
 Object.assign(map.data,{userType:'salaried',grossPersonalIncome:'1200000',effectiveTaxRate:'10',monthlyNeeds:'30000',monthlyWants:'10000',annualInvesting:'120000'});
 map.data.assets=[{id:'savings',category:'cash',description:'Savings',value:'5000000',annualNetIncome:'0',purpose:'personal'}];
 map.data.liabilities=[{id:'loan',type:'personal',classification:'personal',description:'Synthetic loan 1',value:'1000000',interestRate:'10',annualRepayment:'12000',repaymentIncludedInNeeds:false}];
 return map;
}
const sources=()=>coachFinancialSources(failingPersonaMap(),[],7);
test('exact live failure: gross minus lifestyle is not the verified surplus',()=>{
 const map=failingPersonaMap();expect(financialStatus(map).metrics.surplus.value).toBe(588000);
 expect(Number(map.data.grossPersonalIncome)-financialStatus(map).metrics.lifestyle.value!).toBe(720000);
 expect(renderCoachFinancialText('This means you have a surplus of ₹720,000 annually after accounting for your spending.',sources(),7,[])).toBeNull();
 expect(renderCoachFinancialText('{{financial:7:map.surplus}}',sources(),7,[])).toBe('Annual surplus after loan repayment, before investing: ₹5,88,000 (INR).');
});
test.each([
 'Your annual surplus is ₹7,20,000.',
 'Your monthly surplus is ₹5,88,000.',
 'Your annual surplus is ₹49,000.',
 'Your surplus is ₹12,00,000.', // unrelated supported gross income
 'Your surplus is 10%.', // unrelated supported tax percentage
 'Your investing rate is 10%.', // tax rate cannot be borrowed as investing rate
 'Your annual surplus is USD 588000.',
 'Your surplus is ₹५८८०००.',
 'Your surplus is seven lakh twenty thousand rupees.',
 'Your surplus is zero.',
 'Your surplus is one.',
 '{{financial:6:map.surplus}}',
 '{{financial:7:map.unknown}}',
 'Your monthly surplus is {{financial:7:map.surplus}}',
 'Your surplus:\n{{financial:7:input.grossPersonalIncome}}',
 '{{financial:7:map.surplus}}\n{{financial:7:map.surplus}}',
])('rejects literal, mislabeled, stale or ambiguous numeric claim: %s',text=>{
 // A free-standing misleading label must not be allowed to attach to the next source.
 expect(renderCoachFinancialText(text,sources(),7,[])).toBeNull();
});
test('supported amounts with equal values keep distinct metric, unit and period identities',()=>{
 const map=failingPersonaMap();map.data.monthlyNeeds='120000';map.data.monthlyWants='120000';
 const s=coachFinancialSources(map,[],7);
 expect(s.find(x=>x.id==='input.annualInvesting')).toMatchObject({value:120000,unit:'INR',currency:'INR',period:'annual',revision:7});
 expect(s.find(x=>x.id==='input.monthlyNeeds')).toMatchObject({value:120000,unit:'INR',period:'monthly'});
 const text=renderCoachFinancialText('{{financial:7:input.annualInvesting}}\n{{financial:7:input.monthlyNeeds}}',s,7,[]);
 expect(text).toContain('Investing per year: ₹1,20,000 (INR).');expect(text).toContain('Household needs per month: ₹1,20,000 (INR).');
});
test('supported percentages are rendered from existing guarded formulas',()=>{
 const rendered=renderCoachFinancialText('{{financial:7:ratio.investingRate}}',sources(),7,[]);
 expect(rendered).toBe('Annual investing as a share of take-home income: 11.11%.');
 expect(renderCoachFinancialText('{{financial:7:input.effectiveTaxRate}}',sources(),7,[])).toBe('Effective personal tax rate for annual income: 10%.');
});
test('unknown is absent, explicit zero is preserved, estimates are labelled',()=>{
 const map=failingPersonaMap();map.unknowns=['monthlyWants'];let s=coachFinancialSources(map,[],7);
 expect(s.some(x=>x.id==='map.surplus')).toBe(false);expect(s.some(x=>x.id==='input.monthlyWants')).toBe(false);
 expect(renderCoachFinancialText('{{financial:7:map.surplus}}',s,7,[])).toBeNull();
 map.unknowns=[];map.data.monthlyWants='0';map.estimates=['assets.savings.value'];s=coachFinancialSources(map,[],7);
 expect(renderCoachFinancialText('{{financial:7:input.monthlyWants}}',s,7,[])).toContain('₹0 (INR)');
 expect(renderCoachFinancialText('{{financial:7:map.networth}}',s,7,[])).toContain('(estimate)');
});
test('dates survive while unrelated bare numbers and duplicate legacy identities do not',()=>{
 const dates=coachDates(['I commit to review spending by 10 October 2026.']);
 expect(renderCoachFinancialText('Review spending by 10 October 2026. What is one small step?',sources(),7,dates)).toContain('10 October 2026');
 expect(renderCoachFinancialText('Review spending by 11 October 2026.',sources(),7,dates)).toBeNull();
 const f={key:'income',kind:'exact',amount:720000,scope:'personal',period:'annual' as const,currency:'INR',asOf:'2026'};
 expect(coachFinancialSources(null,[f,f],7)).toEqual([]);
});
test('clarification questions may name a unit without claiming a number',()=>{
 expect(renderCoachFinancialText('What effective tax percentage applies to your annual income?',sources(),7,[])).toBe('What effective tax percentage applies to your annual income?');
 expect(renderCoachFinancialText('Unknown is not zero. What would help you check the amount in rupees?',sources(),7,[])).toContain('Unknown is not zero.');
});
const completedMap=()=>{
 const map=failingPersonaMap();Object.assign(map.data,{grossPersonalIncome:'2400000',effectiveTaxRate:'20',monthlyNeeds:'60000',monthlyWants:'30000',annualInvesting:'240000'});map.data.liabilities[0].annualRepayment='300000';return map;
};
test.each([
 'Your annual surplus after repayment is ₹5,40,000, and your annual cash after investing is ₹3,00,000.',
 'Your annual surplus after repayment is ₹5.4 lakh; your annual cash after investing is ₹3 lakh.',
 'Your annual surplus after debt repayment is ₹5.4 lakh. Your annual cash after investing is ₹3 lakh.',
 'You have ₹5.4 lakh annual surplus after repayment and ₹3 lakh annual cash after investing.',
 'Your annual surplus is ₹5.4L. Your annual cash after investing is ₹3L.',
 'Your surplus is ₹5,40,000 per year after repayment and ₹3,00,000 after investing.',
 'Your monthly surplus is ₹45,000, and your monthly cash after investing is ₹25,000.',
 'Your annual investing rate is 12.5%.',
 'Your annual gross income is ₹24 lakh. Your annual take-home income is ₹19.2 lakh.',
 'Your annual income is ₹19.2 lakh after tax.',
 'Your loan interest rate is 10%. Your tax rate is 20%.',
 'You have a 20% tax rate. Your annual tax is ₹4.8 lakh.',
 'Your annual interest costs are ₹1 lakh.',
 'Your monthly needs are ₹60,000 and your monthly wants are ₹30,000.',
 'Your annual needs are ₹7.2 lakh and your annual wants are ₹3.6 lakh.',
 'Your net worth is ₹40 lakh. Your assets are ₹50 lakh and your total liabilities are ₹10 lakh.',
 'Which of your top 3 actions feels most useful this week?',
 '1. Review your spending.\n2. Check your repayment plan.\n3. Decide your next action.',
 'Your top 3 actions:\n1. Review spending.\n2. Check repayments.\n3. Choose your next move.',
 'Start with action 1: review your spending. Would that fit your goal?',
 'Call three customers. Which one action would you choose?',
 'Which one of your actions feels easiest to start? You choose the one that fits.',
])('exact completed MAP: correct figures and action counts pass: %s',text=>{
 const s=coachFinancialSources(completedMap(),[],7);expect(s.find(x=>x.metric==='surplus')?.value).toBe(540000);expect(s.find(x=>x.metric==='afterinvesting')?.value).toBe(300000);
 expect(renderCoachFinancialText(text,s,7,[])).toBeTruthy();
});
test.each([
 'Your annual surplus after repayment is ₹7,20,000.',
 'Your annual surplus is ₹3,00,000.', // repayment value and after-investing value exist, but neither is surplus
 'Your annual cash after investing is ₹5,40,000.',
 'Your monthly surplus is ₹5.4 lakh.',
 'Your annual surplus is ₹45,000.',
 'Your investing rate is 20%.',
 'Your surplus is 540000%.',
 'Your annual surplus is ₹5.4 lakh and your cash after investing is ₹7.2 lakh.',
 'Your surplus is ₹540000 USD.',
 'Your loan interest rate is 20%.',
 'Your annual gross income is ₹19.2 lakh after tax.',
])('exact completed MAP: wrong value, meaning, unit or period stays blocked: %s',text=>{
 expect(renderCoachFinancialText(text,coachFinancialSources(completedMap(),[],7),7,[])).toBeNull();
});
test('rounding is permitted with an approximate money label and percentage display precision',()=>{
 expect(renderCoachFinancialText('Your annual surplus is approximately ₹5.9 lakh.',sources(),7,[])).toBeTruthy();
 expect(renderCoachFinancialText('Your annual surplus is ₹5.9 lakh.',sources(),7,[])).toBeNull();
 expect(renderCoachFinancialText('Your investing rate is 11.11%.',sources(),7,[])).toBeTruthy();
 expect(renderCoachFinancialText('Your annual surplus is approximately ₹7.2 lakh.',sources(),7,[])).toBeNull();
});

test.each(['Your annual surplus is -₹5.4 lakh.','Your annual surplus is −₹5.4 lakh.','Your annual surplus is ₹−5.4 lakh.'])('a negative sign cannot turn a verified positive surplus into a negative claim: %s',text=>{
 expect(renderCoachFinancialText(text,coachFinancialSources(completedMap(),[],7),7,[])).toBeNull();
});
test.each(['Your net worth is -₹8.5 lakh.','Your net worth is −₹8.5 lakh.','Your net worth is ₹-8.5 lakh.','Your net worth is ₹−8.5 lakh.'])('negative-net-worth households can receive correctly signed supported figures: %s',text=>{
 const map=completedMap();map.data.assets[0].value='50000';map.data.liabilities[0].value='900000';
 const s=coachFinancialSources(map,[],7);expect(s.find(x=>x.metric==='networth')?.value).toBe(-850000);
 expect(renderCoachFinancialText(text,s,7,[])).toBeTruthy();
 expect(renderCoachFinancialText('Your net worth is ₹8.5 lakh.',s,7,[])).toBeNull();
});

test.each(['Your annual surplus is - 540000.','Your annual surplus is − 540000.','Your annual surplus is ₹- 5.4 lakh.','Your annual surplus is -₹-5.4 lakh.'])('spaced and double signs cannot bypass amount verification: %s',text=>{
 expect(renderCoachFinancialText(text,coachFinancialSources(completedMap(),[],7),7,[])).toBeNull();
});
test('spaced negative amounts still explain a verified negative net worth',()=>{
 const map=completedMap();map.data.assets[0].value='50000';map.data.liabilities[0].value='900000';
 expect(renderCoachFinancialText('Your net worth is − 850000.',coachFinancialSources(map,[],7),7,[])).toBeTruthy();
});

test.each([
 ['Your annual surplus is ₹7,20,000.','₹7,20,000','surplus','annual',588000],
 ['Your monthly surplus is ₹5,88,000.','₹5,88,000','surplus','monthly',49000],
 ['Your annual surplus is -₹5,88,000.','-₹5,88,000','surplus','annual',588000],
 ['Your surplus is 10%.','10%','surplus',null,588000],
])('rejection diagnostics identify exact claim, interpreted metric and expected display amount: %s',(text,figure,metric,period,expected)=>{
 const events:any[]=[];expect(renderCoachFinancialText(text,sources(),7,[],e=>events.push(e))).toBeNull();
 expect(events).toHaveLength(1);expect(events[0]).toMatchObject({numericString:figure,metric,period,expectedMetric:'map.surplus',expectedAmount:expected,revision:7});
});
test('equal financial amounts do not allow a mismatched metric or period',()=>{
 const catalog=sources().map(s=>s.metric==='grossPersonalIncome'?{...s,value:588000}:s);
 expect(renderCoachFinancialText('Your annual gross income is ₹5,88,000.',catalog,7,[])).not.toBeNull();
 expect(renderCoachFinancialText('Your monthly surplus is ₹5,88,000.',catalog,7,[])).toBeNull();
 expect(renderCoachFinancialText('Your annual cash after investing is ₹5,88,000.',catalog,7,[])).toBeNull();
});
test('diagnostics omit unlabelled numbers and all surrounding private prose',()=>{
 const events:any[]=[];renderCoachFinancialText('Contact fictional.user@example.test at 9876543210.',sources(),7,[],e=>events.push(e));
 expect(events[0].numericString).toBeNull();expect(JSON.stringify(events)).not.toMatch(/9876543210|fictional|example/);
});

test('foreign currency diagnostic distinguishes actual currency from verified INR',()=>{
 const events:any[]=[];expect(renderCoachFinancialText('Your annual surplus is USD 588000.',sources(),7,[],e=>events.push(e))).toBeNull();
 expect(events[0]).toMatchObject({numericString:'USD 588000',metric:'surplus',expectedMetric:'map.surplus',expectedAmount:588000,currency:'INR',actualCurrency:'USD',reason:'unsupported_currency'});
});

test('captured live reply: correct first sentence passes, double-subtracted repayment remains blocked',()=>{
 const map=completedMap();map.data.userType='business-owner';map.data.assets[0].purpose='investment';const catalog=coachFinancialSources(map,[],7);const events:any[]=[];
 expect(capturedReply.reply).toBe('Your annual surplus before investing is ₹5,40,000. After your annual loan repayment of ₹3,00,000, your surplus would be ₹2,40,000. After investing ₹2,40,000, you would have ₹0 left as surplus.');
 expect(renderCoachFinancialText(capturedReply.reply.split('. ')[0]+'.',catalog,7,[])).not.toBeNull();
 expect(renderCoachFinancialText(capturedReply.reply,catalog,7,[],e=>events.push(e))).toBeNull();
 expect(events[0]).toMatchObject({numericString:'₹2,40,000',metric:'surplus',expectedAmount:540000,reason:'amount_mismatch'});
});
test.each([
 ['540000','300000'],['5,40,000','3,00,000'],['5.4 lakh','3 lakh'],
])('exact Business Owners MAP: before/after investing labels pass with ₹%s and ₹%s',(before,after)=>{
 const map=completedMap();map.data.userType='business-owner';map.data.assets[0].purpose='investment';
 const text=`Your annual surplus before investing is ₹${before}. After investing, your annual surplus is ₹${after}.`;
 expect(renderCoachFinancialText(text,coachFinancialSources(map,[],7),7,[])).toBe(text);
});
test.each(['₹7,20,000','₹2,40,000','₹0','-₹5,40,000'])('new surplus qualifier cannot authorize a wrong amount: %s',amount=>{
 expect(renderCoachFinancialText(`Your annual surplus before investing is ${amount}.`,coachFinancialSources(completedMap(),[],7),7,[])).toBeNull();
});
test('new labels preserve monthly/annual, sign, currency and source binding',()=>{
 const catalog=coachFinancialSources(completedMap(),[],7);
 expect(renderCoachFinancialText('Your monthly surplus before investing is ₹45,000. After investing, your monthly surplus is ₹25,000.',catalog,7,[])).not.toBeNull();
 for(const text of ['Your monthly surplus before investing is ₹5,40,000.','After investing, your annual surplus is ₹5,40,000.','After investing, your annual surplus is -₹3,00,000.','Your annual surplus before investing is USD 540000.'])expect(renderCoachFinancialText(text,catalog,7,[])).toBeNull();
});
test('qualified after-repayment before-investing label uses surplus rather than contribution',()=>{
 expect(renderCoachFinancialText('Your annual surplus after loan repayment, before investing, is ₹5,40,000.',coachFinancialSources(completedMap(),[],7),7,[])).not.toBeNull();
});
