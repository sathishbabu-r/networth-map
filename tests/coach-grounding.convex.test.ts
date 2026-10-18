import capturedReply from './fixtures/coach-live-surplus-reply.json';
import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import schema from '../convex/schema';
import {api} from '../convex/_generated/api';
import {emptyMap} from '../shared/map-engine';
import {FINANCIAL_POLICY_VERSION} from '../shared/financial-status';
const provider=vi.hoisted(()=>({responses:[] as any[],systems:[] as string[],schemas:[] as any[],during:null as null|(()=>Promise<void>)}));
vi.mock('@convex-dev/agent',()=>({Agent:class{async generateObject(_ctx:unknown,_thread:unknown,args:{system:string;schema:unknown}){
 provider.systems.push(args.system);provider.schemas.push(args.schema);if(provider.during){const callback=provider.during;provider.during=null;await callback();}
 return {object:provider.responses.shift()};
}}}));
vi.mock('convex/server',async original=>({...await original<typeof import('convex/server')>(),getServiceToken:async()=>{throw Error('Mock gateway');}}));
const modules=import.meta.glob('../convex/**/*.{ts,js}');
afterEach(()=>{vi.unstubAllEnvs();provider.responses=[];provider.systems=[];provider.schemas=[];provider.during=null;});
async function setup(){
 vi.stubEnv('OPENAI_API_KEY','test-only-placeholder');const t=convexTest(schema,modules);
 const id=await t.run(ctx=>ctx.db.insert('users',{name:'Synthetic Asha Vale P01 regression'}));const user=t.withIdentity({subject:id+'|session'});
 const map=emptyMap();map.covered=['earn','own','owe','spend','invest'];map.step=10;
 Object.assign(map.data,{userType:'salaried',grossPersonalIncome:'1200000',effectiveTaxRate:'10',monthlyNeeds:'30000',monthlyWants:'10000',annualInvesting:'120000'});
 map.data.assets=[{id:'savings',category:'cash',description:'Savings',value:'5000000',annualNetIncome:'0',purpose:'personal'}];
 map.data.liabilities=[{id:'loan',type:'personal',classification:'personal',description:'Synthetic loan 1',value:'1000000',interestRate:'10',annualRepayment:'12000',repaymentIncludedInNeeds:false}];
 const content={concern:'Synthetic P01',map,facts:[],goal:null,action:null,outcome:null};
 await user.mutation(api.huddles.save,{content,expectedRevision:0});return {t,user,content,id};
}
const request={messages:[{role:'user' as const,content:'Explain my net worth using my saved assets and liabilities, and distinguish my annual income from monthly spending. Do not change figures or choose an action. This is fictional P01 testing.'}],today:'2026-10-10'};
test('actual Coach action rejects the live ₹720,000 reply and an unconfirmed proposal cannot authorize it',async()=>{
 const {user,content}=await setup();const before=await user.query(api.huddles.current,{});const original=JSON.stringify(request);
 provider.responses.push({text:'This means you have a surplus of ₹720,000 annually after accounting for your spending.',proposal:{...content,map:{...content.map,data:{...content.map.data,effectiveTaxRate:'0',liabilities:[{...content.map.data.liabilities[0],annualRepayment:'0'}]}}},inferred_fields:[]});
 const r=await user.action(api.coach.reply,request);
 expect(r.error).toContain('could not be verified');expect(r.text).toBe('');expect(r.proposal).toBeNull();
 expect(await user.query(api.huddles.current,{})).toEqual(before);expect(JSON.stringify(request)).toBe(original);
 expect(provider.systems[0]).toContain('"metric":"surplus","value":588000');
 expect(provider.systems[0]).toContain('"period":"annual","currency":"INR","revision":1');
});
test('verified facts and reflective coaching work together without a forced action or saving',async()=>{
 const {user}=await setup();const before=await user.query(api.huddles.current,{});
 provider.responses.push({text:'{{financial:1:map.networth}}\n{{financial:1:map.surplus}}\nWhat matters most to you about this?',proposal:null,inferred_fields:null});
 const r=await user.action(api.coach.reply,request);
 expect(r.error).toBeNull();expect(r.text).toContain('Net worth: ₹40,00,000 (INR).');expect(r.text).toContain('Annual surplus after loan repayment, before investing: ₹5,88,000 (INR).');expect(r.text).toContain('What matters most');expect(r.proposal).toBeNull();expect(r.revision).toBe(1);
 expect(await user.query(api.huddles.current,{})).toEqual(before);
});
test('a reply based on an older MAP is rejected even when its old amount was supported',async()=>{
 const {user,content}=await setup();provider.responses.push({text:'{{financial:1:map.surplus}}',proposal:null,inferred_fields:null});
 const updated={...content,map:{...content.map,data:{...content.map.data,monthlyWants:'20000'}}};
 provider.during=async()=>{await user.mutation(api.huddles.save,{content:updated,expectedRevision:1});};
 const r=await user.action(api.coach.reply,request);expect(r.error).toContain('MAP changed');expect(r.text).toBe('');expect(r.proposal).toBeNull();
 expect((await user.query(api.huddles.current,{}))?.content.map?.data.monthlyWants).toBe('20000');
});
test.each(['Your monthly surplus is ₹5,88,000.','Your surplus is ₹12,00,000.','Your surplus is 10%.','{{financial:0:map.surplus}}','Your surplus is {{financial:1:input.grossPersonalIncome}}'])('action rejects mismatched number or source: %s',async text=>{
 const {user}=await setup();provider.responses.push({text,proposal:null,inferred_fields:null});const r=await user.action(api.coach.reply,request);expect(r.error).toContain('could not be verified');expect(r.proposal).toBeNull();
});
test('CFO prose cannot authorize a number that disagrees with saved calculations',async()=>{
 const {t,user,id}=await setup();
 const report=JSON.stringify({data_policy_version:FINANCIAL_POLICY_VERSION,cfo:{story:'Your annual surplus is ₹720,000.'},intervention_options:[],verified:{state:'RECONCILED',missing:[],risk:'low'}});
 await t.run(ctx=>ctx.db.insert('financialReviews',{userId:id,revision:1,createdAt:Date.now(),report}));
 provider.responses.push({text:'Your annual surplus is ₹720,000.',proposal:null,inferred_fields:null});
 const r=await user.action(api.coach.reply,request);expect(r.error).toContain('could not be verified');
 expect(provider.systems[0]).toContain('Your annual surplus is ₹720,000.');expect(provider.systems[0]).toContain('"metric":"surplus","value":588000');
 expect((await user.query(api.intelligence.latest,{}))?.report).toBe(report);
});
test('expired or revoked evaluator access during generation cannot release financial facts',async()=>{
 vi.stubEnv('OPENAI_API_KEY','test-only-placeholder');vi.stubEnv('EVALUATOR_ACCESS_ENABLED','1');vi.stubEnv('EVALUATOR_ACCESS_UNTIL',new Date(Date.now()+86400000).toISOString());
 const {enrollEvaluator}=await import('../convex/evaluator');const t=convexTest(schema,modules);
 const id=await t.run(ctx=>ctx.db.insert('users',{isAnonymous:true}));await t.run(ctx=>enrollEvaluator(ctx,id));
 const user=t.withIdentity({subject:id+'|synthetic-evaluator'});
 provider.responses.push({text:'What would you like to understand?',proposal:null,inferred_fields:null});
 provider.during=async()=>{await t.run(async ctx=>{const session=await ctx.db.query('evaluatorSessions').withIndex('by_user',q=>q.eq('userId',id)).unique();await ctx.db.patch(session!._id,{revoked:true});});};
 const r=await user.action(api.coach.reply,request);expect(r.text).toBe('');expect(r.proposal).toBeNull();expect(r.error).toContain('session ended');
});
async function exactCompletedMap(){
 const {user,content}=await setup();Object.assign(content.map.data,{grossPersonalIncome:'2400000',effectiveTaxRate:'20',monthlyNeeds:'60000',monthlyWants:'30000',annualInvesting:'240000'});content.map.data.liabilities[0].annualRepayment='300000';
 await user.mutation(api.huddles.save,{content,expectedRevision:1});return user;
}
test('exact completed /try MAP: correct annual surplus ₹5,40,000 and cash after investing ₹3,00,000 pass the Coach action',async()=>{
 const user=await exactCompletedMap();const before=await user.query(api.huddles.current,{});
 const text='Your annual surplus after repayment is ₹5,40,000. Your annual cash after investing is ₹3,00,000. Which of your top 3 actions would you choose this week?';
 provider.responses.push({text,proposal:null,inferred_fields:null});const r=await user.action(api.coach.reply,{...request,messages:[{role:'user',content:'Explain my annual surplus after loan repayment and annual cash after investing.'}]});
 expect(r.error).toBeNull();expect(r.text.startsWith(text)).toBe(true);expect(r.revision).toBe(2);expect(r.proposal).toBeNull();expect(await user.query(api.huddles.current,{})).toEqual(before);
});
test('exact completed /try MAP: wrong annual surplus ₹7,20,000 is blocked and saved MAP is preserved',async()=>{
 const user=await exactCompletedMap();const before=await user.query(api.huddles.current,{});
 provider.responses.push({text:'Your annual surplus after repayment is ₹7,20,000.',proposal:null,inferred_fields:null});const r=await user.action(api.coach.reply,request);
 expect(r.error).toContain('could not be verified');expect(r.text).toBe('');expect(r.proposal).toBeNull();expect(await user.query(api.huddles.current,{})).toEqual(before);
});

