"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "../LocaleProvider";

type TailResponse = {
  path: string;
  bytes: number;
  mtimeMs: number;
  content: string;
};
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function SearchPage() {
  const { t, locale } = useI18n();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [source, setSource] = useState("");
  const [selected, setSelected] = useState<TailResponse | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const results = useQuery(api.search.searchAll, {
    text: query,
    kind: kind || undefined,
    source: source || undefined,
    limit: 50,
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("focus") === "1") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    const handler = () => inputRef.current?.focus();
    window.addEventListener("mc:focus-search", handler as EventListener);
    return () =>
      window.removeEventListener("mc:focus-search", handler as EventListener);
  }, []);

  return (
    <div className="grid cols-2">
      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        <h1 className="page-title">{t("searchTitle")}</h1>
        <p className="page-subtitle">{t("searchSubtitle")}</p>
        <div className="filters" style={{ marginTop: 20, alignItems: "center" }}>
          <input
            ref={inputRef}
            type="text"
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{ minWidth: 280 }}
          />
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">{t("allTypes")}</option>
            <option value="activity_event">activity_event</option>
            <option value="scheduled_item">scheduled_item</option>
            <option value="workspace_doc">workspace_doc</option>
          </select>
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="">{t("allSources")}</option>
            <option value="openclaw">openclaw</option>
            <option value="windows">windows</option>
            <option value="workspace">workspace</option>
            <option value="mission-control">mission-control</option>
            <option value="garmin">garmin</option>
          </select>
        </div>
      </section>

      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        <div className="list">
          {results?.map((item) => (
            <button
              key={item._id}
              className="search-result"
              style={{ textAlign: "left", cursor: "pointer" }}
              onClick={async () => {
                setSelected(null);
                setSelectedTitle(item.title);
                setSelectedPath(item.path ?? null);
                if (!item.path) return;
                try {
                  setPreviewLoading(true);
                  const res = await fetch(
                    `/api/files/tail?path=${encodeURIComponent(item.path)}&lines=200`
                  );
                  if (!res.ok) return;
                  const json = (await res.json()) as TailResponse;
                  setSelected(json);
                } finally {
                  setPreviewLoading(false);
                }
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <strong>{item.title}</strong>
                <span className="pill">{item.kind}</span>
              </div>
              <span className="page-subtitle">{t("sourceLabel")}: {item.source}</span>
              {item.path && (
                <span className="page-subtitle">
                  Path: <span className="mono">{item.path}</span>
                </span>
              )}
              {item.url && (
                <span className="page-subtitle">URL: {item.url}</span>
              )}
              {item.ts && (
                <span className="page-subtitle">
                  {new Date(item.ts).toLocaleString(locale === "da" ? "da-DK" : "en-US")}
                </span>
              )}

              {item.path && (
                <span className="page-subtitle">{t("clickForPreview")}</span>
              )}
            </button>
          ))}

          {(selectedTitle || selected) && (
            <>
              <div className="drawer-backdrop" onClick={() => { setSelected(null); setSelectedTitle(null); setSelectedPath(null); }} />
              <aside className="drawer">
                <h2 style={{ marginTop: 0 }}>{selectedTitle ?? "Preview"}</h2>
                {selectedPath && (
                  <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                    <div className="page-subtitle mono" style={{ wordBreak: "break-all" }}>
                      {selectedPath}
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        className="button secondary"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(selectedPath);
                          } catch {
                            // ignore
                          }
                        }}
                      >
                        {t("copyPath")}
                      </button>
                    </div>
                  </div>
                )}
                {previewLoading && <p className="page-subtitle">{t("previewLoading")}</p>}
                {selected ? (
                  <>
                    <div className="pill">Preview</div>
                    <p className="page-subtitle">
                      {new Date(selected.mtimeMs).toLocaleString(locale === "da" ? "da-DK" : "en-US")} · {selected.bytes} bytes
                    </p>
                    <pre className="mono" style={{ whiteSpace: "pre-wrap" }}>{selected.content}</pre>
                  </>
                ) : (
                  <p className="page-subtitle">{t("noPreview")}</p>
                )}
              </aside>
            </>
          )}
          {!results?.length && (
            <div className="page-subtitle">
              {t("noMatches")}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
