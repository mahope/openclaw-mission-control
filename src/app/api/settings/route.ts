import fs from "node:fs/promises";
import path from "node:path";

const SETTINGS_PATH = path.join(process.cwd(), ".mission-control.json");

type Settings = {
  workspaceIgnore: string[];
  liveCronImportEverySeconds: number;
};

const DEFAULTS: Settings = {
  workspaceIgnore: ["**/node_modules/**", "**/.git/**", "**/.next/**"],
  liveCronImportEverySeconds: 30,
};

async function load(): Promise<Settings> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      workspaceIgnore: Array.isArray(parsed.workspaceIgnore)
        ? parsed.workspaceIgnore
        : DEFAULTS.workspaceIgnore,
      liveCronImportEverySeconds:
        typeof parsed.liveCronImportEverySeconds === "number"
          ? parsed.liveCronImportEverySeconds
          : DEFAULTS.liveCronImportEverySeconds,
    };
  } catch {
    return DEFAULTS;
  }
}

export async function GET() {
  return Response.json(await load());
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Settings>;
  const next: Settings = {
    workspaceIgnore: Array.isArray(body.workspaceIgnore)
      ? body.workspaceIgnore
      : DEFAULTS.workspaceIgnore,
    liveCronImportEverySeconds:
      typeof body.liveCronImportEverySeconds === "number"
        ? body.liveCronImportEverySeconds
        : DEFAULTS.liveCronImportEverySeconds,
  };
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(next, null, 2), "utf-8");
  return Response.json({ ok: true });
}
