import React,{useEffect,useId,useState} from 'react';
import './evaluator-notice.css';
export function sessionTimeLeft(expiresAt,now){
 if(!Number.isFinite(expiresAt))return 'Expiry unavailable';
 const minutes=Math.max(0,Math.ceil((expiresAt-now)/60000));
 if(!minutes)return 'Session ended';
 return minutes>=60?`${Math.floor(minutes/60)}h ${minutes%60}m left`:`${minutes}m left`;
}
export function EvaluatorNotice({ended,expiresAt,now,busy,onGoogleLogin}){
 const [expanded,setExpanded]=useState(false);const id=useId();
 // Recalculate the existing mobile workspace after this in-flow notice changes height.
 useEffect(()=>{window.dispatchEvent(new Event('resize'));},[expanded]);
 return <aside className="evaluator-notice" aria-label="Evaluator session information">
  <div className="evaluator-notice-summary"><span role="status">{ended?'Test session ended':`Test session · ${sessionTimeLeft(expiresAt,now)}`}</span><button type="button" className="secondary evaluator-notice-toggle" aria-expanded={expanded} aria-controls={id} onClick={()=>setExpanded(value=>!value)}>{expanded?'Less':'More'}</button></div>
  <div id={id} className="evaluator-notice-content" data-expanded={expanded}>
   <strong>{ended?'Evaluator session ended':'Evaluator session'}</strong>
   <p>{ended?'Your temporary access has ended. Start a new evaluation or return to your private account.':'Your disposable MAP is separate from private accounts. It resumes in this browser for up to four hours, then its financial records are scheduled for deletion. Real AI is used when connected, with a limit of two reviews and fifteen Coach requests. Voice and email contact require Google Login.'}</p>
   {!ended&&Number.isFinite(expiresAt)&&<p>Session expires <time dateTime={new Date(expiresAt).toISOString()}>{new Date(expiresAt).toLocaleString()}</time>.</p>}
   <button className="secondary" disabled={busy} onClick={onGoogleLogin}>Return to Google Login</button>
  </div>
 </aside>;
}
