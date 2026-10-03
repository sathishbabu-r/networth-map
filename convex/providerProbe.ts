import { internalAction } from './_generated/server';
import { v } from 'convex/values';
import { Agent } from '@convex-dev/agent';
import { components } from './_generated/api';
import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';
import { providerFailure } from '../shared/provider-error.mjs';
export const check = internalAction({args:{},returns:v.object({ok:v.boolean(),status:v.union(v.number(),v.null()),code:v.union(v.string(),v.null()),reason:v.string()}),handler:async(ctx)=>{
 const key=process.env.OPENAI_API_KEY;
 if(!key)return {ok:false,status:null,code:null,reason:'Key missing'};
 try {const agent=new Agent(components.agent,{name:'Connection check',languageModel:createOpenAI({apiKey:key})('gpt-4o-mini'),instructions:'Return the word ready.'});await agent.generateObject(ctx, {userId:"connection-check"}, {schema:z.object({text:z.string(),proposal:z.null()}),messages:[{role:'user',content:'Reply ready and set proposal to null.'}],maxOutputTokens:100,maxRetries:0},{storageOptions:{saveMessages:'none'}});return {ok:true,status:null,code:null,reason:'OpenAI responded'};}
 catch(error){const f=providerFailure(error);return {ok:false,status:f.status,code:f.code,reason:(error instanceof Error?error.message:"Unknown failure").replaceAll(key,"[redacted]").replace(/sk-[A-Za-z0-9_-]+/g,"[redacted]").slice(0,400)};}
}});
