"use client";

import { useTheme } from "./ThemeProvider";
import { useI18n } from "./LocaleProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  return (
    <button className="icon-button" onClick={toggle} title={t("theme")}>
      {theme === "dark" ? "☾" : "☀"}
    </button>
  );
}
