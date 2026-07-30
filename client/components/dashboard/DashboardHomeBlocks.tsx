"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type IconName =
  | "calendar"
  | "document"
  | "events"
  | "group"
  | "leaderboard"
  | "notification"
  | "profile"
  | "results"
  | "settings"
  | "students"
  | "faculty"
  | "chart"
  | "reports"
  | "department";

export type DashboardTile = {
  title: string;
  description?: string;
  href: string;
  icon: IconName;
  badge?: string | number;
};

type WelcomeCardProps = {
  roleLabel: string;
  name: string;
  email: string;
  href: string;
  summary?: string;
};

export function DashboardWelcomeCard({ roleLabel, name, email, href, summary }: WelcomeCardProps) {
  return (
    <Link href={href} className="block focus:outline-none focus:ring-4 focus:ring-kec-purple/20">
      <Card className="group overflow-hidden border-white/60 bg-gradient-to-br from-white/75 via-white/55 to-kec-purple/10 p-0 shadow-lg shadow-slate-200/70 backdrop-blur-xl">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-white/70 bg-kec-purple text-2xl font-black text-white shadow-lg shadow-kec-purple/20 sm:h-24 sm:w-24">
              {initials(name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-wide text-kec-purple">{roleLabel}</p>
              <h2 className="mt-1 truncate text-2xl font-black text-kec-text sm:text-3xl">{name}</h2>
              <p className="mt-1 break-words text-sm text-kec-secondary sm:text-base">{email}</p>
              {summary ? <p className="mt-2 text-sm text-kec-muted">{summary}</p> : null}
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-kec-border bg-white/60 text-kec-purple transition group-hover:translate-x-1">
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function DashboardQuickAccess({ title, subtitle, tiles }: { title: string; subtitle?: string; tiles: DashboardTile[] }) {
  return (
    <Card className="bg-white/75 backdrop-blur-xl">
      <div className="mb-5">
        <h2 className="text-xl font-black text-kec-text">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-kec-secondary">{subtitle}</p> : null}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {tiles.map((tile) => (
          <Link
            key={`${tile.href}-${tile.title}`}
            href={tile.href}
            className="group relative flex min-h-32 flex-col items-center justify-center rounded-2xl border border-kec-border bg-white/60 px-3 py-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-kec-purple/40 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-kec-purple/20"
          >
            {tile.badge !== undefined && Number(tile.badge) > 0 ? (
              <span className="absolute right-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{tile.badge}</span>
            ) : null}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-kec-purple/10 text-kec-purple transition group-hover:bg-kec-purple group-hover:text-white">
              <DashboardIcon name={tile.icon} />
            </div>
            <p className="mt-3 line-clamp-2 text-sm font-bold text-kec-text">{tile.title}</p>
            {tile.description ? <p className="mt-1 line-clamp-2 text-xs text-kec-muted">{tile.description}</p> : null}
          </Link>
        ))}
      </div>
    </Card>
  );
}

export function DashboardMetricStrip({ items }: { items: Array<{ label: string; value: string | number; hint?: string }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="bg-white/75 backdrop-blur-xl">
          <p className="text-sm font-semibold text-kec-secondary">{item.label}</p>
          <p className="mt-3 text-3xl font-black text-kec-text">{item.value}</p>
          {item.hint ? <p className="mt-1 text-xs text-kec-muted">{item.hint}</p> : null}
        </Card>
      ))}
    </div>
  );
}

export function DashboardActionPanel({
  title,
  subtitle,
  children,
  actionHref,
  actionLabel
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <Card className="bg-white/75 backdrop-blur-xl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-kec-text">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-kec-secondary">{subtitle}</p> : null}
        </div>
        {actionHref && actionLabel ? (
          <Link href={actionHref}>
            <Button type="button" variant="secondary" className="w-full sm:w-auto">{actionLabel}</Button>
          </Link>
        ) : null}
      </div>
      {children}
    </Card>
  );
}

export function InlineActionCard({ title, description, href, action }: { title: string; description: string; href: string; action: string }) {
  return (
    <div className="rounded-2xl border border-kec-border bg-white/60 p-4">
      <h3 className="text-base font-black text-kec-text">{title}</h3>
      <p className="mt-2 text-sm text-kec-secondary">{description}</p>
      <Link className="mt-4 block" href={href}>
        <Button className="w-full" type="button" variant="secondary">{action}</Button>
      </Link>
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "KEC";
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
}

function DashboardIcon({ name }: { name: IconName }) {
  const common = "h-6 w-6";
  return (
    <svg aria-hidden="true" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      {iconPath(name)}
    </svg>
  );
}

function iconPath(name: IconName) {
  switch (name) {
    case "calendar":
      return <><path d="M8 2v4" /><path d="M16 2v4" /><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18" /></>;
    case "document":
    case "reports":
      return <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8" /><path d="M8 17h5" /></>;
    case "events":
      return <><path d="M4 5h16" /><path d="M4 12h16" /><path d="M4 19h16" /><path d="M8 5v14" /></>;
    case "group":
      return <><path d="M16 21v-2a4 4 0 0 0-8 0v2" /><circle cx="12" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>;
    case "leaderboard":
      return <><path d="M4 19V9" /><path d="M10 19V5" /><path d="M16 19v-8" /><path d="M22 19H2" /></>;
    case "notification":
      return <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>;
    case "profile":
      return <><circle cx="12" cy="8" r="4" /><path d="M4 22a8 8 0 0 1 16 0" /></>;
    case "results":
      return <><path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M5 5H3v2a4 4 0 0 0 4 4" /><path d="M19 5h2v2a4 4 0 0 1-4 4" /></>;
    case "settings":
      return <><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-.4-1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 .4 1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.25.35.45.75.6 1.16.15.42.47.74.89.89H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51.95z" /></>;
    case "students":
      return <><path d="M22 10L12 5 2 10l10 5 10-5z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /></>;
    case "faculty":
      return <><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /><path d="M18 3h3v6" /></>;
    case "chart":
      return <><path d="M3 3v18h18" /><path d="M7 16l4-4 3 3 5-7" /></>;
    case "department":
      return <><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" /><path d="M9 9h.01" /><path d="M15 9h.01" /><path d="M9 12h.01" /><path d="M15 12h.01" /></>;
  }
}
