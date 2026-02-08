import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

const execAsync = promisify(exec);
const STATUS_PATH = path.join(process.cwd(), ".mission-control-alerts.json");

export async function POST(req: Request) {
  const startedAt = Date.now();
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";

  // Basic rate limiting (avoid spam): default 60s cooldown unless forced
  try {
    const raw = await fs.readFile(STATUS_PATH, "utf-8");
    const prev = JSON.parse(raw);
    const last = typeof prev.lastDispatchAt === "number" ? prev.lastDispatchAt : null;
    if (!force && last && Date.now() - last < 60_000) {
      return Response.json({ ok: true, skipped: true, reason: "cooldown", lastDispatchAt: last });
    }
  } catch {
    // ignore
  }

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
