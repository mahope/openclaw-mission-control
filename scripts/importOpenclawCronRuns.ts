import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const execAsync = promisify(exec);

const convexUrl = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL.");

const client = new ConvexHttpClient(convexUrl);

async function run() {
  const { stdout } = await execAsync("openclaw cron list --json --all");
  const jsonText = stdout.slice(stdout.indexOf("{"));
  const parsed = JSON.parse(jsonText);
  const jobs: unknown[] = Array.isArray(parsed) ? parsed : parsed?.jobs ?? [];

  let total = 0;

  for (const job of jobs) {
    const j = job as Record<string, unknown>;
    const id = j.id;
    if (!id) continue;

    const { stdout: runsStdout } = await execAsync(
      `openclaw cron runs --id ${id} --limit 50`
    );
    const runsJsonText = runsStdout.slice(runsStdout.indexOf("{"));
    const runsParsed = JSON.parse(runsJsonText);
    const entries: unknown[] = runsParsed?.entries ?? [];

    for (const entry of entries) {
      const e = entry as Record<string, unknown>;
      const externalId = `openclaw-cron-run:${e.jobId}:${e.runAtMs ?? e.ts}`;
      const status = typeof e.status === "string" ? e.status : "unknown";

      const summary =
        status === "error"
          ? `Cron run failed: ${j.name ?? j.id}`
          : `Cron run finished: ${j.name ?? j.id}`;

      const runAtMs = typeof e.runAtMs === "number" ? e.runAtMs : null;
      const ts = typeof e.ts === "number" ? e.ts : null;

      await client.mutation(api.activity.createActivityEvent, {
        ts: runAtMs ?? ts ?? Date.now(),
        source: "openclaw",
        kind: "cron_run",
        status,
        summary,
        details: {
          job: {
            id: j.id,
            name: j.name,
            schedule: j.schedule,
          },
          run: e,
        },
        relatedPaths: [],
        relatedUrls: [],
        externalId,
      });
      total++;
    }
  }

  await client.mutation(api.activity.createActivityEvent, {
    ts: Date.now(),
    source: "mission-control",
    kind: "indexer",
    status: "ok",
    summary: "Imported OpenClaw cron run history",
    details: { total },
    relatedPaths: [],
    relatedUrls: [],
    externalId: `openclaw-cron-import:${new Date().toISOString().slice(0, 10)}`,
  });

  console.log(`Imported ${total} cron run entries.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
