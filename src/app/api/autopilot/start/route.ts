import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const PID_PATH = path.join(process.cwd(), ".mission-control-autopilot.json");

export async function POST() {
  // Spawn a detached autopilot process.
  const child = spawn("cmd.exe", ["/c", "npm run autopilot"], {
    cwd: process.cwd(),
    windowsHide: true,
    detached: true,
    stdio: "ignore",
  });
  child.unref();

  await fs.writeFile(PID_PATH, JSON.stringify({ pid: child.pid, startedAt: Date.now() }, null, 2), "utf-8");
  return Response.json({ ok: true, pid: child.pid });
}
