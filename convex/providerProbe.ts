import { internalAction } from './_generated/server';
import { v } from 'convex/values';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { providerFailure } from '../shared/provider-error.mjs';
export const check = internalAction({args:{},returns:v.object({ok:v.boolean(),status:v.union(v.number(),v.null()),code:v.union(v.string(),v.null()),reason:v.string()}),handler:async()=>{
 const key=process.env.OPENAI_API_KEY;
 if(!key)return {ok:false,status:null,code:null,reason:'Key missing'};
 try {await generateText({model:createOpenAI({apiKey:key})('gpt-4o-mini'),prompt:'Reply with the single word ready.',maxOutputTokens:32,maxRetries:0});return {ok:true,status:null,code:null,reason:'OpenAI responded'};}
 catch(error){const f=providerFailure(error);return {ok:false,status:f.status,code:f.code,reason:f.message};}
}});
