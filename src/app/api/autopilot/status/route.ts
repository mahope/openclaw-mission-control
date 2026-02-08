import fs from "node:fs/promises";
import path from "node:path";

const PID_PATH = path.join(process.cwd(), ".mission-control-autopilot.json");

export async function GET() {
  try {
    const raw = await fs.readFile(PID_PATH, "utf-8");
    return Response.json({ ok: true, ...JSON.parse(raw) });
  } catch {
    return Response.json({ ok: true, pid: null });
  }
}
