import { v, ConvexError } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { evaluatorBudget, authorizedUserId as getAuthUserId } from "./evaluator";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { content } from "./validators";
import { financialStatus } from "../shared/financial-status";
import { validateMap } from "../shared/map-engine";
import { validateContent } from "../shared/huddle.mjs";
export const current = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      id: v.id("huddles"),
      content,
      revision: v.number(),
      confirmedAt: v.number(),
      complete: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const saved = await ctx.db
      .query("huddles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    return saved
      ? {
          id: saved._id,
          content: saved.content,
          revision: saved.revision,
          confirmedAt: saved.confirmedAt,
          complete: saved.complete,
        }
      : null;
  },
});
export const save = mutation({
  args: { content, expectedRevision: v.number(), analytics:v.optional(v.object({sessionId:v.string(),device:v.union(v.literal("mobile"),v.literal("tablet"),v.literal("desktop"))})) },
  returns: v.number(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Sign in before saving.");
    await evaluatorBudget(ctx,userId,"save");
    const old = await ctx.db
      .query("huddles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if ((old?.revision ?? 0) !== args.expectedRevision)
      throw new ConvexError(
        "Your saved information changed in another tab. Reload and review before confirming again.",
      );
    const c = args.content;
    try {
      validateContent(c);
      if (c.map) validateMap(c.map);
    } catch (error) {
      throw new ConvexError(
        error instanceof Error
          ? error.message
          : "Check the proposed information.",
      );
    }
    const revision = (old?.revision ?? 0) + 1,
      confirmedAt = Date.now();
    const id = old
      ? old._id
      : await ctx.db.insert("huddles", {
          userId,
          content: c,
          revision,
          confirmedAt,
          complete: false,
        });
    await ctx.db.patch(id, {
      content: c,
      revision,
      confirmedAt,
      complete: Boolean(c.goal && c.action && c.facts.length),
    });
    const reviewed=await ctx.db.query("financialReviews").withIndex("by_user",q=>q.eq("userId",userId)).order("desc").first();
    await ctx.db.insert("huddleChanges", {
      ...(reviewed?{financialReviewId:reviewed._id}:{}),
      huddleId: id,
      userId,
      oldContent: old?.content ?? null,
      newContent: c,
      revision,
      confirmedAt,
    });
    // The generation event commits atomically with the successful MAP save.
    // Existing save limits apply; optional telemetry failure cannot lose this event.
    if(c.map?.step===11 && old?.content.map?.step!==11 && financialStatus(validateMap(c.map)).ready){
      const session=await ctx.db.query("evaluatorSessions").withIndex("by_user",q=>q.eq("userId",userId)).unique();
      const supplied=args.analytics?.sessionId;
      const sessionId=supplied&&/^[a-zA-Z0-9-]{1,64}$/.test(supplied)?supplied:String(session?._id??id);
      await ctx.db.insert("productInsightEvents",{userId,sessionId,event:"map_generated",step:11,device:args.analytics?.device??"desktop",generationRevision:revision,...(session?{evaluatorSessionId:session._id}:{})});
    }
    return revision;
  },
});
export const history = query({
  args: { paginationOpts: paginationOptsValidator, latestFirst: v.optional(v.boolean()) },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("huddleChanges"),
        _creationTime: v.number(),
        huddleId: v.id("huddles"),
        financialReviewId: v.optional(v.id("financialReviews")),
        userId: v.id("users"),
        oldContent: v.union(content, v.null()),
        newContent: content,
        confirmedAt: v.number(),
        revision: v.number(),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.string(),
    splitCursor: v.optional(v.union(v.string(), v.null())),
    pageStatus: v.optional(
      v.union(
        v.literal("SplitRecommended"),
        v.literal("SplitRequired"),
        v.null(),
      ),
    ),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Sign in first.");
    const saved = await ctx.db
      .query("huddles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!saved) return { page: [], isDone: true, continueCursor: "" };
    return await ctx.db
      .query("huddleChanges")
      .withIndex("by_huddle", (q) => q.eq("huddleId", saved._id))
      .order(args.latestFirst ? "desc" : "asc")
      .paginate(args.paginationOpts);
  },
});
export const remove = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Sign in first.");
    await ctx.scheduler.runAfter(0, internal.intelligence.clean, {userId});
    const saved = await ctx.db
      .query("huddles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    for (const table of ["productInsightEvents", "productFeedback", "completedMapEmailSignups"] as const) await ctx.scheduler.runAfter(0,internal.productInsights.deleteAccountRows,{userId,table});
    if (saved) {
      await ctx.db.delete(saved._id);
      await ctx.scheduler.runAfter(0, internal.huddles.cleanHistory, {
        huddleId: saved._id,
      });
    }
    return null;
  },
});
export const cleanHistory = internalMutation({
  args: { huddleId: v.id("huddles") },
  returns: v.null(),
  handler: async (ctx, { huddleId }) => {
    const rows = await ctx.db
      .query("huddleChanges")
      .withIndex("by_huddle", (q) => q.eq("huddleId", huddleId))
      .take(100);
    for (const row of rows) await ctx.db.delete(row._id);
    if (rows.length === 100)
      await ctx.scheduler.runAfter(0, internal.huddles.cleanHistory, {
        huddleId,
      });
    return null;
  },
});
