"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Link from "next/link";
import {
  DashboardActionPanel,
  DashboardMetricStrip,
  DashboardQuickAccess,
  DashboardWelcomeCard,
  type DashboardTile
} from "@/components/dashboard/DashboardHomeBlocks";
import {
  getAdminAnalyticsOverview,
  getEventEngagement,
  getTopDepartments,
  getTopStudents,
  type AdminAnalyticsSummary,
  type EventEngagementRow,
  type TopDepartmentAnalyticsRow,
  type TopStudentAnalyticsRow
} from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export default function AdminDashboardShell() {
  const [summary, setSummary] = useState<AdminAnalyticsSummary | null>(null);
  const [topDepartments, setTopDepartments] = useState<TopDepartmentAnalyticsRow[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudentAnalyticsRow[]>([]);
  const [eventEngagement, setEventEngagement] = useState<EventEngagementRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const results = await Promise.allSettled([
        getAdminAnalyticsOverview(),
        getTopDepartments({ limit: 5 }),
        getTopStudents({ limit: 5 }),
        getEventEngagement({ limit: 5 })
      ]);

      const [analytics, departments, students, events] = results;
      const failures: string[] = [];

      if (analytics.status === "fulfilled") {
        setSummary(analytics.value);
      } else {
        failures.push(`Overview: ${messageFromRejection(analytics.reason)}`);
      }

      if (departments.status === "fulfilled") {
        setTopDepartments(departments.value);
      } else {
        failures.push(`Top departments: ${messageFromRejection(departments.reason)}`);
      }

      if (students.status === "fulfilled") {
        setTopStudents(students.value);
      } else {
        failures.push(`Top students: ${messageFromRejection(students.reason)}`);
      }

      if (events.status === "fulfilled") {
        setEventEngagement(events.value);
      } else {
        setEventEngagement([]);
      }

      setError(failures.join(" "));
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
    { title: "Leaderboard", description: "Points ranking", href: "/admin/leaderboard", icon: "leaderboard" },
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

      <div className="space-y-6">
        <DashboardActionPanel title="Top Departments" subtitle="Ranked by student points." actionHref="/admin/analytics" actionLabel="Open Analytics">
          <DataTable
            headers={["Rank", "Department", "Points", "Participants", "Wins"]}
            rows={topDepartments.map((row) => [
              row.rank,
              `${row.departmentCode} - ${row.departmentName}`,
              row.totalPoints,
              row.participationCount,
              row.wins
            ])}
            emptyMessage="No department points yet."
          />
        </DashboardActionPanel>

        <DashboardActionPanel title="Top Students" subtitle="Highest scoring participants from live point data." actionHref="/admin/leaderboard" actionLabel="View Leaderboard">
          <DataTable
            headers={["Rank", "Student", "Dept", "Points", "Wins"]}
            rows={topStudents.map((row) => [
              row.rank,
              `${row.studentName} (${row.registerNumber})`,
              row.departmentCode ?? "-",
              row.totalPoints,
              row.wins
            ])}
            emptyMessage="No student points yet."
          />
        </DashboardActionPanel>

        <DashboardActionPanel title="Event Engagement" subtitle="Events with the most registration activity." actionHref="/admin/events" actionLabel="Manage Events">
          <DataTable
            headers={["Event", "Category", "Registrations", "Teams"]}
            rows={eventEngagement.map((row) => [
              row.eventTitle,
              row.categoryName,
              row.registrationCount,
              row.teamCount
            ])}
            emptyMessage="No event engagement yet."
          />
        </DashboardActionPanel>
      </div>
      </div>
    </AppShell>
  );
}

function messageFromRejection(reason: unknown) {
  return reason instanceof Error ? reason.message : "Unable to load this section.";
}
