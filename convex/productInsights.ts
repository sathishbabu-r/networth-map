import { summarizeAnalytics } from "../shared/product-analytics";
import { v } from "convex/values";
import {
  internalQuery, internalMutation, query,
  mutation,
} from "./_generated/server";
import schema from "./schema";
import { paginationOptsValidator } from "convex/server";
import { internal } from "./_generated/api";
import { evaluatorBudget, evaluatorRecord, authorizedUserId as getAuthUserId } from "./evaluator";

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
    if(args.event==="map_generated") throw new Error("MAP generation is recorded by the successful save.");
    await evaluatorBudget(ctx,userId,"telemetry");
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
    const saved=await ctx.db.query("huddles").withIndex("by_user",q=>q.eq("userId",userId)).unique();
    if(saved?.content.map?.step!==11)throw new Error("Save your generated MAP first.");
    const existing=await ctx.db.query("productInsightEvents").withIndex("by_user",q=>q.eq("userId",userId)).order("desc").take(500);
    const completion=existing.find(e=>e.event==="map_generated"&&e.generationRevision!==undefined&&e.generationRevision<=saved.revision)
      ?? existing.find(e=>e.event==="map_generated"&&e.step===11);
    if(!completion)throw new Error("Your successful MAP save has not been recorded yet. Retry after saving finishes.");
    return completion._id;
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
    if ((await evaluatorRecord(ctx,userId)).kind === "evaluator") throw Error("Use Google Login before requesting email contact.");
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
    await evaluatorBudget(ctx,userId,"telemetry");
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

// Owner-only aggregate view. Existing tracking and financial records are unchanged.
async function analyticsOwner(ctx: import('./_generated/server').QueryCtx) {
 const id=await getAuthUserId(ctx);if(!id)return false;
 const user=await ctx.db.get(id);if(!user||user.isAnonymous||!user.email||user.emailVerificationTime===undefined)return false;
 const allowed=(process.env.ANALYTICS_OWNER_EMAILS??'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
 if(!allowed.includes(user.email.toLowerCase()))return false;
 const google=await ctx.db.query('authAccounts').withIndex('userIdAndProvider',q=>q.eq('userId',id).eq('provider','google')).first();
 return Boolean(google);
}
export const analyticsAccess=query({args:{},returns:v.boolean(),handler:analyticsOwner});
const countRows=v.array(v.object({label:v.string(),count:v.number()}));
export const analyticsDashboard=query({
 args:{days:v.union(v.literal(7),v.literal(30),v.literal(90)),cohort:v.union(v.literal('all'),v.literal('private'),v.literal('evaluator'))},
 returns:v.union(v.null(),v.object({events:v.number(),sessions:v.number(),started:v.number(),generated:v.number(),generationEvents:v.number(),generationUsers:v.number(),legacyGenerationEvents:v.number(),completedStarts:v.number(),completionRate:v.union(v.number(),v.null()),steps:v.array(v.object({step:v.number(),viewed:v.number(),completed:v.number(),notCompleted:v.number(),validationErrors:v.number()})),eventCounts:countRows,devices:countRows,errors:countRows,sampled:v.boolean(),windowStart:v.number(),sampleStart:v.union(v.number(),v.null()),generatedAt:v.number(),cohort:v.string()})),
 handler:async(ctx,args)=>{
  if(!await analyticsOwner(ctx))return null;
  const now=Date.now(),windowStart=now-args.days*86400000;
  const rows=await ctx.db.query('productInsightEvents').withIndex('by_creation_time',q=>q.gte('_creationTime',windowStart)).order('desc').take(4001);
  const recent=rows.slice(0,4000);const kinds=new Map<string,string>();
  for(const row of recent){if(!kinds.has(row.userId)){const user=await ctx.db.get(row.userId);kinds.set(row.userId,user?(user.isAnonymous?'evaluator':'private'):'unknown');}}
  const selected=recent.filter(e=>args.cohort==='all'||kinds.get(e.userId)===args.cohort);
  return {...summarizeAnalytics(selected),sampled:rows.length>4000,windowStart,sampleStart:recent.at(-1)?._creationTime??null,generatedAt:now,cohort:args.cohort};
 }
});
