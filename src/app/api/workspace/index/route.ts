import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function POST() {
  // Local-only helper: run the workspace indexer script.
  const cwd = process.cwd();
  const cmd = "npm run index-workspace";

  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd, windowsHide: true });
    return Response.json({ ok: true, stdout, stderr });
  } catch (err) {
    return new Response(String(err), { status: 500 });
  }
}
