import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convexUrl = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

export async function GET(req: Request) {
  if (!convex) return new Response("Convex not configured", { status: 500 });
  const url = new URL(req.url);
  const days = Number(url.searchParams.get("days") ?? "14");
  const start = Date.now();
  const end = start + days * 24 * 60 * 60 * 1000;
  const schedules = await convex.query(api.schedules.listScheduledItems, { start, end });
  return Response.json({ exportedAt: Date.now(), start, end, schedules });
}
