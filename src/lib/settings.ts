export type MissionControlSettings = {
  workspaceIgnore: string[];
  liveCronImportEverySeconds: number;
};

export async function getSettings(): Promise<MissionControlSettings> {
  const res = await fetch("/api/settings", { cache: "no-store" });
  if (!res.ok) {
    return {
      workspaceIgnore: ["**/node_modules/**", "**/.git/**", "**/.next/**"],
      liveCronImportEverySeconds: 30,
    };
  }
  return (await res.json()) as MissionControlSettings;
}
