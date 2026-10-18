import {test,expect} from 'vitest';
import {emptyMap} from '../shared/map-engine';
import {mapConversation,financialChanges} from '../shared/map-conversation.mjs';

test('build guidance uses supplied amounts including zero, accepts unknowns, and transitions to next move',()=>{
 const map=emptyMap();map.data.userType='salaried';map.data.grossPersonalIncome='2400000';map.unknowns=['effectiveTaxRate'];
 map.data.hasNoLiabilitiesConfirmed=true;map.covered=['own','goals'];map.data.monthlyNeeds='50000';map.data.monthlyWants='0';map.data.annualInvesting='300000';
 expect(mapConversation(map).missing.map(x=>x.path)).toEqual(['visionLevel','wealthMilestoneChoice']);
 map.data.visionChoiceConfirmed=true;map.data.visionLevel='security';map.data.wealthMilestoneChoice='not-yet';
 expect(mapConversation(map)).toEqual({role:'guide_next_move',missing:[]});
});

test('financial review shows changed amounts only and never turns unknowns into zero',()=>{
 const map=emptyMap();map.data.monthlyNeeds='50000';map.estimates=['monthlyNeeds'];
 const content={facts:[],map};
 expect(financialChanges(content,null)).toEqual([{label:'Monthly household needs',value:'₹50,000',detail:'Estimate'}]);
 expect(financialChanges(content,structuredClone(content))).toEqual([]);
 map.unknowns=['monthlyNeeds'];expect(financialChanges(content,null)).toEqual([]);
});

test('year-based milestones do not request age fields',()=>{
 const m=emptyMap();Object.assign(m.data,{wealthMilestoneChoice:'yes',targetTiming:'year',targetYear:'2036',targetNetworth:'5000000'});
 expect(mapConversation(m).missing.map(x=>x.path)).not.toContain('currentAge');
 m.data.targetTiming='age';expect(mapConversation(m).missing.map(x=>x.path)).toContain('currentAge');
});
