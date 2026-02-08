"use client";

import { useI18n } from "./LocaleProvider";

export function AppTitle({ which }: { which: "title" | "subtitle" }) {
  const { t } = useI18n();
  return which === "title" ? t("appTitle") : t("appSubtitle");
}
