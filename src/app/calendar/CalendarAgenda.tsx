"use client";

import { useMemo, useState } from "react";
import { useI18n } from "../LocaleProvider";

type Item = {
  _id: string;
  name: string;
  system: string;
  scheduleText: string;
  nextRunAt: number;
  enabled: boolean;
};

export function CalendarAgenda(props: {
  days: Date[];
  items: Item[];
  onSelect: (id: string) => void;
}) {
  const { locale } = useI18n();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const itemsByDay = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const day of props.days) {
      const start = new Date(day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      const list = props.items
        .filter((s) => s.nextRunAt >= start.getTime() && s.nextRunAt < end.getTime())
        .sort((a, b) => a.nextRunAt - b.nextRunAt);
      map.set(day.toDateString(), list);
    }
    return map;
  }, [props.days, props.items]);

  return (
    <div className="agenda">
      {props.days.map((day) => {
        const key = day.toDateString();
        const items = itemsByDay.get(key) ?? [];
        const isCollapsed = collapsed[key] ?? false;

        return (
          <div key={key} className="panel">
            <button
              className="agenda-day"
              onClick={() =>
                setCollapsed((prev) => ({ ...prev, [key]: !isCollapsed }))
              }
            >
              <strong>
                {day.toLocaleDateString(locale === "da" ? "da-DK" : "en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </strong>
              <span className="pill">{items.length}</span>
            </button>

            {!isCollapsed && (
              <div className="list" style={{ marginTop: 12 }}>
                {items.map((item) => (
                  <button
                    key={item._id}
                    className="list-item"
                    style={{ textAlign: "left", cursor: "pointer" }}
                    onClick={() => props.onSelect(item._id)}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <strong>{item.name}</strong>
                      <span className="pill">
                        {new Date(item.nextRunAt).toLocaleTimeString(
                          locale === "da" ? "da-DK" : "en-US",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </span>
                    </div>
                    <div className="page-subtitle">
                      {item.system} · {item.scheduleText}
                    </div>
                  </button>
                ))}
                {!items.length && (
                  <div className="page-subtitle" style={{ padding: 10 }}>
                    —
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
