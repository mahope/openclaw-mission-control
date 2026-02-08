"use client";

import { useEffect, useState } from "react";
import { useI18n } from "../LocaleProvider";

type Settings = {
  workspaceIgnore: string[];
  liveCronImportEverySeconds: number;
};

export default function SettingsPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    workspaceIgnore: ["**/node_modules/**", "**/.git/**", "**/.next/**"],
    liveCronImportEverySeconds: 30,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const json = (await res.json()) as Settings;
          setSettings(json);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid cols-2">
      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        <h1 className="page-title">{t("settingsTitle")}</h1>
        <p className="page-subtitle">{t("settingsSubtitle")}</p>
      </section>

      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        {loading ? (
          <p className="page-subtitle">Loader…</p>
        ) : (
          <div className="grid" style={{ gap: 16 }}>
            <div>
              <div className="badge">{t("ignoreTitle")}</div>
              <p className="page-subtitle" style={{ marginTop: 8 }}>
                {t("ignoreHint")}
              </p>
              <textarea
                className="mono"
                style={{ width: "100%", minHeight: 160, marginTop: 12 }}
                value={settings.workspaceIgnore.join("\n")}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    workspaceIgnore: e.target.value
                      .split(/\r?\n/)
                      .map((s) => s.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </div>

            <div>
              <div className="badge">{t("liveImportTitle")}</div>
              <p className="page-subtitle" style={{ marginTop: 8 }}>
                {t("liveImportHint")}
              </p>
              <input
                type="number"
                min={10}
                max={600}
                value={settings.liveCronImportEverySeconds}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    liveCronImportEverySeconds: Number(e.target.value || 30),
                  }))
                }
              />
              <div className="page-subtitle" style={{ marginTop: 6 }}>
                {t("seconds")}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button className="button" onClick={save} disabled={saving}>
                {saving ? t("saving") : t("save")}
              </button>
              <button
                className="button secondary"
                onClick={async () => {
                  await fetch("/api/workspace/index", { method: "POST" });
                }}
              >
                {t("runIndexNow")}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
