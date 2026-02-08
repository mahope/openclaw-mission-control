"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatRelativeTime } from "../../lib/format";
import { useI18n } from "../LocaleProvider";

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

const hours = Array.from({ length: 24 }, (_, i) => i);

export default function CalendarPage() {
  const { t, locale } = useI18n();
  const [refreshing, setRefreshing] = useState(false);
  const [systemFilter, setSystemFilter] = useState<string>("");
  const [enabledOnly, setEnabledOnly] = useState<boolean>(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const schedules = useQuery(api.schedules.listScheduledItems, {
    start: weekStart.getTime(),
    end: weekEnd.getTime(),
  });

  useEffect(() => {
    const saved = localStorage.getItem("mc-calendar-view");
    if (saved === "grid" || saved === "list") setView(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("mc-calendar-view", view);
  }, [view]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const filteredSchedules = useMemo(() => {
    const list = schedules ?? [];
    return list.filter((item) => {
      if (enabledOnly && !item.enabled) return false;
      if (systemFilter && item.system !== systemFilter) return false;
      return true;
    });
  }, [schedules, enabledOnly, systemFilter]);

  const selected = useMemo(
    () => filteredSchedules.find((s) => s._id === selectedId) ?? null,
    [filteredSchedules, selectedId]
  );

  const scheduleMap = useMemo(() => {
    type ScheduleItem = NonNullable<typeof schedules>[number];
    const map = new Map<string, ScheduleItem[]>();
    filteredSchedules.forEach((item) => {
      const date = new Date(item.nextRunAt);
      const key = `${date.toDateString()}-${date.getHours()}`;
      const current = map.get(key) ?? [];
      current.push(item);
      map.set(key, current);
    });
    return map;
  }, [filteredSchedules]);

  const refreshSchedules = async () => {
    try {
      setRefreshing(true);
      await fetch("/api/schedules/refresh", { method: "POST" });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="grid cols-2">
      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        <h1 className="page-title">{t("calendarTitle")}</h1>
        <p className="page-subtitle">{t("calendarSubtitle")}</p>
        <div className="filters" style={{ marginTop: 16, alignItems: "center" }}>
          <button className="button" onClick={refreshSchedules}>
            {refreshing ? t("updating") : t("updateCalendar")}
          </button>
          <select
            value={systemFilter}
            onChange={(e) => setSystemFilter(e.target.value)}
          >
            <option value="">{t("allSystems")}</option>
            <option value="openclaw">openclaw</option>
            <option value="windows">windows</option>
          </select>
          <label className="page-subtitle" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={enabledOnly}
              onChange={(e) => setEnabledOnly(e.target.checked)}
            />
            {t("enabledOnly")}
          </label>
          <button
            className="button secondary"
            onClick={() => setView((v) => (v === "grid" ? "list" : "grid"))}
          >
            {locale === "da"
              ? `Visning: ${view === "grid" ? "Grid" : "Liste"}`
              : `View: ${view === "grid" ? "Grid" : "List"}`}
          </button>
          <span className="page-subtitle">{t("showing")}: {filteredSchedules.length}</span>
        </div>
      </section>

      <section className="panel calendar" style={{ gridColumn: "1 / -1" }}>
        {view === "list" ? (
          <div className="list">
            {days.map((day) => {
              const start = new Date(day);
              start.setHours(0, 0, 0, 0);
              const end = new Date(start);
              end.setDate(start.getDate() + 1);
              const items = filteredSchedules
                .filter((s) => s.nextRunAt >= start.getTime() && s.nextRunAt < end.getTime())
                .sort((a, b) => a.nextRunAt - b.nextRunAt);

              return (
                <div key={day.toDateString()} className="panel">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <strong>
                      {day.toLocaleDateString(locale === "da" ? "da-DK" : "en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </strong>
                    <span className="pill">{items.length}</span>
                  </div>
                  <div className="list" style={{ marginTop: 12 }}>
                    {items.map((item) => (
                      <button
                        key={item._id}
                        className="list-item"
                        style={{ textAlign: "left", cursor: "pointer" }}
                        onClick={() => setSelectedId(item._id)}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <strong>{item.name}</strong>
                          <span className="pill">
                            {new Date(item.nextRunAt).toLocaleTimeString(locale === "da" ? "da-DK" : "en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="page-subtitle">{item.system} · {item.scheduleText}</div>
                      </button>
                    ))}
                    {!items.length && (
                      <div className="page-subtitle" style={{ padding: 10 }}>
                        —
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="calendar-grid">
          <div className="calendar-header">
            <div className="calendar-cell day">Time</div>
            {days.map((day) => (
              <div key={day.toDateString()} className="calendar-cell day">
                {day.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            ))}
          </div>
          {hours.map((hour) => (
            <div key={hour} className="calendar-row">
              <div className="calendar-cell time">
                {hour.toString().padStart(2, "0")}:00
              </div>
              {days.map((day) => {
                const key = `${day.toDateString()}-${hour}`;
                const items = scheduleMap.get(key) ?? [];
                return (
                  <div key={key} className="calendar-cell">
                    {items.map((item) => (
                      <button
                        key={item._id}
                        className="calendar-event"
                        style={{ textAlign: "left", cursor: "pointer", border: "none" }}
                        onClick={() => setSelectedId(item._id)}
                      >
                        <strong>{item.name}</strong>
                        <div className="meta">{item.system}</div>
                        <div className="meta">{item.scheduleText}</div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        )}
      </section>

      {selected && (
        <>
          <div className="drawer-backdrop" onClick={() => setSelectedId(null)} />
          <aside className="drawer">
            <h2 style={{ marginTop: 0 }}>{selected.name}</h2>
            <div className={`pill ${selected.enabled ? "ok" : "error"}`}>
              {selected.system} · {selected.enabled ? "enabled" : "disabled"}
            </div>
            <p className="page-subtitle">
              {t("nextRun")}: {new Date(selected.nextRunAt).toLocaleString(locale === "da" ? "da-DK" : "en-US")} ({formatRelativeTime(selected.nextRunAt)})
            </p>

            <div className="panel" style={{ marginTop: 16 }}>
              <strong>{t("schedule")}</strong>
              <div className="mono" style={{ marginTop: 8 }}>
                {selected.scheduleText}
              </div>
            </div>

            <div className="panel" style={{ marginTop: 16 }}>
              <strong>{t("command")}</strong>
              <pre className="mono" style={{ whiteSpace: "pre-wrap" }}>
                {selected.command}
              </pre>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
