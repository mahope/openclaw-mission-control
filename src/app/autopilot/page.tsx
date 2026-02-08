"use client";

import { useEffect, useState } from "react";
import { useI18n } from "../LocaleProvider";

export default function AutopilotPage() {
  const { t, locale } = useI18n();
  const [status, setStatus] = useState<{ pid: number | null; startedAt?: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const res = await fetch("/api/autopilot/status");
    const json = await res.json();
    setStatus({ pid: json.pid ?? null, startedAt: json.startedAt });
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="grid cols-2">
      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        <h1 className="page-title">{t("autopilotTitle")}</h1>
        <p className="page-subtitle">{t("autopilotSubtitle")}</p>
      </section>

      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        <div className="badge">{t("status")}</div>
        <p className="page-subtitle" style={{ marginTop: 8 }}>
          PID: {status?.pid ?? "—"}
        </p>
        {status?.startedAt && (
          <p className="page-subtitle">
            {t("started")}: {new Date(status.startedAt).toLocaleString(locale === "da" ? "da-DK" : "en-US")}
          </p>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <button
            className="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await fetch("/api/autopilot/start", { method: "POST" });
                await refresh();
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("startAutopilot")}
          </button>
          <button
            className="button secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await fetch("/api/autopilot/stop", { method: "POST" });
                await refresh();
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("stopAutopilot")}
          </button>
          <button
            className="button secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await fetch("/api/alerts/dispatch", { method: "POST" });
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("dispatchAlertsNow")}
          </button>
        </div>
      </section>
    </div>
  );
}
