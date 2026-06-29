"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { getFacultyDepartmentSummary, getFacultyEventResults, getFacultyEvents, type EventItem, type FacultyDepartmentSummary } from "@/lib/api";

export default function FacultyDashboardShell() {
  const [summary, setSummary] = useState<FacultyDepartmentSummary | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [resultEntries, setResultEntries] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const assignedEvents = await getFacultyEvents();
        setEvents(assignedEvents);

        const resultSummaries = await Promise.all(
          assignedEvents.map((event) => getFacultyEventResults(event.id).catch(() => null))
        );
        setResultEntries(resultSummaries.reduce((total, item) => total + (item?.results.length ?? 0), 0));
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

  return (
    <AppShell expectedRole="FACULTY" title="Faculty Dashboard">
      <PageHeader
        title="Faculty Dashboard"
        subtitle="Assigned event and department monitoring overview."
      />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assigned Events" value={events.length} hint="Events assigned to you" />
        <StatCard label="Result Entries" value={resultEntries} hint="Saved result tags" />
        <StatCard label="Department Students" value={summary?.departmentStudents ?? "-"} hint={summary?.departmentCode ?? "Monitoring not enabled"} />
        <StatCard label="Department Points" value={summary?.departmentTotalPoints ?? "-"} hint="From student points" />
      </div>
      <Card className="mt-6">
        <h2 className="text-lg font-bold text-kec-text">
          {summary ? `${summary.departmentCode} Department Monitoring` : "Assigned Event Management"}
        </h2>
        <p className="mt-2 text-sm text-kec-secondary">
          {summary
            ? `${summary.departmentName} has ${summary.departmentParticipations} event participations recorded.`
            : "Assigned event management remains available from the Events section. Department monitoring appears here only when enabled."}
        </p>
      </Card>
      <section className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-kec-text">Assigned Events</h2>
          <Link href="/faculty/events"><Button type="button" variant="secondary">View All</Button></Link>
        </div>
        <DataTable
          headers={["Event", "Category", "Type", "Status", "Registration", "Start", "Action"]}
          rows={events.slice(0, 5).map((event) => [
            event.title,
            event.category?.name ?? "-",
            event.eventType,
            event.status,
            event.registrationOpen ? "Open" : "Closed",
            event.startDatetime ? new Date(event.startDatetime).toLocaleString() : "-",
            <Link key="view" href={`/faculty/events/${event.id}`}><Button type="button" variant="secondary">View</Button></Link>
          ])}
          emptyMessage="No assigned events found."
        />
      </section>
    </AppShell>
  );
}
