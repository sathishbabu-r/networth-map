/** Formula calculations only. No affordability or financial-health judgments. */
export function validateFact(fact) {
  if (!fact || typeof fact.key !== "string" || !fact.key.trim())
    throw new Error("A financial entry needs a name.");
  if (!["exact", "estimate", "range", "unknown"].includes(fact.kind))
    throw new Error("Choose exact, estimate, range or unknown.");
  if (!["personal", "business", "shared"].includes(fact.scope))
    throw new Error("Choose personal, business or shared ownership.");
  if (!["monthly", "annual", "point_in_time"].includes(fact.period))
    throw new Error("Specify the period for this figure.");
  if (fact.kind === "unknown") {
    if (fact.amount != null || fact.lower != null || fact.upper != null)
      throw new Error("Unknown is not a number.");
    return fact;
  }
  const valid = (value) =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= Number.MAX_SAFE_INTEGER;
  if (fact.kind === "range") {
    if (
      !valid(fact.lower) ||
      !valid(fact.upper) ||
      fact.lower > fact.upper ||
      fact.amount != null
    )
      throw new Error("Enter a valid range instead of a single amount.");
  } else if (!valid(fact.amount) || fact.lower != null || fact.upper != null)
    throw new Error("Enter one valid amount.");
  return fact;
}
export function calculateInsights(facts) {
  const insights = [];
  // A confirmation does not make an estimate exact. Ranges are not silently reduced to midpoints.
  const eligible = facts.filter(
    (f) => f.confirmed === true && ["exact", "estimate"].includes(f.kind),
  );
  function pair(firstKey, secondKey, period, calculate) {
    for (const scope of ["personal", "business", "shared"]) {
      const first = eligible.filter(
        (f) => f.key === firstKey && f.scope === scope && f.period === period,
      );
      const second = eligible.filter(
        (f) => f.key === secondKey && f.scope === scope && f.period === period,
      );
      // Ambiguous duplicates must be resolved, not silently added or overwritten.
      if (first.length !== 1 || second.length !== 1) continue;
      const a = first[0],
        b = second[0];
      try {
        validateFact(a);
        validateFact(b);
      } catch {
        continue;
      }
      if (!a.currency || a.currency !== b.currency) continue;
      // Balance figures must describe the same date; flow figures the same month/year.
      if (!a.asOf || a.asOf !== b.asOf) continue;
      const result = calculate(a.amount, b.amount);
      if (!result) continue;
      insights.push({
        ...result,
        scope,
        currency: a.currency,
        asOf: a.asOf,
        estimated: a.kind === "estimate" || b.kind === "estimate",
        inputs: [a.key, b.key],
        amounts: [a.amount, b.amount],
      });
    }
  }
  pair(
    "overdue_receivables",
    "customer_receivables",
    "point_in_time",
    (overdue, total) =>
      total > 0 && overdue <= total
        ? {
            key: "overdue_share",
            value: (overdue / total) * 100,
            unit: "percent",
            formula: "overdue receivables ÷ total receivables × 100",
          }
        : null,
  );
  pair("emi", "income", "monthly", (emi, income) =>
    income > 0
      ? {
          key: "emi_share",
          value: (emi / income) * 100,
          unit: "percent",
          formula: "monthly EMI ÷ monthly income × 100",
        }
      : null,
  );
  pair("payments_due", "available_cash", "point_in_time", (due, cash) => ({
    key: "cash_gap",
    value: due - cash,
    unit: "money",
    formula: "payments due − available cash",
  }));
  return insights;
}
