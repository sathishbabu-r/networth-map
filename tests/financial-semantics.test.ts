import {test,expect} from 'vitest';
import {goldenCases} from '../shared/intelligence-evals';
import {runIntelligence,type Specialist} from '../shared/intelligence';
const empty=(agent:string):Specialist=>({agent:agent as any,insights:[],risks:[],opportunities:[],questions_for_user:[],cross_agent_challenges:[],assumptions:[],missing_information:[],confidence:.9,escalation:null});
async function review(text:string,ref='calc:takehome',estimates:string[]=[]){const map=structuredClone(goldenCases[0].map);map.estimates=estimates;return runIntelligence(map,'income',false,async<T>(role:string)=>role==='cfo'?{story:'Review the evidence.',insights:[{text,finding_ids:['income-one']}],strategic_gap:'Clarify goals',tradeoffs:[],attention_now:'Review evidence',no_action:'No action required',behaviour:null,coach_questions:[],confidence:.9,caveats:[]} as T:{...empty(role),insights:role==='income'?[{id:'income-one',text:'Review income',evidence:[ref],topic:'income',position:'attention'}]:[]} as T);}
test('annual take-home income cannot be relabelled as monthly income',async()=>{expect((await review('Your monthly take-home income is ₹36,00,000.')).cfo.insights).toEqual([]);});
test('a rupee amount cannot become a percentage just because the number matches',async()=>{expect((await review('Your savings rate is 3600000%.')).cfo.insights).toEqual([]);});
test('net take-home income cannot be relabelled as gross income',async()=>{expect((await review('Your gross income is ₹36,00,000.')).cfo.insights).toEqual([]);});
test('estimated income cannot be described as exact',async()=>{expect((await review('Your exact annual take-home income is ₹36,00,000.','calc:takehome',['grossPersonalIncome'])).cfo.insights).toEqual([]);});
test('correctly labelled annual income retains its supporting evidence',async()=>{expect((await review('Your annual take-home income is ₹36,00,000.')).cfo.insights).toHaveLength(1);});
