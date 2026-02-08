import fs from "node:fs/promises";
import path from "node:path";

const PID_PATH = path.join(process.cwd(), ".mission-control-autopilot.json");

export async function POST() {
  try {
    const raw = await fs.readFile(PID_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    const pid = parsed.pid as number | null;
    if (pid) {
      try {
        process.kill(pid);
      } catch {
        // ignore
      }
    }
    await fs.rm(PID_PATH, { force: true });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: true });
  }
}
