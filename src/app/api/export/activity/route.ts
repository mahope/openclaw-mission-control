import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convexUrl = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

export async function GET() {
  if (!convex) return new Response("Convex not configured", { status: 500 });
  const events = await convex.query(api.activity.listActivityEvents, { limit: 5000 });
  return Response.json({ exportedAt: Date.now(), events });
}
