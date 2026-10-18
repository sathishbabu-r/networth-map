import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import schema from '../convex/schema';
import {api} from '../convex/_generated/api';
import {goldenCases} from '../shared/intelligence-evals';
const calls=vi.hoisted(()=>[] as string[]);
const provider=vi.hoisted(()=>({fail:false}));
vi.mock('@convex-dev/agent',()=>({Agent:class{async generateObject(_ctx:unknown,_thread:unknown,args:{system:string},options:unknown){if(provider.fail)throw Error('Provider unavailable');const role=args.system.match(/Role: (\w+)/)?.[1]??'';calls.push(role);expect(options).toEqual({storageOptions:{saveMessages:'none'}});return {object:role==='cfo'?{story:'Your financial story uses your reported MAP.',insights:[{text:'Your annual surplus merits review.',finding_ids:['cashflow-one']}],strategic_gap:'Choose a meaningful goal',tradeoffs:[],attention_now:'Explore your priorities',no_action:'No transaction needed',behaviour:null,coach_questions:['What matters most?'],confidence:.9,caveats:[]}:{agent:role,insights:role==='cashflow'?[{id:'cashflow-one',text:'Your annual surplus merits review.',evidence:['calc:surplus'],topic:'surplus',position:'attention'}]:[],assumptions:[],missing_information:[],confidence:.9,escalation:null}};}}}));
vi.mock('convex/server',async original=>({...await original<typeof import('convex/server')>(),getServiceToken:async()=>{throw Error('Offline');}}));
const modules=import.meta.glob('../convex/**/*.{ts,js}');
afterEach(()=>{calls.length=0;provider.fail=false;vi.unstubAllEnvs();});
test('authenticated full review invokes eight specialists then CFO and saves private evidence (mock model)',async()=>{
 vi.stubEnv('OPENAI_API_KEY','test-placeholder');const t=convexTest(schema,modules);const userId=await t.run(ctx=>ctx.db.insert('users',{name:'Synthetic user'}));const user=t.withIdentity({subject:userId+'|session'});
 await user.mutation(api.huddles.save,{content:{concern:'Clarity',facts:[],goal:null,action:null,map:goldenCases[8].map},expectedRevision:0});
 const result=JSON.parse(await user.action(api.intelligence.review,{intent:'Understand my financial picture',full:true}));
 expect(calls).toHaveLength(9);expect(calls.at(-1)).toBe('cfo');expect(result.cfo.insights).toHaveLength(1);expect(result.verified.calculations.find((c:any)=>c.key==='surplus').value).toBe(600000);
 expect((await user.query(api.intelligence.latest,{}))?.report).toBe(JSON.stringify(result));expect((await user.query(api.huddles.current,{}))?.revision).toBe(1);
});

test.each(['missing connection','provider failure'])('%s leaves the saved MAP intact and saves no partial review',async mode=>{
 vi.stubEnv('OPENAI_API_KEY',mode==='provider failure'?'test-placeholder':'');provider.fail=mode==='provider failure';
 const t=convexTest(schema,modules);const userId=await t.run(ctx=>ctx.db.insert('users',{name:'Synthetic outage user'}));const user=t.withIdentity({subject:userId+'|session'});
 await user.mutation(api.huddles.save,{content:{concern:'Clarity',facts:[],goal:null,action:null,map:goldenCases[8].map},expectedRevision:0});
 const before=await user.query(api.huddles.current,{});
 await expect(user.action(api.intelligence.review,{intent:'Understand my financial picture',full:true})).rejects.toThrow(mode==='provider failure'?'could not be completed safely':'not connected');
 expect(await user.query(api.huddles.current,{})).toEqual(before);expect(await user.query(api.intelligence.latest,{})).toBeNull();
});

test('authenticated evaluator uses the real eight-specialist and CFO backend path (provider mocked only in this test)',async()=>{
 vi.stubEnv('EVALUATOR_ACCESS_ENABLED','1');vi.stubEnv('EVALUATOR_ACCESS_UNTIL',new Date(Date.now()+86400000).toISOString());vi.stubEnv('OPENAI_API_KEY','test-placeholder');
 const {enrollEvaluator}=await import('../convex/evaluator');const t=convexTest(schema,modules);
 const id=await t.run(ctx=>ctx.db.insert('users',{isAnonymous:true}));await t.run(ctx=>enrollEvaluator(ctx,id));const user=t.withIdentity({subject:id+'|evaluator-session'});
 await user.mutation(api.huddles.save,{content:{concern:'Evaluator clarity',facts:[],goal:null,action:null,map:goldenCases[8].map},expectedRevision:0});
 const result=JSON.parse(await user.action(api.intelligence.review,{intent:'Understand my financial picture',full:true}));
 expect(calls).toHaveLength(9);expect(result.invoked).toHaveLength(8);expect(result.verified.failed).toEqual([]);expect(result.verified.calculations.find((x:any)=>x.key==='surplus').value).toBe(600000);
 expect(result.test_mode).toBeUndefined();expect(await t.query(api.intelligence.latest,{})).toBeNull();
});
