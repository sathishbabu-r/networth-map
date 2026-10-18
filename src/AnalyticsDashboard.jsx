import React,{useState} from 'react';
import {useQuery} from 'convex/react';
import {api} from '../convex/_generated/api';
import './analytics.css';
const names=['Welcome','Personal Profiling','Assets','Liabilities','Spending','Investing','Plan','Vision','Goals','Milestone','Review','Generated MAP'];
export function AnalyticsDashboard(){
 const access=useQuery(api.productInsights.analyticsAccess,{});
 const [days,setDays]=useState(30),[cohort,setCohort]=useState('private');
 const data=useQuery(api.productInsights.analyticsDashboard,access?{days,cohort}:'skip');
 if(access===undefined)return <main className="analytics"><p role="status">Checking dashboard access…</p></main>;
 if(!access)return <main className="analytics"><h1>Private analytics</h1><p>Sign in with your approved owner Google account. Access must also be configured on the server.</p><a href="/">Return to Networth MAP</a></main>;
 return <main className="analytics"><a href="/">Return to Networth MAP</a><h1>Product analytics</h1><p>Aggregate MAP journey events. No financial amounts, messages, names or emails are shown.</p>
 <div className="analytics-filters"><label>Time window <select value={days} onChange={e=>setDays(Number(e.target.value))}>{[7,30,90].map(n=><option key={n} value={n}>Last {n} days</option>)}</select></label><label>Account type <select value={cohort} onChange={e=>setCohort(e.target.value)}><option value="private">Private accounts</option><option value="evaluator">Evaluator accounts</option><option value="all">All accounts</option></select></label></div>
 {!data?<p role="status">Loading analytics…</p>:<>
 {data.sampled&&<p role="status">Partial sample: only the newest 4,000 events across account types were reviewed. These figures are not totals for the full time window.</p>}
 <p>Account type does not prove real-user activity. Private accounts can include testing. Expired evaluator records are deleted, so this is not a permanent evaluator history.</p>
 {data.events===0&&<p>No tracked events in this selection yet.</p>}
 <div className="analytics-cards">{[['Tracked sessions',data.sessions],['MAP starts',data.started],['Verified MAP generations',data.generationEvents],['Sessions generating MAP',data.generated],['Accounts generating MAP',data.generationUsers],['Started sessions completing MAP',data.completionRate===null?'No starts':(data.completionRate*100).toFixed(1)+'%']].map(([name,value])=><article key={name}><h2>{name}</h2><strong>{value}</strong></article>)}</div>
 <p>Generation counts include only successful server saves. {data.legacyGenerationEvents} earlier client-reported generation events are excluded because their saves were not verified. Accounts are distinct account records, not necessarily distinct people.</p>
 <p>Completion compares distinct sessions that started and generated a MAP within this selection. Refreshes and repeated events count once per session. It is not a person-based completion rate.</p>
 <h2>Step progression</h2><p>“Not completed” means a viewed step without a completion event in this window, not confirmed abandonment. Welcome and Generated MAP do not emit step-completed events.</p>
 <div className="analytics-table"><table><caption>Distinct sessions per step</caption><thead><tr><th>Step</th><th>Viewed</th><th>Completed</th><th>Not completed</th><th>Errors</th></tr></thead><tbody>{data.steps.map(r=><tr key={r.step}><th scope="row">{names[r.step]}</th><td>{r.viewed}</td><td>{r.step===0||r.step===11?'—':r.completed}</td><td>{r.step===0||r.step===11?'—':r.notCompleted}</td><td>{r.validationErrors}</td></tr>)}</tbody></table></div>
 <h2>Validation errors</h2>{data.errors.length?<ul>{data.errors.map(r=><li key={r.label}>{r.label.replaceAll('_',' ')}: {r.count}</li>)}</ul>:<p>No recorded validation errors.</p>}
 <h2>Events and device activity</h2><p>Device counts are events, not unique people.</p><ul>{data.devices.map(r=><li key={r.label}>{r.label}: {r.count} events</li>)}</ul><ul>{data.eventCounts.map(r=><li key={r.label}>{r.label.replaceAll('_',' ')}: {r.count}</li>)}</ul>
 <p>Financial Review engagement, Coach engagement and return-day retention are not tracked by this dashboard yet.</p>
 </>}
 </main>;
}
