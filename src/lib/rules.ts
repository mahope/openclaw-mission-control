export type RuleResult = {
  severity?: "low" | "medium" | "high";
  tags: string[];
  alert?: { severity: "medium" | "high"; title: string; body: string; externalId?: string };
};

function pickRc(details: unknown): number | null {
  if (!details || typeof details !== "object") return null;
  const d = details as Record<string, unknown>;
  if (typeof d.rc === "number") return d.rc;
  if (typeof d.RC === "number") return d.RC;
  if (d.details && typeof d.details === "object") {
    const inner = d.details as Record<string, unknown>;
    if (typeof inner.rc === "number") return inner.rc;
  }
  return null;
}

export function applyRules(input: {
  ts: number;
  source: string;
  kind: string;
  status: string;
  summary: string;
  details: unknown;
  relatedPaths: string[];
}): RuleResult {
  const tags = new Set<string>();
  tags.add(`source:${input.source}`);
  tags.add(`kind:${input.kind}`);
  tags.add(`status:${input.status}`);

  const rc = pickRc(input.details);

  // Baseline severity
  let severity: RuleResult["severity"] = "low";
  if (input.status === "error") severity = "high";

  if (input.kind === "garmin_export") {
    tags.add("domain:health");
    tags.add("system:garmin");
    if (rc !== null) tags.add(`rc:${rc}`);
    if (rc !== null && rc !== 0) severity = "high";
  }

  if (input.kind === "cron_run") {
    tags.add("system:openclaw");
    if (input.status === "error") severity = "high";
  }

  if (input.kind === "indexer") {
    tags.add("system:mission-control");
    if (input.status === "error") severity = "medium";
  }

  let alert: RuleResult["alert"] | undefined;
  if (severity === "high" || severity === "medium") {
    // Only alert on actionable things.
    if (input.status === "error" || (input.kind === "garmin_export" && rc !== 0 && rc !== null)) {
      const title = severity === "high" ? "🚨 Mission Control alert" : "⚠️ Mission Control alert";
      const body = `${input.summary}\n\nKind: ${input.kind}\nSource: ${input.source}\nStatus: ${input.status}`;
      alert = {
        severity: severity === "high" ? "high" : "medium",
        title,
        body,
        externalId: `alert:${input.kind}:${input.source}:${input.ts}`,
      };
    }
  }

  return { severity, tags: Array.from(tags), alert };
}
