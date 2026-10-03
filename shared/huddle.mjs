import { validateFact } from "./financial.mjs";
export function validDate(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function validateContent(c) {
  if (
    !c.concern?.trim() ||
    c.concern.length > 1000 ||
    !Array.isArray(c.facts) ||
    c.facts.length > 20
  )
    throw Error("Keep this snapshot focused on your current issue.");
  const keys = new Set();
  for (const f of c.facts) {
    validateFact(f);
    if (
      !f.label?.trim() ||
      f.label.length > 100 ||
      f.key.length > 80 ||
      f.note.length > 500 ||
      f.asOf.length > 20
    )
      throw Error("Check the financial entry labels and date.");
    const key = [f.key, f.scope, f.period].join("|");
    if (keys.has(key))
      throw Error("Resolve duplicate financial entries before saving.");
    keys.add(key);
    if (
      f.asOf &&
      !(f.period === "monthly"
        ? /^\d{4}-(0[1-9]|1[0-2])$/.test(f.asOf)
        : f.period === "annual"
          ? /^\d{4}$/.test(f.asOf)
          : validDate(f.asOf))
    )
      throw Error("Check the date or period for this figure.");
  }
  if (
    c.goal &&
    (!c.goal.text.trim() ||
      c.goal.text.length > 500 ||
      (c.goal.targetDate !== null && !validDate(c.goal.targetDate)))
  )
    throw Error("Enter one clear goal and a real date if you chose one.");
  if (c.action) {
    if (
      !c.goal ||
      !c.facts.length ||
      !c.action.text.trim() ||
      c.action.text.length > 500
    )
      throw Error(
        "Confirm your snapshot and goal before committing to an action.",
      );
    if (!validDate(c.action.dueDate))
      throw Error("Choose a real date for your action.");
  }
  if (c.outcome) {
    const o = c.outcome;
    if (
      !c.action ||
      !o.text.trim() ||
      o.text.length > 500 ||
      !validDate(o.occurredOn) ||
      !["completed", "partial", "not_done"].includes(o.actionStatus)
    )
      throw Error("Check the action, outcome and date.");
    if (
      ![
        "none",
        "receivables_collection",
        "income",
        "expense_reduction",
        "debt_repayment",
        "savings_allocation",
      ].includes(o.impactType)
    )
      throw Error("Choose what the realised amount represents.");
    if (
      o.amount !== null &&
      (!Number.isFinite(o.amount) ||
        o.amount < 0 ||
        o.amount > Number.MAX_SAFE_INTEGER)
    )
      throw Error("Enter a valid realised amount.");
    if (
      (o.impactType === "none" && o.amount !== null) ||
      (o.impactType !== "none" && o.amount === null)
    )
      throw Error(
        "Separate action completion from the realised financial amount.",
      );
  }
  return c;
}
