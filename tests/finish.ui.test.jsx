import { emptyMap, memoryFromAssessment } from "../shared/map-engine";
import { emptyAssessment } from "../shared/networth-engine";
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
    return { revision: state.saved?.revision ?? 0, error: null, ...r };
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
  window.matchMedia = () => ({matches:false});
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
  const start = await screen.findByRole("button", {name:/^(Build My Networth MAP|Continue My MAP)$/});
  await waitFor(() => expect(start.disabled).toBe(false));
  fireEvent.click(start);
  const welcome = screen.queryByRole("button", {name:"Start My Blueprint"}); if(welcome) fireEvent.click(welcome);
  fireEvent.click(await screen.findByRole("button", {name:"Ask Your Money Coach"}));
}
async function login() {
  fireEvent.click(
    await screen.findByRole("button", { name: "Build My Networth MAP" }),
  );
  await openMap();
  await screen.findByLabelText("Review your words, or type instead");
}
async function send(text,confirm=true) {
  await waitFor(() => expect(screen.getByRole("button", {name:"Send message"}).disabled).toBe(false));
  fireEvent.change(
    screen.getByLabelText("Review your words, or type instead"),
    { target: { value: text } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await waitFor(() => expect(screen.queryByRole("alert") || screen.queryByRole("button",{name:"Confirm this update"}) || !screen.getByRole("button", {name:"Send message"}).disabled).toBeTruthy());
  if(confirm && screen.queryByRole("button",{name:"Confirm this update"})){fireEvent.click(screen.getByRole("button",{name:"Confirm this update"}));await waitFor(()=>expect(screen.queryByRole("alert") || !screen.queryByRole("button",{name:"Confirm this update"})).toBeTruthy());}
}
test("FINISH UI: sent answers → goal → action → logout/login (mock providers)", async () => {
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
  await screen.findByText("What would you like to achieve?");
  expect(screen.queryByText(/62.5% of your receivables/)).toBeNull();
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
}, 15000);
test("failed save keeps the answer; Send retries and conversational correction updates memory", async () => {
  state.signedIn = true;
  const content = { concern: "Fictional receivables", facts: [fact("customer_receivables", "Customer receivables", 800000)], goal: null, action: null, outcome: null };
  const corrected = { ...content, facts: [fact("customer_receivables", "Customer receivables", 850000)] };
  state.replies = [{ text: "Review", proposal: content }, { text: "What would you like to achieve?", proposal: null }, { text: "Review", proposal: corrected }, { text: "What would you like to achieve next?", proposal: null }];
  render(<App />); await openMap(); await screen.findByLabelText("Review your words, or type instead");
  state.failSave = true; await send("Fictional receivables are eight lakh.");
  await screen.findByRole("alert");
  expect(state.saved).toBeNull();
  expect(screen.getByLabelText("Review your words, or type instead").value).toBe("Fictional receivables are eight lakh.");
  state.failSave = false;
  fireEvent.click(screen.getByRole("button",{name:"Confirm this update"}));
  await screen.findByText("What would you like to achieve?");
  await send("Correction: receivables are eight lakh fifty thousand.");
  await screen.findByText("What would you like to achieve next?");
  expect(state.saved.content.facts[0].amount).toBe(850000);
  expect(state.saveCalls).toBe(2);
});
test('rejected Coach financial figures preserve the typed message and confirmed records (mock provider)',async()=>{
 state.signedIn=true;
 state.saved={revision:7,complete:false,content:{concern:'Synthetic saved balances',facts:[fact('available_cash','Available cash',588000)],goal:null,action:null,outcome:null}};
 const original=JSON.stringify(state.saved);
 state.replies=[{text:'',proposal:null,error:"The Coach's financial figures could not be verified against your saved MAP. Your answer is still here; please retry. No financial records were changed."}];
 render(<App/>);await openMap();await screen.findByLabelText('Review your words, or type instead');
 const message='Explain my verified surplus without changing my figures.';await send(message);
 expect((await screen.findByRole('alert')).textContent).toContain('could not be verified');
 expect(screen.getByLabelText('Review your words, or type instead').value).toBe(message);
 expect(JSON.stringify(state.saved)).toBe(original);expect(state.saveCalls).toBe(0);
 expect(screen.queryByText(/720,000/)).toBeNull();
});
test('an old Coach reply arriving after a MAP update is not displayed or saved',async()=>{
 state.signedIn=true;state.saved={revision:7,complete:false,content:{concern:'Synthetic balances',facts:[fact('available_cash','Available cash',588000)],goal:null,action:null,outcome:null}};
 const original=JSON.stringify(state.saved);state.replies=[{text:'Annual surplus before investing: ₹7,20,000 (INR).',proposal:null,revision:6}];
 render(<App/>);await openMap();await screen.findByLabelText('Review your words, or type instead');await send('Explain my current surplus.');
 expect((await screen.findByRole('alert')).textContent).toContain('MAP changed');
 expect(screen.getByLabelText('Review your words, or type instead').value).toBe('Explain my current surplus.');
 expect(screen.queryByText('Annual surplus before investing: ₹7,20,000 (INR).')).toBeNull();
 expect(JSON.stringify(state.saved)).toBe(original);expect(state.saveCalls).toBe(0);
});
test("blank answers never save and the first answer sends without a disclosure popup", async () => {
  state.signedIn = true; render(<App />); await openMap();
  await screen.findByLabelText("Review your words, or type instead");
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await screen.findByText("Speak or type an answer first.");
  expect(state.saveCalls).toBe(0);
  expect(screen.queryByRole("dialog", {name:"Before your first message"})).toBeNull();
  state.replies=[{text:"What would you like to achieve?",proposal:null}];
  await send("Help me understand my spending.");
  await screen.findByText("What would you like to achieve?");
  expect(screen.queryByText("Before we talk")).toBeNull();
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
 state.signedIn=true;const map=emptyMap();Object.assign(map.data,{userType:"salaried",grossPersonalIncome:"2400000",effectiveTaxRate:"15"});map.data.monthlyNeeds="90000";map.data.monthlyWants="30000";map.covered=["spend"];map.step=4;
 const content={concern:"Fictional spending review",facts:[fact("income","Income",200000)],goal:null,action:null,outcome:null,map};
 state.replies=[{text:"Review",proposal:content},{text:"How much do you invest each year?",proposal:null}];render(<App />);await openMap();await screen.findByLabelText("Review your words, or type instead");
 await send("My needs are ninety thousand and wants are thirty thousand per month.");await screen.findByText("How much do you invest each year?");expect(screen.getByRole("region",{name:"Your Networth MAP"})).toBeTruthy();expect(screen.getByDisplayValue("90,000")).toBeTruthy();expect(screen.getByDisplayValue("30,000")).toBeTruthy();
 expect(screen.getByRole("button",{name:"Step 11: Daily Check-in"}).disabled).toBe(true);expect(screen.queryByRole("navigation",{name:"MAP views"})).toBeNull();
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
  expect(await screen.findByRole("heading",{name:/Your wealth/})).toBeTruthy();
  expect(screen.queryByRole("dialog",{name:"Your best estimates are enough."})).toBeNull();
  await openMap();
  expect(screen.getByRole("heading",{name:"Money Huddle"})).toBeTruthy();
  expect(screen.queryByRole("button",{name:/Build My Networth Map/i})).toBeNull();
  expect(screen.getByRole("heading",{name:"What is your income before tax?"})).toBeTruthy();
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
 await screen.findByRole("button",{name:"Log out"});
 expect(screen.getByRole("heading",{name:/Your wealth/})).toBeTruthy();
 expect(screen.queryByRole("button",{name:"Start My Blueprint"})).toBeNull();
 const start = screen.getByRole("button",{name:"Build My Networth MAP"});
 await waitFor(() => expect(start.disabled).toBe(false));
 fireEvent.click(start);
 expect(await screen.findByRole("button",{name:"Start My Blueprint"})).toBeTruthy();
 expect(screen.queryByRole("heading",{name:/Your wealth/})).toBeNull();
 expect(screen.getByRole("heading",{name:"Your best estimates are enough."})).toBeTruthy();
 expect(screen.getByRole("dialog",{name:"Your best estimates are enough."})).toBeTruthy();
});

test("floating Money Huddle keeps the current MAP, conversation draft and pending review when minimised", async()=>{
 state.signedIn=true;const map=emptyMap();map.step=4;Object.assign(map.data,{userType:"salaried",grossPersonalIncome:"2400000",effectiveTaxRate:"15"});map.data.monthlyNeeds="50000";
 state.saved={content:{concern:"Spending",facts:[],goal:null,action:null,outcome:null,map},revision:1,complete:false};
 render(<App/>);await openMap();
 expect(screen.getByText("Your Vision. Your Wealth. Your Next Move.")).toBeTruthy();
 fireEvent.change(screen.getByLabelText("Review your words, or type instead"),{target:{value:"Draft to keep"}});
 fireEvent.click(screen.getByRole("button",{name:"Minimise Money Huddle"}));
 expect(screen.queryByRole("region",{name:"Conversation with your coach"})).toBeNull();
 expect(screen.getByRole("heading",{name:"What does your life cost?"})).toBeTruthy();
 expect(screen.getByDisplayValue("50,000")).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:"Ask Your Money Coach"}));
 expect(screen.getByDisplayValue("Draft to keep")).toBeTruthy();expect(state.saveCalls).toBe(0);
});

