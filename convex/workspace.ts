import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const replaceWorkspaceDocs = mutation({
  args: {
    source: v.string(),
    docs: v.array(
      v.object({
        path: v.string(),
        content: v.string(),
        updatedAt: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existingDocs = await ctx.db
      .query("workspace_docs")
      .withIndex("by_source", (q) => q.eq("source", args.source))
      .collect();
    for (const doc of existingDocs) {
      await ctx.db.delete(doc._id);
    }

    const existingSearchItems = await ctx.db
      .query("search_items")
      .withIndex("by_kind_ref", (q) =>
        q.eq("kind", "workspace_doc").eq("refId", args.source)
      )
      .collect();
    for (const item of existingSearchItems) {
      await ctx.db.delete(item._id);
    }

    for (const doc of args.docs) {
      await ctx.db.insert("workspace_docs", {
        ...doc,
        source: args.source,
      });
      await ctx.db.insert("search_items", {
        kind: "workspace_doc",
        title: doc.path,
        content: doc.content,
        source: args.source,
        refId: args.source,
        path: doc.path,
        ts: doc.updatedAt,
      });
    }
    return { inserted: args.docs.length };
  },
});
