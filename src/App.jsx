import { insightSessionId, insightDeviceClass } from "./original-map/use-product-insights";
import { EvaluatorNotice } from "./EvaluatorNotice.jsx";
import { AnalyticsDashboard } from "./AnalyticsDashboard.jsx";
import {userFacingError} from '../shared/user-facing-error.mjs';
import React, { useEffect, useRef, useState } from "react";
import {
  useAction,
  useMutation,
  useQuery,
  useConvex,
  useConvexAuth,
} from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { attachVoice } from "./voice.js";
import { mapConversation } from "../shared/map-conversation.mjs";
import { sameAction } from "../shared/commitment.mjs";
import { sameConfirmedContent, nextHuddleQuestion } from "./proposal.js";
import { updateSummary } from "./update-summary.js";
import { FinancialReview } from "./FinancialReview.jsx";
import { NetworthMap } from "./NetworthMap.jsx";
import { NetworthWelcome } from "./original-map/networth-assessment";
import { memoryFromAssessment } from "../shared/map-engine";
import { observeMobileViewport } from "./mobile-viewport.mjs";
import "./style.css";
import huddleDiamond from "./assets/huddle-diamond.svg";
function HuddleIcon({ className = "" }) {
  return <img className={"huddle-icon " + className} src={huddleDiamond} alt="" width="40" height="40" />;
}
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const opening = "What’s on your mind financially?";
function Composer({ onSend, busy, inputLocked = busy, active = true, clearVersion = 0, children }) {
  const input = useRef(), send = useRef(), voiceBox = useRef(), voice = useRef();
  const ready = useAction(api.speech.ready), transcribe = useAction(api.speech.transcribe);
  useEffect(() => {
    voice.current = attachVoice(voiceBox.current, input.current, send.current, {
      ready: () => ready({}), transcribe, compact: true,
    });
    return () => voice.current?.dispose();
  }, [ready, transcribe]);
  useEffect(() => { if (!active) voiceBox.current?.querySelector(".microphone.listening")?.click(); }, [active]);
  useEffect(()=>{if(clearVersion && input.current){input.current.value="";voice.current?.clearRecording();}},[clearVersion]);
  async function submit() {
    if (busy || input.current.readOnly) return;
    const ok = await onSend(input.current.value.trim());
    if (ok) { input.current.value = ""; voice.current.clearRecording(); }
    input.current.focus();
  }
  return <div className="composer-dock">
    <form onSubmit={e => { e.preventDefault(); void submit(); }}>
      <fieldset disabled={inputLocked} className="composer">
        <label className="sr-only" htmlFor="answer">Review your words, or type instead</label>
        <textarea ref={input} id="answer" rows="2" maxLength="5000" placeholder="Message Money Huddle…"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void submit(); } }} />
        <div className="composer-actions"><div ref={voiceBox} className="voice-inline" />
          <button type="submit" ref={send} disabled={busy} className="send-icon" aria-label={busy ? "Your coach is thinking" : "Send message"}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6" /></svg>
          </button>
        </div>
      </fieldset>
    </form>
    {busy && <p className="composer-hint">Money Huddle is thinking…</p>}
    {children}
  </div>;
}

