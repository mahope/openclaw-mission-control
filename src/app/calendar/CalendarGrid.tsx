"use client";

import { useMemo } from "react";
import { useI18n } from "../LocaleProvider";

type Item = {
  _id: string;
  name: string;
  system: string;
  scheduleText: string;
  nextRunAt: number;
};

const hours = Array.from({ length: 24 }, (_, i) => i);

export function CalendarGrid(props: {
  days: Date[];
  items: Item[];
  onSelect: (id: string) => void;
  timeLabel: string;
}) {
  const { t } = useI18n();

  const scheduleMap = useMemo(() => {
    const map = new Map<string, Item[]>();
    props.items.forEach((item) => {
      const date = new Date(item.nextRunAt);
      const key = `${date.toDateString()}-${date.getHours()}`;
      const current = map.get(key) ?? [];
      current.push(item);
      map.set(key, current);
    });
    return map;
  }, [props.items]);

  return (
    <div className="calendar-grid">
      <div className="calendar-header">
        <div className="calendar-cell day">{props.timeLabel || t("time")}</div>
        {props.days.map((day) => (
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
          {props.days.map((day) => {
            const key = `${day.toDateString()}-${hour}`;
            const items = scheduleMap.get(key) ?? [];
            return (
              <div key={key} className="calendar-cell">
                {items.map((item) => (
                  <button
                    key={item._id}
                    className="calendar-event"
                    style={{
                      textAlign: "left",
                      cursor: "pointer",
                      border: "none",
                    }}
                    onClick={() => props.onSelect(item._id)}
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
  );
}
