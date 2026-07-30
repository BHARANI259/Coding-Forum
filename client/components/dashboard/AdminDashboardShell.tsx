"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Link from "next/link";
import {
  DashboardActionPanel,
  DashboardMetricStrip,
  DashboardQuickAccess,
  DashboardWelcomeCard,
  InlineActionCard,
  type DashboardTile
} from "@/components/dashboard/DashboardHomeBlocks";
import {
  getAdminAnalyticsOverview,
  type AdminAnalyticsSummary
} from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export default function AdminDashboardShell() {
  const [summary, setSummary] = useState<AdminAnalyticsSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setSummary(await getAdminAnalyticsOverview());
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load dashboard overview.");
      }
    }
    void load();
  }, []);
  const user = getCurrentUser();
  const quickAccess: DashboardTile[] = [
    { title: "Events", description: "Create and manage", href: "/admin/events", icon: "calendar" },
    { title: "Students", description: "Profiles and import", href: "/admin/students", icon: "students" },
    { title: "Faculty", description: "Faculty accounts", href: "/admin/faculty", icon: "faculty" },
    { title: "Departments", description: "Department setup", href: "/admin/departments", icon: "department" },
    { title: "Event Incharges", description: "Coordinator mapping", href: "/admin/event-incharges", icon: "group" },
    { title: "Analytics", description: "Charts and trends", href: "/admin/analytics", icon: "chart" },
    { title: "Reports", description: "PDF and Excel", href: "/admin/reports", icon: "reports" },
    { title: "Notifications", description: "Forum updates", href: "/admin/notifications", icon: "notification" }
  ];

  return (
    <AppShell expectedRole="SUPER_ADMIN" title="SuperAdmin Dashboard">
      <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-kec-purple">Home</p>
          <h1 className="mt-1 text-3xl font-black text-kec-text">SuperAdmin Dashboard</h1>
          <p className="mt-1 text-sm text-kec-secondary">Institution-level coding forum control center.</p>
        </div>
        <Link href="/admin/analytics">
          <Button type="button" className="w-full sm:w-auto">View Full Analytics</Button>
        </Link>
      </div>
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <DashboardWelcomeCard
        roleLabel="SuperAdmin"
        name={user?.name ?? "SuperAdmin"}
        email={user?.email ?? ""}
        href="/admin/dashboard"
        summary={`${summary?.totalEvents ?? 0} events, ${summary?.totalRegistrations ?? 0} registrations, and ${summary?.totalPointsAwarded ?? 0} points recorded.`}
      />

      <DashboardQuickAccess title="Administration" subtitle="Create events, manage people, assign incharges, and review performance." tiles={quickAccess} />

      <DashboardMetricStrip
        items={[
          { label: "Total Students", value: summary?.totalStudents ?? 0, hint: "Active and inactive" },
          { label: "Total Faculty", value: summary?.totalFaculty ?? 0, hint: "Faculty accounts" },
          { label: "Total Events", value: summary?.totalEvents ?? 0, hint: "All statuses" },
          { label: "Published Events", value: summary?.publishedEvents ?? 0, hint: "Visible to students" },
          { label: "Completed Events", value: summary?.completedEvents ?? 0, hint: "Closed events" },
          { label: "Total Registrations", value: summary?.totalRegistrations ?? 0, hint: "Registered rows" },
          { label: "Registered Teams", value: summary?.totalTeams ?? 0, hint: "Team event registrations" },
          { label: "Points Awarded", value: summary?.totalPointsAwarded ?? 0, hint: "From student points" }
        ]}
      />

      <DashboardActionPanel title="Essential Administration" subtitle="The dashboard only shows core controls. Use Analytics or Leaderboard pages when detailed rankings are needed.">
        <div className="grid gap-4 lg:grid-cols-3">
          <InlineActionCard
            title="Event Setup"
            description="Create events, upload posters, configure rounds, and add problem statements."
            href="/admin/events"
            action="Manage Events"
          />
          <InlineActionCard
            title="People"
            description="Add or import students and faculty before assigning event responsibilities."
            href="/admin/students"
            action="Manage Students"
          />
          <InlineActionCard
            title="Reports"
            description="Download event and participation reports for review or submission."
            href="/admin/reports"
            action="Open Reports"
          />
        </div>
      </DashboardActionPanel>
      </div>
    </AppShell>
  );
}
