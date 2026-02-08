"use client";

import { useEffect } from "react";
import { useI18n } from "./LocaleProvider";

// Small helper to set <html lang="..."> dynamically.
export function LocaleBridge() {
  const { locale } = useI18n();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
