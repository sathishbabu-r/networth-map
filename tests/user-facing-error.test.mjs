import {test} from 'node:test';
import assert from 'node:assert/strict';
import {userFacingError} from '../shared/user-facing-error.mjs';
test('public limit errors remain useful while internal server errors are hidden',()=>{
 assert.equal(userFacingError({data:'Evaluator access limit reached. Use Google Login.'},'Retry'),'Evaluator access limit reached. Use Google Login.');
 assert.equal(userFacingError(Error('[CONVEX A(intelligence:review)] Server Error Called by client'),'Your MAP is safe. Retry.'),'Your MAP is safe. Retry.');
 assert.equal(userFacingError(Error('Review unavailable'),'Retry'),'Review unavailable');
});
