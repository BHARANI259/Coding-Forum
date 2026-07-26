"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import BackButton from "@/components/ui/BackButton";
import EventPosterPreview from "@/components/events/EventPosterPreview";
import { getFacultyEvents, type EventItem } from "@/lib/api";
import { formatDateTime } from "@/lib/dateFormat";

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
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden p-0">
              <EventPosterPreview posterImageUrl={event.posterImageUrl} title={event.title} className="aspect-video rounded-b-none border-0" />
              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="purple">{event.category?.name ?? "Uncategorized"}</Badge>
                  <Badge variant="info">{formatLabel(event.eventType)}</Badge>
                  <Badge variant={event.registrationOpen ? "success" : "warning"}>{event.registrationOpen ? "Open" : "Closed"}</Badge>
                </div>
                <h2 className="mt-3 text-lg font-bold text-kec-text">{event.title}</h2>
                <p className="mt-2 text-sm text-kec-secondary">{formatDateTime(event.startDatetime, "Date not set")}</p>
                <Link className="mt-5 inline-flex" href={`/faculty/events/${event.id}`}><Button type="button" variant="secondary">View</Button></Link>
              </div>
            </Card>
          ))}
          {!events.length ? <Card>No assigned events found.</Card> : null}
        </div>
      )}
    </AppShell>
  );
}

function formatLabel(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
