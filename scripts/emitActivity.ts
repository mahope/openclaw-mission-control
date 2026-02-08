import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const convexUrl = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL.");
}

const client = new ConvexHttpClient(convexUrl);

function parseArg(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function readStdin() {
  // In many CI/exec environments stdin is a non-TTY pipe that never closes.
  // We treat stdin as empty unless we actually receive data quickly.
  if (process.stdin.isTTY) return "";

  return new Promise<string>((resolve) => {
    let data = "";
    let sawData = false;

    const finish = () => {
      cleanup();
      resolve(sawData ? data : "");
    };

    const cleanup = () => {
      process.stdin.off("data", onData);
      process.stdin.off("end", finish);
      if (timer) clearTimeout(timer);
      if (idleTimer) clearTimeout(idleTimer);
    };

    const onData = (chunk: string) => {
      sawData = true;
      data += chunk;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(finish, 50);
    };

    const timer: NodeJS.Timeout | null = setTimeout(finish, 50);
    let idleTimer: NodeJS.Timeout | null = null;

    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", onData);
    process.stdin.on("end", finish);
  });
}

async function run() {
  const jsonArg = parseArg("json");
  const jsonFile = parseArg("jsonFile");
  const stdin = await readStdin();
  const fs = await import("node:fs");
  const payload =
    jsonArg ||
    (jsonFile ? fs.readFileSync(jsonFile, "utf-8") : "") ||
    stdin.trim();

  let event: {
    ts: number;
    source: string;
    kind: string;
    status: string;
    summary: string;
    details: unknown;
    relatedPaths: string[];
    relatedUrls: string[];
    externalId?: string;
  };

  if (payload) {
    const parsed = JSON.parse(payload);
    event = {
      ts: parsed.ts ?? Date.now(),
      source: parsed.source ?? "openclaw",
      kind: parsed.kind ?? "tool",
      status: parsed.status ?? "ok",
      summary: parsed.summary ?? "Activity event",
      details: parsed.details ?? {},
      relatedPaths: parsed.relatedPaths ?? [],
      relatedUrls: parsed.relatedUrls ?? [],
      externalId: parsed.externalId,
    };
  } else {
    const summary = parseArg("summary") ?? "Activity event";
    event = {
      ts: Date.now(),
      source: parseArg("source") ?? "openclaw",
      kind: parseArg("kind") ?? "tool",
      status: parseArg("status") ?? "ok",
      summary,
      details: parseArg("details")
        ? JSON.parse(parseArg("details") as string)
        : {},
      relatedPaths: parseArg("relatedPaths")
        ? JSON.parse(parseArg("relatedPaths") as string)
        : [],
      relatedUrls: parseArg("relatedUrls")
        ? JSON.parse(parseArg("relatedUrls") as string)
        : [],
      externalId: parseArg("externalId"),
    };
  }

  const id = await client.mutation(api.activity.createActivityEvent, event);
  console.log(`Activity event created: ${id}`);
  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
