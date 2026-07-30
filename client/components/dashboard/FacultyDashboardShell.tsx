"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import {
  DashboardActionPanel,
  DashboardMetricStrip,
  DashboardQuickAccess,
  DashboardWelcomeCard,
  type DashboardTile
} from "@/components/dashboard/DashboardHomeBlocks";
import { getFacultyDepartmentSummary, getFacultyEvents, type EventItem, type FacultyDepartmentSummary } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/dateFormat";
import Link from "next/link";

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
        title={summary ? `${summary.departmentCode} Department Monitoring` : "Assigned Event Management"}
        subtitle={summary
          ? `${summary.departmentName} has ${summary.departmentParticipations} event participations recorded.`
          : "Assigned event management remains available from the Events section. Department monitoring appears here only when enabled."}
        actionHref={summary ? "/faculty/department-monitoring" : "/faculty/events"}
        actionLabel={summary ? "Open Monitoring" : "Open Events"}
      >
        <div className="rounded-2xl border border-kec-border bg-white/60 p-4 text-sm text-kec-secondary">
          Use this dashboard as your daily checklist: registrations before the event, round result publishing during the event, and post-event media/reports after completion.
        </div>
      </DashboardActionPanel>

      <DashboardActionPanel title="Needs Attention" subtitle="Assigned events with a current action.">
        <DataTable
          headers={["Event", "Current State", "Recommended Action", "Open"]}
          rows={needsAttention.slice(0, 5).map((event) => [
            event.title,
            formatStatus(event.status),
            event.status === "ONGOING" ? "Review the active round and publish its result when ready" : event.registrationOpen ? "Monitor registrations before the event starts" : "Start the first pending round when the event begins",
            <Link key="open" href={`/faculty/events/${event.id}`}><Button type="button">Open Event</Button></Link>
          ])}
          emptyMessage="No assigned event needs action right now."
        />
      </DashboardActionPanel>

      <DashboardActionPanel title="Assigned Events" subtitle="Latest assigned events." actionHref="/faculty/events" actionLabel="View All">
        <DataTable
          headers={["Event", "Category", "Type", "Status", "Registration", "Start", "Action"]}
          rows={events.slice(0, 5).map((event) => [
            event.title,
            event.category?.name ?? "-",
            formatStatus(event.eventType),
            formatStatus(event.status),
            event.registrationOpen ? "Open" : "Closed",
            formatDateTime(event.startDatetime),
            <Link key="view" href={`/faculty/events/${event.id}`}><Button type="button" variant="secondary">View</Button></Link>
          ])}
          emptyMessage="No assigned events found."
        />
      </DashboardActionPanel>
      </div>
    </AppShell>
  );
}

function formatStatus(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " ");
}
