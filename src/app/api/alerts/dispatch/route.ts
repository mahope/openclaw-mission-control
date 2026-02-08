import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

const execAsync = promisify(exec);
const STATUS_PATH = path.join(process.cwd(), ".mission-control-alerts.json");

export async function POST() {
  const startedAt = Date.now();
  try {
    const { stdout, stderr } = await execAsync("npm run dispatch-alerts", {
      cwd: process.cwd(),
      windowsHide: true,
    });
    await fs.writeFile(
      STATUS_PATH,
      JSON.stringify({ lastDispatchAt: Date.now(), startedAt, ok: true }, null, 2),
      "utf-8"
    );
    return Response.json({ ok: true, stdout, stderr });
  } catch (err) {
    await fs.writeFile(
      STATUS_PATH,
      JSON.stringify(
        { lastDispatchAt: Date.now(), startedAt, ok: false, error: String(err) },
        null,
        2
      ),
      "utf-8"
    );
    return new Response(String(err), { status: 500 });
  }
}