test('server diagnostic excludes private figures and records only safe rejection metadata',async()=>{
 const {user}=await setup();const log=vi.spyOn(console,'warn').mockImplementation(()=>{});
 try {
 provider.responses.push({text:'Private name and email should never reach logs. Your annual surplus is ₹7,20,000.',proposal:null,inferred_fields:null});
 const r=await user.action(api.coach.reply,request);expect(r.error).toContain('could not be verified');
 const event=log.mock.calls.find(c=>c[0]==='Huddle coach figure rejection');expect(event).toBeTruthy();
 const detail=JSON.parse(event![1]);expect(detail).toEqual({phase:'financial_validation',metric:'surplus',period:'annual',reason:'amount_mismatch',revision:1,hasSavedSnapshot:true,proposalPresent:false});
 expect(event![1]).not.toMatch(/Private name|email|Synthetic Asha|Savings|users|token|720|588|7,20/);
 }finally{log.mockRestore();}
});
const topThreeRequest={...request,messages:[{role:'user' as const,content:'Which of my top 3 actions should I start with this week?'}]};
test('Coach uses the exact saved Top 3 order and allows only a saved starting item',async()=>{
 const {user,content}=await setup();
 content.map.data.proposedActions=[{id:'cash-buffer',category:'increase-liquidity',description:'Check my emergency cash',targetDate:''},{id:'budget',category:'reduce-spending',description:'Review optional spending',targetDate:''},{id:'income',category:'change-income',description:'Explore income stability',targetDate:''}];
 await user.mutation(api.huddles.save,{content,expectedRevision:1});const before=await user.query(api.huddles.current,{});
 provider.responses.push({revision:2,startingId:'action-budget'});const r=await user.action(api.coach.reply,topThreeRequest);
 expect(r.error).toBeNull();expect(r.text.indexOf('Check my emergency cash')).toBeLessThan(r.text.indexOf('Review optional spending'));expect(r.text.indexOf('Review optional spending')).toBeLessThan(r.text.indexOf('Explore income stability'));
 expect(r.text).toContain('A starting point to consider is action 2');expect(r.text).toContain('The choice remains yours');expect(r.text).toContain('Cost reductions should protect essential commitments');expect(r.proposal).toBeNull();expect(r.requiresConfirmation).toBe(false);
 expect(provider.systems[0]).toContain('"revision":2,"actions":[{"id":"action-cash-buffer"');expect(provider.systems[0]).toContain('"observation":');expect(await user.query(api.huddles.current,{})).toEqual(before);
});
test.each([{revision:0,startingId:null},{revision:1,startingId:'invented'},{revision:1,startingId:null,text:'Your surplus is ₹7,20,000.'}])('Coach rejects stale, invented or extra generated action prose: %j',async selection=>{
 const {user}=await setup();provider.responses.push(selection);const r=await user.action(api.coach.reply,topThreeRequest);expect(r.error).toContain('action choice could not be verified');expect(r.text).toBe('');expect(r.proposal).toBeNull();
});
test('incomplete MAP yields clarification rather than invented Top 3',async()=>{
 const {user,content}=await setup();content.map=emptyMap();await user.mutation(api.huddles.save,{content,expectedRevision:1});provider.responses.push({revision:2,startingId:null});
 const r=await user.action(api.coach.reply,topThreeRequest);expect(r.error).toBeNull();expect(r.text).toContain('no Top 3 actions');expect(r.proposal).toBeNull();
});
test('saved actions changing during generation invalidate the selected starting action',async()=>{
 const {user,content}=await setup();provider.responses.push({revision:1,startingId:null});provider.during=async()=>{await user.mutation(api.huddles.save,{content:{...content,map:{...content.map,data:{...content.map.data,proposedActions:[{id:'new',category:'reduce-spending',description:'Changed saved action',targetDate:''}]}}},expectedRevision:1});};
 const r=await user.action(api.coach.reply,topThreeRequest);expect(r.error).toContain('MAP changed');expect(r.text).toBe('');
});

