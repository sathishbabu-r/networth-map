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
import { calculateInsights } from "../shared/financial.mjs";
import "./style.css";
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
const opening = "What's the one financial issue on your mind right now?";
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
function Snapshot({ content, complete }) {
  return (
    <div className="snapshot">
      <h2>{complete ? "Your Money Huddle" : "Your confirmed snapshot"}</h2>
      <p>{content.concern}</p>
      {content.facts.length ? (
        content.facts.map((f) => (
          <div className="fact" key={f.key + f.scope + f.period}>
            <strong>{f.label}</strong>
            <p>
              {factValue(f)} ·{" "}
              {f.kind === "exact"
                ? "Exact"
                : f.kind === "estimate"
                  ? "Estimate"
                  : f.kind === "range"
                    ? "Range"
                    : "Unknown"}
            </p>
            <small>
              {f.scope} · {f.period.replaceAll("_", " ")} ·{" "}
              {f.asOf || "Timing unknown"}
              {f.note && ` · ${f.note}`}
            </small>
          </div>
        ))
      ) : (
        <p>No financial figures confirmed yet.</p>
      )}
      <Insights facts={content.facts} />
      <h3>Your goal</h3>
      <p>
        {content.goal?.text || "You will choose one goal."}
        {content.goal?.targetDate && ` · ${content.goal.targetDate}`}
      </p>
      <h3>This week's action</h3>
      <p>
        {content.action?.text || "You will choose one practical action."}
        {content.action && (
          <>
            <br />
            <strong>By {content.action.dueDate}</strong>
          </>
        )}
      </p>
      {content.outcome && (
        <>
          <h3>What happened</h3>
          <p>Action: {content.outcome.actionStatus.replaceAll("_", " ")}</p>
          <p>Outcome: {content.outcome.text}</p>
          <p>
            {content.outcome.amount === null
              ? "No realised amount recorded."
              : `${money(content.outcome.amount)} · ${content.outcome.impactType.replaceAll("_", " ")}`}{" "}
            · {content.outcome.occurredOn}
          </p>
        </>
      )}
    </div>
  );
}
function Proposal({ proposal, setProposal, onConfirm, onCancel, busy }) {
  const [editing, setEditing] = useState(false);
  const change = (key, value) =>
    setProposal({
      ...proposal,
      content: { ...proposal.content, [key]: value },
    });
  const c = proposal.content;
  return (
    <div className="proposal" aria-label="Review what I understood">
      <h2>Review what I understood</h2>
      <p>
        Only confirm information that matches what you meant. Estimates stay
        estimates.
      </p>
      {editing ? (
        <div>
          <label>
            Your issue
            <input
              value={c.concern}
              onChange={(e) => change("concern", e.target.value)}
            />
          </label>
          {c.facts.map((f, index) => {
            const update = (patch) =>
              change(
                "facts",
                c.facts.map((a, j) => (j === index ? { ...a, ...patch } : a)),
              );
            return (
              <fieldset key={index}>
                <legend>{f.label}</legend>
                <label>
                  Entry name
                  <input
                    value={f.label}
                    onChange={(e) => update({ label: e.target.value })}
                  />
                </label>
                <label>
                  How certain is this?
                  <select
                    value={f.kind}
                    onChange={(e) =>
                      update({
                        kind: e.target.value,
                        amount: ["unknown", "range"].includes(e.target.value)
                          ? null
                          : (f.amount ?? 0),
                        lower:
                          e.target.value === "range" ? (f.lower ?? 0) : null,
                        upper:
                          e.target.value === "range" ? (f.upper ?? 0) : null,
                      })
                    }
                  >
                    {["exact", "estimate", "range", "unknown"].map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </label>
                {["exact", "estimate"].includes(f.kind) && (
                  <label>
                    Amount in rupees
                    <input
                      type="number"
                      min="0"
                      value={f.amount ?? ""}
                      onChange={(e) =>
                        update({
                          amount:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      }
                    />
                  </label>
                )}
                {f.kind === "range" && (
                  <>
                    <label>
                      Low amount
                      <input
                        type="number"
                        min="0"
                        value={f.lower ?? ""}
                        onChange={(e) =>
                          update({
                            lower:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <label>
                      High amount
                      <input
                        type="number"
                        min="0"
                        value={f.upper ?? ""}
                        onChange={(e) =>
                          update({
                            upper:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                    </label>
                  </>
                )}
                <label>
                  Whose finances?
                  <select
                    value={f.scope}
                    onChange={(e) => update({ scope: e.target.value })}
                  >
                    {["personal", "business", "shared"].map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Period
                  <select
                    value={f.period}
                    onChange={(e) => update({ period: e.target.value })}
                  >
                    {["monthly", "annual", "point_in_time"].map((k) => (
                      <option key={k} value={k}>
                        {k.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Date or period
                  <input
                    value={f.asOf}
                    placeholder="YYYY-MM-DD, YYYY-MM or YYYY"
                    onChange={(e) => update({ asOf: e.target.value })}
                  />
                </label>
                <label>
                  Notes
                  <input
                    value={f.note}
                    onChange={(e) => update({ note: e.target.value })}
                  />
                </label>
              </fieldset>
            );
          })}
          {c.goal && (
            <>
              <label>
                Your goal
                <textarea
                  value={c.goal.text}
                  onChange={(e) =>
                    change("goal", { ...c.goal, text: e.target.value })
                  }
                />
              </label>
              <label>
                Goal date, if chosen
                <input
                  type="date"
                  value={c.goal.targetDate || ""}
                  onChange={(e) =>
                    change("goal", {
                      ...c.goal,
                      targetDate: e.target.value || null,
                    })
                  }
                />
              </label>
            </>
          )}
          {c.action && (
            <>
              <label>
                Your chosen action
                <textarea
                  value={c.action.text}
                  onChange={(e) =>
                    change("action", { ...c.action, text: e.target.value })
                  }
                />
              </label>
              <label>
                Action due date
                <input
                  type="date"
                  value={c.action.dueDate}
                  onChange={(e) =>
                    change("action", { ...c.action, dueDate: e.target.value })
                  }
                />
              </label>
            </>
          )}
          {c.outcome && (
            <>
              <label>
                Action status
                <select
                  value={c.outcome.actionStatus}
                  onChange={(e) =>
                    change("outcome", {
                      ...c.outcome,
                      actionStatus: e.target.value,
                    })
                  }
                >
                  {["completed", "partial", "not_done"].map((k) => (
                    <option key={k} value={k}>
                      {k.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                What happened
                <textarea
                  value={c.outcome.text}
                  onChange={(e) =>
                    change("outcome", { ...c.outcome, text: e.target.value })
                  }
                />
              </label>
              <label>
                Realised amount, if any
                <input
                  type="number"
                  min="0"
                  value={c.outcome.amount ?? ""}
                  onChange={(e) =>
                    change("outcome", {
                      ...c.outcome,
                      amount:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Financial impact
                <select
                  value={c.outcome.impactType}
                  onChange={(e) =>
                    change("outcome", {
                      ...c.outcome,
                      impactType: e.target.value,
                    })
                  }
                >
                  {[
                    "none",
                    "receivables_collection",
                    "income",
                    "expense_reduction",
                    "debt_repayment",
                    "savings_allocation",
                  ].map((k) => (
                    <option key={k} value={k}>
                      {k.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Outcome date
                <input
                  type="date"
                  value={c.outcome.occurredOn}
                  onChange={(e) =>
                    change("outcome", {
                      ...c.outcome,
                      occurredOn: e.target.value,
                    })
                  }
                />
              </label>
            </>
          )}
        </div>
      ) : (
        <div>
          <p>
            <strong>Issue:</strong> {c.concern}
          </p>
          {c.facts.map((f) => (
            <div className="fact" key={f.key + f.scope + f.period}>
              <strong>
                {f.label}: {factValue(f)}
              </strong>
              <p>
                {f.kind} · {f.scope} · {f.period.replaceAll("_", " ")} ·{" "}
                {f.asOf || "Timing unknown"}
              </p>
              {f.note && <small>{f.note}</small>}
            </div>
          ))}
          {c.goal && (
            <p>
              <strong>Your goal:</strong> {c.goal.text}
              {c.goal.targetDate && ` · ${c.goal.targetDate}`}
            </p>
          )}
          {c.action && (
            <p>
              <strong>Your action:</strong> {c.action.text}
              <br />
              By {c.action.dueDate}
            </p>
          )}
          {c.outcome && (
            <>
              <p>
                <strong>Action:</strong>{" "}
                {c.outcome.actionStatus.replaceAll("_", " ")}
              </p>
              <p>
                <strong>Outcome:</strong> {c.outcome.text}
              </p>
              <p>
                <strong>Financial impact:</strong>{" "}
                {c.outcome.amount === null
                  ? "No realised amount"
                  : money(c.outcome.amount)}{" "}
                · {c.outcome.impactType.replaceAll("_", " ")} ·{" "}
                {c.outcome.occurredOn}
              </p>
            </>
          )}
        </div>
      )}
      <div className="controls">
        <button
          disabled={busy}
          className="secondary"
          onClick={() => setEditing(!editing)}
        >
          {editing ? "Finish editing" : "Edit"}
        </button>
        <button disabled={busy} onClick={onConfirm}>
          {busy
            ? "Saving…"
            : c.action
              ? "Confirm and commit"
              : "Confirm and save"}
        </button>
      </div>
      <button className="text-button" disabled={busy} onClick={onCancel}>
        Not what I meant — explain again
      </button>
    </div>
  );
}
function Composer({ onSend, busy, consent, setConsent }) {
  const input = useRef(),
    send = useRef(),
    voiceBox = useRef(),
    voice = useRef();
  const ready = useAction(api.speech.ready),
    transcribe = useAction(api.speech.transcribe);
  useEffect(() => {
    voice.current = attachVoice(voiceBox.current, input.current, send.current, {
      ready: () => ready({}),
      transcribe,
    });
    return () => voice.current?.dispose();
  }, [ready, transcribe]);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        const ok = await onSend(input.current.value.trim());
        if (ok) {
          input.current.value = "";
          voice.current.clearRecording();
        }
        input.current.focus();
      }}
    >
      <fieldset disabled={busy} className="composer">
        <div ref={voiceBox} />
        <label htmlFor="answer">Review your words, or type instead</label>
        <textarea
          ref={input}
          id="answer"
          rows="3"
          maxLength="5000"
          placeholder="Tell me what’s on your mind…"
        />
        <label className="voice-consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />{" "}
          I understand how this conversation is processed
        </label>
        <div className="controls">
          <button type="submit" ref={send}>
            {busy ? "Your coach is thinking…" : "Send to coach"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
function Huddle() {
  const saved = useQuery(api.huddles.current, {});
  const reply = useAction(api.coach.reply),
    save = useMutation(api.huddles.save),
    remove = useMutation(api.huddles.remove);
  const client = useConvex();
  const [messages, setMessages] = useState([]),
    [proposal, setProposal] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [consent, setConsent] = useState(false),
    [showSummary, setShowSummary] = useState(false),
    [notice, setNotice] = useState(""),
    [deleting, setDeleting] = useState(false);
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
              ? `Welcome back. I have your confirmed snapshot${saved.content.goal ? ` and goal: ${saved.content.goal.text}` : ""}. ${saved.content.goal ? "What's one realistic action you can take this week?" : "What would you like to achieve from here?"}`
              : opening,
        },
      ]);
    }
  }, [saved]);
  useEffect(() => {
    log.current?.lastElementChild?.scrollIntoView({ block: "nearest" });
  }, [messages, proposal]);
  async function ask(next) {
    const r = await reply({ messages: next, today: today() });
    if (r.error) throw Error(r.error);
    setMessages([...next, { role: "assistant", content: r.text }]);
    setProposal(
      r.proposal ? { content: r.proposal, revision: r.revision } : null,
    );
  }
  async function onSend(text) {
    setError("");
    setNotice("");
    if (!consent) {
      setError("Read the processing note and tick the box before sending.");
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
  async function confirm() {
    setBusy(true);
    setError("");
    let didSave = false;
    try {
      await save({
        content: proposal.content,
        expectedRevision: proposal.revision,
      });
      didSave = true;
      const state = proposal.content;
      setProposal(null);
      setNotice("Confirmed information saved to your account.");
      const next = [
        ...messages,
        {
          role: "user",
          content:
            "I confirm the reviewed information: " + JSON.stringify(state),
        },
      ];
      if (state.action && !state.outcome) {
        setMessages([
          ...next,
          {
            role: "assistant",
            content:
              "Your Huddle is complete. You have chosen your goal and dated action. Your confirmed summary is saved below.",
          },
        ]);
        setShowSummary(true);
      } else if (state.outcome) {
        setMessages([
          ...next,
          {
            role: "assistant",
            content:
              "Your update is confirmed. Action completion and realised financial impact are recorded separately.",
          },
        ]);
        setShowSummary(true);
      } else {
        setMessages(next);
        await ask(next);
      }
    } catch (e) {
      setError(
        didSave
          ? "Your information was saved, but the next reply failed. You can continue by typing."
          : e.message || "Could not save. Please try again.",
      );
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
      const blob = new Blob(
        [JSON.stringify({ confirmed: saved, changes: history }, null, 2)],
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
  if (saved === undefined)
    return <p role="status">Loading your saved Huddle…</p>;
  return (
    <main className="conversation">
      <aside>
        <h1>Let’s talk about your money.</h1>
        <p>One issue. One goal you choose. One practical next step.</p>
        {saved && (
          <Snapshot content={saved.content} complete={saved.complete} />
        )}
      </aside>
      <section aria-label="Conversation with your coach">
        <h2>
          {saved?.complete ? "Your next Money Huddle" : "Your Money Huddle"}
        </h2>
        <div className="processing-note">
          <details>
            <summary>How your information is processed and saved</summary>
            <p>
              Your answers are processed by Convex and the AI provider. Voice
              recordings are sent through Convex to OpenAI for transcription. We
              save only the financial context and commitments you confirm, along
              with previous confirmed versions, in your account. This app does
              not save raw audio or the full conversation. Unsaved conversation
              and drafts disappear when this tab closes. Provider retention has
              not been verified. Export or delete your saved Huddle below.
            </p>
          </details>
        </div>
        <div id="messages" ref={log} role="log" aria-live="polite">
          {messages.map((m, i) => (
            <article key={i} className={"message " + m.role}>
              <p className="speaker">
                {m.role === "user" ? "You" : "Money Huddle"}
              </p>
              <p>
                {m.content.startsWith("I confirm the reviewed information:")
                  ? "I confirm the reviewed information."
                  : m.content}
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
        {proposal ? (
          <Proposal
            proposal={proposal}
            setProposal={setProposal}
            busy={busy}
            onConfirm={confirm}
            onCancel={() => {
              setProposal(null);
              setMessages([
                ...messages,
                {
                  role: "assistant",
                  content:
                    "Nothing from that proposal was saved. What should I correct?",
                },
              ]);
            }}
          />
        ) : showSummary && saved ? (
          <>
            <Snapshot content={saved.content} complete={saved.complete} />
            <button
              onClick={() => {
                setShowSummary(false);
                setMessages([
                  ...messages,
                  {
                    role: "assistant",
                    content: `Your commitment is ${saved.content.action.text} by ${saved.content.action.dueDate}. What would you like to discuss?`,
                  },
                ]);
              }}
            >
              Continue the conversation
            </button>
          </>
        ) : (
          <Composer
            onSend={onSend}
            busy={busy}
            consent={consent}
            setConsent={setConsent}
          />
        )}
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
                Delete your saved snapshot, goal, action and confirmed history?
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
                    setProposal(null);
                    setShowSummary(false);
                    setDeleting(false);
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
      </section>
    </main>
  );
}
export function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const status = useAction(api.coach.status);
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
        <a className="brand" href="/">
          My Money Huddle
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
      ) : isAuthenticated ? (
        <Huddle key="signed-in" />
      ) : (
        <main>
          <aside>
            <p className="opening-line">A guided 10-minute financial clarity conversation with My Money Huddle</p>
            <h1>Your wealth.<br/>Your vision.<br/>Your next move.</h1>
            <p>Know your wealth. Define your vision. Make your next move with clarity.</p>
          </aside>
          <section className="signin">
            <h2>Start your Money Huddle</h2>
            <p>
              Sign in to keep your confirmed snapshot, goal and commitment
              private to your account.
            </p>
            <p>Estimates, ranges and “I don’t know” are welcome.</p>
            <button
              disabled={busy || !setup?.google}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await signIn("google", {
                    redirectTo: window.location.origin,
                  });
                } catch {
                  setError(
                    "Google sign-in could not start. Check the connection and retry.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Opening Google…" : "Continue with Google"}
            </button>
            {setup && !setup.google && (
              <p role="status">
                Google sign-in is waiting for the app’s Google connection to be
                configured.
              </p>
            )}
            {setup && (!setup.coach || !setup.speech) && (
              <p role="status">
                {!setup.coach ? "The AI coach is not connected yet. " : ""}
                {!setup.speech
                  ? "Voice is waiting for its speech service connection."
                  : ""}
              </p>
            )}
            <details>
              <summary>Before you start</summary>
              <p>
                Your answers are processed by Convex and an AI provider. Voice
                uses OpenAI to turn recordings into text. This app saves only
                context and commitments you confirm, plus confirmed change
                history. Raw audio and full conversations are not retained by
                this app. Provider retention has not been verified. Your
                confirmed Huddle can be exported or deleted.
              </p>
            </details>
          </section>
        </main>
      )}
      <footer>
        You choose your goal and action. Calculations use confirmed figures;
        estimates remain visible.
      </footer>
    </>
  );
}
