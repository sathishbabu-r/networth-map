// This checks the UI with mocked Google/AI services. It does not prove real provider connections.
// @vitest-environment jsdom
import React from "react";
import { test, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { getFunctionName } from "convex/server";
const state = vi.hoisted(() => ({
  signedIn: false,
  saved: null,
  listeners: new Set(),
  replies: [],
  saveCalls: 0,
  failSave: false,
}));
function notify() {
  for (const fn of state.listeners) fn();
}
const actions = {
  "coach:status": async () => ({ google: true, coach: true, speech: true }),
  "coach:reply": async () => {
    const r = state.replies.shift();
    if (!r) throw Error("Missing mock reply");
    return { ...r, revision: state.saved?.revision ?? 0, error: null };
  },
  "speech:ready": async () => true,
  "speech:transcribe": async () => ({ text: "eight lakh", error: null }),
};
const mutations = {
  "huddles:save": async ({ content, expectedRevision }) => {
    if (state.failSave) throw Error("Could not save. Try again.");
    expect(expectedRevision).toBe(state.saved?.revision ?? 0);
    state.saveCalls++;
    state.saved = {
      content,
      revision: expectedRevision + 1,
      complete: Boolean(content.action && content.goal && content.facts.length),
    };
    notify();
    return state.saved.revision;
  },
  "huddles:remove": async () => {
    state.saved = null;
    notify();
  },
};
vi.mock("convex/react", async () => {
  const React = await import("react");
  const subscribe = (fn) => {
    state.listeners.add(fn);
    return () => state.listeners.delete(fn);
  };
  return {
    useConvexAuth: () => ({
      isAuthenticated: React.useSyncExternalStore(
        subscribe,
        () => state.signedIn,
      ),
      isLoading: false,
    }),
    useQuery: () => React.useSyncExternalStore(subscribe, () => state.saved),
    useAction: (ref) => actions[getFunctionName(ref)],
    useMutation: (ref) => mutations[getFunctionName(ref)],
    useConvex: () => ({
      query: async () => ({ page: [], isDone: true, continueCursor: "" }),
    }),
  };
});
const authActions = {
  signIn: async () => {
    state.signedIn = true;
    notify();
  },
  signOut: async () => {
    state.signedIn = false;
    notify();
  },
};
vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => authActions,
}));
import { App } from "../src/App.jsx";
beforeEach(() => {
  state.signedIn = false;
  state.saved = null;
  state.replies = [];
  state.saveCalls = 0;
  state.failSave = false;
  Element.prototype.scrollIntoView = () => {};
});
afterEach(cleanup);
const fact = (key, label, amount) => ({
  key,
  label,
  amount,
  kind: "estimate",
  lower: null,
  upper: null,
  scope: "business",
  period: "point_in_time",
  currency: "INR",
  asOf: "2026-10-03",
  note: "Current balances",
});
async function login() {
  fireEvent.click(
    await screen.findByRole("button", { name: "Continue with Google" }),
  );
  await screen.findByLabelText("Review your words, or type instead");
}
async function send(text) {
  fireEvent.change(
    screen.getByLabelText("Review your words, or type instead"),
    { target: { value: text } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  const consent = screen.queryByRole("button", { name: "I understand — continue" });
  if (consent) {
    fireEvent.click(consent);
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  }
}
test("FINISH UI: automatically remembered facts → formula → goal → action → logout/login (mock providers)", async () => {
  const s1 = { concern: "Fictional overdue customers", facts: [fact("customer_receivables", "Customer receivables", 800000)], goal: null, action: null, outcome: null };
  const s2 = { ...s1, facts: [...s1.facts, fact("overdue_receivables", "Overdue receivables", 500000)] };
  const s3 = { ...s2, goal: { text: "Collect ₹3 lakh this month", targetDate: "2026-10-31" } };
  const s4 = { ...s3, action: { text: "Call five largest overdue customers", dueDate: "2026-10-09" } };
  state.replies = [
    { text: "Review receivables", proposal: s1 }, { text: "How much is overdue?", proposal: null },
    { text: "Review overdue balance", proposal: s2 }, { text: "What would you like to achieve?", proposal: null },
    { text: "Review goal", proposal: s3 }, { text: "What's one action this week?", proposal: null },
    { text: "Review action", proposal: s4 },
  ];
  render(<App />); await login();
  await send("Fictional current business receivables are around eight lakh.");
  await screen.findByText("How much is overdue?");
  expect(state.saveCalls).toBe(1);
  expect(screen.queryByRole("heading", { name: "I understood" })).toBeNull();
  await send("Around five lakh is overdue now.");
  await screen.findByText(/62.5% of your receivables/);
  await send("I choose to collect three lakh this month.");
  await screen.findByText("What's one action this week?");
  await send("Call my five biggest overdue customers by 9 October 2026.");
  await screen.findByText(/This week: Call five largest overdue customers/);
  expect(state.saved.complete).toBe(true);
  expect(state.saved.content.action).toEqual(s4.action);
  expect(state.saveCalls).toBe(4);
  fireEvent.click(screen.getByRole("button", { name: "Log out" }));
  await screen.findByRole("heading", { name: "Start your Money Huddle" });
  await login();
  await screen.findByText(/Last time your goal was: Collect ₹3 lakh this month.*What happened/);
});
test("failed automatic save keeps the answer; retry and conversational correction update memory", async () => {
  state.signedIn = true;
  const content = { concern: "Fictional receivables", facts: [fact("customer_receivables", "Customer receivables", 800000)], goal: null, action: null, outcome: null };
  const corrected = { ...content, facts: [fact("customer_receivables", "Customer receivables", 850000)] };
  state.replies = [{ text: "Review", proposal: content }, { text: "Review", proposal: content }, { text: "What would you like to achieve?", proposal: null }, { text: "Review", proposal: corrected }, { text: "What would you like to achieve next?", proposal: null }];
  render(<App />); await screen.findByLabelText("Review your words, or type instead");
  state.failSave = true; await send("Fictional receivables are eight lakh.");
  await screen.findByRole("alert");
  expect(state.saved).toBeNull();
  expect(screen.getByLabelText("Review your words, or type instead").value).toBe("Fictional receivables are eight lakh.");
  state.failSave = false; await send("Fictional receivables are eight lakh.");
  await screen.findByText("What would you like to achieve?");
  await send("Correction: receivables are eight lakh fifty thousand.");
  await screen.findByText("What would you like to achieve next?");
  expect(state.saved.content.facts[0].amount).toBe(850000);
  expect(state.saveCalls).toBe(2);
});
test("blank answers and answers without processing consent never reach the coach", async () => {
  state.signedIn = true; render(<App />);
  await screen.findByLabelText("Review your words, or type instead");
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await screen.findByRole("dialog", { name: "Before your first message" });
  expect(state.saveCalls).toBe(0);
  fireEvent.click(screen.getByRole("button", { name: "I understand — continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await screen.findByText("Speak or type an answer first.");
});
test("one composer, privacy controls and no financial confirmation cards", async () => {
  state.signedIn = true; render(<App />);
  await screen.findByLabelText("Review your words, or type instead");
  expect(screen.getAllByRole("textbox")).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Record voice message" })).toBeTruthy();
  expect(screen.queryByRole("checkbox")).toBeNull();
  expect(screen.queryByText("Saved Huddle")).toBeNull();
  expect(screen.getByText("Privacy & data")).toBeTruthy();
});
test("a repeated saved proposal does not create another confirmation or another save", async () => {
  state.signedIn = true;
  const content = { concern: "Fictional receivables", facts: [fact("customer_receivables", "Customer receivables", 800000)], goal: null, action: null, outcome: null };
  state.replies = [{ text: "Review", proposal: content }, { text: "Confirm again", proposal: JSON.parse(JSON.stringify(content)) }];
  render(<App />); await screen.findByLabelText("Review your words, or type instead");
  await send("Fictional receivables are eight lakh.");
  await screen.findByText("What would you like to achieve?");
  expect(screen.queryByRole("heading", { name: "I understood" })).toBeNull();
  expect(screen.queryByText("Confirm again")).toBeNull();
  expect(state.saveCalls).toBe(1);
});
