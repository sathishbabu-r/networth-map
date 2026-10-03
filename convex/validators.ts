import { v } from "convex/values";
export const fact = v.object({
  key: v.string(),
  label: v.string(),
  kind: v.union(
    v.literal("exact"),
    v.literal("estimate"),
    v.literal("range"),
    v.literal("unknown"),
  ),
  amount: v.union(v.number(), v.null()),
  lower: v.union(v.number(), v.null()),
  upper: v.union(v.number(), v.null()),
  scope: v.union(
    v.literal("personal"),
    v.literal("business"),
    v.literal("shared"),
  ),
  period: v.union(
    v.literal("monthly"),
    v.literal("annual"),
    v.literal("point_in_time"),
  ),
  currency: v.literal("INR"),
  asOf: v.string(),
  note: v.string(),
});
export const goal = v.object({
  text: v.string(),
  targetDate: v.union(v.string(), v.null()),
});
export const commitment = v.object({ text: v.string(), dueDate: v.string() });
export const outcome = v.object({
  actionStatus: v.union(
    v.literal("completed"),
    v.literal("partial"),
    v.literal("not_done"),
  ),
  text: v.string(),
  amount: v.union(v.number(), v.null()),
  impactType: v.union(
    v.literal("none"),
    v.literal("receivables_collection"),
    v.literal("income"),
    v.literal("expense_reduction"),
    v.literal("debt_repayment"),
    v.literal("savings_allocation"),
  ),
  occurredOn: v.string(),
});
export const content = v.object({
  concern: v.string(),
  facts: v.array(fact),
  goal: v.union(goal, v.null()),
  action: v.union(commitment, v.null()),
  outcome: v.optional(v.union(outcome, v.null())),
});
