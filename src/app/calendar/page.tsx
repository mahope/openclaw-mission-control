"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useI18n } from "../LocaleProvider";
import { CalendarAgenda } from "./CalendarAgenda";
import { CalendarControls, CalendarView } from "./CalendarControls";
import { CalendarGrid } from "./CalendarGrid";
import { ScheduleDrawer } from "./ScheduleDrawer";
import { addDays, startOfWeek } from "./utils";

export default function CalendarPage() {
  const { t, locale } = useI18n();

  const [refreshing, setRefreshing] = useState(false);
  const [systemFilter, setSystemFilter] = useState("");
  const [enabledOnly, setEnabledOnly] = useState(true);
  const [textFilter, setTextFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [view, setView] = useState<CalendarView>("grid");

  const [weekOffset, setWeekOffset] = useState(0);
  const now = new Date();
  const weekStart = addDays(startOfWeek(now), weekOffset * 7);
  const weekEnd = addDays(weekStart, 7);

  const schedules = useQuery(api.schedules.listScheduledItems, {
    start: weekStart.getTime(),
    end: weekEnd.getTime(),
  });

  useEffect(() => {
    const saved = localStorage.getItem("mc-calendar-view");
    if (saved === "grid" || saved === "agenda") setView(saved);

    // Default to agenda on small screens
    if (!saved) {
      const small = window.matchMedia?.("(max-width: 980px)").matches;
      if (small) setView("agenda");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("mc-calendar-view", view);
  }, [view]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const filteredSchedules = useMemo(() => {
    const q = textFilter.trim().toLowerCase();
    return (schedules ?? []).filter((item) => {
      if (enabledOnly && !item.enabled) return false;
      if (systemFilter && item.system !== systemFilter) return false;
      if (q) {
        const hay = `${item.name} ${item.scheduleText} ${item.command}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [schedules, enabledOnly, systemFilter, textFilter]);

  const selected = useMemo(
    () => filteredSchedules.find((s) => s._id === selectedId) ?? null,
    [filteredSchedules, selectedId]
  );

  const weekLabel = useMemo(() => {
    const start = weekStart.toLocaleDateString(locale === "da" ? "da-DK" : "en-US", {
      month: "short",
      day: "numeric",
    });
    const end = addDays(weekEnd, -1).toLocaleDateString(locale === "da" ? "da-DK" : "en-US", {
      month: "short",
      day: "numeric",
    });
    return `${start} – ${end}`;
  }, [weekStart, weekEnd, locale]);

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
        <p className="page-subtitle">{t("calendarSubtitle")}</p>
        <CalendarControls
          refreshing={refreshing}
          onRefresh={refreshSchedules}
          systemFilter={systemFilter}
          setSystemFilter={setSystemFilter}
          enabledOnly={enabledOnly}
          setEnabledOnly={setEnabledOnly}
          textFilter={textFilter}
          setTextFilter={setTextFilter}
          view={view}
          setView={setView}
          count={filteredSchedules.length}
          weekLabel={weekLabel}
          onPrevWeek={() => setWeekOffset((v) => v - 1)}
          onNextWeek={() => setWeekOffset((v) => v + 1)}
          onToday={() => setWeekOffset(0)}
        />
      </section>

      <section className="panel calendar" style={{ gridColumn: "1 / -1" }}>
        {view === "agenda" ? (
          <CalendarAgenda
            days={days}
            items={filteredSchedules}
            onSelect={(id) => setSelectedId(id)}
          />
        ) : (
          <CalendarGrid
            days={days}
            items={filteredSchedules}
            onSelect={(id) => setSelectedId(id)}
            timeLabel={t("time")}
          />
        )}
      </section>

      <ScheduleDrawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        item={
          selected
            ? {
                name: selected.name,
                system: selected.system,
                enabled: selected.enabled,
                nextRunAt: selected.nextRunAt,
                scheduleText: selected.scheduleText,
                command: selected.command,
                externalId: selected.externalId,
              }
            : null
        }
      />
    </div>
  );
}