function Huddle({ allowEmailContact = true }) {
  const workspace = useRef();
  const saved = useQuery(api.huddles.current, {});
  useEffect(() => {
    if (workspace.current) return observeMobileViewport(workspace.current);
  }, [saved !== undefined]);
  const [pendingReview,setPendingReview]=useState(null);
  const [clearVersion,setClearVersion]=useState(0);
  const [agentOpen,setAgentOpen] = useState(false);
  const history = useQuery(api.huddles.history, { paginationOpts: { numItems: 50, cursor: null }, latestFirst: true });
  const [olderHistory, setOlderHistory] = useState([]), [olderCursor, setOlderCursor] = useState(null), [olderDone,setOlderDone] = useState(false), [loadingOlder,setLoadingOlder] = useState(false);
  const reply = useAction(api.coach.reply),
    save = useMutation(api.huddles.save),
    remove = useMutation(api.huddles.remove);
  const client = useConvex();
  const [messages, setMessages] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [deleting, setDeleting] = useState(false);
  const savedRef=useRef(saved), pendingMap=useRef(null), savingMap=useRef(false);
  const [mapReview,setMapReview]=useState(null);
  const [mapSaving,setMapSaving]=useState(false), [mapError,setMapError]=useState(""), [mapDraft,setMapDraft]=useState(false);
  if (saved !== undefined && (!savedRef.current || !saved || saved.revision >= savedRef.current.revision)) savedRef.current=saved;
  async function drainMap() {
    if (savingMap.current || busy || !pendingMap.current) return;
    savingMap.current=true; setMapSaving(true); setMapError("");
    try {
      {
        const pending=pendingMap.current;
        const current=savedRef.current;
        const content={...(current?.content??{concern:"Building my Networth MAP",facts:[],goal:null,action:null,outcome:null}),map:memoryFromAssessment(pending.data,current?.content.map,pending.step)};
        try {
          const revision=await save({content,expectedRevision:current?.revision??0,analytics:{sessionId:insightSessionId(),device:insightDeviceClass()}});
          savedRef.current={...current,content,revision};
          if(pendingMap.current===pending){pendingMap.current=null;setMapReview(null);}
        } catch(e) {pendingMap.current=pending;throw e;}
      }
    } catch(e) {setMapError(e.message||"Your MAP could not be remembered. Your edits are still here.");}
    finally {savingMap.current=false;setMapSaving(false);}
  }
  function onMapChange(data,step) {const draft={data,step};pendingMap.current=draft;setMapReview(draft);if(JSON.stringify(memoryFromAssessment(data,savedRef.current?.content.map,step).data)===JSON.stringify(savedRef.current?.content.map?.data))void drainMap();}
  const started = useRef(false);
  const log = useRef();
  useEffect(() => {
    if (agentOpen && saved !== undefined && !started.current) {
      started.current = true;
      setMessages([
        {
          role: "assistant",
          content: saved?.content.action
            ? `Last time your goal was: ${saved.content.goal.text}. You committed to ${saved.content.action.text} by ${saved.content.action.dueDate}. What happened?`
            : saved
              ? `Welcome back. I remember what we discussed${saved.content.goal ? ` and your goal: ${saved.content.goal.text}` : ""}. ${saved.content.goal ? "What's one realistic action you can take this week?" : (mapConversation(saved.content.map).missing[0]?.question ?? "What would you like to achieve from here?")}`
              : `Let’s build your MAP together. ${mapConversation(null).missing[0].question}`,
        },
      ]);
    }
  }, [saved, agentOpen]);
  useEffect(() => {
    log.current?.lastElementChild?.scrollIntoView({ block: "nearest" });
  }, [messages]);
  async function ask(next, confirmed = saved?.content) {
    const r = await reply({ messages: next, today: today() });
    if (r.error) throw Error(r.error);
    if(r.revision!==(savedRef.current?.revision??0)) throw Error("Your MAP changed while the Coach was replying. Your answer is still here; please retry using the current MAP.");
    if (!r.proposal || sameConfirmedContent(r.proposal, confirmed)) {
      setMessages([...next, { role: "assistant", content: r.proposal ? nextHuddleQuestion(confirmed) : r.text }]);
      return;
    }
    setPendingReview({r,next,confirmed});setMessages(next);return false;
  }
  async function rememberProposal(r,next,confirmed) {
    const revision=await save({ content: r.proposal, expectedRevision: r.revision });
    savedRef.current={...savedRef.current,content:r.proposal,revision};
    const remembered = r.proposal;
    setNotice("Answers remembered. You can correct them in the conversation.");
    if ((remembered.outcome && !sameConfirmedContent({facts:[],outcome:remembered.outcome},{facts:[],outcome:confirmed?.outcome})) || (remembered.action && !sameAction(remembered.action,confirmed?.action))) {
      const text = remembered.outcome
        ? `Your update is remembered: ${remembered.outcome.text}. Action completion and financial results are recorded separately.`
        : `Your goal: ${remembered.goal.text}. This week: ${remembered.action.text}, by ${remembered.action.dueDate}.`;
      setMessages([...next, { role: "assistant", content: text }]);
      return;
    }
    const continuation = [...next, { role: "user", content: "[Memory update] The user sent the latest answer and it is already saved in the account and available in your remembered context. Continue with one useful next question. Do not propose this information again." }];
    setMessages(next);
    try {
      const follow = await reply({ messages: continuation, today: today() });
      if (follow.error) throw Error(follow.error);
      if(follow.revision!==(savedRef.current?.revision??0)) throw Error("Your MAP changed while the Coach was replying.");
      setMessages([...continuation, { role: "assistant", content: follow.proposal ? nextHuddleQuestion(remembered) : follow.text }]);
    } catch {
      setMessages([...continuation, { role: "assistant", content: nextHuddleQuestion(remembered) }]);
    }
  }
  async function onSend(text) {
    setError("");
    setNotice("");
    if (mapDraft || savingMap.current || pendingMap.current) {
      setError("Please review and confirm your MAP draft before sending your message.");
      return false;
    }
    if (!text) {
      setError("Speak or type an answer first.");
      return false;
    }
    setBusy(true);
    try {
      return (await ask([...messages, { role: "user", content: text }])) !== false;
    } catch (e) {
      setError(userFacingError(e, "Could not connect. Your answer is still here. Please retry."));
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function onCheckIn({content, expectedRevision}) {
    if (busy || savingMap.current || pendingMap.current || mapDraft || pendingReview) throw Error("Wait for your MAP and current review to finish saving, then retry.");
    const current=savedRef.current;
    if (!current || current.revision !== expectedRevision) throw Error("Your saved information changed. Reopen the check-in and review it before saving.");
    setBusy(true);
    try {
      const revision=await save({content,expectedRevision});
      savedRef.current={...current,content,revision};
      setNotice("Your check-in is remembered privately.");
    } finally {setBusy(false);}
  }
  async function exportData() {
    try {
      setBusy(true);
      setError("");
      let cursor = null,
        history = [],
        done = false;
      while (!done) {
        const result = await client.query(api.huddles.history, {
          paginationOpts: { numItems: 50, cursor },
        });
        history.push(...result.page);
        done = result.isDone;
        cursor = result.continueCursor;
      }
      const mapExtras={};
      for(const table of ["productInsightEvents","productFeedback","completedMapEmailSignups"]) {
        let cursor=null, done=false;mapExtras[table]=[];
        while(!done){const page=await client.query(api.productInsights.exportRows,{table,paginationOpts:{numItems:50,cursor}});mapExtras[table].push(...page.page);cursor=page.continueCursor;done=page.isDone;}
      }
      const financialReviews=[]; let reviewCursor=null, reviewsDone=false;
      while(!reviewsDone){const page=await client.query(api.intelligence.exportRows,{paginationOpts:{numItems:50,cursor:reviewCursor}});financialReviews.push(...page.page);reviewsDone=page.isDone;reviewCursor=page.continueCursor;}
      const blob = new Blob(
        [JSON.stringify({ confirmed: saved, changes: history, mapExtras, financialReviews }, null, 2)],
        { type: "application/json" },
      );
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "my-money-huddle.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not export. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function loadOlder() {
    setLoadingOlder(true);
    try {
      const result = await client.query(api.huddles.history, { paginationOpts: {numItems:50,cursor:olderCursor??history.continueCursor}, latestFirst:true });
      setOlderHistory(rows=>[...rows,...result.page]); setOlderCursor(result.continueCursor); setOlderDone(result.isDone);
    } catch { setError("Could not load earlier progress. Try again."); } finally { setLoadingOlder(false); }
  }
  if (saved === undefined)
    return <p role="status">Loading your saved Huddle…</p>;
  return (
    <main ref={workspace} className="conversation integrated-workspace floating-workspace">
      <NetworthMap draftReview={mapReview ? updateSummary({facts:[],map:memoryFromAssessment(mapReview.data,saved?.content.map,mapReview.step)},saved?.content) : null} onConfirmDraft={drainMap} draftPublishing={mapDraft||mapSaving} allowEmailContact={allowEmailContact} review={saved?.content.map ? <FinancialReview revision={saved.revision} locked={busy||mapSaving||mapDraft||Boolean(mapReview)} onExplore={text=>{setAgentOpen(true);setMessages(m=>[...m,{role:"assistant",content:`Your review raised: ${text} What matters most to you about this?`}]);}} /> : <p>Start your MAP to explore your financial picture.</p>} onCheckIn={onCheckIn} onCoach={()=>setAgentOpen(true)} saved={saved} history={history ? {...history,isDone:olderDone||history.isDone} : undefined} olderHistory={olderHistory} onOlder={loadOlder} loadingOlder={loadingOlder} onChange={onMapChange} saving={mapSaving||mapDraft||Boolean(mapReview)} locked={busy||mapSaving||Boolean(pendingReview)} onDraftStatus={setMapDraft} mapError={mapError} onRetry={drainMap} onDelete={()=>{setAgentOpen(true);setDeleting(true);document.querySelector(".privacy-data")?.setAttribute("open","");}} />

      <button className="huddle-launcher" aria-label="Ask Your Money Coach" aria-expanded={agentOpen} aria-controls="money-huddle-panel" hidden={agentOpen} onClick={()=>setAgentOpen(true)}><HuddleIcon /><span>Ask Your Money Coach</span></button>
      <section id="money-huddle-panel" className="thread floating-huddle" hidden={!agentOpen} aria-label="Conversation with your coach" onKeyDown={event=>{if(event.key==="Escape")setAgentOpen(false);}}>
        <button className="huddle-minimise text-button" aria-label="Minimise Money Huddle" onClick={()=>setAgentOpen(false)}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 12h12"/></svg></button>
        <div className="thread-identity"><HuddleIcon /><h1 className="thread-title">Money Huddle</h1></div>
        <p className="thread-intro">Your Vision. Your Wealth. Your Next Move.</p>
        <div id="messages" ref={log} role="log" aria-live="polite">
          {messages.filter(m => !m.content.startsWith("[Memory update]")).map((m, i) => (
            <article key={i} className={"message " + m.role}>
              <p className="speaker">
                {m.role === "user" ? "You" : "Money Huddle"}
              </p>
              <p>
                {m.content}
              </p>
            </article>
          ))}


        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        {pendingReview && <section aria-label="Review proposed update" style={{overflowY:"auto",maxHeight:"60dvh",flexShrink:0}}><p role="status">Awaiting your confirmation.</p><h2>Review before saving</h2><p>{pendingReview.r.text}</p>
          {pendingReview.r.proposal.action && <p>Action: {pendingReview.r.proposal.action.text} · {pendingReview.r.proposal.action.dueDate}</p>}
          <p><strong>Your message — unconfirmed:</strong> {pendingReview.next.at(-1)?.content}</p><h3>AI-prepared draft — not saved</h3><p>Check every detail. AI suggestions are not confirmed facts.</p><div>{updateSummary(pendingReview.r.proposal,pendingReview.confirmed).map((line,i)=><p key={i}>{line}</p>)}</div>
          <details><summary>Previously confirmed details</summary>{pendingReview.confirmed ? updateSummary(pendingReview.confirmed,null).map((line,i)=><p key={i}>{line}</p>) : <p>No confirmed snapshot yet.</p>}</details><button disabled={busy} onClick={async()=>{setBusy(true);setError("");try{await rememberProposal(pendingReview.r,pendingReview.next,pendingReview.confirmed);setPendingReview(null);setClearVersion(v=>v+1);}catch(e){setError(e.message||"Could not save. Please retry.");}finally{setBusy(false);}}}>Confirm this update</button>
          <button className="secondary" disabled={busy} onClick={()=>setPendingReview(null)}>Keep existing details</button>
        </section>}
        <Composer clearVersion={clearVersion} active={agentOpen} onSend={onSend} busy={busy||mapSaving||mapDraft} inputLocked={busy||Boolean(pendingReview)}>
        <details className="privacy-data">
          <summary>Answers remembered between visits · <span>Privacy &amp; data</span></summary>
          <p>Your answers are processed by Convex and the AI provider. Voice recordings are sent through Convex to OpenAI for transcription. We save financial details and commitments only after you confirm the review, along with previous versions and financial review records, in your account. You can correct them by chatting. This app does not save raw audio or the full conversation. Unsaved conversation and drafts disappear when this tab closes. Provider retention has not been verified.</p>
        <div className="data-controls">
          {saved && (
            <>
              <button
                className="text-button"
                disabled={busy}
                onClick={exportData}
              >
                Export saved Huddle
              </button>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => setDeleting(true)}
              >
                Delete saved Huddle
              </button>
            </>
          )}
          {deleting && (
            <div role="alert">
              <p>
                Delete your MAP, saved snapshot, goal, action, financial reviews and remembered history?
                This cannot be undone.
              </p>
              <button className="secondary" onClick={() => setDeleting(false)}>
                Keep my Huddle
              </button>{" "}
              <button
                onClick={async () => {
                  setBusy(true);
                  try {
                    await remove({});
                    pendingMap.current=null;savedRef.current=null;
                    setDeleting(false);setPendingReview(null);
                    setOlderHistory([]); setOlderCursor(null); setOlderDone(false);
                    setMessages([{ role: "assistant", content: opening }]);
                    setNotice("Your saved Huddle was deleted.");
                  } catch {
                    setError("Could not delete. Try again.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Delete permanently
              </button>
            </div>
          )}
        </div>
        </details>
        </Composer>
      </section>
    </main>
  );
}
export function App() {
  if (/^\/analytics\/?$/.test(window.location.pathname)) return <AnalyticsDashboard />;
  return <ProductApp />;
}
function ProductApp() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const status = useAction(api.coach.status);
  const evaluatorSession = useQuery(api.evaluator.session, {});
  const [sessionClock,setSessionClock]=useState(Date.now());
  const evaluating=evaluatorSession?.kind === "evaluator";
  const evaluationEnded=["expired","missing"].includes(evaluatorSession?.kind) || (evaluating && sessionClock >= evaluatorSession.expiresAt);
  const accessReady=isAuthenticated && !evaluationEnded;
  const remembered = useQuery(api.huddles.current, accessReady ? {} : "skip");
  const [building, setBuilding] = useState(false);
  const [opened, setOpened] = useState(false);
  useEffect(() => { if (!isAuthenticated) { setBuilding(false); setOpened(false); } }, [isAuthenticated]);
  useEffect(()=>{
    if(!evaluating)return;
    const timer=setInterval(()=>setSessionClock(Date.now()),15000);
    return()=>clearInterval(timer);
  },[evaluating]);
  useEffect(()=>{
    if(evaluating && !evaluationEnded && window.location.pathname === "/try") {setOpened(true);setBuilding(true);}
    if(evaluationEnded)setBuilding(false);
  },[evaluating,evaluationEnded]);
  const [setup, setSetup] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    status({})
      .then(setSetup)
      .catch(() => setError("Could not check the connection. Please reload."));
  }, [status]);
  async function startEvaluation(){
    if (!/^\/try\/?$/.test(window.location.pathname)) {window.location.assign("/try");return;}
    setBusy(true);setError("");
    try{
      if(isAuthenticated)await signOut();
      await signIn("evaluator");
      window.history.replaceState(null,"","/try");
      setSessionClock(Date.now());setOpened(true);setBuilding(true);
    }catch{setError("Evaluator access could not start. It may be closed or at its limit. Use Google Login or retry later.");}
    finally{setBusy(false);}
  }
  async function googleLogin(){
    setBusy(true);setError("");
    try{
      if(isAuthenticated)await signOut();
      setOpened(false);setBuilding(false);
      if (/^\/try\/?$/.test(window.location.pathname)) {window.location.assign("/");return;}
      await signIn("google",{redirectTo:window.location.origin});
    }catch{setError("Google sign-in could not start. Check the connection and retry.");}
    finally{setBusy(false);}
  }
  const evaluatorAttempted=useRef(false);
  useEffect(()=>{
    if(/^\/try\/?$/.test(window.location.pathname)&&evaluatorSession?.enabled&&!isAuthenticated&&!isLoading&&!evaluatorAttempted.current){
      evaluatorAttempted.current=true;void startEvaluation();
    }
  },[evaluatorSession?.enabled,isAuthenticated,isLoading]);
  return (
    <>
      <header>
        <a className="brand" href="/" onClick={isAuthenticated ? (event) => { event.preventDefault(); setBuilding(false); } : undefined}>
          <span className="map-brand-mark" aria-hidden="true">NM</span>Networth MAP
        </a>
        {isAuthenticated ? (
          <button
            className="secondary"
            onClick={async () => {
              setBusy(true);
              try {
                await signOut();
                if(/^\/try\/?$/.test(window.location.pathname))window.location.assign("/");
              } catch {
                setError("Could not sign out. Please retry.");
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
          >
            {evaluating || evaluationEnded ? "End Evaluator Session" : "Log out"}
          </button>
        ) : (
          <button className="secondary" disabled={busy} onClick={googleLogin}>Google Login</button>
        )}
      </header>
      {(evaluating || evaluationEnded) && <EvaluatorNotice ended={evaluationEnded} expiresAt={evaluatorSession?.expiresAt} now={sessionClock} busy={busy} onGoogleLogin={googleLogin} />}
      {error && (isAuthenticated || building) && (
        <p className="error page-error" role="alert">
          {error}
        </p>
      )}
      {isLoading ? (
        <main>
          <p role="status">Checking your sign-in…</p>
        </main>
      ) : (
        <>
          {!building && <div className="original-map map-entry">
            <main className="shell">
              <NetworthWelcome
                buttonLabel={!isAuthenticated && evaluatorSession?.enabled ? "Try Networth MAP" : accessReady && (remembered || opened) ? "Continue My MAP" : "Build My Networth MAP"}
                authMessage={!isAuthenticated ? error || (setup && !setup.google ? "Google sign-in is temporarily unavailable. Please try again shortly." : "") : ""}
                disabled={busy || (accessReady ? remembered === undefined : !evaluatorSession?.enabled && !setup?.google)}
                onBuild={async () => {
                  if (!isAuthenticated && evaluatorSession?.enabled) { await startEvaluation();return; }
                  if (accessReady) { setOpened(true); setBuilding(true); return; }
                  await googleLogin();
                }}
              />
              <section className="evaluator-entry" aria-label="Try Networth MAP">
                {(isAuthenticated || !evaluatorSession?.enabled) && <button className="primary" onClick={startEvaluation} disabled={busy || !evaluatorSession?.enabled}>Try Networth MAP</button>}
                <p>Evaluate the real MAP without Google Login. Your own disposable session saves in this browser for up to four hours.</p>
                {!evaluatorSession?.enabled && <p>Temporary evaluator access is currently closed. Google Login remains available.</p>}
              </section>
            </main>
            {!isAuthenticated && <details className="entry-privacy">
              <summary>Privacy &amp; data</summary>
              <p>Your answers are processed by Convex and an AI provider. Voice uses OpenAI to turn recordings into text. This app saves financial context, commitments, change history and financial review records in your account. Proposed inferred facts and new commitments are reviewed before saving. Raw audio and full conversations are not retained by this app. Provider retention has not been verified. Your remembered information can be exported or deleted.</p>
            </details>}
            {setup && (!setup.coach || !setup.speech) && <p role="status">{!setup.coach ? "The AI coach is not connected yet. " : ""}{!setup.speech ? "Voice is waiting for its speech service connection." : ""}</p>}
          </div>}
          {accessReady && <div hidden={!building}>{opened && <Huddle key="signed-in" allowEmailContact={!evaluating} />}</div>}
        </>
      )}
      <footer className="sr-only">
        You choose your goal and action. Calculations use confirmed figures;
        estimates remain visible.
      </footer>
    </>
  );
}
