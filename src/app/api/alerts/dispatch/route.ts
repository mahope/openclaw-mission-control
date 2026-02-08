import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function POST() {
  try {
    const { stdout, stderr } = await execAsync("npm run dispatch-alerts", {
      cwd: process.cwd(),
      windowsHide: true,
    });
    return Response.json({ ok: true, stdout, stderr });
  } catch (err) {
    return new Response(String(err), { status: 500 });
  }
}
