import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { collectScheduledItems } from "../src/lib/schedules";

const convexUrl = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL.");
}

const client = new ConvexHttpClient(convexUrl);

async function run() {
  const items = await collectScheduledItems();
  await client.mutation(api.schedules.upsertScheduledItems, { items });
  await client.mutation(api.activity.createActivityEvent, {
    ts: Date.now(),
    source: "mission-control",
    kind: "indexer",
    status: "ok",
    summary: "Schedules refreshed",
    details: { count: items.length },
    relatedPaths: [],
    relatedUrls: [],
  });
  console.log(`Indexed ${items.length} scheduled items.`);
}

run().catch(async (error) => {
  await client.mutation(api.activity.createActivityEvent, {
    ts: Date.now(),
    source: "mission-control",
    kind: "indexer",
    status: "error",
    summary: "Schedules refresh failed",
    details: { error: String(error) },
    relatedPaths: [],
    relatedUrls: [],
  });
  console.error(error);
  process.exit(1);
});
