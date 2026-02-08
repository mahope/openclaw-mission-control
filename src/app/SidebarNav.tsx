"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "./LocaleProvider";

const items = [
  { href: "/", key: "navOverview" },
  { href: "/activity", key: "navActivity" },
  { href: "/calendar", key: "navCalendar" },
  { href: "/search", key: "navSearch" },
  { href: "/alerts", key: "navAlerts" },
  { href: "/autopilot", key: "navAutopilot" },
  { href: "/settings", key: "navSettings" },
] as const;

export function SidebarNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <nav className="sidebar-nav">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "nav-link active" : "nav-link"}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
