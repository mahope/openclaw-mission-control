"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useI18n } from "../LocaleProvider";

export default function AlertsPage() {
  const { t, locale } = useI18n();
  const [dispatching, setDispatching] = useState(false);
  const [lastDispatchAt, setLastDispatchAt] = useState<number | null>(null);
  const alerts = useQuery(api.alerts.listAlerts, { limit: 200 });

  useEffect(() => {
    fetch("/api/alerts/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json && typeof json.lastDispatchAt === "number") {
          setLastDispatchAt(json.lastDispatchAt);
        }
      })
      .catch(() => {
        // ignore
      });
  }, []);

  return (
    <div className="grid cols-2">
      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        <h1 className="page-title">{t("alertsTitle")}</h1>
        <p className="page-subtitle">{t("alertsSubtitle")}</p>
        <div className="filters" style={{ marginTop: 16, alignItems: "center" }}>
          <button
            className="button"
            onClick={async () => {
              setDispatching(true);
              try {
                await fetch("/api/alerts/dispatch", { method: "POST" });
              } finally {
                setDispatching(false);
              }
            }}
          >
            {dispatching ? t("sending") : t("dispatchNow")}
          </button>
          <span className="page-subtitle">{t("total")}: {alerts?.length ?? "—"}</span>
          <span className="page-subtitle">
            Last dispatch: {lastDispatchAt ? new Date(lastDispatchAt).toLocaleString(locale === "da" ? "da-DK" : "en-US") : "—"}
          </span>
        </div>
      </section>

      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        <div className="list">
          {alerts?.map((a) => (
            <div key={a._id} className="list-item">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <strong>{a.title}</strong>
                <div className={`pill ${a.sentAt ? "ok" : "running"}`}>
                  {a.severity} · {a.sentAt ? a.sendStatus ?? "sent" : "queued"}
                </div>
              </div>
              <div className="page-subtitle">
                {new Date(a.createdAt).toLocaleString(locale === "da" ? "da-DK" : "en-US")}
                {a.sentAt ? ` · ${new Date(a.sentAt).toLocaleString(locale === "da" ? "da-DK" : "en-US")}` : ""}
              </div>
              <pre className="mono" style={{ whiteSpace: "pre-wrap" }}>{a.body}</pre>
              {a.sendError && (
                <div className="panel" style={{ marginTop: 8 }}>
                  <strong>Send error</strong>
                  <pre className="mono" style={{ whiteSpace: "pre-wrap" }}>{a.sendError}</pre>
                </div>
              )}
            </div>
          ))}
          {!alerts?.length && <div className="page-subtitle">{t("noAlerts")}</div>}
        </div>
      </section>
    </div>
  );
}
