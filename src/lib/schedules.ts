import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import { CronExpressionParser } from "cron-parser";

const execAsync = promisify(exec);

export type ScheduledItemInput = {
  system: string;
  name: string;
  scheduleText: string;
  nextRunAt: number;
  enabled: boolean;
  command: string;
  externalId: string;
};

const DEFAULT_WORKSPACE =
  process.env.OPENCLAW_WORKSPACE ?? "C:\\Users\\mads_\\.openclaw\\workspace";

function parseDate(value: unknown): number | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "n/a") return null;
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

function nextRunFromCron(cronText: string): number | null {
  try {
    const interval = CronExpressionParser.parse(cronText, {
      currentDate: new Date(),
    });
    return interval.next().getTime();
  } catch {
    return null;
  }
}

async function loadOpenClawCronJobs(): Promise<ScheduledItemInput[]> {
  const items: ScheduledItemInput[] = [];
  try {
    const { stdout } = await execAsync("openclaw cron list --json --all");
    const jsonText = stdout.slice(stdout.indexOf("{"));
    const parsed = JSON.parse(jsonText);
    const entries = Array.isArray(parsed) ? parsed : parsed?.jobs ?? [];
    for (const entry of entries) {
      const expr = entry?.schedule?.expr ?? entry.cron ?? entry.schedule;
      const tz = entry?.schedule?.tz;
      const scheduleText = expr
        ? tz
          ? `${expr} (${tz})`
          : String(expr)
        : "unknown";

      const nextRunAtMs =
        entry?.state?.nextRunAtMs ?? entry?.nextRunAtMs ?? entry?.nextRunAt;

      const nextRunAt =
        typeof nextRunAtMs === "number"
          ? nextRunAtMs
          : parseDate(nextRunAtMs) ?? (expr ? nextRunFromCron(String(expr)) : null);

      if (!nextRunAt) continue;

      const payload = entry?.payload;
      const command =
        payload?.kind === "systemEvent"
          ? `systemEvent: ${String(payload.text ?? "")}`
          : payload?.kind === "agentTurn"
            ? `agentTurn: ${String(payload.message ?? "")}`
            : "openclaw cron";

      items.push({
        system: "openclaw",
        name: entry.name ?? entry.id ?? "OpenClaw Cron",
        scheduleText,
        nextRunAt,
        enabled: entry.enabled ?? true,
        command,
        externalId: entry.id ?? entry.name ?? scheduleText,
      });
    }
    return items;
  } catch {
    // fall back to config parsing
  }

  try {
    const configPath = path.join(DEFAULT_WORKSPACE, "openclaw.json");
    const raw = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(raw);
    const possibleKeys = ["cron", "cronJobs", "crons", "schedules"];
    const entries = possibleKeys.flatMap((key) =>
      Array.isArray(config?.[key]) ? config[key] : []
    );
    for (const entry of entries) {
      const scheduleText = entry.schedule ?? entry.cron ?? "unknown";
      const nextRunAt =
        typeof entry.nextRunAt === "number"
          ? entry.nextRunAt
          : parseDate(entry.nextRunAt) ?? nextRunFromCron(scheduleText);
      if (!nextRunAt) continue;
      items.push({
        system: "openclaw",
        name: entry.name ?? entry.id ?? "OpenClaw Cron",
        scheduleText,
        nextRunAt,
        enabled: entry.enabled ?? true,
        command: entry.command ?? entry.task ?? "openclaw cron",
        externalId: entry.id ?? entry.name ?? scheduleText,
      });
    }
  } catch {
    return items;
  }

  return items;
}

function parseSchtasksList(stdout: string): Record<string, string>[] {
  const lines = stdout.split(/\r?\n/);
  const entries: Record<string, string>[] = [];
  let current: Record<string, string> = {};

  function pushCurrent() {
    const hasKeys = Object.keys(current).length > 0;
    if (hasKeys) entries.push(current);
    current = {};
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      pushCurrent();
      continue;
    }
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) continue;
    current[key] = value;
  }
  pushCurrent();
  return entries;
}

async function loadWindowsScheduledTasks(): Promise<ScheduledItemInput[]> {
  try {
    // Note: schtasks does not reliably support /FO JSON on Windows.
    const { stdout } = await execAsync("schtasks /Query /FO LIST /V");
    const entries = parseSchtasksList(stdout);

    return entries
      .map((entry) => {
        const name = entry["TaskName"] ?? entry["Task Name"];
        if (!name) return null;

        const nextRunAt = parseDate(entry["Next Run Time"]);
        if (!nextRunAt) return null;

        const scheduleText =
          entry["Schedule"] ??
          entry["Schedule Type"] ??
          ([entry["Schedule Type"], entry["Start Time"], entry["Start Date"]]
            .filter(Boolean)
            .join(" ") ||
            "Scheduled Task");

        const status = String(entry["Status"] ?? entry["Scheduled Task State"] ?? "");
        const enabled = !/disabled/i.test(status);

        const command =
          entry["Task To Run"] ??
          entry["Action"] ??
          entry["Actions"] ??
          "schtasks";

        return {
          system: "windows",
          name,
          scheduleText,
          nextRunAt,
          enabled,
          command,
          externalId: name,
        } satisfies ScheduledItemInput;
      })
      .filter(Boolean) as ScheduledItemInput[];
  } catch {
    return [];
  }
}

export async function collectScheduledItems(): Promise<ScheduledItemInput[]> {
  const [openclaw, windows] = await Promise.all([
    loadOpenClawCronJobs(),
    loadWindowsScheduledTasks(),
  ]);
  return [...openclaw, ...windows];
}
