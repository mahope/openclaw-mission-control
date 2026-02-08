"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ThemeProvider } from "./ThemeProvider";
import { LocaleProvider } from "./LocaleProvider";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function Providers({ children }: { children: React.ReactNode }) {
  if (!convexClient) {
    return (
      <LocaleProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </LocaleProvider>
    );
  }
  return (
    <LocaleProvider>
      <ThemeProvider>
        <ConvexProvider client={convexClient}>{children}</ConvexProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}
