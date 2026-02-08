"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatRelativeTime } from "../../lib/format";
import { useI18n } from "../LocaleProvider";

type FilterState = {
  kind?: string;
  status?: string;
  source?: string;
};

type TailResponse = {
  path: string;
  bytes: number;
  mtimeMs: number;
  content: string;
};

export default function ActivityPage() {
  const { t } = useI18n();
  const [filters, setFilters] = useState<FilterState>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tailLoading, setTailLoading] = useState(false);
  const [tailData, setTailData] = useState<TailResponse | null>(null);
  const [live, setLive] = useState(true);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const events = useQuery(api.activity.listActivityEvents, {
    ...filters,
    limit: 200,
  });
  const facets = useQuery(api.activity.listActivityFacets, {});

  const selected = useMemo(
    () => events?.find((event) => event._id === selectedId) ?? null,
    [events, selectedId]
  );

  useEffect(() => {
    if (!live) return;

    let everySeconds = 30;
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json && typeof json.liveCronImportEverySeconds === "number") {
          everySeconds = Math.max(10, Math.min(600, json.liveCronImportEverySeconds));
        }
      })
      .catch(() => {
        // ignore
      });

    const interval = setInterval(async () => {
      try {
        await fetch("/api/openclaw/import-cron-runs", { method: "POST" });
        setLastSync(Date.now());
      } catch {
        // ignore
      }
    }, everySeconds * 1000);
    return () => clearInterval(interval);
  }, [live]);

  return (
    <div className="grid cols-2">
      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        <h1 className="page-title">{t("activityTitle")}</h1>
        <p className="page-subtitle">{t("activitySubtitle")}</p>
        <div className="filters" style={{ marginTop: 20, alignItems: "center" }}>
          <button
            className={`button secondary ${live ? "" : ""}`}
            onClick={() => setLive((v) => !v)}
          >
            {live ? t("liveOn") : t("liveOff")}
          </button>
          <span className="page-subtitle">
            {lastSync ? `${t("syncLabel")}: ${formatRelativeTime(lastSync)}` : `${t("syncLabel")}: —`}
          </span>
          <select
            value={filters.kind ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                kind: event.target.value || undefined,
              }))
            }
          >
            <option value="">{t("allKinds")}</option>
            {facets?.kinds.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
          <select
            value={filters.status ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                status: event.target.value || undefined,
              }))
            }
          >
            <option value="">{t("allStatuses")}</option>
            {facets?.statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={filters.source ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                source: event.target.value || undefined,
              }))
            }
          >
            <option value="">{t("allSources")}</option>
            {facets?.sources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        <div className="list">
          {events?.map((event) => (
            <button
              key={event._id}
              className="list-item"
              style={{ textAlign: "left", cursor: "pointer" }}
              onClick={() => setSelectedId(event._id)}
            >
              <strong>{event.summary}</strong>
              <div className={`pill ${event.status}`}>
                {event.kind} · {event.status} · {formatRelativeTime(event.ts)}
              </div>
              <div className="page-subtitle">
                {new Date(event.ts).toLocaleString("da-DK")}
              </div>
              <span className="page-subtitle">{event.source}</span>
            </button>
          ))}
          {!events?.length && (
            <div className="page-subtitle">
              {t("noEvents")}
            </div>
          )}
        </div>
      </section>

      {selected && (
        <>
          <div
            className="drawer-backdrop"
            onClick={() => {
              setSelectedId(null);
              setTailData(null);
            }}
          />
          <aside className="drawer">
            <h2 style={{ marginTop: 0 }}>{selected.summary}</h2>
            <div className="pill">
              {selected.kind} · {selected.status}
            </div>
            <p className="page-subtitle">{selected.source}</p>
            <div className="panel" style={{ marginTop: 16 }}>
              <strong>{t("details")}</strong>
              <pre style={{ whiteSpace: "pre-wrap" }}>
                {JSON.stringify(selected.details, null, 2)}
              </pre>
            </div>
            {selected.relatedPaths?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <strong>{t("relatedFiles")}</strong>
                <ul>
                  {selected.relatedPaths.map((p) => (
                    <li key={p} className="page-subtitle">
                      <div className="mono" style={{ wordBreak: "break-all" }}>
                        {p}
                      </div>
                      <button
                        className="button secondary"
                        style={{ marginTop: 8 }}
                        onClick={async () => {
                          try {
                            setTailLoading(true);
                            setTailData(null);
                            const res = await fetch(
                              `/api/files/tail?path=${encodeURIComponent(p)}&lines=200`
                            );
                            const json = (await res.json()) as TailResponse;
                            setTailData(json);
                          } finally {
                            setTailLoading(false);
                          }
                        }}
                      >
                        {tailLoading ? t("fetching") : t("showLogTail")}
                      </button>
                    </li>
                  ))}
                </ul>

                {tailData && (
                  <div className="panel" style={{ marginTop: 16 }}>
                    <strong>{t("previewLabel")}: {tailData.path}</strong>
                    <div className="page-subtitle">
                      {new Date(tailData.mtimeMs).toLocaleString("da-DK")} · {tailData.bytes} bytes
                    </div>
                    <pre className="mono" style={{ whiteSpace: "pre-wrap" }}>
                      {tailData.content}
                    </pre>
                  </div>
                )}
              </div>
            )}
            {selected.relatedUrls?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <strong>Related URLs</strong>
                <ul>
                  {selected.relatedUrls.map((url) => (
                    <li key={url} className="page-subtitle">
                      {url}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </>
      )}
    </div>
  );
}
