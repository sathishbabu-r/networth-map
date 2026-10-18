import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import schema from '../convex/schema';
import coachPolicy from '../shared/coach-policy.json';
import {api} from '../convex/_generated/api';
import {emptyMap} from '../shared/map-engine';
const calls=vi.hoisted(()=>[] as unknown[]);
const responses=vi.hoisted(()=>[] as any[]);
vi.mock('@convex-dev/agent',()=>({Agent:class{async generateObject(_ctx:unknown,thread:{userId?:string},args:{system:string},options:unknown){if(!thread.userId)throw Error('Specify userId or threadId');calls.push({thread,options,system:args.system,schema:(args as any).schema});return {object:responses.shift()??{text:'What would you like to achieve?',proposal:null}};}}}));
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


import {generateObject} from 'ai';
import {providerFailure} from '../shared/provider-error.mjs';
import {createOpenAI} from '@ai-sdk/openai';
async function providerRequest(outputSchema:any){
 let body:any;
 const model=createOpenAI({apiKey:'synthetic-not-a-secret',fetch:async(_url,init)=>{
  body=JSON.parse(init!.body as string);
  // Capture the real SDK wire schema without simulating a successful AI response.
  return new Response(JSON.stringify({error:{message:'Transport capture only',type:'invalid_request_error',code:'capture_only'}}),{status:400,headers:{'content-type':'application/json'}});
 }})('gpt-4o-mini');
 await expect(generateObject({model,schema:outputSchema,prompt:'Synthetic schema validation only',maxRetries:0})).rejects.toThrow();
 expect(body.model).toBe('gpt-4o-mini');
 expect(body.text.format.strict).toBe(true);
 return body.text.format.schema;
}
function strictSchemaIssues(schema:any,path='$'):string[]{
 const issues:string[]=[];
 if(schema.type==='object'||(Array.isArray(schema.type)&&schema.type.includes('object'))){
  if(schema.additionalProperties!==false)issues.push(path+': open object');
  for(const key of Object.keys(schema.properties??{}))if(!(schema.required??[]).includes(key))issues.push(path+'.'+key+': missing required');
 }
 for(const [key,value] of Object.entries(schema.properties??{}))issues.push(...strictSchemaIssues(value,path+'.'+key));
 if(schema.items)issues.push(...strictSchemaIssues(schema.items,path+'[]'));
 for(const [key,value] of Object.entries(schema.$defs??schema.definitions??{}))issues.push(...strictSchemaIssues(value,path+'.definition.'+key));
 for(const keyword of ['anyOf','oneOf','allOf'])for(const [i,item] of (schema[keyword]??[]).entries())issues.push(...strictSchemaIssues(item,path+'.'+keyword+i));
 return issues;
}
test('actual Coach and commitment schemas produce strict-compatible OpenAI request bodies',async()=>{
 vi.stubEnv('OPENAI_API_KEY','test-only-placeholder');const t=convexTest(schema,modules);const id=await t.run(ctx=>ctx.db.insert('users',{name:'Synthetic schema test'}));const user=t.withIdentity({subject:id+'|session'});
 const map=emptyMap();map.data.proposedActions=[{id:'one',category:'other',description:'Review spending',targetDate:'2026-10-10'}];
 responses.push({text:'What matters most?',proposal:{map,concern:'Synthetic',facts:[],goal:null,action:null,outcome:null},inferred_fields:[]},{chosen:false,goalText:'',goalTargetDate:null,actionText:'',dueDate:''});
 await user.action(api.coach.reply,{messages:[{role:'user',content:'I might review spending.'}],today:'2026-10-08'});
 expect(calls).toHaveLength(2);
 for(const call of calls){
  const outputSchema=(call as any).schema;
  const wire=await providerRequest(outputSchema);
  expect(strictSchemaIssues(wire)).toEqual([]);
  if(wire.properties.inferred_fields){
   expect(outputSchema.safeParse({text:'Synthetic',proposal:null,inferred_fields:null}).success).toBe(true);
   expect(outputSchema.safeParse({text:'Synthetic',proposal:null,inferred_fields:Array(21).fill('income')}).success).toBe(false);
   expect(outputSchema.safeParse({text:'Synthetic',proposal:null,inferred_fields:[123]}).success).toBe(false);
   expect(outputSchema.safeParse({text:'x'.repeat(501),proposal:null,inferred_fields:null}).success).toBe(false);
  }
  // Opt-in genuine provider acceptance; no credentials or user data in test output.
  if(process.env.RUN_LIVE_COACH_SCHEMA==='1'){
   if(!process.env.OPENAI_API_KEY)throw Error('BLOCKED: OPENAI_API_KEY must be set in the shell for the live schema check.');
   const liveModel=createOpenAI({apiKey:process.env.OPENAI_API_KEY})('gpt-4o-mini');
   try{
    const result=await generateObject({model:liveModel,schema:outputSchema,
     prompt:wire.properties.inferred_fields?'Synthetic schema check only: reply text "Schema check passed", proposal null, inferred_fields null.':'Synthetic schema check only: chosen false, goalText empty, goalTargetDate null, actionText empty, dueDate empty.',
     maxRetries:0,maxOutputTokens:512,abortSignal:AbortSignal.timeout(15000)});
    expect(outputSchema.safeParse(result.object).success).toBe(true);
   }catch(error){
    // Avoid Vitest rendering raw provider requests, headers or error bodies.
    throw Error('Live provider check failed: '+JSON.stringify(providerFailure(error)));
   }
  }
 }
});
test.each([false,true])('Coach context distinguishes unknown debt from confirmed zero (no-debt confirmation: %s)',async noDebt=>{
 vi.stubEnv('OPENAI_API_KEY','test-only-placeholder');const t=convexTest(schema,modules);const id=await t.run(ctx=>ctx.db.insert('users',{name:'Synthetic data status'}));const user=t.withIdentity({subject:id+'|session'});
 const map=emptyMap();map.data.hasNoLiabilitiesConfirmed=noDebt;
 await user.mutation(api.huddles.save,{content:{concern:'Clarity',facts:[],goal:null,action:null,map},expectedRevision:0});
 const before=await user.query(api.huddles.current,{});
 responses.push({text:'What would you like to understand?',proposal:null,inferred_fields:null});
 await user.action(api.coach.reply,{messages:[{role:'user',content:'Help me understand my finances'}],today:'2026-10-10'});
 const system=(calls[0] as {system:string}).system;const section=system.split('MAP financial data status (data;')[1].split('\nMAP formula observations')[0];
 expect(section).toContain(noDebt?'"liabilities":{"status":"CONFIRMED_ZERO","value":0':'"liabilities":{"status":"UNKNOWN","value":null');
 expect(await user.query(api.huddles.current,{})).toEqual(before);
});
test('Coach replaces an unsupported no-debt conclusion with one missing-section question without writing records',async()=>{
 vi.stubEnv('OPENAI_API_KEY','test-only-placeholder');const t=convexTest(schema,modules);const id=await t.run(ctx=>ctx.db.insert('users',{name:'Synthetic missing debt'}));const user=t.withIdentity({subject:id+'|session'});
 responses.push({text:'You have no debt and your net worth is ₹0.',proposal:null,inferred_fields:null});
 const result=await user.action(api.coach.reply,{messages:[{role:'user',content:'Help with my MAP'}],today:'2026-10-10'});
 expect(result.error).toBeNull();expect(result.text).not.toContain('₹0');expect(result.text).toContain('complete');expect(result.proposal).toBeNull();expect(await user.query(api.huddles.current,{})).toBeNull();
});

