import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function POST() {
  // Local-only helper: import OpenClaw cron run history into the Activity Feed.
  const cwd = process.cwd();
  const cmd = "npm run import-openclaw-cron-runs";

  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd, windowsHide: true });
    return Response.json({ ok: true, stdout, stderr });
  } catch (err) {
    return new Response(String(err), { status: 500 });
  }
}
