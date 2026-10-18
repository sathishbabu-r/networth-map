import {test} from 'node:test';
import assert from 'node:assert/strict';
import {preserveUncertainty} from '../shared/uncertainty.mjs';
const fact={key:'customer_receivables',kind:'exact',amount:800000,scope:'business',period:'point_in_time',asOf:'2026-10-03'};
test('around eight lakh is proposed as an estimate even when the model mislabels it exact',()=>{assert.equal(preserveUncertainty({facts:[fact]},null,'Around eight lakh is outstanding').facts[0].kind,'estimate');});
test('uncertainty in a new answer does not change an unchanged confirmed exact figure',()=>{const second={...fact,key:'overdue_receivables',amount:500000};const result=preserveUncertainty({facts:[fact,second]},{facts:[fact]},'About five lakh is overdue');assert.equal(result.facts[0].kind,'exact');assert.equal(result.facts[1].kind,'estimate');});
test('exact answers, ranges and unknowns are not silently converted into different amounts',()=>{assert.equal(preserveUncertainty({facts:[fact]},null,'Exactly 800000').facts[0].kind,'exact');const range={...fact,kind:'range',amount:null,lower:700000,upper:900000};assert.deepEqual(preserveUncertainty({facts:[range]},null,'Around seven to nine lakh').facts[0],range);});
test('estimated MAP inputs are labelled and unrelated confirmed entries are preserved',()=>{
 const map={data:{grossPersonalIncome:'1200000',monthlyNeeds:'40000',assets:[],liabilities:[],lifestyleChanges:[],wealthGoalDetails:[]},estimates:[],unknowns:[]};
 const prior={facts:[],map};const proposal={facts:[],map:{...map,data:{...map.data,monthlyNeeds:'50000'}}};
 const result=preserveUncertainty(proposal,prior,'About 50000 each month');
 assert.deepEqual(result.map.estimates,['monthlyNeeds']);assert.equal(result.map.data.grossPersonalIncome,'1200000');assert.deepEqual(prior.map.estimates,[]);
});
test('refresh and an unrelated Coach answer cannot silently discard saved estimates or unknowns',()=>{
 const map={data:{grossPersonalIncome:'1200000',monthlyNeeds:'',assets:[],liabilities:[],lifestyleChanges:[],wealthGoalDetails:[]},estimates:['grossPersonalIncome'],unknowns:['monthlyNeeds']};
 const result=preserveUncertainty({facts:[],map:{...map,estimates:[],unknowns:[]}},{facts:[],map},'My goal is clarity');
 assert.deepEqual(result.map.estimates,map.estimates);assert.deepEqual(result.map.unknowns,map.unknowns);assert.deepEqual(result.map.data,map.data);
});
test('AI-inferred numeric drafts stay estimates after review and leave confirmed values intact',()=>{
 const map={data:{grossPersonalIncome:'1200000',monthlyNeeds:'40000',assets:[],liabilities:[],lifestyleChanges:[],wealthGoalDetails:[]},estimates:[],unknowns:[]};
 const prior={facts:[],map};const proposed={facts:[fact],map:{...map,data:{...map.data,monthlyNeeds:'50000'}}};
 const result=preserveUncertainty(proposed,prior,'Help me plan',['map.data.monthlyNeeds','map.data.grossPersonalIncome','facts.0.amount']);
 assert.deepEqual(result.map.estimates,['monthlyNeeds']);assert.equal(result.facts[0].kind,'estimate');assert.equal(result.map.data.monthlyNeeds,'50000');assert.deepEqual(prior.map.estimates,[]);
});
