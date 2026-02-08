"use client";

import { ThemeToggle } from "./ThemeToggle";
import { LocaleToggle } from "./LocaleToggle";
import { useI18n } from "./LocaleProvider";

export function SidebarFooter() {
  const { t } = useI18n();
  return (
    <div className="sidebar-footer">
      <div className="page-subtitle">{t("theme")} / {t("language")}</div>
      <div style={{ display: "flex", gap: 10 }}>
        <ThemeToggle />
        <LocaleToggle />
      </div>
    </div>
  );
}
