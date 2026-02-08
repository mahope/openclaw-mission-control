import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

type Settings = {
  workspaceIgnore: string[];
  liveCronImportEverySeconds: number;
};

const SETTINGS_PATH = path.join(process.cwd(), ".mission-control.json");

async function loadSettings(): Promise<Settings> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      workspaceIgnore: Array.isArray(parsed.workspaceIgnore) ? parsed.workspaceIgnore : [],
      liveCronImportEverySeconds:
        typeof parsed.liveCronImportEverySeconds === "number" ? parsed.liveCronImportEverySeconds : 30,
    };
  } catch {
    return { workspaceIgnore: [], liveCronImportEverySeconds: 30 };
  }
}

async function tick() {
  // Keep it simple: refresh schedules + import cron runs + dispatch alerts.
  await execAsync("npm run refresh-schedules", { windowsHide: true });
  await execAsync("npm run import-openclaw-cron-runs", { windowsHide: true });
  await execAsync("npm run dispatch-alerts", { windowsHide: true });
}

async function main() {
  console.log("Mission Control Autopilot started.");

  while (true) {
    const settings = await loadSettings();
    const everySeconds = Math.max(15, Math.min(600, settings.liveCronImportEverySeconds || 30));
    try {
      await tick();
    } catch (err) {
      console.error("Autopilot tick failed:", err);
    }
    await new Promise((r) => setTimeout(r, everySeconds * 1000));
  }
}

main();
