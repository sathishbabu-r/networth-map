import { checkInContent, dailyProgressRecords } from "../shared/daily-progress.mjs";
import { emptyMap } from "../shared/map-engine";
import { test, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";
const modules = import.meta.glob("../convex/**/*.{ts,js}");
const initial = () => ({
  concern: "Cash is tight because customers have not paid",
  facts: [
    {
      key: "customer_receivables",
      label: "Customer receivables",
      kind: "estimate" as const,
      amount: 800000,
      lower: null,
      upper: null,
      scope: "business" as const,
      period: "point_in_time" as const,
      currency: "INR" as const,
      asOf: "2026-10-03",
      note: "Current customer balances",
    },
    {
      key: "overdue_receivables",
      label: "Overdue receivables",
      kind: "estimate" as const,
      amount: 500000,
      lower: null,
      upper: null,
      scope: "business" as const,
      period: "point_in_time" as const,
      currency: "INR" as const,
      asOf: "2026-10-03",
      note: "Current overdue customer balances",
    },
  ],
  goal: null,
  action: null,
  outcome: null,
});
async function setup() {
  const t = convexTest(schema, modules);
  const [a, b] = await t.run(async (ctx) => [
    await ctx.db.insert("users", { name: "Pilot A" }),
    await ctx.db.insert("users", { name: "Pilot B" }),
  ]);
  return {
    t,
    a: t.withIdentity({ subject: a + "|session-a" }),
    b: t.withIdentity({ subject: b + "|session-b" }),
    aId: a,
    bId: b,
  };
}
test("signed-out users cannot save or see financial context", async () => {
  const { t } = await setup();
  expect(await t.query(api.huddles.current, {})).toBeNull();
  await expect(
    t.mutation(api.huddles.save, { content: initial(), expectedRevision: 0 }),
  ).rejects.toThrow("Sign in");
  await expect(
    t.query(api.huddles.history, {
      paginationOpts: { numItems: 10, cursor: null },
    }),
  ).rejects.toThrow("Sign in");
  await expect(t.mutation(api.huddles.remove, {})).rejects.toThrow("Sign in");
});
test("confirmed facts, one goal and action survive a new user session, without leaking to another user", async () => {
  const { t, a, b, aId } = await setup();
  const content = initial();
  await a.mutation(api.huddles.save, { content, expectedRevision: 0 });
  expect(await b.query(api.huddles.current, {})).toBeNull();
  const goalState = {
    ...content,
    goal: { text: "Collect ₹3 lakh this month", targetDate: "2026-10-31" },
  };
  await a.mutation(api.huddles.save, {
    content: goalState,
    expectedRevision: 1,
  });
  const committed = {
    ...goalState,
    action: {
      text: "Call five largest overdue customers",
      dueDate: "2026-10-09",
    },
  };
  await a.mutation(api.huddles.save, {
    content: committed,
    expectedRevision: 2,
  });
  const freshSession = t.withIdentity({ subject: aId + "|new-session" });
  const saved = await freshSession.query(api.huddles.current, {});
  expect(saved?.complete).toBe(true);
  expect(saved?.content).toEqual(committed);
  expect(saved?.revision).toBe(3);
  expect(
    await b.query(api.huddles.history, {
      paginationOpts: { numItems: 10, cursor: null },
    }),
  ).toEqual({ page: [], isDone: true, continueCursor: "" });
  const ownHistory = await a.query(api.huddles.history, {
    paginationOpts: { numItems: 10, cursor: null },
  });
  expect(ownHistory.page).toHaveLength(3);
  expect(ownHistory.page[2].oldContent?.action).toBeNull();
});
test("another user cannot overwrite or delete the first user’s Huddle", async () => {
  const { a, b } = await setup();
  await a.mutation(api.huddles.save, {
    content: initial(),
    expectedRevision: 0,
  });
  await b.mutation(api.huddles.save, {
    content: { ...initial(), concern: "My own separate issue" },
    expectedRevision: 0,
  });
  await b.mutation(api.huddles.remove, {});
  expect((await a.query(api.huddles.current, {}))?.content.concern).toBe(
    initial().concern,
  );
  expect(await b.query(api.huddles.current, {})).toBeNull();
});
test("a stale tab cannot overwrite more recently confirmed data", async () => {
  const { a } = await setup();
  await a.mutation(api.huddles.save, {
    content: initial(),
    expectedRevision: 0,
  });
  await expect(
    a.mutation(api.huddles.save, {
      content: { ...initial(), concern: "Stale version" },
      expectedRevision: 0,
    }),
  ).rejects.toThrow("another tab");
  expect((await a.query(api.huddles.current, {}))?.content.concern).toBe(
    initial().concern,
  );
});
test("return update remembers commitment and keeps collection separate from the starting snapshot", async () => {
  const { a } = await setup();
  const content = {
    ...initial(),
    goal: { text: "Collect ₹3 lakh", targetDate: null },
    action: { text: "Call five customers", dueDate: "2026-10-09" },
  };
  await a.mutation(api.huddles.save, { content, expectedRevision: 0 });
  await a.mutation(api.huddles.save, {
    content: {
      ...content,
      outcome: {
        actionStatus: "completed",
        text: "Called five customers; three paid",
        amount: 200000,
        impactType: "receivables_collection",
        occurredOn: "2026-10-03",
      },
    },
    expectedRevision: 1,
  });
  const saved = await a.query(api.huddles.current, {});
  expect(saved?.content.action).toEqual(content.action);
  expect(saved?.content.facts[0].amount).toBe(800000);
  expect(saved?.content.outcome?.amount).toBe(200000);
});

test("MAP memory survives return visits and is isolated from another account",async()=>{
 const {t,a,b,aId}=await setup();const map=emptyMap();map.data.monthlyNeeds="90000";map.data.monthlyWants="30000";map.covered=["spend"];
 await a.mutation(api.huddles.save,{content:{...initial(),map},expectedRevision:0});
 const returning=t.withIdentity({subject:aId+"|return"});expect((await returning.query(api.huddles.current,{}))?.content.map?.data.monthlyNeeds).toBe("90000");expect(await b.query(api.huddles.current,{})).toBeNull();
 const history=await returning.query(api.huddles.history,{paginationOpts:{numItems:10,cursor:null},latestFirst:true});expect(history.page[0].newContent.map?.covered).toEqual(["spend"]);
});


test("MAP review and reflection completion markers persist through the real save validators",async()=>{
 const {a}=await setup();const map=emptyMap();map.step=1;map.covered=["earn","blueprint","reflect"];
 await a.mutation(api.huddles.save,{content:{...initial(),map},expectedRevision:0});
 const saved=await a.query(api.huddles.current,{});
 expect(saved?.content.map?.covered).toEqual(map.covered);expect(saved?.content.map?.data).toEqual(map.data);
});


test("confirmed daily check-ins persist privately through the existing mutation and retain MAP balances",async()=>{
 const {a,b}=await setup();const map=emptyMap();map.step=11;map.covered=["earn","own","owe","spend","invest","blueprint","lifestyle","goals","milestone","reflect"];
 const content={...initial(),map};
 const values={action:"Reviewed spending",goal:"Understand my costs",useExisting:false,status:"completed",date:"2026-10-10",change:"Reviewed subscriptions",obstacle:"",impactType:"none",amount:"",confirmed:true};
 const first=checkInContent(content,values,null,"2026-10-10");
 await a.mutation(api.huddles.save,{content:first,expectedRevision:0});
 const second=checkInContent(first,{...values,useExisting:true,date:"2026-10-09",status:"partial",change:"Started the review"},null,"2026-10-10");
 await a.mutation(api.huddles.save,{content:second,expectedRevision:1});
 const saved=await a.query(api.huddles.current,{});
 expect(saved?.content.map).toEqual(map);expect(saved?.content.facts).toEqual(content.facts);expect(saved?.content.outcome?.amount).toBeNull();
 expect(await b.query(api.huddles.current,{})).toBeNull();
 const history=await a.query(api.huddles.history,{paginationOpts:{numItems:10,cursor:null},latestFirst:true});
 expect(dailyProgressRecords(history.page,saved)).toHaveLength(2);
 await expect(a.mutation(api.huddles.save,{content:first,expectedRevision:1})).rejects.toThrow(/another tab/);
});
