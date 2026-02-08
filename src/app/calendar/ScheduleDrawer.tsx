"use client";

import { useMemo, useState } from "react";
import { useI18n } from "../LocaleProvider";
import { formatRelativeTime } from "../../lib/format";

export function ScheduleDrawer(props: {
  open: boolean;
  onClose: () => void;
  item: {
    name: string;
    system: string;
    enabled: boolean;
    nextRunAt: number;
    scheduleText: string;
    command: string;
    externalId: string;
  } | null;
}) {
  const { t, locale } = useI18n();
  const [copied, setCopied] = useState<string | null>(null);

  const time = useMemo(() => {
    if (!props.item) return null;
    return new Date(props.item.nextRunAt).toLocaleString(
      locale === "da" ? "da-DK" : "en-US"
    );
  }, [props.item, locale]);

  const item = props.item;
  if (!props.open || !item) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={props.onClose} />
      <aside className="drawer">
        <h2 style={{ marginTop: 0 }}>{item.name}</h2>
        <div className={`pill ${item.enabled ? "ok" : "error"}`}>
          {item.system} · {item.enabled ? t("enabled") : t("disabled")}
        </div>
        <p className="page-subtitle">
          {t("nextRun")}: {time} ({formatRelativeTime(item.nextRunAt)})
        </p>

        <div className="panel" style={{ marginTop: 16 }}>
          <strong>{t("schedule")}</strong>
          <div className="mono" style={{ marginTop: 8 }}>
            {item.scheduleText}
          </div>
        </div>

        <div className="panel" style={{ marginTop: 16 }}>
          <strong>{t("command")}</strong>
          <pre className="mono" style={{ whiteSpace: "pre-wrap" }}>
            {item.command}
          </pre>
        </div>

        <div className="panel" style={{ marginTop: 16 }}>
          <strong>{t("externalId")}</strong>
          <div className="mono" style={{ marginTop: 8, wordBreak: "break-all" }}>
            {item.externalId}
          </div>
        </div>

        <div className="filters" style={{ marginTop: 16 }}>
          <button
            className="button secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(item.command);
              setCopied("command");
              setTimeout(() => setCopied(null), 800);
            }}
          >
            {copied === "command" ? t("copied") : t("copyCommand")}
          </button>
          <button
            className="button secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(item.externalId);
              setCopied("externalId");
              setTimeout(() => setCopied(null), 800);
            }}
          >
            {copied === "externalId" ? t("copied") : t("copyExternalId")}
          </button>
        </div>
      </aside>
    </>
  );
}
