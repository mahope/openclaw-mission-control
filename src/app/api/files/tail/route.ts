import fs from "node:fs/promises";
import path from "node:path";

const OPENCLAW_WORKSPACE =
  process.env.OPENCLAW_WORKSPACE ?? "C:\\Users\\mads_\\.openclaw\\workspace";
const GARMIN_LOGS = "C:\\Users\\mads_\\Garmin\\logs";

function isAllowedPath(filePath: string) {
  const normalized = path.resolve(filePath);
  const allowedRoots = [path.resolve(OPENCLAW_WORKSPACE), path.resolve(GARMIN_LOGS)];
  return allowedRoots.some((root) => normalized.startsWith(root + path.sep) || normalized === root);
}

function tailLines(text: string, lines: number) {
  const arr = text.split(/\r?\n/);
  return arr.slice(Math.max(0, arr.length - lines)).join("\n");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawPath = url.searchParams.get("path");
  const lines = Number(url.searchParams.get("lines") ?? "200");

  if (!rawPath) return new Response("Missing path", { status: 400 });
  // Allow chunk refs like "file.md#2" from the workspace indexer.
  const filePath = rawPath.split("#")[0];
  if (!isAllowedPath(filePath)) return new Response("Path not allowed", { status: 403 });

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return new Response("Not a file", { status: 400 });
    // Safety: cap read size to keep it fast.
    const raw = await fs.readFile(filePath, "utf-8");
    const content = tailLines(raw, Math.min(Math.max(lines, 10), 2000));
    return Response.json({ path: filePath, bytes: stat.size, mtimeMs: stat.mtimeMs, content });
  } catch (err) {
    return new Response(String(err), { status: 500 });
  }
}