test("Send stages edited MAP answers for explicit confirmation and corrections require confirmation",async()=>{
 state.signedIn=true;const map=emptyMap();map.data.monthlyNeeds="60000";
 const content={concern:"Spending",facts:[],goal:null,action:null,outcome:null,map};
 const corrected={...content,map:{...map,data:{...map.data,monthlyNeeds:"55000"}}};
 state.replies=[{text:"Review",proposal:content},{text:"What matters most for your vision?",proposal:null},{text:"Review",proposal:corrected},{text:"What would you like to do next?",proposal:null}];
 render(<App/>);await openMap();
 const input=screen.getByLabelText("Review your words, or type instead");
 fireEvent.change(input,{target:{value:"Needs are fifty thousand per month"}});
 expect(state.saveCalls).toBe(0);
 await send("Needs are sixty thousand per month",false);
 expect(state.saved).toBeNull();expect(state.saveCalls).toBe(0);
 expect(input.value).toBe("Needs are sixty thousand per month");
 fireEvent.click(screen.getByRole("button",{name:"Confirm this update"}));
 await waitFor(()=>expect(state.saveCalls).toBe(1));
 expect(state.saved.content.map.data.monthlyNeeds).toBe("60000");
 expect(state.saveCalls).toBe(1);await waitFor(()=>expect(input.value).toBe(""));
 expect(screen.queryByRole("button",{name:"Confirm"})).toBeNull();
 expect(screen.queryByLabelText("Review financial details")).toBeNull();
 expect(screen.queryByRole("heading",{name:"Insight"})).toBeNull();
 await send("Correction: my needs are fifty-five thousand per month.");
 expect(state.saved.content.map.data.monthlyNeeds).toBe("55000");expect(state.saveCalls).toBe(2);
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

test("chat remains writable when a MAP save fails, while sending waits for a successful save",async()=>{
 state.signedIn=true;state.failSave=true;render(<App/>);await openMap();
 const income=screen.getByLabelText(/Annual Income Before Tax/i,{selector:'input:not([type=range])'});
 fireEvent.change(income,{target:{value:'1200000'}});
 const input=screen.getByLabelText('Review your words, or type instead');
 expect(input.closest('fieldset').disabled).toBe(false);
 expect(input.readOnly).toBe(false);
 expect(screen.getByRole('button',{name:'Your coach is thinking'}).disabled).toBe(true);
 fireEvent.change(input,{target:{value:'I need help with my school fees'}});
 fireEvent.click(await screen.findByRole('button',{name:'Confirm financial snapshot'}));
 await screen.findByText(/Could not save. Try again./);
 expect(input.value).toBe('I need help with my school fees');
 state.failSave=false;fireEvent.click(screen.getByRole('button',{name:'Retry saving MAP'}));
 await waitFor(()=>expect(state.saveCalls).toBe(1));
 expect(input.value).toBe('I need help with my school fees');
});

test('voice transcription can be sent with Enter through the real composer',async()=>{
 const {Blob:NodeBlob}=await import('node:buffer');
 const previousMedia=Object.getOwnPropertyDescriptor(navigator,'mediaDevices');
 class Recorder {
  static isTypeSupported(){return true;}
  constructor(_stream,options){this.mimeType=options.mimeType;this.state='inactive';}
  start(){this.state='recording';}
  stop(){this.state='inactive';this.ondataavailable({data:new NodeBlob(['x'.repeat(200)])});this.onstop();}
 }
 vi.stubGlobal('MediaRecorder',Recorder);vi.stubGlobal('Blob',NodeBlob);
 Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})}});
 try{
  state.signedIn=true;state.replies=[{text:'What would you like to understand about that amount?',proposal:null}];
  render(<App/>);await openMap();
  const microphone=screen.getByRole('button',{name:'Record voice message'});
  fireEvent.click(microphone);
  const consent=screen.queryByRole('button',{name:'I understand — use voice'});
  if(consent)fireEvent.click(consent);
  await screen.findByRole('button',{name:'Stop recording'});
  fireEvent.click(screen.getByRole('button',{name:'Stop recording'}));
  const input=screen.getByLabelText('Review your words, or type instead');
  await waitFor(()=>expect(input.value).toBe('eight lakh'));
  expect(input.readOnly).toBe(false);
  fireEvent.keyDown(input,{key:'Enter',code:'Enter'});
  await screen.findByText('What would you like to understand about that amount?');
  expect(input.value).toBe('');
 }finally{
  cleanup();vi.unstubAllGlobals();
  if(previousMedia)Object.defineProperty(navigator,'mediaDevices',previousMedia);else delete navigator.mediaDevices;
 }
});