test('Top 3 selection schema is valid for the actual strict OpenAI adapter without network access',async()=>{
 const {user}=await setup();provider.responses.push({revision:1,startingId:null});await user.action(api.coach.reply,topThreeRequest);
 const {generateObject}=await import('ai');const {createOpenAI}=await import('@ai-sdk/openai');let wire:any;
 const model=createOpenAI({apiKey:'synthetic',fetch:async(_url,init)=>{
  wire=JSON.parse(init!.body as string);return new Response(JSON.stringify({error:{message:'Capture only',type:'invalid_request_error',code:'capture_only'}}),{status:400,headers:{'content-type':'application/json'}});
 }})('gpt-4o-mini');
 await expect(generateObject({model,schema:provider.schemas[0],prompt:'Schema check only',maxRetries:0})).rejects.toThrow();
 expect(wire.text.format.strict).toBe(true);expect(wire.text.format.schema.additionalProperties).toBe(false);
 expect(wire.text.format.schema.required.sort()).toEqual(['revision','startingId']);
});

test('captured deployed Business Owners reply still rejects its genuine double-repayment error',async()=>{
 const user=await exactCompletedMap();const saved=await user.query(api.huddles.current,{});saved!.content.map!.data.userType='business-owner';saved!.content.map!.data.assets[0].purpose='investment';await user.mutation(api.huddles.save,{content:saved!.content,expectedRevision:2});const before=await user.query(api.huddles.current,{});
 provider.responses.push({text:capturedReply.reply,proposal:null,inferred_fields:null});const r=await user.action(api.coach.reply,{...request,messages:[{role:'user',content:capturedReply.question}]});
 expect(r.error).toContain('could not be verified');expect(r.text).toBe('');expect(await user.query(api.huddles.current,{})).toEqual(before);
 expect(provider.systems[0]).toContain('map.surplus ALREADY includes loan repayments exactly once');
 expect(provider.systems[0]).toContain('Annual surplus after loan repayment, before investing');
});
test('exact live Business Owners MAP accepts correctly labelled real-world before/after wording',async()=>{
 const user=await exactCompletedMap();const saved=await user.query(api.huddles.current,{});saved!.content.map!.data.userType='business-owner';saved!.content.map!.data.assets[0].purpose='investment';await user.mutation(api.huddles.save,{content:saved!.content,expectedRevision:2});
 const text='Your annual surplus before investing is ₹5,40,000. After investing, your annual surplus is ₹3,00,000.';provider.responses.push({text,proposal:null,inferred_fields:null});const r=await user.action(api.coach.reply,{...request,messages:[{role:'user',content:capturedReply.question}]});expect(r.error).toBeNull();expect(r.text.startsWith(text)).toBe(true);
});

