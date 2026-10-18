// Server-only disposable database: never imports a production client or credentials.
import {convexTest} from 'convex-test';
import {mkdir,readFile,writeFile,rename,unlink} from 'node:fs/promises';
import {resolve} from 'node:path';
import schema from '../convex/schema';
import {api,internal} from '../convex/_generated/api';
import {runIntelligence} from '../shared/intelligence';
import {financialStatus,FINANCIAL_POLICY_VERSION} from '../shared/financial-status';
import {validateMap,emptyMap} from '../shared/map-engine';
import {nextHuddleQuestion} from '../src/proposal.js';
const modules=import.meta.glob('../convex/**/*.{ts,js}');
const sessions=new Map<string,Promise<any>>();
const locks=new Map<string,Promise<any>>();
const directory=resolve('.test-data');
async function open(id:string){
 await mkdir(directory,{recursive:true,mode:0o700});
 let journal:any[]=[];try{journal=JSON.parse(await readFile(resolve(directory,id+'.json'),'utf8'));}catch(error:any){if(error.code!=='ENOENT')throw error;}
 const db=convexTest(schema,modules);
 const userId=await db.run(ctx=>ctx.db.insert('users',{name:'Disposable local test account'}));
 const user=db.withIdentity({subject:userId+'|local-test'});
 for(const event of journal){
  if(event.name==='huddles:save')await user.mutation(api.huddles.save,event.args);
  if(event.name==='intelligence:record')await user.mutation(internal.intelligence.record,{userId,...event.args});
 }
 return {db,user,userId,journal};
}
async function persist(id:string,state:any,event:any){
 const next=[...state.journal,event],file=resolve(directory,id+'.json'),temporary=file+'.tmp';
 await writeFile(temporary,JSON.stringify(next),{mode:0o600});await rename(temporary,file);state.journal=next;
}
async function perform(id:string,name:string,args:any){
 if(!/^[a-f0-9]{64}$/.test(id))throw Error('Invalid disposable session');
 if(name==='test:session')return {local:true};
 if(name==='test:reset'||name==='huddles:remove'){
  sessions.delete(id);await unlink(resolve(directory,id+'.json')).catch((e:any)=>{if(e.code!=='ENOENT')throw e;});return null;
 }
 if(!sessions.has(id))sessions.set(id,open(id));
 const s=await sessions.get(id)!;
 if(name==='huddles:current')return s.user.query(api.huddles.current,{});
 if(name==='huddles:history')return s.user.query(api.huddles.history,args);
 if(name==='intelligence:latest')return s.user.query(api.intelligence.latest,{});
 if(name==='huddles:save'){
  const revision=await s.user.mutation(api.huddles.save,args);await persist(id,s,{name,args});return revision;
 }
 if(name==='evaluator:session')return {enabled:false,kind:'private',expiresAt:null};
 if(name==='coach:status')return {google:true,coach:true,speech:false};
 if(name==='speech:ready')return false;
 if(name==='speech:transcribe')throw Error('Speech is unavailable in local test mode. Type your answer.');
 if(name==='intelligence:review'){
  if(typeof args.intent!=='string'||!args.intent.trim()||args.intent.length>1000||typeof args.full!=='boolean')throw Error('Check the review question');
  const saved=await s.user.query(api.huddles.current,{});if(!saved?.content.map)throw Error('Start your MAP first.');
  const map=validateMap(saved.content.map);
  const changes=await s.user.query(api.huddles.history,{paginationOpts:{numItems:50,cursor:null},latestFirst:true});
  const seen=new Set();const history=changes.page.flatMap((row:any)=>{const key=JSON.stringify(row.newContent.outcome);if(!row.newContent.outcome||seen.has(key))return [];seen.add(key);return [{revision:row.revision,outcome:row.newContent.outcome,action:row.newContent.action}];});
  const generate=async(name:string,shape:any,packet:any)=>{
   if(name==='cfo')return shape.parse({story:'Offline test review of your supplied financial information.',insights:packet.findings.slice(0,3).map((f:any)=>({text:f.text,finding_ids:[f.id]})),strategic_gap:'Compare your stated goals with the supported figures.',attention_now:'Review missing information and choose what matters to you.',tradeoffs:[],no_action:'No financial transaction is recommended.',behaviour:null,coach_questions:['What would you like to understand next?'],confidence:packet.confidence,caveats:['Offline test intelligence; no AI provider was called.']});
   return shape.parse({agent:name,risks:[],opportunities:[],questions_for_user:[],cross_agent_challenges:[],insights:packet.metrics.map((metric:any)=>({id:name+'-'+metric.key,text:`${metric.label}: ₹${metric.value}${metric.estimated?' (estimate)':''}`,evidence:['calc:'+metric.key],topic:metric.key,position:'attention'})).slice(0,5),assumptions:[],missing_information:packet.missing.slice(0,12),confidence:packet.missing.length?0.5:0.9,escalation:null});
  };
  const result=await runIntelligence(map,args.intent,args.full,generate,history);
  const report=JSON.stringify({...result,data_policy_version:FINANCIAL_POLICY_VERSION,map_version:saved.revision,question:args.intent,createdAt:Date.now(),test_mode:'offline'});
  const event={name:'intelligence:record',args:{revision:saved.revision,report}};
  await s.user.mutation(internal.intelligence.record,{userId:s.userId,...event.args});await persist(id,s,event);return report;
 }
 if(name==='coach:reply'){
  const saved=await s.user.query(api.huddles.current,{}),content=saved?.content;
  const message=args.messages?.at(-1)?.content;if(typeof message!=='string'||message.length>5000)throw Error('Keep your message under 5,000 characters.');
  const status=content?.map?financialStatus(content.map):null;
  let proposal=null;
  const match=message.match(/^(annual gross personal income|monthly needs|monthly wants|annual investing|effective tax rate)\s*(?:is|=|:)\s*(unknown|\d+(?:\.\d+)?)$/i);
  if(match){
   proposal=structuredClone(content??{concern:'Building my Networth MAP',facts:[],goal:null,action:null,outcome:null,map:emptyMap()});proposal.map??=emptyMap();
   const key=({'annual gross personal income':'grossPersonalIncome','monthly needs':'monthlyNeeds','monthly wants':'monthlyWants','annual investing':'annualInvesting','effective tax rate':'effectiveTaxRate'} as Record<string,string>)[match[1].toLowerCase()];
   proposal.map.unknowns=proposal.map.unknowns.filter((p:string)=>p!==key);proposal.map.estimates=proposal.map.estimates.filter((p:string)=>p!==key);
   if(match[2].toLowerCase()==='unknown'){proposal.map.data[key]='';proposal.map.unknowns.push(key);}else proposal.map.data[key]=match[2];validateMap(proposal.map);
  }
  const text=proposal?'Offline test Coach: review this input before confirming it.':status?.metrics.networth.value===null?'Offline test Coach: your net worth is unavailable because required information is missing. '+nextHuddleQuestion(content??{goal:null,action:null}):'Offline test Coach: '+nextHuddleQuestion(content??{goal:null,action:null});
  return {text,proposal,revision:saved?.revision??0,error:null,requiresConfirmation:Boolean(proposal)};
 }
 if(['productInsights:track','productInsights:submitFeedback'].includes(name))return null;
 if(name==='productInsights:completeMap')return 'local-test-completion';
 if(name==='productInsights:submitCompletedMapEmail')return {emailStatus:'created'};
 throw Error('This operation is unavailable in isolated local testing.');
}
export function dispatch(_serverToken:string,id:string,name:string,args:any){
 const previous=locks.get(id)??Promise.resolve();
 const next=previous.catch(()=>{}).then(()=>perform(id,name,args));locks.set(id,next);return next;
}