test('fresh account starts at income and personal profile without silently saving default values',async()=>{
 render(<App/>);await login();
 expect(screen.getByRole('heading',{name:'What is your income before tax?'})).toBeTruthy();
 expect(screen.getByRole('group',{name:/Select your primary income profile/})).toBeTruthy();
 expect(screen.queryByRole('heading',{name:'What do you own?'})).toBeNull();
 expect(screen.getByLabelText(/Annual Income Before Tax/i,{selector:'input:not([type=range])'}).value).toBe('');
 expect(state.saved).toBeNull();expect(state.saveCalls).toBe(0);
});

test('returning account resumes saved asset step and can revisit/edit profile without losing confirmed facts or MAP values',async()=>{
 state.signedIn=true;const map=emptyMap();map.step=2;map.covered=['earn'];
 Object.assign(map.data,{userType:'salaried',grossPersonalIncome:'1800000',effectiveTaxRate:'15',monthlyNeeds:'50000'});
 map.data.assets=[{id:'cash',description:'Synthetic savings',category:'cash',value:'300000',purpose:'personal',annualNetIncome:'0'}];
 const facts=[fact('available_cash','Synthetic cash',300000)];
 state.saved={content:{concern:'Synthetic planning',facts,goal:null,action:null,outcome:null,map},revision:1,complete:false};
 const original=structuredClone(state.saved.content);
 render(<App/>);await openMap();
 expect(screen.getByRole('heading',{name:'What do you own?'})).toBeTruthy();
 expect(state.saveCalls).toBe(0);
 fireEvent.click(screen.getByRole('button',{name:'← Back'}));
 expect(await screen.findByRole('heading',{name:'What is your income before tax?'})).toBeTruthy();
 expect(screen.getByRole('button',{name:'Salaried'}).getAttribute('aria-pressed')).toBe('true');
 await waitFor(()=>expect(state.saved.content.map.step).toBe(1));
 expect(state.saved.content.map.data).toEqual(original.map.data);
 expect(state.saved.content.facts).toEqual(facts);
 fireEvent.click(screen.getByRole('button',{name:'Professionals'}));
 fireEvent.click(await screen.findByRole('button',{name:'Confirm financial snapshot'}));
 await waitFor(()=>expect(state.saved.content.map.data.userType).toBe('professional'));
 expect(state.saved.content.map.data).toEqual({...original.map.data,userType:'professional'});
 expect(state.saved.content.facts).toEqual(facts);
});

