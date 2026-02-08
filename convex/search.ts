import { query } from "./_generated/server";
import { v } from "convex/values";

export const searchAll = query({
  args: {
    text: v.string(),
    kind: v.optional(v.string()),
    source: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const trimmed = args.text.trim();
    if (!trimmed) {
      return [];
    }
    return await ctx.db
      .query("search_items")
      .withSearchIndex("search_all", (q) => {
        let qq = q.search("content", trimmed);
        if (args.kind) qq = qq.eq("kind", args.kind);
        if (args.source) qq = qq.eq("source", args.source);
        return qq;
      })
      .take(args.limit ?? 50);
  },
});
