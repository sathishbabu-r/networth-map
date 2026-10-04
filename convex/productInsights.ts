import { v } from "convex/values";
import {
  internalQuery, internalMutation, query,
  mutation,
} from "./_generated/server";
import schema from "./schema";
import { paginationOptsValidator } from "convex/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

const eventValidator = v.union(
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

const deviceValidator = v.union(
  v.literal("mobile"),
  v.literal("tablet"),
  v.literal("desktop"),
);

const validationCodeValidator = v.union(
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

const feedbackCategoryValidator = v.union(
  v.literal("confusing"),
  v.literal("cannot_continue"),
  v.literal("incorrect_number"),
  v.literal("display_problem"),
  v.literal("other"),
);

const clarityValidator = v.union(
  v.literal("yes"),
  v.literal("partly"),
  v.literal("no"),
);

const assertSafeSession = (sessionId: string) => {
  if (!/^[a-zA-Z0-9-]{1,64}$/.test(sessionId)) {
    throw new Error("Invalid anonymous session identifier.");
  }
};

const assertStep = (step: number) => {
  if (!Number.isInteger(step) || step < 0 || step > 11) {
    throw new Error("Invalid assessment step.");
  }
};

const safeFeedbackMessage = (message: string | undefined) => {
  const normalized = message?.trim();
  if (!normalized) return undefined;
  if (normalized.length > 400) {
    throw new Error("Feedback must be 400 characters or fewer.");
  }
  if (/[0-9₹$€£@]/u.test(normalized)) {
    throw new Error(
      "Please remove financial figures, contact details and other personal information.",
    );
  }
  return normalized;
};

export const track = mutation({
  args: {
    sessionId: v.string(),
    event: eventValidator,
    step: v.optional(v.number()),
    device: deviceValidator,
    validationCode: v.optional(validationCodeValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");
    assertSafeSession(args.sessionId);
    if (args.step !== undefined) assertStep(args.step);
    const existing = await ctx.db
      .query("productInsightEvents")
      .withIndex("by_user_session", (query) =>
        query.eq("userId", userId!).eq("sessionId", args.sessionId),
      )
      .take(500);
    if (existing.length >= 500) return null;
    await ctx.db.insert("productInsightEvents", {
      ...args,userId});
    return null;
  },
});

export const completeMap = mutation({
  args: {
    sessionId: v.string(),
    device: deviceValidator,
  },
  returns: v.id("productInsightEvents"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");
    assertSafeSession(args.sessionId);
    const existing = await ctx.db
      .query("productInsightEvents")
      .withIndex("by_user_session", (query) =>
        query.eq("userId", userId!).eq("sessionId", args.sessionId),
      )
      .take(500);
    const completion = existing.find(
      (event) => event.event === "map_generated" && event.step === 11,
    );
    if (completion) return completion._id;
    if (existing.length >= 500) {
      throw new Error("Event limit reached for this session.");
    }
    return await ctx.db.insert("productInsightEvents", {
      userId,
      sessionId: args.sessionId,
      event: "map_generated",
      step: 11,
      device: args.device,
    });
  },
});

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const assertValidEmail = (email: string) => {
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)
  ) {
    throw new Error("Enter a valid email address.");
  }
};

export const submitCompletedMapEmail = mutation({
  args: {
    email: v.string(),
    submittedAt: v.number(),
    completionEventId: v.id("productInsightEvents"),
  },
  returns: v.object({
    emailStatus: v.union(v.literal("created"), v.literal("existing")),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");
    const email = normalizeEmail(args.email);
    assertValidEmail(email);
    if (!Number.isFinite(args.submittedAt)) {
      throw new Error("Invalid submission timestamp.");
    }
    const completion = await ctx.db.get(args.completionEventId);
    if (
      !completion || completion.userId !== userId ||
      completion.event !== "map_generated" ||
      completion.step !== 11
    ) {
      throw new Error("A completed MAP is required before saving an email.");
    }
    const existing = await ctx.db
      .query("completedMapEmailSignups")
      .withIndex("by_user_email", (query) => query.eq("userId", userId!).eq("email", email))
      .unique();
    if (existing) return { emailStatus: "existing" as const };
    await ctx.db.insert("completedMapEmailSignups", {
      userId,
      email,
      submittedAt: args.submittedAt,
      completedMap: true,
      completionEventId: args.completionEventId,
    });
    return { emailStatus: "created" as const };
  },
});

export const completedMapEmailAudit = internalQuery({
  args: { email: v.string() },
  returns: v.object({
    count: v.number(),
    record: v.union(schema.doc("completedMapEmailSignups"), v.null()),
  }),
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    const records = await ctx.db
      .query("completedMapEmailSignups")
      .withIndex("by_email", (query) => query.eq("email", email))
      .take(2);
    return { count: records.length, record: records[0] ?? null };
  },
});

export const submitFeedback = mutation({
  args: {
    sessionId: v.string(),
    step: v.number(),
    device: deviceValidator,
    category: feedbackCategoryValidator,
    message: v.optional(v.string()),
    clarity: v.optional(clarityValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");
    assertSafeSession(args.sessionId);
    assertStep(args.step);
    const message = safeFeedbackMessage(args.message);
    const existing = await ctx.db
      .query("productFeedback")
      .withIndex("by_user_session", (query) =>
        query.eq("userId", userId!).eq("sessionId", args.sessionId),
      )
      .take(20);
    if (existing.length >= 20) {
      throw new Error("Feedback limit reached for this session.");
    }
    await ctx.db.insert("productFeedback", {
      userId,
      sessionId: args.sessionId,
      step: args.step,
      device: args.device,
      category: args.category,
      ...(message ? { message } : {}),
      ...(args.clarity ? { clarity: args.clarity } : {}),
    });
    return null;
  },
});

export const recentFeedback = internalQuery({
  args: { limit: v.number() },
  returns: v.array(schema.doc("productFeedback")),
  handler: async (ctx, args) => {
    const limit = Math.min(200, Math.max(1, Math.floor(args.limit)));
    return await ctx.db
      .query("productFeedback")
      .withIndex("by_creation_time")
      .order("desc")
      .take(limit);
  },
});

export const journeySummary = internalQuery({
  args: { limit: v.number() },
  returns: v.object({
    eventsReviewed: v.number(),
    sessions: v.number(),
    events: v.array(v.object({ event: eventValidator, count: v.number() })),
    steps: v.array(
      v.object({
        step: v.number(),
        viewed: v.number(),
        completed: v.number(),
        validationErrors: v.number(),
      }),
    ),
    validationErrors: v.array(
      v.object({ code: validationCodeValidator, count: v.number() }),
    ),
  }),
  handler: async (ctx, args) => {
    const limit = Math.min(4_000, Math.max(1, Math.floor(args.limit)));
    const events = await ctx.db
      .query("productInsightEvents")
      .withIndex("by_creation_time")
      .order("desc")
      .take(limit);
    const eventCounts = new Map<string, number>();
    const errorCounts = new Map<string, number>();
    const stepCounts = new Map<
      number,
      { viewed: number; completed: number; validationErrors: number }
    >();
    for (const event of events) {
      eventCounts.set(event.event, (eventCounts.get(event.event) ?? 0) + 1);
      if (event.validationCode) {
        errorCounts.set(
          event.validationCode,
          (errorCounts.get(event.validationCode) ?? 0) + 1,
        );
      }
      if (event.step !== undefined) {
        const current = stepCounts.get(event.step) ?? {
          viewed: 0,
          completed: 0,
          validationErrors: 0,
        };
        if (event.event === "step_viewed") current.viewed += 1;
        if (event.event === "step_completed") current.completed += 1;
        if (event.event === "validation_error") current.validationErrors += 1;
        stepCounts.set(event.step, current);
      }
    }
    return {
      eventsReviewed: events.length,
      sessions: new Set(events.map((event) => event.sessionId)).size,
      events: [...eventCounts.entries()].map(([event, count]) => ({
        event: event as (typeof events)[number]["event"],
        count,
      })),
      steps: [...stepCounts.entries()]
        .sort(([left], [right]) => left - right)
        .map(([step, counts]) => ({ step, ...counts })),
      validationErrors: [...errorCounts.entries()].map(([code, count]) => ({
        code: code as NonNullable<(typeof events)[number]["validationCode"]>,
        count,
      })),
    };
  },
});

const personalTables=v.union(v.literal("productInsightEvents"),v.literal("productFeedback"),v.literal("completedMapEmailSignups"));
export const exportRows=query({
 args:{table:personalTables,paginationOpts:paginationOptsValidator},
 returns:v.object({page:v.array(v.union(schema.doc("productInsightEvents"),schema.doc("productFeedback"),schema.doc("completedMapEmailSignups"))),isDone:v.boolean(),continueCursor:v.string(),splitCursor:v.optional(v.union(v.string(),v.null())),pageStatus:v.optional(v.union(v.literal("SplitRecommended"),v.literal("SplitRequired"),v.null()))}),
 handler:async(ctx,args)=>{const userId=await getAuthUserId(ctx);if(!userId)throw new Error("Sign in first.");return await ctx.db.query(args.table).withIndex("by_user",q=>q.eq("userId",userId)).paginate(args.paginationOpts);}
});
export const deleteAccountRows=internalMutation({
 args:{userId:v.id("users"),table:personalTables},returns:v.null(),
 handler:async(ctx,args)=>{const rows=await ctx.db.query(args.table).withIndex("by_user",q=>q.eq("userId",args.userId)).take(100);for(const row of rows)await ctx.db.delete(row._id);if(rows.length===100)await ctx.scheduler.runAfter(0,internal.productInsights.deleteAccountRows,args);return null;}
});