test('a saved Step 2 with no profile opens profiling and preserves the saved MAP',async()=>{
 state.signedIn=true;const map=emptyMap();map.step=2;
 map.data.assets=[{id:'cash',description:'Synthetic asset',category:'cash',value:'100000',purpose:'personal',annualNetIncome:''}];
 state.saved={content:{concern:'Synthetic',facts:[],goal:null,action:null,outcome:null,map},revision:1,complete:false};
 render(<App/>);await openMap();
 expect(screen.queryByRole('heading',{name:'What do you own?'})).toBeNull();
 expect(screen.getByRole('group',{name:/Select your primary income profile/})).toBeTruthy();
 expect(state.saveCalls).toBe(0);
 expect(state.saved.content.map.step).toBe(2);
 expect(state.saved.content.map.data.userType).toBe('');
 expect(state.saved.content.map.data.assets).toEqual(map.data.assets);
 fireEvent.click(screen.getByRole('button',{name:'Salaried'}));
 fireEvent.click(await screen.findByRole('button',{name:'Confirm financial snapshot'}));
 await waitFor(()=>expect(state.saved.content.map.data.userType).toBe('salaried'));
 expect(state.saved.content.map.step).toBe(1);
 expect(state.saved.content.map.data).toEqual({...map.data,userType:'salaried'});
});

