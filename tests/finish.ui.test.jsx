import { emptyMap } from "../shared/map-engine";
// This checks the UI with mocked Google/AI services. It does not prove real provider connections.
// @vitest-environment jsdom
import React from "react";
import { test, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  within,
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
  "productInsights:track": async()=>null,
  "productInsights:completeMap": async()=>"test-completion",
  "productInsights:submitFeedback": async()=>null,
  "productInsights:submitCompletedMapEmail": async()=>({emailStatus:"created"}),
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
    useQuery: (ref) => {
      const saved = React.useSyncExternalStore(subscribe, () => state.saved);
      return getFunctionName(ref) === "huddles:history" ? { page: [], isDone: true, continueCursor: "" } : saved;
    },
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
  Element.prototype.scrollTo = () => {};
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
async function openMap() {
  fireEvent.click(await screen.findByRole("button", {name:"Start My Blueprint"}));
  fireEvent.click(await screen.findByRole("button", {name:"Open Money Huddle"}));
}
async function login() {
  fireEvent.click(
    await screen.findByRole("button", { name: "Build My Networth MAP" }),
  );
  await openMap();
  await screen.findByLabelText("Review your words, or type instead");
}
async function send(text) {
  await waitFor(() => expect(screen.getByRole("button", {name:"Send message"}).disabled).toBe(false));
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
  await waitFor(() => expect(screen.queryByRole("button", {name:"Confirm"}) || !screen.getByRole("button", {name:"Send message"}).disabled).toBeTruthy());
  const confirm = screen.queryByRole("button", {name:"Confirm"});
  if (confirm) fireEvent.click(confirm);
  await waitFor(() => expect(screen.queryByRole("alert") || !screen.getByRole("button", {name:"Send message"}).disabled).toBeTruthy());
}
test("FINISH UI: confirmed facts → formula → goal → action → logout/login (mock providers)", async () => {
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
  await screen.findByRole("heading", { name: /Your wealth/ });
  await login();
  await screen.findByText(/Last time your goal was: Collect ₹3 lakh this month.*What happened/);
});
test("failed confirmed save keeps the answer; retry and conversational correction update memory", async () => {
  state.signedIn = true;
  const content = { concern: "Fictional receivables", facts: [fact("customer_receivables", "Customer receivables", 800000)], goal: null, action: null, outcome: null };
  const corrected = { ...content, facts: [fact("customer_receivables", "Customer receivables", 850000)] };
  state.replies = [{ text: "Review", proposal: content }, { text: "What would you like to achieve?", proposal: null }, { text: "Review", proposal: corrected }, { text: "What would you like to achieve next?", proposal: null }];
  render(<App />); await openMap(); await screen.findByLabelText("Review your words, or type instead");
  state.failSave = true; await send("Fictional receivables are eight lakh.");
  await screen.findByRole("alert");
  expect(state.saved).toBeNull();
  expect(screen.getByLabelText("Review your words, or type instead").value).toBe("Fictional receivables are eight lakh.");
  state.failSave = false; fireEvent.click(screen.getByRole("button",{name:"Confirm"}));
  await screen.findByText("What would you like to achieve?");
  await send("Correction: receivables are eight lakh fifty thousand.");
  await screen.findByText("What would you like to achieve next?");
  expect(state.saved.content.facts[0].amount).toBe(850000);
  expect(state.saveCalls).toBe(2);
});
test("blank answers and answers without processing consent never reach the coach", async () => {
  state.signedIn = true; render(<App />); await openMap();
  await screen.findByLabelText("Review your words, or type instead");
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await screen.findByRole("dialog", { name: "Before your first message" });
  expect(state.saveCalls).toBe(0);
  fireEvent.click(screen.getByRole("button", { name: "I understand — continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await screen.findByText("Speak or type an answer first.");
});
test("one composer, privacy controls and no financial confirmation cards", async () => {
  state.signedIn = true; render(<App />); await openMap();
  await screen.findByLabelText("Review your words, or type instead");
  const thread = within(screen.getByRole("region", {name:"Conversation with your coach"}));
  expect(thread.getAllByRole("textbox")).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Record voice message" })).toBeTruthy();
  expect(thread.queryByRole("checkbox")).toBeNull();
  expect(screen.queryByText("Saved Huddle")).toBeNull();
  expect(screen.getByText("Privacy & data")).toBeTruthy();
});
test("a repeated saved proposal does not create another confirmation or another save", async () => {
  state.signedIn = true;
  const content = { concern: "Fictional receivables", facts: [fact("customer_receivables", "Customer receivables", 800000)], goal: null, action: null, outcome: null };
  state.replies = [{ text: "Review", proposal: content }, { text: "Confirm again", proposal: JSON.parse(JSON.stringify(content)) }];
  render(<App />); await openMap(); await screen.findByLabelText("Review your words, or type instead");
  await send("Fictional receivables are eight lakh.");
  await screen.findByText("What would you like to achieve?");
  expect(screen.queryByRole("heading", { name: "I understood" })).toBeNull();
  expect(screen.queryByText("Confirm again")).toBeNull();
  expect(state.saveCalls).toBe(1);
});

test("chat fills the live MAP and the progress view shows the remembered dated action",async()=>{
 state.signedIn=true;const map=emptyMap();map.data.monthlyNeeds="90000";map.data.monthlyWants="30000";map.covered=["spend"];map.step=4;
 const content={concern:"Fictional spending review",facts:[fact("income","Income",200000)],goal:null,action:null,outcome:null,map};
 state.replies=[{text:"Review",proposal:content},{text:"How much do you invest each year?",proposal:null}];render(<App />);await openMap();await screen.findByLabelText("Review your words, or type instead");
 await send("My needs are ninety thousand and wants are thirty thousand per month.");await screen.findByText("How much do you invest each year?");expect(screen.getByRole("region",{name:"Your Networth MAP"})).toBeTruthy();expect(screen.getByDisplayValue("90,000")).toBeTruthy();expect(screen.getByDisplayValue("30,000")).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:"Daily progress",exact:true}));expect(screen.getByText("Your first dated action will start this record.")).toBeTruthy();
});

test("a financial correction keeps the remembered action and continues the conversation without repeating its summary",async()=>{
 state.signedIn=true;const map=emptyMap();map.step=4;map.data.monthlyNeeds="50000";
 const content={concern:"Spending clarity",facts:[fact("income","Income",200000)],goal:{text:"Understand spending",targetDate:null},action:{dueDate:"2026-10-10",text:"Review spending"},outcome:null,map};
 state.saved={content,revision:1,complete:true};
 const corrected={...content,action:{text:"Review spending",dueDate:"2026-10-10"},map:{...map,data:{...map.data,monthlyNeeds:"60000"}}};
 state.replies=[{text:"Your needs are updated.",proposal:corrected},{text:"How much do you invest each year?",proposal:null}];
 render(<App/>);await openMap();await screen.findByLabelText("Review your words, or type instead");await send("Correction: my monthly needs are sixty thousand.");
 await screen.findByText("How much do you invest each year?");expect(state.saved.content.action).toEqual(content.action);expect(screen.queryByText(/^Your goal:/)).toBeNull();expect(state.saveCalls).toBe(1);
});

 test("Networth MAP home leads into Huddle and home navigation preserves the draft", async () => {
  state.signedIn=true; render(<App />);
  expect(await screen.findByRole("heading",{name:"Your best estimates are enough."})).toBeTruthy();
  expect(screen.getByRole("dialog",{name:"Your best estimates are enough."})).toBeTruthy();
  await openMap();
  expect(screen.getByRole("heading",{name:"Money Huddle"})).toBeTruthy();
  expect(screen.queryByRole("button",{name:/Build My Networth Map/i})).toBeNull();
  expect(screen.getByRole("heading",{name:"What income do you take home?"})).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Review your words, or type instead"),{target:{value:"My next step"}});
  fireEvent.click(screen.getByRole("link",{name:"Networth MAP"}));
  fireEvent.click(screen.getByRole("button",{name:"Continue My MAP"}));
  expect(screen.getByDisplayValue("My next step")).toBeTruthy();
});

test("public MAP home starts Google sign-in before showing Start My Blueprint", async () => {
 render(<App />);
 expect(screen.getByRole("heading",{name:/Your wealth/})).toBeTruthy();
 expect(screen.queryByRole("button",{name:"Start My Blueprint"})).toBeNull();
 fireEvent.click(await screen.findByRole("button",{name:"Build My Networth MAP"}));
 expect(await screen.findByRole("button",{name:"Start My Blueprint"})).toBeTruthy();
 expect(screen.queryByRole("heading",{name:/Your wealth/})).toBeNull();
 expect(screen.getByRole("heading",{name:"Your best estimates are enough."})).toBeTruthy();
 expect(screen.getByRole("dialog",{name:"Your best estimates are enough."})).toBeTruthy();
});

test("floating Money Huddle keeps the current MAP, conversation draft and pending review when minimised", async()=>{
 state.signedIn=true;const map=emptyMap();map.step=4;map.data.monthlyNeeds="50000";
 state.saved={content:{concern:"Spending",facts:[],goal:null,action:null,outcome:null,map},revision:1,complete:false};
 render(<App/>);await openMap();
 expect(screen.getByText("Your Vision. Your Wealth. Your Next Move.")).toBeTruthy();
 fireEvent.change(screen.getByLabelText("Review your words, or type instead"),{target:{value:"Draft to keep"}});
 fireEvent.click(screen.getByRole("button",{name:"Minimise Money Huddle"}));
 expect(screen.queryByRole("region",{name:"Conversation with your coach"})).toBeNull();
 expect(screen.getByRole("heading",{name:"What does your life cost?"})).toBeTruthy();
 expect(screen.getByDisplayValue("50,000")).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:"Open Money Huddle"}));
 expect(screen.getByDisplayValue("Draft to keep")).toBeTruthy();expect(state.saveCalls).toBe(0);
});

