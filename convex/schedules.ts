import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertScheduledItems = mutation({
  args: {
    items: v.array(
      v.object({
        system: v.string(),
        name: v.string(),
        scheduleText: v.string(),
        nextRunAt: v.number(),
        enabled: v.boolean(),
        command: v.string(),
        externalId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const item of args.items) {
      const existing = await ctx.db
        .query("scheduled_items")
        .withIndex("by_external", (q) =>
          q.eq("system", item.system).eq("externalId", item.externalId)
        )
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { ...item, lastIndexedAt: now });
      } else {
        await ctx.db.insert("scheduled_items", {
          ...item,
          lastIndexedAt: now,
        });
      }
      const searchRefId = `${item.system}:${item.externalId}`;
      const previousSearchItems = await ctx.db
        .query("search_items")
        .withIndex("by_kind_ref", (q) =>
          q.eq("kind", "scheduled_item").eq("refId", searchRefId)
        )
        .collect();
      for (const previous of previousSearchItems) {
        await ctx.db.delete(previous._id);
      }
      await ctx.db.insert("search_items", {
        kind: "scheduled_item",
        title: `${item.system}: ${item.name}`,
        content: [
          item.system,
          item.name,
          item.scheduleText,
          item.command,
          item.enabled ? "enabled" : "disabled",
        ]
          .filter(Boolean)
          .join(" "),
        source: item.system,
        refId: searchRefId,
        ts: item.nextRunAt,
      });
    }
    return { inserted: args.items.length };
  },
});

export const listScheduledItems = query({
  args: {
    start: v.number(),
    end: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scheduled_items")
      .withIndex("by_next_run", (q) =>
        q.gte("nextRunAt", args.start).lte("nextRunAt", args.end)
      )
      .collect();
  },
});
