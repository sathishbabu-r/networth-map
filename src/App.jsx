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
import { sameAction } from "../shared/commitment.mjs";
import { sameConfirmedContent, nextHuddleQuestion } from "./proposal.js";
import { calculateInsights } from "../shared/financial.mjs";
import { NetworthMap } from "./NetworthMap.jsx";
import { NetworthWelcome } from "./original-map/networth-assessment";
import { memoryFromAssessment } from "../shared/map-engine";
import "./style.css";
function HuddleIcon({ className = "" }) {
  return <img className={"huddle-icon " + className} src="/money-huddle.svg" alt="" width="40" height="40" />;
}
const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const opening = "What’s on your mind financially?";
function factValue(f) {
  return f.kind === "unknown"
    ? "I don't know"
    : f.kind === "range"
      ? `${money(f.lower)}–${money(f.upper)}`
      : money(f.amount);
}
function Insights({ facts }) {
  const insights = calculateInsights(
    facts.map((f) => ({ ...f, confirmed: true })),
  ).slice(0, 1);
  return (
    <div>
      <h3>Insight</h3>
      {insights.length ? (
        insights.map((i) => (
          <div key={i.key}>
            <p>
              {i.estimated ? "Based on your estimates: " : ""}
              {i.key === "overdue_share"
                ? `${Number(i.value.toFixed(2))}% of your receivables are overdue.`
                : i.key === "emi_share"
                  ? `Your monthly EMI is ${Number(i.value.toFixed(2))}% of your monthly income.`
                  : i.value >= 0
                    ? `Payments due exceed available cash by ${money(i.value)}.`
                    : `Available cash exceeds payments due by ${money(-i.value)}.`}
            </p>
            <details>
              <summary>How this was calculated</summary>
              <p>
                {i.formula}
                <br />
                {money(i.amounts[0])} {i.unit === "percent" ? "÷" : "−"}{" "}
                {money(i.amounts[1])}
                {i.unit === "percent" ? " × 100" : ""} ={" "}
                {i.unit === "percent"
                  ? `${Number(i.value.toFixed(2))}%`
                  : money(i.value)}
              </p>
              <p>
                {i.scope} · {i.asOf}
              </p>
            </details>
          </div>
        ))
      ) : (
        <p className="muted">
          No calculation is supported by the confirmed figures yet. Unknowns and
          ranges stay visible.
        </p>
      )}
    </div>
  );
}
function Composer({ onSend, busy, consent, setConsent, reviewPending, children }) {
  const input = useRef(), send = useRef(), voiceBox = useRef(), voice = useRef();
  const [disclosure, setDisclosure] = useState(false);
  const ready = useAction(api.speech.ready), transcribe = useAction(api.speech.transcribe);
  useEffect(() => {
    voice.current = attachVoice(voiceBox.current, input.current, send.current, {
      ready: () => ready({}), transcribe, compact: true,
    });
    return () => voice.current?.dispose();
  }, [ready, transcribe]);
  async function submit() {
    if (busy || reviewPending || input.current.readOnly) return;
    if (!consent) { setDisclosure(true); return; }
    const ok = await onSend(input.current.value.trim());
    if (ok) { input.current.value = ""; voice.current.clearRecording(); }
    input.current.focus();
  }
  return <div className="composer-dock">
    {disclosure && <div className="first-use" role="dialog" aria-label="Before your first message">
      <h2>Before we talk</h2>
      <p>Your answers are processed by Convex and the AI provider. Financial details, your goal and action are remembered automatically. You can correct them in the chat. This app does not retain full conversations or raw audio. Provider retention has not been verified.</p>
      <button onClick={() => { setConsent(true); setDisclosure(false); input.current.focus(); }}>I understand — continue</button>
      <button className="text-button" onClick={() => setDisclosure(false)}>Not now</button>
    </div>}
    <form onSubmit={e => { e.preventDefault(); void submit(); }}>
      <fieldset disabled={busy || reviewPending} className="composer">
        <label className="sr-only" htmlFor="answer">Review your words, or type instead</label>
        <textarea ref={input} id="answer" rows="2" maxLength="5000" placeholder="Message My Money Huddle…"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void submit(); } }} />
        <div className="composer-actions"><div ref={voiceBox} className="voice-inline" />
          <button type="submit" ref={send} className="send-icon" aria-label={busy ? "Your coach is thinking" : "Send message"}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6" /></svg>
          </button>
        </div>
      </fieldset>
    </form>
    {(busy || reviewPending) && <p className="composer-hint">{busy ? "Money Huddle is thinking…" : "Confirm or edit the details above to continue."}</p>}
    {children}
  </div>;
}

