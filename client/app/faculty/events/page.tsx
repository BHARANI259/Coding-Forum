"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import BackButton from "@/components/ui/BackButton";
import { getFacultyEvents, type EventItem } from "@/lib/api";

export default function FacultyEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setEvents(await getFacultyEvents());
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load assigned events.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <AppShell expectedRole="FACULTY" title="Assigned Events">
      <PageHeader title="Assigned Events" subtitle="Events assigned to you by the SuperAdmin." actions={<BackButton fallbackHref="/faculty/dashboard" />} />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <Card>Loading assigned events...</Card> : (
        <DataTable
          headers={["Title", "Category", "Type", "Status", "Registration", "Start", "Action"]}
          rows={events.map((event) => [
            event.title,
            event.category?.name ?? "-",
            <Badge key="type" variant="purple">{event.eventType}</Badge>,
            event.status,
            event.registrationOpen ? "Open" : "Closed",
            event.startDatetime ? new Date(event.startDatetime).toLocaleString() : "-",
            <Link key="view" href={`/faculty/events/${event.id}`}><Button type="button" variant="secondary">View</Button></Link>
          ])}
          emptyMessage="No assigned events found."
        />
      )}
    </AppShell>
  );
}
