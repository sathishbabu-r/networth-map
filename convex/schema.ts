import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { content } from "./validators";
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
});