test('personal profile navigation is visible to returning users and does not reset the MAP',async()=>{
 state.signedIn=true;const map=emptyMap();map.step=11;
 Object.assign(map.data,{userType:'salaried',grossPersonalIncome:'1800000',effectiveTaxRate:'15',monthlyNeeds:'50000'});
 map.data.assets=[{id:'cash',description:'Synthetic savings',category:'cash',value:'300000',purpose:'personal',annualNetIncome:'0'}];
 const facts=[fact('available_cash','Synthetic cash',300000)];
 state.saved={content:{concern:'Synthetic planning',facts,goal:null,action:null,outcome:null,map},revision:1,complete:false};
 render(<App/>);await openMap();
 expect(screen.queryByRole('button',{name:'Edit Personal Profile'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Step 1: Personal Profiling, completed'}));
 expect(screen.getByRole('heading',{name:'What is your income before tax?'})).toBeTruthy();
 await waitFor(()=>expect(state.saved.content.map.step).toBe(1));
 expect(state.saved.content.map.data).toEqual(map.data);
 expect(state.saved.content.facts).toEqual(facts);
});

test('profile requires explicit valid continuation; Step 2, refresh, re-login and Back preserve all data',async()=>{
 state.signedIn=true;render(<App/>);await openMap();
 expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
 expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toContain('Personal Profiling');
 fireEvent.click(screen.getByRole('button',{name:/Add My Assets/}));
 expect(screen.queryByRole('heading',{name:'What do you own?'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Salaried'}));
 fireEvent.change(screen.getByLabelText(/Annual Income Before Tax/i,{selector:'input:not([type=range])'}),{target:{value:'1800000'}});
 fireEvent.change(screen.getByLabelText(/Effective Personal Tax Rate/i,{selector:'input:not([type=range])'}),{target:{value:'15'}});
 fireEvent.click(await screen.findByRole('button',{name:'Confirm financial snapshot'}));
 await waitFor(()=>expect(state.saved?.content.map.data.effectiveTaxRate).toBe('15'));
 expect(screen.getByRole('heading',{name:'What is your income before tax?'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:/Add My Assets/}));
 await screen.findByRole('heading',{name:'What do you own?'});
 await waitFor(()=>expect(state.saved.content.map.step).toBe(2));
 const saved=structuredClone(state.saved);
 // Remount keeps database memory while discarding page-local state, as on refresh.
 cleanup();render(<App/>);await openMap();
 expect(screen.getByRole('heading',{name:'What do you own?'})).toBeTruthy();expect(state.saved).toEqual(saved);
 fireEvent.click(screen.getByRole('button',{name:'Log out'}));await login();
 expect(screen.getByRole('heading',{name:'What do you own?'})).toBeTruthy();expect(state.saved).toEqual(saved);
 fireEvent.click(screen.getByRole('button',{name:'← Back'}));
 await screen.findByRole('heading',{name:'What is your income before tax?'});
 await waitFor(()=>expect(state.saved.content.map.step).toBe(1));
 expect(state.saved.content.map.data).toEqual(saved.content.map.data);
});


test('10-step navigation marks validated completed sections and keeps unfinished sections unchecked',async()=>{
 state.signedIn=true;const map=emptyMap();map.step=2;map.covered=['earn'];
 Object.assign(map.data,{userType:'salaried',grossPersonalIncome:'1800000',effectiveTaxRate:'15'});
 state.saved={content:{concern:'Synthetic',facts:[],goal:null,action:null,outcome:null,map},revision:1,complete:false};
 render(<App/>);await openMap();
 const nav=screen.getByRole('navigation',{name:'Your 12 steps'});
 expect(within(nav).getAllByRole('button')).toHaveLength(12);
 expect(within(nav).getByRole('button',{name:'Step 1: Personal Profiling, completed'})).toBeTruthy();
 expect(within(nav).getByRole('button',{name:'Step 2: Own'}).getAttribute('aria-current')).toBe('step');
 expect(within(nav).getByRole('button',{name:'Step 3: Owe'}).disabled).toBe(true);
 expect(within(nav).queryByRole('button',{name:/Owe, completed/})).toBeNull();
 const original=structuredClone(map.data);
 fireEvent.click(within(nav).getByRole('button',{name:'Step 1: Personal Profiling, completed'}));
 await screen.findByRole('heading',{name:'What is your income before tax?'});
 await waitFor(()=>expect(state.saved.content.map.step).toBe(1));
 expect(state.saved.content.map.data).toEqual(original);
 cleanup();render(<App/>);await openMap();
 expect(screen.getByRole('button',{name:'Step 1: Personal Profiling, completed'})).toBeTruthy();
 fireEvent.change(screen.getByLabelText(/Annual Income Before Tax/i,{selector:'input:not([type=range])'}),{target:{value:''}});
 expect(screen.queryByRole('button',{name:'Step 1: Personal Profiling, completed'})).toBeNull();
 expect(screen.getByRole('button',{name:'Step 2: Own'}).disabled).toBe(true);
});

test('an incomplete profile in saved later progress opens Personal Profiling without overwriting data',async()=>{
 state.signedIn=true;const map=emptyMap();map.step=8;map.covered=['earn','own'];
 Object.assign(map.data,{userType:'salaried',grossPersonalIncome:'',effectiveTaxRate:'15',monthlyNeeds:'50000'});
 const facts=[fact('available_cash','Synthetic cash',300000)];
 state.saved={content:{concern:'Synthetic',facts,goal:null,action:null,outcome:null,map},revision:1,complete:false};
 const original=structuredClone(state.saved);
 render(<App/>);await openMap();
 expect(screen.getByRole('heading',{name:'What is your income before tax?'})).toBeTruthy();
 expect(screen.getByRole('button',{name:'Step 1: Personal Profiling'}).getAttribute('aria-current')).toBe('step');
 expect(state.saved).toEqual(original);expect(state.saveCalls).toBe(0);
});


test('completed MAP → daily check-in → private dashboard → refresh/re-login preserves reported actions and MAP',async()=>{
 state.signedIn=true;
 const data={...emptyAssessment,userType:'salaried',grossPersonalIncome:'1800000',effectiveTaxRate:'15',assets:[{id:'cash',description:'Synthetic savings',category:'cash',value:'300000',purpose:'personal',annualNetIncome:'0'}],liabilities:[],hasNoLiabilitiesConfirmed:true,monthlyNeeds:'50000',monthlyWants:'10000',annualInvesting:'120000',visionLevel:'security',visionChoiceConfirmed:true,wealthGoals:['dreams'],wealthGoalDetails:{dreams:{description:'Travel',amount:'100000',targetYear:'2030',priority:'important',flexibility:'date'}},wealthMilestoneChoice:'not-yet',proposedActions:[]};
 const map=memoryFromAssessment(data,null,11);
 const content={concern:'Synthetic planning',facts:[],goal:null,action:null,outcome:null,map};
 state.saved={content,revision:1,complete:false};
 render(<App/>);await openMap();
 fireEvent.click(screen.getByRole('button',{name:'Minimise Money Huddle'}));
 fireEvent.click(screen.getByRole('button',{name:'Step 11: Daily Check-in'}));
 fireEvent.change(screen.getByLabelText('Your action'),{target:{value:'Reviewed recurring costs'}});
 fireEvent.change(screen.getByLabelText('What changed?'),{target:{value:'Identified an unused subscription'}});
 fireEvent.click(screen.getByRole('checkbox',{name:/I confirm this check-in/}));
 fireEvent.click(screen.getByRole('button',{name:'Save My Check-in'}));
 await screen.findByRole('heading',{name:'Your actions are becoming a story.'});
 expect(state.saved.content.map).toEqual(map);expect(state.saved.content.outcome.amount).toBeNull();expect(state.saveCalls).toBe(1);
 expect(screen.getByRole('heading',{name:'Reviewed recurring costs'})).toBeTruthy();
 const remembered=structuredClone(state.saved);
 cleanup();render(<App/>);await openMap();
 fireEvent.click(screen.getByRole('button',{name:'Minimise Money Huddle'}));
 fireEvent.click(screen.getByRole('button',{name:'Step 12: My Progress'}));
 expect(screen.getByRole('heading',{name:'Reviewed recurring costs'})).toBeTruthy();expect(state.saved).toEqual(remembered);
 fireEvent.click(screen.getByRole('button',{name:'Log out'}));await login();
 fireEvent.click(screen.getByRole('button',{name:'Minimise Money Huddle'}));
 fireEvent.click(screen.getByRole('button',{name:'Step 12: My Progress'}));
 expect(screen.getByRole('heading',{name:'Reviewed recurring costs'})).toBeTruthy();expect(state.saved).toEqual(remembered);
});

test('new user confirms a complete synthetic snapshot, then chooses exactly one goal and weekly action',async()=>{
 state.signedIn=true;
 const map=emptyMap();Object.assign(map.data,{userType:'business-owner',grossPersonalIncome:'2400000',effectiveTaxRate:'20',monthlyNeeds:'60000',monthlyWants:'30000',annualInvesting:'240000'});
 map.data.assets=[{id:'cash',category:'cash',description:'Synthetic savings',purpose:'investment',value:'5000000',annualNetIncome:'0'}];
 map.data.liabilities=[{id:'loan',type:'personal',classification:'personal',description:'Synthetic loan',value:'1000000',interestRate:'10',annualRepayment:'300000',repaymentIncludedInNeeds:false}];
 const snapshot={concern:'Synthetic financial clarity',facts:[{...fact('income','Annual gross income',2400000),scope:'personal',period:'annual',asOf:'2026'}],map,goal:null,action:null,outcome:null};
 const goal={...snapshot,goal:{text:'Build a household reserve',targetDate:'2026-12-31'}};
 const action={...goal,action:{text:'Review one month of spending',dueDate:'2026-10-23'}};
 state.replies=[{text:'Review the draft details before saving.',proposal:snapshot,requiresConfirmation:false},{text:'What matters most to you?',proposal:null},{text:'Review your chosen goal.',proposal:goal},{text:'What action would you choose this week?',proposal:null},{text:'Review your chosen action.',proposal:action}];
 render(<App/>);await openMap();
 const input='My annual income is 2400000, needs 60000 monthly, wants 30000 monthly, cash 5000000, loan 1000000 and my goal is a household reserve.';
 await send(input,false);expect(state.saved).toBeNull();expect(state.saveCalls).toBe(0);
 expect(screen.getByText(/Your message — unconfirmed:/)).toBeTruthy();expect(screen.getByText('AI-prepared draft — not saved')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Confirm this update'}));await screen.findByText('What matters most to you?');
 expect(state.saved.content.map.data).toEqual(map.data);
 await send('I choose to build a household reserve by 31 December 2026.');
 await send('I choose to review one month of spending by 23 October 2026.');
 expect(state.saved.content.goal).toEqual(goal.goal);expect(state.saved.content.action).toEqual(action.action);expect(state.saveCalls).toBe(3);
 const saved=structuredClone(state.saved);cleanup();render(<App/>);await openMap();expect(state.saved).toEqual(saved);
 expect(screen.getByText(/Last time your goal was: Build a household reserve/)).toBeTruthy();
});

test('manual financial edits stay unsaved until the snapshot is explicitly confirmed',async()=>{
 state.signedIn=true;render(<App/>);await openMap();
 fireEvent.change(screen.getByLabelText(/Annual Income Before Tax/i,{selector:'input:not([type=range])'}),{target:{value:'2400000'}});
 const confirm=await screen.findByRole('button',{name:'Confirm financial snapshot'});expect(state.saved).toBeNull();expect(state.saveCalls).toBe(0);
 fireEvent.click(confirm);await waitFor(()=>expect(state.saveCalls).toBe(1));expect(state.saved.content.map.data.grossPersonalIncome).toBe('2400000');
});
