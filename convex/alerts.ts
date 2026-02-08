import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const enqueueAlert = mutation({
  args: {
    createdAt: v.number(),
    severity: v.string(),
    status: v.string(),
    title: v.string(),
    body: v.string(),
    activityEventId: v.optional(v.id("activity_events")),
    externalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.externalId) {
      const existing = await ctx.db
        .query("alerts")
        .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
        .first();
      if (existing) return existing._id;
    }

    return await ctx.db.insert("alerts", {
      ...args,
      sentAt: undefined,
      sendStatus: undefined,
      sendError: undefined,
    });
  },
});

export const listAlerts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200;
    return await ctx.db.query("alerts").withIndex("by_createdAt").order("desc").take(limit);
  },
});

export const listUnsentAlerts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const rows = await ctx.db.query("alerts").withIndex("by_createdAt").order("desc").take(500);
    return rows.filter((r) => !r.sentAt).slice(0, limit);
  },
});

export const markAlertSent = mutation({
  args: {
    id: v.id("alerts"),
    sentAt: v.number(),
    sendStatus: v.string(),
    sendError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      sentAt: args.sentAt,
      sendStatus: args.sendStatus,
      sendError: args.sendError,
    });
    return true;
  },
});
