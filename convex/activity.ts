import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createActivityEvent = mutation({
  args: {
    ts: v.number(),
    source: v.string(),
    kind: v.string(),
    status: v.string(),
    summary: v.string(),
    details: v.any(),
    relatedPaths: v.array(v.string()),
    relatedUrls: v.array(v.string()),
    externalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.externalId) {
      const existing = await ctx.db
        .query("activity_events")
        .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
        .first();
      if (existing) return existing._id;
    }

    // Rules engine (inline, so it works in Convex runtime)
    const tags = new Set<string>();
    tags.add(`source:${args.source}`);
    tags.add(`kind:${args.kind}`);
    tags.add(`status:${args.status}`);

    let severity: string | undefined = "low";
    if (args.status === "error") severity = "high";

    const detailsObj =
      args.details && typeof args.details === "object"
        ? (args.details as Record<string, unknown>)
        : null;
    const rc = detailsObj && typeof detailsObj.rc === "number" ? detailsObj.rc : null;

    let alertToQueue:
      | { severity: "medium" | "high"; title: string; body: string; externalId: string }
      | null = null;

    if (args.kind === "garmin_export") {
      tags.add("domain:health");
      tags.add("system:garmin");
      if (rc !== null) tags.add(`rc:${rc}`);
      if (rc !== null && rc !== 0) severity = "high";
    }

    if (args.kind === "cron_run") {
      tags.add("system:openclaw");
    }

    if (args.kind === "indexer") {
      tags.add("system:mission-control");
      if (args.status === "error") severity = "medium";
    }

    if (severity === "high" || severity === "medium") {
      const actionable = args.status === "error" || (args.kind === "garmin_export" && rc !== null && rc !== 0);
      if (actionable) {
        const title = severity === "high" ? "🚨 Mission Control alert" : "⚠️ Mission Control alert";
        const body = `${args.summary}\n\nKind: ${args.kind}\nSource: ${args.source}\nStatus: ${args.status}`;
        alertToQueue = {
          severity: severity === "high" ? "high" : "medium",
          title,
          body,
          externalId: `alert:${args.kind}:${args.source}:${args.ts}`,
        };
      }
    }

    const id = await ctx.db.insert("activity_events", { ...args, severity, tags: Array.from(tags) });

    if (alertToQueue) {
      // Dedup by externalId
      const existing = await ctx.db
        .query("alerts")
        .withIndex("by_externalId", (q) => q.eq("externalId", alertToQueue!.externalId))
        .first();
      if (!existing) {
        await ctx.db.insert("alerts", {
          createdAt: Date.now(),
          severity: alertToQueue.severity,
          status: "queued",
          title: alertToQueue.title,
          body: alertToQueue.body,
          activityEventId: id,
          externalId: alertToQueue.externalId,
          sentAt: undefined,
          sendStatus: undefined,
          sendError: undefined,
        });
      }
    }
    await ctx.db.insert("search_items", {
      kind: "activity_event",
      title: `${args.kind}: ${args.summary}`,
      content: [
        args.summary,
        args.kind,
        args.status,
        args.source,
        ...(args.relatedPaths ?? []),
        ...(args.relatedUrls ?? []),
        typeof args.details === "string"
          ? args.details
          : JSON.stringify(args.details),
      ]
        .filter(Boolean)
        .join(" "),
      source: args.source,
      refId: id,
      ts: args.ts,
    });
    return id;
  },
});

export const listActivityEvents = query({
  args: {
    kind: v.optional(v.string()),
    status: v.optional(v.string()),
    source: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200;

    // Use indexes when possible.
    if (args.kind && !args.status && !args.source) {
      return await ctx.db
        .query("activity_events")
        .withIndex("by_kind", (q) => q.eq("kind", args.kind as string))
        .order("desc")
        .take(limit);
    }

    if (args.source && !args.kind && !args.status) {
      return await ctx.db
        .query("activity_events")
        .withIndex("by_source", (q) => q.eq("source", args.source as string))
        .order("desc")
        .take(limit);
    }

    if (args.status && !args.kind && !args.source) {
      return await ctx.db
        .query("activity_events")
        .withIndex("by_status", (q) => q.eq("status", args.status as string))
        .order("desc")
        .take(limit);
    }

    let q = ctx.db.query("activity_events");
    if (args.kind) {
      q = q.filter((row) => row.eq(row.field("kind"), args.kind));
    }
    if (args.status) {
      q = q.filter((row) => row.eq(row.field("status"), args.status));
    }
    if (args.source) {
      q = q.filter((row) => row.eq(row.field("source"), args.source));
    }

    return await q.order("desc").take(limit);
  },
});

export const latestByKind = query({
  args: { kind: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activity_events")
      .withIndex("by_kind", (q) => q.eq("kind", args.kind))
      .order("desc")
      .first();
  },
});

export const listActivityFacets = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("activity_events").take(500);
    const kinds = new Set<string>();
    const statuses = new Set<string>();
    const sources = new Set<string>();
    for (const row of rows) {
      kinds.add(row.kind);
      statuses.add(row.status);
      sources.add(row.source);
    }
    return {
      kinds: Array.from(kinds).sort(),
      statuses: Array.from(statuses).sort(),
      sources: Array.from(sources).sort(),
    };
  },
});
