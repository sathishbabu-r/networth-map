import {v,ConvexError} from 'convex/values';
import {getAuthUserId} from '@convex-dev/auth/server';
import {query,internalQuery,internalMutation,type QueryCtx,type MutationCtx,type ActionCtx} from './_generated/server';
import {internal} from './_generated/api';
import type {Id} from './_generated/dataModel';
export const EVALUATOR_SESSION_MS=4*60*60*1000;
export function evaluatorEnabled(now=Date.now()){
 const until=Date.parse(process.env.EVALUATOR_ACCESS_UNTIL??'');
 return process.env.EVALUATOR_ACCESS_ENABLED==='1'&&Number.isFinite(until)&&until>now&&until<=now+7*86400000;
}
export async function evaluatorRecord(ctx:QueryCtx|MutationCtx,userId:Id<'users'>){
 const user=await ctx.db.get(userId);
 if(!user)return {kind:'missing' as const};
 if(!user.isAnonymous)return {kind:'private' as const};
 const session=await ctx.db.query('evaluatorSessions').withIndex('by_user',q=>q.eq('userId',userId)).unique();
 return session&&evaluatorEnabled()&&session.expiresAt>Date.now()&&!session.revoked?{kind:'evaluator' as const,expiresAt:session.expiresAt}:{kind:'expired' as const};
}
export const access=internalQuery({args:{userId:v.id('users')},handler:(ctx,{userId})=>evaluatorRecord(ctx,userId)});
export async function authorizedUserId(ctx:QueryCtx|MutationCtx|ActionCtx):Promise<Id<"users">|null>{
 const userId=await getAuthUserId(ctx);if(!userId)return null;
 const state='db' in ctx?await evaluatorRecord(ctx,userId):await ctx.runQuery(internal.evaluator.access,{userId});
 return state.kind==='expired'||state.kind==='missing'?null:userId;
}
async function consume(ctx:MutationCtx,key:string,limit:number,expiresAt:number){
 if(limit<=0)throw new ConvexError('Evaluator access limit reached. Use Google Login for this service.');
 const row=await ctx.db.query('evaluatorLimits').withIndex('by_key',q=>q.eq('key',key)).unique();
 if(row&&row.count>=limit)throw new ConvexError('Evaluator access limit reached. Please try again later or use Google Login.');
 if(row)await ctx.db.patch(row._id,{count:row.count+1});
 else {const id=await ctx.db.insert('evaluatorLimits',{key,count:1,expiresAt});await ctx.scheduler.runAfter(Math.max(0,expiresAt-Date.now()),internal.evaluator.clearLimit,{id});}
}
export async function enrollEvaluator(ctx:MutationCtx,userId:Id<'users'>){
 if(!evaluatorEnabled())throw new ConvexError('Evaluator access is currently unavailable. Use Google Login.');
 const user=await ctx.db.get(userId);if(!user?.isAnonymous)throw new ConvexError('Evaluator access requires a separate disposable account.');
 const now=Date.now(),minute=Math.floor(now/60000),day=Math.floor(now/86400000);
 await consume(ctx,'admission-minute:'+minute,3,(minute+1)*60000);
 await consume(ctx,'admission-day:'+day,30,(day+1)*86400000);
 const expiresAt=Math.min(now+EVALUATOR_SESSION_MS,Date.parse(process.env.EVALUATOR_ACCESS_UNTIL!));
 await ctx.db.insert('evaluatorSessions',{userId,createdAt:now,expiresAt,revoked:false});
 await ctx.scheduler.runAfter(expiresAt-now,internal.evaluator.cleanup,{userId});
}
export async function evaluatorBudget(ctx:MutationCtx,userId:Id<'users'>,operation:'save'|'coach'|'review'|'speech'|'telemetry'){
 const state=await evaluatorRecord(ctx,userId);if(state.kind==='private')return;
 if(state.kind!=='evaluator')throw new ConvexError('Evaluator session unavailable.');
 const now=Date.now(),minute=Math.floor(now/60000),day=Math.floor(now/86400000);
 const limits={save:{session:300,minute:20,global:9000},coach:{session:15,minute:2,global:100},review:{session:2,minute:1,global:30},speech:{session:0,minute:0,global:0},telemetry:{session:500,minute:30,global:15000}}[operation];
 await consume(ctx,`${userId}:${operation}:session`,limits.session,state.expiresAt!);
 await consume(ctx,`${userId}:${operation}:minute:${minute}`,limits.minute,(minute+1)*60000);
 await consume(ctx,`all:${operation}:day:${day}`,limits.global,(day+1)*86400000);
}
export const reserve=internalMutation({args:{operation:v.union(v.literal('coach'),v.literal('review'),v.literal('speech'))},handler:async(ctx,{operation})=>{
 const userId=await authorizedUserId(ctx);if(!userId)throw new ConvexError('Sign in first.');await evaluatorBudget(ctx,userId,operation);return null;
}});
export const session=query({args:{},handler:async(ctx)=>{
 const userId=await getAuthUserId(ctx);const state=userId?await evaluatorRecord(ctx,userId):null;
 return {enabled:evaluatorEnabled(),kind:state?.kind??'signed_out',expiresAt:state?.kind==='evaluator'?state.expiresAt:null};
}});
export const clearLimit=internalMutation({args:{id:v.id('evaluatorLimits')},handler:async(ctx,{id})=>{const row=await ctx.db.get(id);if(row&&row.expiresAt<=Date.now())await ctx.db.delete(id);return null;}});
export const cleanup=internalMutation({args:{userId:v.id('users')},handler:async(ctx,{userId})=>{
 const user=await ctx.db.get(userId),session=await ctx.db.query('evaluatorSessions').withIndex('by_user',q=>q.eq('userId',userId)).unique();
 if(!user?.isAnonymous||!session||session.expiresAt>Date.now()&&!session.revoked)return null;
 const huddle=await ctx.db.query('huddles').withIndex('by_user',q=>q.eq('userId',userId)).unique();
 if(huddle){const rows=await ctx.db.query('huddleChanges').withIndex('by_huddle',q=>q.eq('huddleId',huddle._id)).take(100);for(const row of rows)await ctx.db.delete(row._id);if(rows.length===100){await ctx.scheduler.runAfter(0,internal.evaluator.cleanup,{userId});return null;}await ctx.db.delete(huddle._id);}
 for(const table of ['financialReviews','productInsightEvents','productFeedback','completedMapEmailSignups'] as const){const rows=await ctx.db.query(table).withIndex('by_user',q=>q.eq('userId',userId)).take(100);for(const row of rows)await ctx.db.delete(row._id);if(rows.length===100){await ctx.scheduler.runAfter(0,internal.evaluator.cleanup,{userId});return null;}}
 // Revoke refresh capability. Existing signed tokens are also rejected by authorizedUserId.
 const sessions=await ctx.db.query('authSessions').withIndex('userId',q=>q.eq('userId',userId)).take(100);
 for(const authSession of sessions){const tokens=await ctx.db.query('authRefreshTokens').withIndex('sessionId',q=>q.eq('sessionId',authSession._id)).take(100);for(const token of tokens)await ctx.db.delete(token._id);if(tokens.length===100){await ctx.scheduler.runAfter(0,internal.evaluator.cleanup,{userId});return null;}await ctx.db.delete(authSession._id);}
 const accounts=await ctx.db.query('authAccounts').withIndex('userIdAndProvider',q=>q.eq('userId',userId)).take(100);for(const account of accounts)await ctx.db.delete(account._id);
 await ctx.db.delete(session._id);await ctx.db.delete(userId);return null;
}});
