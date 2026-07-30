"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  DashboardActionPanel,
  DashboardMetricStrip,
  DashboardQuickAccess,
  DashboardWelcomeCard,
  InlineActionCard,
  type DashboardTile
} from "@/components/dashboard/DashboardHomeBlocks";
import { getFacultyDepartmentSummary, getFacultyEvents, type EventItem, type FacultyDepartmentSummary } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export default function FacultyDashboardShell() {
  const [summary, setSummary] = useState<FacultyDepartmentSummary | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const assignedEvents = await getFacultyEvents();
        setEvents(assignedEvents);
      } catch {
        setError("Unable to load assigned event overview.");
      }

      try {
        setSummary(await getFacultyDepartmentSummary());
      } catch {
        setSummary(null);
      }
    }
    void load();
  }, []);

  const needsAttention = events
    .filter((event) => event.status === "PUBLISHED" || event.status === "ONGOING")
    .sort((first, second) => (first.startDatetime ?? "").localeCompare(second.startDatetime ?? ""));
  const user = getCurrentUser();
  const quickAccess: DashboardTile[] = [
    { title: "Assigned Events", description: "Manage your events", href: "/faculty/events", icon: "calendar" },
    { title: "Results", description: "Round publishing", href: "/faculty/results", icon: "results" },
    { title: "Reports", description: "Assigned reports", href: "/faculty/reports", icon: "reports" },
    { title: "Department Monitoring", description: "Dept overview", href: "/faculty/department-monitoring", icon: "department" },
    { title: "Notifications", description: "Forum updates", href: "/faculty/notifications", icon: "notification" },
    { title: "Profile", description: "Contact details", href: "/faculty/profile", icon: "profile" }
  ];

  return (
    <AppShell expectedRole="FACULTY" title="Faculty Dashboard">
      <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-kec-purple">Home</p>
        <h1 className="mt-1 text-3xl font-black text-kec-text">Faculty Dashboard</h1>
        <p className="mt-1 text-sm text-kec-secondary">Assigned events, result publishing, reports, and department monitoring.</p>
      </div>
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <DashboardWelcomeCard
        roleLabel="Faculty Incharge"
        name={user?.name ?? "Faculty"}
        email={user?.email ?? ""}
        href="/faculty/profile"
        summary={`${events.length} assigned event${events.length === 1 ? "" : "s"}${summary ? ` and ${summary.departmentCode} monitoring enabled` : ""}.`}
      />

      <DashboardQuickAccess title="Quick Access" subtitle="Open the faculty workflows used most often." tiles={quickAccess} />

      <DashboardMetricStrip
        items={[
          { label: "Assigned Events", value: events.length, hint: "Events assigned to you" },
          { label: "Needs Attention", value: needsAttention.length, hint: "Published or ongoing events" },
          { label: "Department Students", value: summary?.departmentStudents ?? "-", hint: summary?.departmentCode ?? "Monitoring not enabled" },
          { label: "Department Points", value: summary?.departmentTotalPoints ?? "-", hint: "From student points" }
        ]}
      />

      <DashboardActionPanel
        title="Essential Actions"
        subtitle="Use these shortcuts for the work that normally needs faculty attention."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <InlineActionCard
            title="Assigned Events"
            description={`${events.length} event${events.length === 1 ? "" : "s"} assigned to you.`}
            href="/faculty/events"
            action="Open Events"
          />
          <InlineActionCard
            title="Pending Event Work"
            description={needsAttention.length ? `${needsAttention.length} published or ongoing event${needsAttention.length === 1 ? "" : "s"} may need attention.` : "No assigned event needs action right now."}
            href="/faculty/events"
            action="Review"
          />
          <InlineActionCard
            title={summary ? "Department Monitoring" : "Reports"}
            description={summary ? `${summary.departmentCode} monitoring is available for your department.` : "Download reports for assigned events when needed."}
            href={summary ? "/faculty/department-monitoring" : "/faculty/reports"}
            action={summary ? "Open Monitoring" : "Open Reports"}
          />
        </div>
      </DashboardActionPanel>
      </div>
    </AppShell>
  );
}
