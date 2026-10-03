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
async function confirm() {
  fireEvent.click(screen.getByRole("button", { name: "Confirm", exact: true }));
}
test("FINISH UI: confirmed facts → 62.5% formula → chosen goal → dated action → logout/login remembers commitment (mock providers)", async () => {
  const s1 = {
    concern: "Cash is tight because customers have not paid",
    facts: [fact("customer_receivables", "Customer receivables", 800000)],
    goal: null,
    action: null,
    outcome: null,
  };
  const s2 = {
    ...s1,
    facts: [
      ...s1.facts,
      fact("overdue_receivables", "Overdue receivables", 500000),
    ],
  };
  const s3 = {
    ...s2,
    goal: { text: "Collect ₹3 lakh this month", targetDate: "2026-10-31" },
  };
  const s4 = {
    ...s3,
    action: {
      text: "Call five largest overdue customers",
      dueDate: "2026-10-09",
    },
  };
  state.replies = [
    { text: "Please review your current customer receivables.", proposal: s1 },
    { text: "How much is overdue?", proposal: null },
    { text: "Please review your overdue balance.", proposal: s2 },
    { text: "What would you like to achieve?", proposal: null },
    { text: "Please review your chosen goal.", proposal: s3 },
    { text: "What action will you take, and by when?", proposal: null },
    { text: "Please review your chosen action and date.", proposal: s4 },
  ];
  render(<App />);
  await login();
  await send(
    "Customers have not paid; current business receivables are around eight lakh.",
  );
  await screen.findByRole("heading", { name: "I understood" });
  expect(state.saveCalls).toBe(0);
  await confirm();
  await screen.findByText("How much is overdue?");
  await send("Around five lakh is overdue now.");
  await screen.findByText("Please review your overdue balance.");
  expect(screen.queryByText(/62.5% of your receivables/)).toBeNull();
  await confirm();
  await screen.findByText(/62.5% of your receivables/);
  expect(state.saveCalls).toBe(2);
  await send("I choose to collect three lakh this month.");
  await screen.findByText("Please review your chosen goal.");
  await confirm();
  await screen.findByText("What action will you take, and by when?");
  await send("Call my five biggest overdue customers by 9 October 2026.");
  await screen.findByText("Please review your chosen action and date.");
  await confirm();
  await screen.findByText(
    "Your Huddle is complete. You have chosen your goal and dated action. Your confirmed summary is saved below.",
  );
  expect(state.saved.complete).toBe(true);
  expect(state.saved.content.action).toEqual(s4.action);
  expect(state.saveCalls).toBe(4);
  fireEvent.click(screen.getByRole("button", { name: "Log out" }));
  await screen.findByRole("heading", { name: "Start your Money Huddle" });
  expect(screen.queryByText("Customer receivables")).toBeNull();
  await login();
  await screen.findByText(
    /Last time your goal was: Collect ₹3 lakh this month.*What happened/,
  );
  expect(
    screen.queryByText(
      "What's the one financial issue on your mind right now?",
    ),
  ).toBeNull();
});
test("edit corrects a proposed number; failed save preserves proposal; retry saves only confirmed correction (mock providers)", async () => {
  state.signedIn = true;
  const content = {
    concern: "Outstanding customers",
    facts: [fact("customer_receivables", "Customer receivables", 800000)],
    goal: null,
    action: null,
    outcome: null,
  };
  state.replies = [
    { text: "Review the amount.", proposal: content },
    { text: "What would you like to achieve?", proposal: null },
  ];
  render(<App />);
  await screen.findByLabelText("Review your words, or type instead");
  await send("About eight lakh is due.");
  await screen.findByText("Review the amount.");
  fireEvent.click(screen.getByRole("button", { name: "Edit", exact: true }));
  fireEvent.change(screen.getByLabelText("Amount in rupees"), {
    target: { value: "850000" },
  });
  state.failSave = true;
  await confirm();
  await screen.findByRole("alert");
  expect(state.saved).toBeNull();
  expect(screen.getByLabelText("Amount in rupees").value).toBe("850000");
  state.failSave = false;
  await confirm();
  await waitFor(() =>
    expect(state.saved?.content.facts[0].amount).toBe(850000),
  );
});
test("blank answers and answers without processing consent never reach the coach (mock providers)", async () => {
  state.signedIn = true;
  render(<App />);
  await screen.findByLabelText("Review your words, or type instead");
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await screen.findByRole("dialog", { name: "Before your first message" });
  expect(state.replies).toHaveLength(0);
  fireEvent.click(screen.getByRole("button", { name: "I understand — continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await screen.findByText("Speak or type an answer first.");
  expect(state.saveCalls).toBe(0);
});

 test("conversation has one composer, discreet privacy controls and explicit first-use consent", async () => {
  state.signedIn = true;
  render(<App />);
  await screen.findByLabelText("Review your words, or type instead");
  expect(screen.getAllByRole("textbox")).toHaveLength(1);
  expect(screen.queryByText("Saved Huddle")).toBeNull();
  expect(screen.getByRole("button", { name: "Record voice message" })).toBeTruthy();
  expect(screen.queryByRole("checkbox")).toBeNull();
  expect(screen.getByText("Privacy & data")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Review your words, or type instead"), { target: { value: "Fictional test concern" } });
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await screen.findByRole("dialog", { name: "Before your first message" });
  expect(screen.getByLabelText("Review your words, or type instead").value).toBe("Fictional test concern");
  expect(state.saveCalls).toBe(0);
  fireEvent.click(screen.getByRole("button", { name: "Not now" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
