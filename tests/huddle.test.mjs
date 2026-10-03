import { test } from "node:test";
import assert from "node:assert/strict";
import { validateContent, validDate } from "../shared/huddle.mjs";
const fact = {
  key: "customer_receivables",
  label: "Customer receivables",
  kind: "estimate",
  amount: 800000,
  lower: null,
  upper: null,
  scope: "business",
  period: "point_in_time",
  currency: "INR",
  asOf: "2026-10-03",
  note: "",
};
const content = () => ({
  concern: "Customers have not paid me",
  facts: [{ ...fact }],
  goal: { text: "Collect ₹3 lakh", targetDate: null },
  action: { text: "Call five overdue customers", dueDate: "2026-10-09" },
  outcome: null,
});
test("confirmed estimate remains an estimate in a complete Huddle", () => {
  assert.equal(validateContent(content()).facts[0].kind, "estimate");
});
test("impossible commitment date is rejected", () => {
  const c = content();
  c.action.dueDate = "2026-02-30";
  assert.throws(() => validateContent(c), /real date/);
  assert.equal(validDate("2026-02-28"), true);
});
test("action cannot be committed without a chosen goal or snapshot", () => {
  const c = content();
  c.goal = null;
  assert.throws(() => validateContent(c), /snapshot and goal/);
  c.goal = content().goal;
  c.facts = [];
  assert.throws(() => validateContent(c), /snapshot and goal/);
});
test("duplicate facts cannot silently inflate calculations", () => {
  const c = content();
  c.facts.push({ ...fact });
  assert.throws(() => validateContent(c), /duplicate/);
});
test("completed action has no automatic financial impact", () => {
  const c = content();
  c.outcome = {
    actionStatus: "completed",
    text: "Called all five customers",
    amount: null,
    impactType: "none",
    occurredOn: "2026-10-03",
  };
  assert.equal(validateContent(c).outcome.amount, null);
  c.outcome.amount = 200000;
  assert.throws(() => validateContent(c), /Separate action/);
});
test("a confirmed receipt is separate from the starting balance", () => {
  const c = content();
  c.outcome = {
    actionStatus: "completed",
    text: "Three customers paid",
    amount: 200000,
    impactType: "receivables_collection",
    occurredOn: "2026-10-03",
  };
  validateContent(c);
  assert.equal(c.facts[0].amount, 800000);
  assert.equal(c.outcome.amount, 200000);
});
test("mismatched periods and invalid ranges are rejected", () => {
  const c = content();
  c.facts[0].period = "monthly";
  assert.throws(() => validateContent(c), /date or period/);
  c.facts[0] = {
    ...fact,
    kind: "range",
    amount: null,
    lower: 900000,
    upper: 800000,
  };
  assert.throws(() => validateContent(c), /valid range/);
});
