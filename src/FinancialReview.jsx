import {userFacingError} from '../shared/user-facing-error.mjs';
import {FINANCIAL_POLICY_VERSION} from '../shared/financial-status';
import React,{useState} from 'react';
import {useAction,useQuery} from 'convex/react';
import {api} from '../convex/_generated/api';
export function FinancialReview({revision,locked,onExplore}){
 const review=useAction(api.intelligence.review);
 const previous=useQuery(api.intelligence.latest,{});
 const [result,setResult]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[question,setQuestion]=useState('Understand my financial picture and the gap to my goals');
 let report=result;
 if(!report&&previous?.report){try{report=JSON.parse(previous.report);}catch{}}
 const stale=report&&(report.map_version!==revision||report.data_policy_version!==FINANCIAL_POLICY_VERSION);
 async function run(full){setBusy(true);setError('');try{setResult(JSON.parse(await review({intent:question,full})));}catch(e){setError(userFacingError(e,'Review unavailable. Your saved MAP and earlier review are safe. Please retry.'));}finally{setBusy(false);}}
 return <section className="financial-review" aria-label="Financial review">
  <h2>Your financial picture</h2><p>Explore what your MAP supports, what is missing, and what matters to you.</p>
  <label htmlFor="review-question">What would you like to understand?</label>
  <input id="review-question" value={question} maxLength={1000} onChange={e=>setQuestion(e.target.value)} />
  <div className="data-controls"><button className="secondary" disabled={busy||locked||!question.trim()} onClick={()=>run(false)}>Explore this question</button><button className="secondary" disabled={busy||locked||!question.trim()} onClick={()=>run(true)}>Review my full MAP</button></div>
  {busy&&<p role="status">Checking your MAP and the evidence…</p>}{error&&<p role="alert" className="error">{error}</p>}
  {stale&&<p role="status">Your MAP has changed, or this review needs the current data checks. Run a new review before using these findings.</p>}
  {report&&!stale&&<div><h3>Your financial story</h3><p>{report.cfo.story}</p>
   <h3>Things worth exploring</h3>{!report.cfo.insights.length&&<p>There is not enough verified evidence for specific insights yet.</p>}
   {report.cfo.insights.map((i,n)=><article key={n}><p>{i.text}</p><button className="text-button" onClick={()=>onExplore(i.text)}>Ask Your Money Coach</button></article>)}
   {report.verified.failed?.length > 0 && <p role="status">Some parts of the analysis were unavailable. Retry before relying on a full review.</p>}
   {report.verified.contradictions?.map((text,i)=><p role="alert" key={i}>{text}</p>)}
   <h3>Your strategic gap</h3><p>{report.cfo.strategic_gap}</p><p>{report.cfo.attention_now}</p>
   {report.cfo.tradeoffs.map((t,i)=><p key={i}>{t}</p>)}{report.cfo.no_action&&<p>{report.cfo.no_action}</p>}
   <details><summary>What this review relies on</summary>
    <p>{report.verified.state==='RECONCILED'?'Supported by the current MAP.':'More information or qualified review may be needed.'}</p>
    {report.cfo.caveats.map((c,i)=><p key={i}>{c}</p>)}
    {report.verified.calculations.map(c=><p key={c.key}>{c.label}: {new Intl.NumberFormat('en-IN',{maximumFractionDigits:2}).format(c.value)}{c.estimated?' (estimate)':''}. {c.formula}</p>)}
   </details>
  </div>}
 </section>;
}
