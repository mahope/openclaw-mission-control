"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useI18n } from "./LocaleProvider";

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function HomePage() {
  const { t } = useI18n();
  const weekRange = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start: start.getTime(), end: end.getTime() };
  }, []);

  const activity = useQuery(api.activity.listActivityEvents, { limit: 6 });
  const lastGarmin = useQuery(api.activity.latestByKind, { kind: "garmin_export" });
  const schedules = useQuery(api.schedules.listScheduledItems, weekRange);

  return (
    <div className="grid cols-2">
      <section className="panel">
        <h1 className="page-title">Mission Control</h1>
        <p className="page-subtitle">{t("overviewIntro")}</p>

        <div className="filters" style={{ marginTop: 18 }}>
          <button
            className="button secondary"
            onClick={async () => {
              await fetch("/api/schedules/refresh", { method: "POST" });
            }}
          >
            {t("quickRefreshCalendar")}
          </button>
          <button
            className="button secondary"
            onClick={async () => {
              await fetch("/api/workspace/index", { method: "POST" });
            }}
          >
            {t("quickIndexWorkspace")}
          </button>
          <button
            className="button secondary"
            onClick={async () => {
              await fetch("/api/openclaw/import-cron-runs", { method: "POST" });
            }}
          >
            {t("quickImportCronHistory")}
          </button>
          <a className="button secondary" href="/api/export/activity" target="_blank">
            {t("quickExportActivity")}
          </a>
          <a className="button secondary" href="/api/export/schedules?days=14" target="_blank">
            {t("quickExportCalendar")}
          </a>
          <Link className="button secondary" href="/alerts">
            {t("quickOpenAlerts")}
          </Link>
          <Link className="button secondary" href="/autopilot">
            {t("quickOpenAutopilot")}
          </Link>
        </div>

        <div style={{ marginTop: 24 }} className="grid cols-2">
          <div>
            <div className="badge">Aktivitet</div>
            <h2 style={{ margin: "8px 0" }}>
              {activity ? activity.length : "—"}
            </h2>
            <p className="page-subtitle">
              Seneste handlinger på tværs af tools, scripts og jobs.
            </p>
            <Link href="/activity" className="pill" style={{ marginTop: 12 }}>
              Åbn feed
            </Link>
          </div>
          <div>
            <div className="badge">Kommende</div>
            <h2 style={{ margin: "8px 0" }}>
              {schedules ? schedules.length : "—"}
            </h2>
            <p className="page-subtitle">
              Planlagte jobs/automations de næste 7 dage.
            </p>
            <Link href="/calendar" className="pill" style={{ marginTop: 12 }}>
              Åbn kalender
            </Link>
          </div>
        </div>
      </section>
      <section className="panel">
        <div className="badge">{t("latestActivity")}</div>

        {lastGarmin && (
          <div className="panel" style={{ marginTop: 12 }}>
            <div className="badge">Garmin (seneste)</div>
            <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
              <strong>{lastGarmin.summary}</strong>
              <div className={`pill ${lastGarmin.status}`}>status: {lastGarmin.status}</div>
              <div className="page-subtitle">
                {new Date(lastGarmin.ts).toLocaleString("da-DK")}
              </div>
              {lastGarmin.relatedPaths?.length ? (
                <div className="page-subtitle mono">{lastGarmin.relatedPaths[0]}</div>
              ) : null}
              <Link href="/activity" className="pill">Åbn i feed</Link>
            </div>
          </div>
        )}
        <div className="list" style={{ marginTop: 12 }}>
          {activity?.length ? (
            activity.map((item) => (
              <div key={item._id} className="list-item">
                <strong>{item.summary}</strong>
                <div className={`pill ${item.status}`}>
                  {item.kind} · {item.status}
                </div>
                <span className="page-subtitle">{item.source}</span>
              </div>
            ))
          ) : (
            <div className="page-subtitle">
              No activity yet. Emit your first event to get started.
            </div>
          )}
        </div>
        <div className="footer-note">
          Tip: Brug den lokale `/api/activity` route eller `npm run emit-activity`
          til at logge ting i real-time.
        </div>
      </section>
    </div>
  );
}