test('authenticated evaluator uses the real Coach backend and cannot exceed its request limit (mock provider)',async()=>{
 vi.stubEnv('EVALUATOR_ACCESS_ENABLED','1');vi.stubEnv('EVALUATOR_ACCESS_UNTIL',new Date(Date.now()+86400000).toISOString());vi.stubEnv('OPENAI_API_KEY','test-only-placeholder');
 const {enrollEvaluator}=await import('../convex/evaluator');const t=convexTest(schema,modules);const id=await t.run(ctx=>ctx.db.insert('users',{isAnonymous:true}));await t.run(ctx=>enrollEvaluator(ctx,id));const user=t.withIdentity({subject:id+'|evaluator-session'});
 const args={messages:[{role:'user' as const,content:'What information is missing from my MAP?'}],today:'2026-10-10'};
 expect((await user.action(api.coach.reply,args)).error).toBeNull();expect(calls).toHaveLength(1);expect(calls[0]).toMatchObject({thread:{userId:id}});
 await user.action(api.coach.reply,args);await expect(user.action(api.coach.reply,args)).rejects.toThrow(/limit/);expect(calls).toHaveLength(2);
});

test('uncategorised Coach actions reopen as supported MAP actions without losing the commitment',async()=>{
 vi.stubEnv('OPENAI_API_KEY','test-only-placeholder');const t=convexTest(schema,modules);const id=await t.run(ctx=>ctx.db.insert('users',{name:'Synthetic category regression'}));const user=t.withIdentity({subject:id+'|session'});
 const map=emptyMap();map.data.proposedActions=[{id:'new',category:'',description:'Review emergency savings',targetDate:'2026-10-11'}];
 responses.push({text:'Review your chosen action.',proposal:{concern:'Clarity',facts:[{key:'cash',label:'Cash',kind:'exact',amount:100,lower:null,upper:null,scope:'personal',period:'point_in_time',currency:'INR',asOf:'',note:''}],goal:{text:'Clarity',targetDate:null},action:{text:'Review emergency savings',dueDate:'2026-10-11'},outcome:null,map}});
 const result=await user.action(api.coach.reply,{messages:[{role:'user',content:'I choose to review emergency savings by 2026-10-11.'}],today:'2026-10-10'});
 expect(result.error).toBeNull();expect(result.proposal?.map?.data.proposedActions[0].category).toBe('other');
});

test('high-impact questions include qualified-review guidance and reject unfinished replies',async()=>{
 vi.stubEnv('OPENAI_API_KEY','test-only-placeholder');const t=convexTest(schema,modules);const id=await t.run(ctx=>ctx.db.insert('users',{name:'Synthetic safety regression'}));const user=t.withIdentity({subject:id+'|session'});
 responses.push({text:'**Consider** your priorities. What matters most?',proposal:null});
 const result=await user.action(api.coach.reply,{messages:[{role:'user',content:'Should I sell my home to repay my mortgage?'}],today:'2026-10-10'});
 expect(result.text).toContain('qualified professional');expect(result.text).not.toContain('**');
 responses.push({text:'Completing these fields is,',proposal:null});
 const unfinished=await user.action(api.coach.reply,{messages:[{role:'user',content:'Which fields are missing?'}],today:'2026-10-10'});
 expect(unfinished.error).toContain('could not be verified');expect(unfinished.proposal).toBeNull();
});

import {specialistSchema} from '../shared/intelligence';
test('all eight specialists use a strict-compatible real SDK response schema',async()=>{
 const wire=await providerRequest(specialistSchema);
 expect(strictSchemaIssues(wire)).toEqual([]);
});
