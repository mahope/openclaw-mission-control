import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convexUrl = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
const convexClient = convexUrl ? new ConvexHttpClient(convexUrl) : null;

export async function POST(request: Request) {
  if (!convexClient) {
    return new Response("Convex is not configured.", { status: 500 });
  }

  const payload = await request.json();
  const event = {
    ts: payload.ts ?? Date.now(),
    source: payload.source ?? "openclaw",
    kind: payload.kind ?? "tool",
    status: payload.status ?? "ok",
    summary: payload.summary ?? "Activity event",
    details: payload.details ?? {},
    relatedPaths: payload.relatedPaths ?? [],
    relatedUrls: payload.relatedUrls ?? [],
  };

  const id = await convexClient.mutation(api.activity.createActivityEvent, event);
  return Response.json({ id });
}