test('new user numeric input is an unconfirmed draft, not a claim against an existing saved MAP',async()=>{
 vi.stubEnv('OPENAI_API_KEY','test-only-placeholder');const t=convexTest(schema,modules);const id=await t.run(ctx=>ctx.db.insert('users',{}));const user=t.withIdentity({subject:id+'|session'});const map=emptyMap();map.data.grossPersonalIncome='1200000';map.covered=['earn'];
 provider.responses.push({text:'Your annual income is ₹12,00,000. What are your monthly expenses?',proposal:{concern:'Income clarity',facts:[],map,goal:null,action:null,outcome:null},inferred_fields:[]});
 const r=await user.action(api.coach.reply,{today:'2026-10-18',messages:[{role:'user',content:'My annual income is ₹12,00,000.'}]});
 expect(r.error).toBeNull();expect(r.requiresConfirmation).toBe(true);expect(r.proposal?.map?.data.grossPersonalIncome).toBe('1200000');expect(r.text).toMatch(/review/i);expect(await user.query(api.huddles.current,{})).toBeNull();
});

test.each([
 ['My annual income is ₹12,00,000.','Your annual income is ₹12,00,000.','1200000',[]],
 ['My annual income is approximately ₹12,00,000.','Your annual income is ₹12,00,000.','1200000',['grossPersonalIncome']],
 ['My annual income is ₹0.','Your annual income is ₹0.','0',[]],
])('new onboarding keeps explicitly reported raw inputs unconfirmed: %s',async(answer,text,income,estimates)=>{
 vi.stubEnv('OPENAI_API_KEY','test-only-placeholder');const t=convexTest(schema,modules);
 const id=await t.run(ctx=>ctx.db.insert('users',{}));const user=t.withIdentity({subject:id+'|session'});
 const map=emptyMap();map.data.grossPersonalIncome=income;map.estimates=estimates;
 provider.responses.push({text,proposal:{concern:'Synthetic onboarding',facts:[],map,goal:null,action:null,outcome:null},inferred_fields:[]});
 const r=await user.action(api.coach.reply,{today:'2026-10-18',messages:[{role:'user',content:answer}]});
 expect(r.error).toBeNull();expect(r.requiresConfirmation).toBe(true);expect(r.text).not.toMatch(/₹|12,00,000/);
 expect(r.proposal?.map?.data.grossPersonalIncome).toBe(income);expect(r.proposal?.map?.estimates).toEqual(estimates);
 expect(await user.query(api.huddles.current,{})).toBeNull();
});

