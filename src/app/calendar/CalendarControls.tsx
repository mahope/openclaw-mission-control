"use client";

import { useI18n } from "../LocaleProvider";

export type CalendarView = "grid" | "agenda";

export function CalendarControls(props: {
  refreshing: boolean;
  onRefresh: () => Promise<void> | void;
  systemFilter: string;
  setSystemFilter: (v: string) => void;
  enabledOnly: boolean;
  setEnabledOnly: (v: boolean) => void;
  textFilter: string;
  setTextFilter: (v: string) => void;
  view: CalendarView;
  setView: (v: CalendarView) => void;
  count: number;
  weekLabel: string;
  onPrevWeek: () => void;
  onToday: () => void;
  onNextWeek: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="calendar-controls">
      <div className="calendar-controls-row">
        <div className="calendar-week">
          <button className="button secondary" onClick={props.onPrevWeek}>
            ←
          </button>
          <div>
            <div className="badge">{t("calendarTitle")}</div>
            <div className="page-subtitle" style={{ marginTop: 6 }}>
              {props.weekLabel}
            </div>
          </div>
          <button className="button secondary" onClick={props.onNextWeek}>
            →
          </button>
          <button className="button secondary" onClick={props.onToday}>
            {t("today")}
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="button" onClick={props.onRefresh}>
            {props.refreshing ? t("updating") : t("updateCalendar")}
          </button>
          <button
            className="button secondary"
            onClick={() =>
              props.setView(props.view === "grid" ? "agenda" : "grid")
            }
          >
            {t("viewLabel")}: {props.view === "grid" ? t("viewGrid") : t("viewAgenda")}
          </button>
        </div>
      </div>

      <div className="filters" style={{ marginTop: 12, alignItems: "center" }}>
        <select
          value={props.systemFilter}
          onChange={(e) => props.setSystemFilter(e.target.value)}
        >
          <option value="">{t("allSystems")}</option>
          <option value="openclaw">openclaw</option>
          <option value="windows">windows</option>
        </select>

        <label
          className="page-subtitle"
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          <input
            type="checkbox"
            checked={props.enabledOnly}
            onChange={(e) => props.setEnabledOnly(e.target.checked)}
          />
          {t("enabledOnly")}
        </label>

        <input
          type="text"
          placeholder={t("filterPlaceholder")}
          value={props.textFilter}
          onChange={(e) => props.setTextFilter(e.target.value)}
          style={{ minWidth: 220 }}
        />

        <span className="page-subtitle">
          {t("showing")}: {props.count}
        </span>
      </div>
    </div>
  );
}