function Huddle() {
  const saved = useQuery(api.huddles.current, {});
  const history = useQuery(api.huddles.history, { paginationOpts: { numItems: 50, cursor: null }, latestFirst: true });
  const [olderHistory, setOlderHistory] = useState([]), [olderCursor, setOlderCursor] = useState(null), [olderDone,setOlderDone] = useState(false), [loadingOlder,setLoadingOlder] = useState(false);
  const reply = useAction(api.coach.reply),
    save = useMutation(api.huddles.save),
    remove = useMutation(api.huddles.remove);
  const client = useConvex();
  const [messages, setMessages] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [consent, setConsent] = useState(false),
    [notice, setNotice] = useState(""),
    [deleting, setDeleting] = useState(false);
  const savedRef=useRef(saved), pendingMap=useRef(null), savingMap=useRef(false);
  const [mapSaving,setMapSaving]=useState(false), [mapError,setMapError]=useState(""), [mapDraft,setMapDraft]=useState(false);
  if (saved !== undefined && (!savedRef.current || !saved || saved.revision >= savedRef.current.revision)) savedRef.current=saved;
  async function drainMap() {
    if (savingMap.current || busy || !pendingMap.current) return;
    savingMap.current=true; setMapSaving(true); setMapError("");
    try {
      while(pendingMap.current) {
        const pending=pendingMap.current; pendingMap.current=null;
        const current=savedRef.current;
        const content={...(current?.content??{concern:"Building my Networth MAP",facts:[],goal:null,action:null,outcome:null}),map:memoryFromAssessment(pending.data,current?.content.map,pending.step)};
        try {
          const revision=await save({content,expectedRevision:current?.revision??0});
          savedRef.current={...current,content,revision};
        } catch(e) {pendingMap.current=pending;throw e;}
      }
    } catch(e) {setMapError(e.message||"Your MAP could not be remembered. Your edits are still here.");}
    finally {savingMap.current=false;setMapSaving(false);}
  }
  function onMapChange(data,step) {pendingMap.current={data,step};void drainMap();}
  useEffect(()=>{if(!busy && pendingMap.current) void drainMap();},[busy]);
  const started = useRef(false);
  const log = useRef();
  useEffect(() => {
    if (saved !== undefined && !started.current) {
      started.current = true;
      setMessages([
        {
          role: "assistant",
          content: saved?.content.action
            ? `Last time your goal was: ${saved.content.goal.text}. You committed to ${saved.content.action.text} by ${saved.content.action.dueDate}. What happened?`
            : saved
              ? `Welcome back. I remember what we discussed${saved.content.goal ? ` and your goal: ${saved.content.goal.text}` : ""}. ${saved.content.goal ? "What's one realistic action you can take this week?" : "What would you like to achieve from here?"}`
              : opening,
        },
      ]);
    }
  }, [saved]);
  useEffect(() => {
    log.current?.lastElementChild?.scrollIntoView({ block: "nearest" });
  }, [messages]);
  async function ask(next, confirmed = saved?.content) {
    const r = await reply({ messages: next, today: today() });
    if (r.error) throw Error(r.error);
    if (!r.proposal || sameConfirmedContent(r.proposal, confirmed)) {
      setMessages([...next, { role: "assistant", content: r.proposal ? nextHuddleQuestion(confirmed) : r.text }]);
      return;
    }
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
    const continuation = [...next, { role: "user", content: "[Memory update] Automatic memory is enabled. The latest answer is already saved in the account and available in your remembered context. Continue with one useful next question. Do not propose this information again." }];
    setMessages(next);
    try {
      const follow = await reply({ messages: continuation, today: today() });
      if (follow.error) throw Error(follow.error);
      setMessages([...continuation, { role: "assistant", content: follow.proposal ? nextHuddleQuestion(remembered) : follow.text }]);
    } catch {
      setMessages([...continuation, { role: "assistant", content: nextHuddleQuestion(remembered) }]);
    }
  }
  async function onSend(text) {
    setError("");
    setNotice("");
    if (!consent) {
      setError("Review the first-use disclosure before sending.");
      return false;
    }
    if (mapDraft || savingMap.current || pendingMap.current) {
      setError("Please finish saving the MAP before sending your message.");
      return false;
    }
    if (!text) {
      setError("Speak or type an answer first.");
      return false;
    }
    setBusy(true);
    try {
      await ask([...messages, { role: "user", content: text }]);
      return true;
    } catch (e) {
      setError(e.message || "Could not connect. Your answer is still here.");
      return false;
    } finally {
      setBusy(false);
    }
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
      const blob = new Blob(
        [JSON.stringify({ confirmed: saved, changes: history, mapExtras }, null, 2)],
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
    <main className="conversation integrated-workspace">
      <NetworthMap saved={saved} history={history ? {...history,isDone:olderDone||history.isDone} : undefined} olderHistory={olderHistory} onOlder={loadOlder} loadingOlder={loadingOlder} onChange={onMapChange} saving={mapSaving||mapDraft} locked={busy} onDraftStatus={setMapDraft} mapError={mapError} onRetry={drainMap} onDelete={()=>{setDeleting(true);document.querySelector(".privacy-data")?.setAttribute("open","");}} />
      <section className="thread" aria-label="Conversation with your coach">
        <div className="thread-identity"><HuddleIcon /><h1 className="thread-title">My Money Huddle</h1></div>
        <p className="thread-intro">Let’s build your MAP together.</p>
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
        {saved && notice && <div className="conversation-insight"><Insights facts={saved.content.facts} /></div>}
        <Composer onSend={onSend} busy={busy||mapSaving||mapDraft} consent={consent} setConsent={setConsent}>
        <details className="privacy-data">
          <summary>Answers remembered between visits · <span>Privacy &amp; data</span></summary>
          <p>Your answers are processed by Convex and the AI provider. Voice recordings are sent through Convex to OpenAI for transcription. We automatically remember financial context and commitments from your answers, along with previous versions, in your account. You can correct them by chatting. This app does not save raw audio or the full conversation. Unsaved conversation and drafts disappear when this tab closes. Provider retention has not been verified.</p>
          {consent && <button className="text-button" onClick={() => setConsent(false)}>Withdraw conversation consent</button>}
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
                Delete your MAP, saved snapshot, goal, action and remembered history?
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
                    setDeleting(false);
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
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const status = useAction(api.coach.status);
  const remembered = useQuery(api.huddles.current, isAuthenticated ? {} : "skip");
  const [building, setBuilding] = useState(false);
  const [opened, setOpened] = useState(false);
  useEffect(() => { if (!isAuthenticated) { setBuilding(false); setOpened(false); } }, [isAuthenticated]);
  const [setup, setSetup] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    status({})
      .then(setSetup)
      .catch(() => setError("Could not check the connection. Please reload."));
  }, [status]);
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
              } catch {
                setError("Could not sign out. Please retry.");
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
          >
            Log out
          </button>
        ) : (
          <span>Blueprint → Vision → MAP</span>
        )}
      </header>
      {error && (
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
              {isAuthenticated ? <section className="blueprint-entry" aria-labelledby="blueprint-entry-title">
                <h1 id="blueprint-entry-title">Your best estimates are enough.</h1>
                <p className="quick-start-intro">Keep these three numbers roughly ready. You can refine them as you go.</p>
                <ol className="quick-start-list">
                  <li><b>01</b><span>Annual income and estimated tax rate</span></li>
                  <li><b>02</b><span>Current asset and loan balances</span></li>
                  <li><b>03</b><span>Average monthly household and lifestyle costs</span></li>
                </ol>
                <p className="quick-start-reassurance">About 20 minutes · Remembered privately in your account</p>
                <button className="primary" disabled={remembered === undefined} onClick={() => { setOpened(true); setBuilding(true); }}>Start My Blueprint <span aria-hidden="true">→</span></button>
              </section> : <NetworthWelcome
                buttonLabel={busy ? "Opening Google…" : "Build My Networth MAP"}
                disabled={busy || (isAuthenticated ? remembered === undefined : !setup?.google)}
                onBuild={async () => {
                  if (isAuthenticated) { setOpened(true); setBuilding(true); return; }
                  setBusy(true); setError("");
                  try { await signIn("google", {redirectTo: window.location.origin}); }
                  catch { setError("Google sign-in could not start. Check the connection and retry."); }
                  finally { setBusy(false); }
                }}
              />}
            </main>
            {!isAuthenticated && <details className="entry-privacy">
              <summary>Privacy &amp; data</summary>
              <p>Your answers are processed by Convex and an AI provider. Voice uses OpenAI to turn recordings into text. This app saves only financial context and commitments from your answers automatically, plus change history. Raw audio and full conversations are not retained by this app. Provider retention has not been verified. Your remembered information can be exported or deleted.</p>
            </details>}
            {setup && !setup.google && !isAuthenticated && <p role="status">Google sign-in is waiting for the app’s Google connection to be configured.</p>}
            {setup && (!setup.coach || !setup.speech) && <p role="status">{!setup.coach ? "The AI coach is not connected yet. " : ""}{!setup.speech ? "Voice is waiting for its speech service connection." : ""}</p>}
          </div>}
          {isAuthenticated && <div hidden={!building}>{opened && <Huddle key="signed-in" />}</div>}
        </>
      )}
      <footer className="sr-only">
        You choose your goal and action. Calculations use confirmed figures;
        estimates remain visible.
      </footer>
    </>
  );
}
