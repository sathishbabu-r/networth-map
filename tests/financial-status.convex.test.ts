import {test,expect} from 'vitest';
import {convexTest} from 'convex-test';
import schema from '../convex/schema';
import {api} from '../convex/_generated/api';
import {emptyMap,supportedMapMetrics} from '../shared/map-engine';
import {financialStatus} from '../shared/financial-status';
const modules=import.meta.glob('../convex/**/*.{ts,js}');
test('financial states survive re-login with exact amounts and account boundaries preserved',async()=>{
 const t=convexTest(schema,modules),id=await t.run(ctx=>ctx.db.insert('users',{name:'Synthetic integrity test'})),otherId=await t.run(ctx=>ctx.db.insert('users',{name:'Synthetic other account'}));
 const user=t.withIdentity({subject:id+'|first'}),map=emptyMap();map.covered=['own','owe'];Object.assign(map.data,{grossPersonalIncome:'1200000',effectiveTaxRate:'0',hasNoLiabilitiesConfirmed:true,monthlyNeeds:'30000',monthlyWants:'0',annualInvesting:'100000'});map.data.assets=[{id:'cash',description:'Synthetic cash',category:'cash',value:'500000',purpose:'investment',annualNetIncome:'0'}];map.estimates=['assets.cash.value'];map.unknowns=['monthlyNeeds'];
 const content={concern:'Synthetic clarity',facts:[],goal:null,action:null,map};
 await user.mutation(api.huddles.save,{content,expectedRevision:0});
 const returning=t.withIdentity({subject:id+'|fresh-session'});const saved=await returning.query(api.huddles.current,{});expect(saved?.content.map).toEqual(map);
 const status=financialStatus(saved!.content.map as any);expect(status.metrics.liabilities.status).toBe('CONFIRMED_ZERO');expect(status.metrics.networth.status).toBe('ESTIMATED');expect(status.metrics.surplus.status).toBe('UNKNOWN');expect(status.inputs.monthlyWants.status).toBe('CONFIRMED_ZERO');expect(supportedMapMetrics(saved!.content.map as any).find(x=>x.key==='surplus')).toBeUndefined();
 expect(await t.withIdentity({subject:otherId+'|session'}).query(api.huddles.current,{})).toBeNull();expect(await t.query(api.huddles.current,{})).toBeNull();
 expect((await returning.query(api.huddles.history,{paginationOpts:{numItems:10,cursor:null},latestFirst:true})).page).toHaveLength(1);
 expect((await returning.query(api.huddles.current,{}))?.revision).toBe(1);
});