test("MAP financial facts are not saved before Confirm; Edit discards the proposal and allows correction",async()=>{
 state.signedIn=true;const map=emptyMap();map.data.monthlyNeeds="50000";
 const content={concern:"Spending",facts:[],goal:null,action:null,outcome:null,map};
 state.replies=[{text:"Review",proposal:content},{text:"Review corrected needs",proposal:{...content,map:{...map,data:{...map.data,monthlyNeeds:"60000"}}}},{text:"What matters most for your vision?",proposal:null}];
 render(<App/>);await openMap();
 const input=screen.getByLabelText("Review your words, or type instead");
 fireEvent.change(input,{target:{value:"Needs are fifty thousand per month"}});fireEvent.click(screen.getByRole("button",{name:"Send message"}));
 fireEvent.click(await screen.findByRole("button",{name:"I understand — continue"}));fireEvent.click(screen.getByRole("button",{name:"Send message"}));
 await screen.findByRole("button",{name:"Confirm"});expect(state.saveCalls).toBe(0);expect(state.saved).toBeNull();
 fireEvent.click(screen.getByRole("button",{name:"Edit"}));
 await send("Correction: my needs are sixty thousand per month.");
 expect(state.saved.content.map.data.monthlyNeeds).toBe("60000");expect(state.saveCalls).toBe(1);
});

 test("unavailable Google sign-in explains the disabled start immediately below it", async () => {
 const original = actions["coach:status"];
 actions["coach:status"] = async () => ({google:false,coach:true,speech:true});
 try {
 render(<App />);
 const message = await screen.findByText("Google sign-in is temporarily unavailable. Please try again shortly.");
 const start = screen.getByRole("button",{name:"Build My Networth MAP"});
 expect(start.disabled).toBe(true);
 expect(start.nextElementSibling).toBe(message);
 expect(start.getAttribute("aria-describedby")).toBe(message.id);
 } finally { actions["coach:status"] = original; }
 });

test("a browser that stays on the start page gets a direct Google continuation link", async () => {
 const original = authActions.signIn;
 const redirect = new URL("https://example.convex.site/api/auth/signin/google?code=test");
 authActions.signIn = async () => ({signingIn:false,redirect});
 try {
 render(<App />);
 const start = screen.getByRole("button",{name:"Build My Networth MAP"});
 await waitFor(() => expect(start.disabled).toBe(false));
 fireEvent.click(start);
 const link = await screen.findByRole("link",{name:"Continue to Google"});
 expect(link.getAttribute("href")).toBe(redirect.toString());
 expect(link.getAttribute("target")).toBeNull();
 expect(link.parentElement.previousElementSibling).toBe(start);
 } finally {authActions.signIn = original;}
});
