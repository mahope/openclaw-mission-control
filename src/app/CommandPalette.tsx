"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "./LocaleProvider";

export type Command = {
  id: string;
  title: string;
  subtitle?: string;
  run: () => Promise<void> | void;
};

export function CommandPalette() {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const commands = useMemo<Command[]>(() => {
    return [
      { id: "nav:overview", title: t("navOverview"), run: () => router.push("/") },
      { id: "nav:activity", title: t("navActivity"), run: () => router.push("/activity") },
      { id: "nav:calendar", title: t("navCalendar"), run: () => router.push("/calendar") },
      { id: "nav:search", title: t("navSearch"), run: () => router.push("/search?focus=1") },
      { id: "nav:alerts", title: t("navAlerts"), run: () => router.push("/alerts") },
      { id: "nav:autopilot", title: t("navAutopilot"), run: () => router.push("/autopilot") },
      { id: "nav:settings", title: t("navSettings"), run: () => router.push("/settings") },

      {
        id: "action:refreshSchedules",
        title: t("quickRefreshCalendar"),
        subtitle: "/api/schedules/refresh",
        run: async () => {
          setBusy(true);
          try {
            await fetch("/api/schedules/refresh", { method: "POST" });
          } finally {
            setBusy(false);
          }
        },
      },
      {
        id: "action:indexWorkspace",
        title: t("quickIndexWorkspace"),
        subtitle: "/api/workspace/index",
        run: async () => {
          setBusy(true);
          try {
            await fetch("/api/workspace/index", { method: "POST" });
          } finally {
            setBusy(false);
          }
        },
      },
      {
        id: "action:importCron",
        title: t("quickImportCronHistory"),
        subtitle: "/api/openclaw/import-cron-runs",
        run: async () => {
          setBusy(true);
          try {
            await fetch("/api/openclaw/import-cron-runs", { method: "POST" });
          } finally {
            setBusy(false);
          }
        },
      },
      {
        id: "action:dispatchAlerts",
        title: t("dispatchAlertsNow"),
        subtitle: "/api/alerts/dispatch",
        run: async () => {
          setBusy(true);
          try {
            await fetch("/api/alerts/dispatch", { method: "POST" });
          } finally {
            setBusy(false);
          }
        },
      },
    ];
  }, [router, t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      (c.title + " " + (c.subtitle ?? "")).toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        return;
      }

      if (e.key === "Escape") {
        setOpen(false);
        return;
      }

      // Quick nav: g a/c/s/o
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        // we use a tiny state machine: store 'g' in sessionStorage
        if (e.key.toLowerCase() === "g") {
          sessionStorage.setItem("mc-g-prefix", String(Date.now()));
          return;
        }
        const gAt = Number(sessionStorage.getItem("mc-g-prefix") ?? "0");
        if (gAt && Date.now() - gAt < 1000) {
          const k = e.key.toLowerCase();
          sessionStorage.removeItem("mc-g-prefix");
          if (k === "a") router.push("/activity");
          if (k === "c") router.push("/calendar");
          if (k === "s") router.push("/search?focus=1");
          if (k === "o") router.push("/");
          return;
        }

        // '/' focuses search
        if (e.key === "/") {
          const path = window.location.pathname;
          if (path.startsWith("/search")) {
            window.dispatchEvent(new CustomEvent("mc:focus-search"));
          } else {
            router.push("/search?focus=1");
          }
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  if (!open) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={() => setOpen(false)} />
      <div className="palette" role="dialog" aria-modal="true">
        <div className="palette-header">
          <input
            className="palette-input"
            placeholder="Type a command…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="pill">Ctrl+K</div>
        </div>
        <div className="palette-list">
          {filtered.map((cmd) => (
            <button
              key={cmd.id}
              className="palette-item"
              disabled={busy}
              onClick={async () => {
                await cmd.run();
                setOpen(false);
                setQuery("");
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <strong>{cmd.title}</strong>
                {cmd.subtitle && <div className="page-subtitle">{cmd.subtitle}</div>}
              </div>
            </button>
          ))}
          {!filtered.length && (
            <div className="page-subtitle" style={{ padding: 14 }}>
              No matches.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
