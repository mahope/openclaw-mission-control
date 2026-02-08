"use client";

import { useI18n } from "./LocaleProvider";

export function LocaleToggle() {
  const { locale, toggleLocale, t } = useI18n();
  return (
    <button className="icon-button" onClick={toggleLocale} title={t("language")}>
      {locale.toUpperCase()}
    </button>
  );
}
