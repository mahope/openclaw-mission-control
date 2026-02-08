import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  activity_events: defineTable({
    ts: v.number(),
    source: v.string(),
    kind: v.string(),
    status: v.string(),
    summary: v.string(),
    details: v.any(),
    relatedPaths: v.array(v.string()),
    relatedUrls: v.array(v.string()),
    externalId: v.optional(v.string()),
    severity: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_ts", ["ts"])
    .index("by_source", ["source"])
    .index("by_kind", ["kind"])
    .index("by_status", ["status"])
    .index("by_externalId", ["externalId"]),
  alerts: defineTable({
    createdAt: v.number(),
    severity: v.string(),
    status: v.string(),
    title: v.string(),
    body: v.string(),
    activityEventId: v.optional(v.id("activity_events")),
    externalId: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    sendStatus: v.optional(v.string()),
    sendError: v.optional(v.string()),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_sentAt", ["sentAt"])
    .index("by_externalId", ["externalId"]),

  scheduled_items: defineTable({
    system: v.string(),
    name: v.string(),
    scheduleText: v.string(),
    nextRunAt: v.number(),
    enabled: v.boolean(),
    command: v.string(),
    externalId: v.string(),
    lastIndexedAt: v.number(),
  })
    .index("by_next_run", ["nextRunAt"])
    .index("by_system", ["system"])
    .index("by_external", ["system", "externalId"]),
  workspace_docs: defineTable({
    path: v.string(),
    content: v.string(),
    updatedAt: v.number(),
    source: v.string(),
  })
    .index("by_path", ["path"])
    .index("by_source", ["source"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["source"],
    }),
  search_items: defineTable({
    kind: v.string(),
    title: v.string(),
    content: v.string(),
    source: v.string(),
    refId: v.optional(v.string()),
    path: v.optional(v.string()),
    url: v.optional(v.string()),
    ts: v.optional(v.number()),
  })
    .index("by_kind", ["kind"])
    .index("by_source", ["source"])
    .index("by_kind_ref", ["kind", "refId"])
    .searchIndex("search_all", {
      searchField: "content",
      filterFields: ["kind", "source"],
    }),
});
