import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { collectScheduledItems } from "../../../../lib/schedules";

const convexUrl = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
const convexClient = convexUrl ? new ConvexHttpClient(convexUrl) : null;

export async function POST() {
  if (!convexClient) {
    return new Response("Convex is not configured.", { status: 500 });
  }

  const items = await collectScheduledItems();
  await convexClient.mutation(api.schedules.upsertScheduledItems, { items });
  await convexClient.mutation(api.activity.createActivityEvent, {
    ts: Date.now(),
    source: "mission-control",
    kind: "indexer",
    status: "ok",
    summary: "Schedules refreshed",
    details: { count: items.length, origin: "api" },
    relatedPaths: [],
    relatedUrls: [],
  });
  return Response.json({ count: items.length });
}
