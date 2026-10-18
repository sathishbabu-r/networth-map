import {test,expect} from 'vitest';
import {map,expected} from '../docs/validation/persona';
import {validateMap,supportedMapMetrics} from '../shared/map-engine';
test('real-AI synthetic persona has independently specified expected MAP totals',()=>{
 validateMap(map);
 for(const [key,value] of Object.entries(expected))expect(supportedMapMetrics(map).find(m=>m.key===key)?.value,key).toBe(value);
 expect(supportedMapMetrics(map).find(m=>m.key==='takehome')?.estimated).toBe(true);
});
