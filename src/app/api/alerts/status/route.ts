import fs from "node:fs/promises";
import path from "node:path";

const STATUS_PATH = path.join(process.cwd(), ".mission-control-alerts.json");

export async function GET() {
  try {
    const raw = await fs.readFile(STATUS_PATH, "utf-8");
    return Response.json({ ok: true, ...JSON.parse(raw) });
  } catch {
    return Response.json({ ok: true, lastDispatchAt: null });
  }
}