test.each([
 ['My annual income is ₹12,00,000.','Your annual income is ₹24,00,000.'],
 ['My annual income is ₹12,00,000.','Your monthly income is ₹12,00,000.'],
 ['My annual income is ₹12,00,000.','Your annual income is -₹12,00,000.'],
 ['My annual income is ₹12,00,000.','Your annual income is $12,00,000.'],
])('pending draft does not authorize mismatched AI figures: %s %s',async(answer,text)=>{
 vi.stubEnv('OPENAI_API_KEY','test-only-placeholder');const t=convexTest(schema,modules);
 const id=await t.run(ctx=>ctx.db.insert('users',{}));const user=t.withIdentity({subject:id+'|session'});
 const map=emptyMap();map.data.grossPersonalIncome='1200000';
 provider.responses.push({text,proposal:{concern:'Synthetic onboarding',facts:[],map,goal:null,action:null,outcome:null},inferred_fields:[]});
 const r=await user.action(api.coach.reply,{today:'2026-10-18',messages:[{role:'user',content:answer}]});
 expect(r.error).toContain('could not be verified');expect(r.proposal).toBeNull();expect(await user.query(api.huddles.current,{})).toBeNull();
});

test('invalid AI response shape produces an actionable retry without modifying records',async()=>{
 const {user}=await setup();const before=await user.query(api.huddles.current,{});
 provider.responses.push({text:42,proposal:null});
 const r=await user.action(api.coach.reply,request);expect(r.error).toContain('invalid draft');expect(r.error).toContain('retry');
 expect(await user.query(api.huddles.current,{})).toEqual(before);
});
