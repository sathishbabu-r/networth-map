import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import schema from '../convex/schema';
import coachPolicy from '../shared/coach-policy.json';
import {api} from '../convex/_generated/api';
import {emptyMap} from '../shared/map-engine';
const calls=vi.hoisted(()=>[] as unknown[]);
const responses=vi.hoisted(()=>[] as any[]);
vi.mock('@convex-dev/agent',()=>({Agent:class{async generateObject(_ctx:unknown,thread:{userId?:string},args:{system:string},options:unknown){if(!thread.userId)throw Error('Specify userId or threadId');calls.push({thread,options,system:args.system});return {object:responses.shift()??{text:'What would you like to achieve?',proposal:null}};}}}));
vi.mock('convex/server',async importOriginal=>({...await importOriginal<typeof import('convex/server')>(),getServiceToken:async()=>{throw Error('Gateway unavailable in test');}}));
const modules=import.meta.glob('../convex/**/*.{ts,js}');
afterEach(()=>{vi.unstubAllEnvs();calls.length=0;responses.length=0;});
test('coach passes the signed-in identity required by the agent and does not retain raw messages (mock provider)',async()=>{vi.stubEnv('OPENAI_API_KEY','test-only-placeholder');const t=convexTest(schema,modules);const id=await t.run(ctx=>ctx.db.insert('users',{name:'Coach pilot'}));const user=t.withIdentity({subject:id+'|session'});const result=await user.action(api.coach.reply,{messages:[{role:'user',content:'Cash is tight'}],today:'2026-10-03'});expect(result.error).toBeNull();expect(result.text).toBe('What would you like to achieve?');expect(calls).toHaveLength(1);expect(calls[0]).toMatchObject({thread:{userId:id},options:{storageOptions:{saveMessages:'none'}}});expect((calls[0] as {system:string}).system).toContain(coachPolicy.instructions);expect(await user.query(api.huddles.current,{})).toBeNull();});

test('an explicit dated commitment captured only in MAP draft actions becomes the active Huddle action and survives a new session',async()=>{
 vi.stubEnv('OPENAI_API_KEY','test-only-placeholder');const t=convexTest(schema,modules);const id=await t.run(ctx=>ctx.db.insert('users',{name:'Commitment pilot'}));const user=t.withIdentity({subject:id+'|first-session'});
 const map=emptyMap();map.data.grossPersonalIncome='2400000';map.data.proposedActions=[{id:'one',category:'increase-investing',description:'Review investment allocation',targetDate:'2026-10-10'}];
 const facts=[{key:'income',label:'Gross personal income',kind:'exact',amount:2400000,lower:null,upper:null,scope:'personal',period:'annual',currency:'INR',asOf:'2026',note:'User supplied annual income'}];
 const goal={text:'Understand my investments',targetDate:null},action={text:'Review investment allocation',dueDate:'2026-10-10'};
 responses.push({text:'Review your investment allocation by 10 October.',proposal:{concern:'Investing clarity',facts,goal:null,action:null,outcome:null,map}},{chosen:true,goalText:goal.text,goalTargetDate:null,actionText:action.text,dueDate:action.dueDate});
 const result=await user.action(api.coach.reply,{messages:[{role:'user',content:'My chosen goal is to understand my investments. I commit to review my investment allocation by 10 October 2026.'}],today:'2026-10-04'});
 expect(result.error).toBeNull();expect(result.proposal?.goal).toEqual(goal);expect(result.proposal?.action).toEqual(action);expect(result.proposal?.facts).toEqual(facts);
 await user.mutation(api.huddles.save,{content:result.proposal!,expectedRevision:result.revision});
 const returning=t.withIdentity({subject:id+'|new-session'});expect((await returning.query(api.huddles.current,{}))?.content.action).toEqual(action);
 expect(calls).toHaveLength(2);for(const call of calls)expect(call).toMatchObject({options:{storageOptions:{saveMessages:'none'}}});
});
test('a dated MAP idea is not silently selected as an active commitment',async()=>{
 vi.stubEnv('OPENAI_API_KEY','test-only-placeholder');const t=convexTest(schema,modules);const id=await t.run(ctx=>ctx.db.insert('users',{name:'Idea pilot'}));const user=t.withIdentity({subject:id+'|session'});
 const map=emptyMap();map.data.proposedActions=[{id:'one',category:'increase-investing',description:'Review investment allocation',targetDate:'2026-10-10'}];
 responses.push({text:'Would that action fit your goal?',proposal:{concern:'Considering options',facts:[],goal:null,action:null,outcome:null,map}},{chosen:false,goalText:"",goalTargetDate:null,actionText:"",dueDate:""});
 const result=await user.action(api.coach.reply,{messages:[{role:'user',content:'I might review my investments by 10 October, but I have not chosen an action.'}],today:'2026-10-04'});
 expect(result.error).toBeNull();expect(result.proposal?.action).toBeNull();expect(result.proposal?.goal).toBeNull();
});

