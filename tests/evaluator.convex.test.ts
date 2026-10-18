import {test,expect,vi,afterEach,beforeEach} from 'vitest';
import {convexTest} from 'convex-test';
import {generateKeyPair,exportPKCS8} from 'jose';
import {decodeJwt} from 'jose';
import schema from '../convex/schema';
import {api,internal} from '../convex/_generated/api';
import {enrollEvaluator,EVALUATOR_SESSION_MS} from '../convex/evaluator';
import {emptyMap} from '../shared/map-engine';
const modules=import.meta.glob('../convex/**/*.{ts,js}');
const content=()=>({concern:'Evaluator financial clarity',facts:[],goal:null,action:null,outcome:null,map:emptyMap()});
beforeEach(()=>{vi.stubEnv('EVALUATOR_ACCESS_ENABLED','1');vi.stubEnv('EVALUATOR_ACCESS_UNTIL',new Date(Date.now()+86400000).toISOString());});
afterEach(()=>{vi.unstubAllEnvs();vi.useRealTimers();});
async function setup(){
 const t=convexTest(schema,modules);
 const [a,b,privateId]=await t.run(async ctx=>[await ctx.db.insert('users',{isAnonymous:true}),await ctx.db.insert('users',{isAnonymous:true}),await ctx.db.insert('users',{name:'Private Google account'})]);
 await t.run(ctx=>enrollEvaluator(ctx,a));await t.run(ctx=>enrollEvaluator(ctx,b));
 return {t,aId:a,bId:b,privateId,a:t.withIdentity({subject:a+'|a-session'}),b:t.withIdentity({subject:b+'|b-session'}),privateUser:t.withIdentity({subject:privateId+'|google-session'})};
}
test('real evaluator auth issues a unique signed session without Google; disabled access fails closed',async()=>{
 const {privateKey}=await generateKeyPair('RS256',{extractable:true});vi.stubEnv('JWT_PRIVATE_KEY',await exportPKCS8(privateKey));vi.stubEnv('CONVEX_SITE_URL','https://test-auth.convex.site');
 const t=convexTest(schema,modules);
 const first=await t.action(api.auth.signIn,{provider:'evaluator',params:{}});
 const second=await t.action(api.auth.signIn,{provider:'evaluator',params:{}});
 expect(first.tokens?.token).toBeTruthy();expect(second.tokens?.token).toBeTruthy();
 const firstClaims=decodeJwt(first.tokens!.token),secondClaims=decodeJwt(second.tokens!.token);
 expect(firstClaims.sub).not.toBe(secondClaims.sub);
 const userId=firstClaims.sub!.split('|')[0] as any;
 const user=t.withIdentity({subject:firstClaims.sub!});
 const status=await user.query(api.evaluator.session,{});expect(status.kind).toBe('evaluator');expect(status.expiresAt).toBeLessThanOrEqual(Date.now()+EVALUATOR_SESSION_MS);
 await user.mutation(api.huddles.save,{content:content(),expectedRevision:0});
 expect((await t.run(ctx=>ctx.db.get(userId)))?.isAnonymous).toBe(true);
 vi.stubEnv('EVALUATOR_ACCESS_ENABLED','0');
 await expect(t.action(api.auth.signIn,{provider:'evaluator',params:{}})).rejects.toThrow(/unavailable/);
 expect(await user.query(api.huddles.current,{})).toBeNull();
});
test('evaluator sessions cannot read, overwrite, export or delete another evaluator or private account',async()=>{
 const {t,a,b,privateUser}=await setup();
 const privateContent={...content(),concern:'Private financial records'};
 await privateUser.mutation(api.huddles.save,{content:privateContent,expectedRevision:0});
 await a.mutation(api.huddles.save,{content:content(),expectedRevision:0});
 expect(await b.query(api.huddles.current,{})).toBeNull();
 expect(await t.query(api.huddles.current,{})).toBeNull();
 await expect(t.mutation(api.huddles.save,{content:content(),expectedRevision:0})).rejects.toThrow(/Sign in/);
 await expect(t.action(api.intelligence.review,{intent:'Review',full:true})).rejects.toThrow(/Sign in/);
 const coach=await t.action(api.coach.reply,{messages:[{role:'user',content:'Read private financial information'}],today:'2026-10-10'});expect(coach.error).toMatch(/Sign in/);
 await b.mutation(api.huddles.remove,{});
 expect((await privateUser.query(api.huddles.current,{}))?.content).toEqual(privateContent);
 expect((await a.query(api.huddles.current,{}))?.revision).toBe(1);
 expect((await b.query(api.intelligence.exportRows,{paginationOpts:{numItems:10,cursor:null}})).page).toEqual([]);
 await expect(a.action(api.intelligence.baseline,{intent:'Bypass evaluation limits'})).rejects.toThrow(/Google Login/);
});
test('expiry denies saving and AI, deletes only disposable financial records, and leaves private accounts intact',async()=>{
 vi.useFakeTimers();const {t,a,privateUser,aId,privateId}=await setup();
 await a.mutation(api.huddles.save,{content:content(),expectedRevision:0});await privateUser.mutation(api.huddles.save,{content:{...content(),concern:'Private'},expectedRevision:0});
 vi.advanceTimersByTime(EVALUATOR_SESSION_MS+1);
 expect((await a.query(api.evaluator.session,{})).kind).toBe('expired');expect(await a.query(api.huddles.current,{})).toBeNull();
 await expect(a.mutation(api.huddles.save,{content:content(),expectedRevision:1})).rejects.toThrow(/Sign in/);
 await expect(a.action(api.intelligence.review,{intent:'Review',full:true})).rejects.toThrow(/Sign in/);
 await t.mutation(internal.evaluator.cleanup,{userId:privateId});expect((await privateUser.query(api.huddles.current,{}))?.content.concern).toBe('Private');
 await t.mutation(internal.evaluator.cleanup,{userId:aId});expect(await t.run(ctx=>ctx.db.get(aId))).toBeNull();expect((await privateUser.query(api.huddles.current,{}))?.revision).toBe(1);
});
test('server enforces admission, save and AI budgets atomically; Google accounts bypass evaluator limits',async()=>{
 const {t,a,privateUser}=await setup();
 await a.mutation(internal.evaluator.reserve,{operation:'review'});
 await expect(a.mutation(internal.evaluator.reserve,{operation:'review'})).rejects.toThrow(/limit/);
 await expect(a.mutation(internal.evaluator.reserve,{operation:'speech'})).rejects.toThrow(/limit/);
 for(let n=0;n<21;n++)await privateUser.mutation(internal.evaluator.reserve,{operation:'coach'});
 for(let n=0;n<20;n++)await a.mutation(api.huddles.save,{content:content(),expectedRevision:n});
 await expect(a.mutation(api.huddles.save,{content:content(),expectedRevision:20})).rejects.toThrow(/limit/);
 const c=await t.run(ctx=>ctx.db.insert('users',{isAnonymous:true}));await t.run(ctx=>enrollEvaluator(ctx,c));
 const d=await t.run(ctx=>ctx.db.insert('users',{isAnonymous:true}));await expect(t.run(ctx=>enrollEvaluator(ctx,d))).rejects.toThrow(/limit/);
 const unregistered=t.withIdentity({subject:d+'|unregistered'});expect(await unregistered.query(api.huddles.current,{})).toBeNull();
 await expect(unregistered.mutation(api.huddles.save,{content:content(),expectedRevision:0})).rejects.toThrow(/Sign in/);
});

test('lifetime AI caps and temporary activation deadline cannot be bypassed by waiting for minute limits',async()=>{
 vi.useFakeTimers();const {a,t}=await setup();
 for(let n=0;n<15;n++){await a.mutation(internal.evaluator.reserve,{operation:'coach'});vi.advanceTimersByTime(60001);}
 await expect(a.mutation(internal.evaluator.reserve,{operation:'coach'})).rejects.toThrow(/limit/);
 await a.mutation(internal.evaluator.reserve,{operation:'review'});vi.advanceTimersByTime(60001);await a.mutation(internal.evaluator.reserve,{operation:'review'});vi.advanceTimersByTime(60001);
 await expect(a.mutation(internal.evaluator.reserve,{operation:'review'})).rejects.toThrow(/limit/);
 vi.stubEnv('EVALUATOR_ACCESS_UNTIL',new Date(Date.now()+30*86400000).toISOString());expect((await t.query(api.evaluator.session,{})).enabled).toBe(false);
 vi.stubEnv('EVALUATOR_ACCESS_UNTIL','');expect((await t.query(api.evaluator.session,{})).enabled).toBe(false);
});
