import {test,expect} from 'vitest';
import {emptyMap,assessedMap} from '../shared/map-engine';
import {mapRecommendations,savedMapTopThree,renderTopThreeChoice,asksAboutTopThree} from '../shared/map-recommendations';
function failingPersonaMap(){
 const map=emptyMap();map.covered=['earn','own','owe','spend','invest'];map.step=10;
 Object.assign(map.data,{userType:'salaried',grossPersonalIncome:'1200000',effectiveTaxRate:'10',monthlyNeeds:'30000',monthlyWants:'10000',annualInvesting:'120000'});
 map.data.assets=[{id:'savings',category:'cash',description:'Savings',value:'5000000',annualNetIncome:'0',purpose:'personal'}];
 map.data.liabilities=[{id:'loan',type:'personal',classification:'personal',description:'Synthetic loan 1',value:'1000000',interestRate:'10',annualRepayment:'12000',repaymentIncludedInNeeds:false}];
 return map;
}
test('shared source reproduces displayed assessment-first, finding-second ordering',()=>{
 const map=failingPersonaMap();map.data.proposedActions=[{id:'a',category:'reduce-spending',description:'Review optional costs',targetDate:''},{id:'b',category:'change-income',description:'Review income',targetDate:''}];
 const {blueprint}=assessedMap(map);const rows=mapRecommendations(blueprint);
 expect(rows.map(r=>r.id)).toEqual([...blueprint.actionAssessments.map(a=>`action-${a.id}`),...blueprint.unaddressedFindings.map(f=>`finding-${f.id}`)]);
 expect(savedMapTopThree(map,9)).toEqual({revision:9,actions:rows.slice(0,3)});
});
test('unsupported action cannot be selected and empty MAP cannot invent actions',()=>{
 const map=failingPersonaMap();map.data.monthlyNeeds='200000';map.data.proposedActions=[{id:'a',category:'increase-investing',description:'Increase investing from surplus',targetDate:''}];
 const catalog=savedMapTopThree(map,2);expect(catalog.actions[0].status).toBe('not-supported');expect(renderTopThreeChoice(catalog,{revision:2,startingId:'action-a'})).toBeNull();
 expect(savedMapTopThree(emptyMap(),1).actions).toEqual([]);expect(renderTopThreeChoice(savedMapTopThree(null,1),{revision:1,startingId:null})).toContain('no Top 3');
});

test('hosting uses its registered component and router without an optional staticHosting.ts module',async()=>{
 const {readFileSync}=await import('node:fs');
 expect(readFileSync('convex/convex.config.ts','utf8')).toContain('app.use(staticHosting)');
 expect(readFileSync('convex/http.ts','utf8')).toContain('registerStaticRoutes(http, components.staticHosting)');
 expect(readFileSync('convex/http.ts','utf8')).not.toMatch(/from ["']\.\/staticHosting/);
 expect(import.meta.resolve('@convex-dev/static-hosting')).toContain('@convex-dev/static-hosting');
});

test('an undescribed saved action needs clarification, never an invented recommendation',()=>{
 const map=failingPersonaMap();map.data.proposedActions=[{id:'blank',category:'increase-liquidity',description:'',targetDate:''}];const catalog=savedMapTopThree(map,3);
 expect(catalog.actions[0].title).toBe('');expect(renderTopThreeChoice(catalog,{revision:3,startingId:'action-blank'})).toBeNull();
 expect(renderTopThreeChoice(catalog,{revision:3,startingId:null})).toContain('description is missing');
});
test('a user-selected commitment retains the existing commitment flow',()=>{
 expect(asksAboutTopThree('Which of my top 3 actions should I start with this week?')).toBe(true);
 expect(asksAboutTopThree('I choose action 2 of my top 3 and I commit to do it by 20 October.')).toBe(false);
});
