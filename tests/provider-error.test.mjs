import {test} from 'node:test';
import assert from 'node:assert/strict';
import {providerFailure} from '../shared/provider-error.mjs';
test('exhausted credit is distinguished from a temporary rate limit, including retry wrappers',()=>{const billing={statusCode:429,responseBody:JSON.stringify({error:{code:'credit_balance_exhausted'}})};const f=providerFailure({lastError:billing,errors:[billing]});assert.equal(f.code,'credit_balance_exhausted');assert.match(f.message,/credit or billing/);assert.match(providerFailure({statusCode:429}).message,/request limit/);});
test('provider credentials and request data never appear in diagnostic output',()=>{const result=providerFailure({statusCode:401,message:'Incorrect key sk-secret',requestBodyValues:{financialData:'private'},responseBody:JSON.stringify({error:{code:'invalid_api_key',message:'sk-secret'}})});assert.doesNotMatch(JSON.stringify(result),/sk-secret|private/);assert.match(result.message,/key was rejected/);});
test('cyclic error causes terminate safely',()=>{const e={statusCode:403};e.cause=e;assert.equal(providerFailure(e).status,403);});
