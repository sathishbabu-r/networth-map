import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateInsights, validateFact } from "../shared/financial.mjs";
const fact = (key, amount, extra = {}) => ({
  key,
  amount,
  kind: "exact",
  scope: "business",
  period: "point_in_time",
  currency: "INR",
  asOf: "2026-10-03",
  confirmed: true,
  ...extra,
});
test("overdue share is 62.5%, with formula and estimated inputs preserved", () => {
  const result = calculateInsights([
    fact("customer_receivables", 800000, { kind: "estimate" }),
    fact("overdue_receivables", 500000, { kind: "estimate" }),
  ]);
  assert.equal(result[0].value, 62.5);
  assert.equal(result[0].estimated, true);
  assert.deepEqual(result[0].amounts, [500000, 800000]);
  assert.match(result[0].formula, /÷/);
});
test("monthly EMI share is 40% and cash gap is two lakh", () => {
  assert.equal(
    calculateInsights([
      fact("emi", 80000, { period: "monthly", asOf: "2026-10" }),
      fact("income", 200000, { period: "monthly", asOf: "2026-10" }),
    ])[0].value,
    40,
  );
  assert.equal(
    calculateInsights([
      fact("payments_due", 700000),
      fact("available_cash", 500000),
    ])[0].value,
    200000,
  );
});
test("unconfirmed, unknown, range and zero denominator do not produce false precision", () => {
  for (const extra of [
    { confirmed: false },
    { kind: "unknown", amount: null },
    { kind: "range", amount: null, lower: 700000, upper: 900000 },
    { amount: 0 },
  ])
    assert.deepEqual(
      calculateInsights([
        fact("customer_receivables", 800000, extra),
        fact("overdue_receivables", 500000),
      ]),
      [],
    );
});
test("incompatible ownership, currency, date and duplicate facts do not combine", () => {
  for (const extra of [
    { scope: "personal" },
    { currency: "USD" },
    { asOf: "2026-09-01" },
  ])
    assert.deepEqual(
      calculateInsights([
        fact("customer_receivables", 800000, extra),
        fact("overdue_receivables", 500000),
      ]),
      [],
    );
  assert.deepEqual(
    calculateInsights([
      fact("customer_receivables", 800000),
      fact("customer_receivables", 900000),
      fact("overdue_receivables", 500000),
    ]),
    [],
  );
  assert.deepEqual(
    calculateInsights([
      fact("customer_receivables", 800000),
      fact("overdue_receivables", 900000),
    ]),
    [],
  );
});
test("unknown is not zero, estimates remain estimates and reversed ranges fail", () => {
  assert.throws(
    () => validateFact(fact("income", 0, { kind: "unknown" })),
    /Unknown/,
  );
  assert.throws(
    () =>
      validateFact(
        fact("income", null, { kind: "range", lower: 200000, upper: 100000 }),
      ),
    /range/,
  );
  assert.equal(
    validateFact(fact("income", 200000, { kind: "estimate" })).kind,
    "estimate",
  );
});
