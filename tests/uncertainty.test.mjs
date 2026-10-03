import {test} from 'node:test';
import assert from 'node:assert/strict';
import {preserveUncertainty} from '../shared/uncertainty.mjs';
const fact={key:'customer_receivables',kind:'exact',amount:800000,scope:'business',period:'point_in_time',asOf:'2026-10-03'};
test('around eight lakh is proposed as an estimate even when the model mislabels it exact',()=>{assert.equal(preserveUncertainty({facts:[fact]},null,'Around eight lakh is outstanding').facts[0].kind,'estimate');});
test('uncertainty in a new answer does not change an unchanged confirmed exact figure',()=>{const second={...fact,key:'overdue_receivables',amount:500000};const result=preserveUncertainty({facts:[fact,second]},{facts:[fact]},'About five lakh is overdue');assert.equal(result.facts[0].kind,'exact');assert.equal(result.facts[1].kind,'estimate');});
test('exact answers, ranges and unknowns are not silently converted into different amounts',()=>{assert.equal(preserveUncertainty({facts:[fact]},null,'Exactly 800000').facts[0].kind,'exact');const range={...fact,kind:'range',amount:null,lower:700000,upper:900000};assert.deepEqual(preserveUncertainty({facts:[range]},null,'Around seven to nine lakh').facts[0],range);});
