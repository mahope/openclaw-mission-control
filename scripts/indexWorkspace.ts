import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fg from "fast-glob";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const convexUrl = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL.");
}

const client = new ConvexHttpClient(convexUrl);

const DEFAULT_WORKSPACE =
  process.env.OPENCLAW_WORKSPACE ?? "C:\\Users\\mads_\\.openclaw\\workspace";

const INCLUDE_EXTENSIONS = new Set([
  ".md",
  ".txt",
  ".log",
  ".json",
  ".yml",
  ".yaml",
]);

const MAX_FILE_SIZE = 200_000;
const CHUNK_SIZE = 6_000;

function chunkContent(content: string) {
  const chunks: string[] = [];
  for (let i = 0; i < content.length; i += CHUNK_SIZE) {
    chunks.push(content.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

async function run() {
  let ignore = ["**/node_modules/**", "**/.git/**", "**/.next/**"]; // default
  try {
    const settingsRaw = await fs.readFile(
      path.join(process.cwd(), ".mission-control.json"),
      "utf-8"
    );
    const parsed = JSON.parse(settingsRaw);
    if (Array.isArray(parsed.workspaceIgnore)) {
      ignore = parsed.workspaceIgnore;
    }
  } catch {
    // ignore
  }

  const files = await fg("**/*", {
    cwd: DEFAULT_WORKSPACE,
    dot: true,
    ignore,
    onlyFiles: true,
  });

  const docs: { path: string; content: string; updatedAt: number }[] = [];

  for (const relativePath of files) {
    const absolutePath = path.join(DEFAULT_WORKSPACE, relativePath);
    const ext = path.extname(relativePath).toLowerCase();
    if (!INCLUDE_EXTENSIONS.has(ext)) continue;
    const stat = await fs.stat(absolutePath);
    if (stat.size > MAX_FILE_SIZE) continue;
    const content = await fs.readFile(absolutePath, "utf-8");
    const chunks = chunkContent(content);
    chunks.forEach((chunk, index) => {
      const chunkPath = chunks.length > 1 ? `${relativePath}#${index + 1}` : relativePath;
      docs.push({
        path: chunkPath,
        content: chunk,
        updatedAt: stat.mtimeMs,
      });
    });
  }

  await client.mutation(api.workspace.replaceWorkspaceDocs, {
    source: "workspace",
    docs,
  });

  await client.mutation(api.activity.createActivityEvent, {
    ts: Date.now(),
    source: "mission-control",
    kind: "indexer",
    status: "ok",
    summary: "Workspace indexed",
    details: { count: docs.length },
    relatedPaths: [],
    relatedUrls: [],
  });

  console.log(`Indexed ${docs.length} workspace docs.`);
}

run().catch(async (error) => {
  await client.mutation(api.activity.createActivityEvent, {
    ts: Date.now(),
    source: "mission-control",
    kind: "indexer",
    status: "error",
    summary: "Workspace indexing failed",
    details: { error: String(error) },
    relatedPaths: [],
    relatedUrls: [],
  });
  console.error(error);
  process.exit(1);
});
