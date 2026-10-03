import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('the deployed coach policy matches the approved COACH.md',()=>{
const approved=readFileSync(new URL('../COACH.md',import.meta.url),'utf8');
const policy=JSON.parse(readFileSync(new URL('../shared/coach-policy.json',import.meta.url),'utf8'));
assert.equal(policy.instructions,approved);
});