test('an explicitly chosen replacement action does not inherit the previous financial outcome',async()=>{
 vi.stubEnv('OPENAI_API_KEY','test-only-placeholder');const t=convexTest(schema,modules);const id=await t.run(ctx=>ctx.db.insert('users',{name:'Returning pilot'}));const user=t.withIdentity({subject:id+'|session'});
 const oldAction={text:'Call a customer',dueDate:'2026-10-03'},newAction={text:'Review my cash forecast',dueDate:'2026-10-10'};
 const facts=[{key:'available_cash',label:'Available cash',kind:'exact',amount:500000,lower:null,upper:null,scope:'business',period:'point_in_time',currency:'INR',asOf:'2026-10-04',note:'Current accessible cash'}];
 const map=emptyMap(),goal={text:'Improve cash clarity',targetDate:null},outcome={actionStatus:'completed',text:'The customer paid',amount:100000,impactType:'receivables_collection',occurredOn:'2026-10-03'};
 const old={concern:'Cash clarity',facts,goal,action:oldAction,outcome,map};await user.mutation(api.huddles.save,{content:old as any,expectedRevision:0});
 const updatedMap={...map,data:{...map.data,proposedActions:[{id:'next',category:'other',description:newAction.text,targetDate:newAction.dueDate}]}};
 responses.push({text:'Your next action is reviewing the forecast.',proposal:{...old,map:updatedMap}},{chosen:true,goalText:goal.text,goalTargetDate:null,actionText:newAction.text,dueDate:newAction.dueDate});
 const result=await user.action(api.coach.reply,{messages:[{role:'user',content:'My next chosen action is to review my cash forecast by 10 October 2026. I commit to that.'}],today:'2026-10-04'});
 expect(result.error).toBeNull();expect(result.proposal?.action).toEqual(newAction);expect(result.proposal?.outcome).toBeNull();expect(result.proposal?.facts).toEqual(facts);
});

test('an active dated action uses the supplied MAP snapshot when the AI omitted duplicate issue facts',async()=>{
 vi.stubEnv('OPENAI_API_KEY','test-only-placeholder');const t=convexTest(schema,modules);const id=await t.run(ctx=>ctx.db.insert('users',{name:'Snapshot pilot'}));const user=t.withIdentity({subject:id+'|session'});
 const map=emptyMap();map.data.grossPersonalIncome='2400000';map.data.proposedActions=[{id:'one',category:'increase-investing',description:'Review allocation',targetDate:'2026-10-10'}];
 const goal={text:'Understand my investments',targetDate:null},action={text:'Review allocation',dueDate:'2026-10-10'};
 const facts=[{key:'income',label:'Gross personal income',kind:'exact',amount:2400000,lower:null,upper:null,scope:'personal',period:'annual',currency:'INR',asOf:'',note:'User supplied annual income'}];
 responses.push({text:'Review allocation by 10 October.',proposal:{concern:'Investment clarity',facts:[],goal,action,outcome:null,map}},{chosen:true,goalText:goal.text,goalTargetDate:null,actionText:action.text,dueDate:action.dueDate});
 const result=await user.action(api.coach.reply,{messages:[{role:'user',content:'My gross income is 24 lakh annually. My goal is understanding my investments and I commit to review allocation by 10 October 2026.'}],today:'2026-10-04'});
 expect(result.error).toBeNull();expect(result.proposal?.action).toEqual(action);expect(result.proposal?.facts[0].amount).toBe(2400000);expect(result.proposal?.map?.data.grossPersonalIncome).toBe('2400000');
});
