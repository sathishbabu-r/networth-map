import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { content } from "./validators";
const insightEvent = v.union(
  v.literal("assessment_started"),
  v.literal("step_viewed"),
  v.literal("step_completed"),
  v.literal("validation_error"),
  v.literal("asset_added"),
  v.literal("liability_added"),
  v.literal("breakdown_toggled"),
  v.literal("assessment_resumed"),
  v.literal("map_generated"),
  v.literal("map_printed"),
  v.literal("map_shared"),
  v.literal("next_moves_copied"),
  v.literal("assessment_deleted"),
);

const deviceClass = v.union(
  v.literal("mobile"),
  v.literal("tablet"),
  v.literal("desktop"),
);

const validationCode = v.union(
  v.literal("profile_required"),
  v.literal("income_invalid"),
  v.literal("assets_incomplete"),
  v.literal("liabilities_incomplete"),
  v.literal("expenses_invalid"),
  v.literal("investing_invalid"),
  v.literal("lifestyle_incomplete"),
  v.literal("goals_incomplete"),
  v.literal("milestone_incomplete"),
  v.literal("actions_incomplete"),
);

const feedbackCategory = v.union(
  v.literal("confusing"),
  v.literal("cannot_continue"),
  v.literal("incorrect_number"),
  v.literal("display_problem"),
  v.literal("other"),
);

const clarityRating = v.union(
  v.literal("yes"),
  v.literal("partly"),
  v.literal("no"),
);

export default defineSchema({
  ...authTables,
  huddles: defineTable({
    userId: v.id("users"),
    content,
    revision: v.number(),
    confirmedAt: v.number(),
    complete: v.boolean(),
  }).index("by_user", ["userId"]),
  huddleChanges: defineTable({
    huddleId: v.id("huddles"),
    userId: v.id("users"),
    oldContent: v.union(content, v.null()),
    newContent: content,
    confirmedAt: v.number(),
    revision: v.number(),
  }).index("by_huddle", ["huddleId"]),
  productInsightEvents: defineTable({
    userId: v.id("users"),
    sessionId: v.string(),
    event: insightEvent,
    step: v.optional(v.number()),
    device: deviceClass,
    validationCode: v.optional(validationCode),
  }).index("by_user_session", ["userId", "sessionId"]).index("by_user", ["userId"]),
  productFeedback: defineTable({
    userId: v.id("users"),
    sessionId: v.string(),
    step: v.number(),
    device: deviceClass,
    category: feedbackCategory,
    message: v.optional(v.string()),
    clarity: v.optional(clarityRating),
  }).index("by_user_session", ["userId", "sessionId"]).index("by_user", ["userId"]),
  completedMapEmailSignups: defineTable({
    userId: v.id("users"),
    email: v.string(),
    submittedAt: v.number(),
    completedMap: v.literal(true),
    completionEventId: v.id("productInsightEvents"),
    consultationRequested: v.optional(v.boolean()),
    consultationStatus: v.optional(
      v.union(v.literal("accepted"), v.literal("waitlisted")),
    ),
  })
    .index("by_email", ["email"])
    .index("by_user_email", ["userId", "email"]).index("by_user", ["userId"])
    .index("by_consultationRequested", ["consultationRequested"])
    .index("by_consultationStatus", ["consultationStatus"]),
});
