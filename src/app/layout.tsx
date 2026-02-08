import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SidebarNav } from "./SidebarNav";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleToggle } from "./LocaleToggle";
import { LocaleBridge } from "./LocaleBridge";
import { AppTitle } from "./AppTitle";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});

export const metadata: Metadata = {
  title: "Mission Control",
  description: "OpenClaw mission control center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body
        className={`${spaceGrotesk.variable} ${plexSerif.variable} antialiased`}
      >
        <Providers>
          <div className="app-shell">
            <LocaleBridge />
            <aside className="sidebar">
              <div className="brand">
                <div className="brand-badge">MC</div>
                <div>
                  <div className="brand-title">
                    <AppTitle which="title" />
                  </div>
                  <div className="page-subtitle">
                    <AppTitle which="subtitle" />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <SidebarNav />
              </div>

              <div className="sidebar-footer">
                <div className="page-subtitle">Theme / Language</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <ThemeToggle />
                  <LocaleToggle />
                </div>
              </div>
            </aside>

            <div className="content">
              <header className="topbar">
                <div className="topbar-title">
                  <AppTitle which="title" />
                </div>
                <div className="topbar-actions">
                  <LocaleToggle />
                  <ThemeToggle />
                </div>
              </header>
              <main className="main">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
