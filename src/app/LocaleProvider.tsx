"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { da } from "../i18n/da";
import { en } from "../i18n/en";

export type Locale = "da" | "en";

const dict = { da, en };
export type I18nKey = keyof typeof da;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: (key: I18nKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "da";
  const saved = localStorage.getItem("mc-locale") as Locale | null;
  if (saved === "da" || saved === "en") return saved;
  const browser = navigator.language?.toLowerCase() ?? "da";
  return browser.startsWith("da") ? "da" : "en";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale());

  useEffect(() => {
    localStorage.setItem("mc-locale", locale);
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => {
    return {
      locale,
      setLocale: setLocaleState,
      toggleLocale: () => setLocaleState((l) => (l === "da" ? "en" : "da")),
      t: (key) => dict[locale][key] ?? String(key),
    };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useI18n must be used inside LocaleProvider");
  return ctx;
}
