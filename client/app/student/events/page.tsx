"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import BackButton from "@/components/ui/BackButton";
import { getMyRegistrations, getStudentEvents, type EventItem } from "@/lib/api";

export default function StudentEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [eligibleEvents, registrations] = await Promise.all([getStudentEvents(), getMyRegistrations()]);
        setEvents(eligibleEvents);
        setRegisteredEventIds(new Set(registrations.filter((registration) => registration.status === "REGISTERED").map((registration) => registration.eventId)));
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load eligible events.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <AppShell expectedRole="STUDENT" title="Events">
      <PageHeader title="Events" subtitle="Eligible published events based on your department, year, section, placement preference, and technical area." actions={<BackButton fallbackHref="/student/dashboard" />} />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <Card>Loading events...</Card> : (
        <div className="grid gap-5 xl:grid-cols-2">
          {events.map((event) => {
            const registered = registeredEventIds.has(event.id);
            return (
              <Card key={event.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-kec-text">{event.title}</h2>
                    <p className="mt-1 text-sm text-kec-secondary">{event.category?.name ?? "Uncategorized"} - {event.venue ?? "Venue not set"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="purple">{event.eventType}</Badge>
                    <Badge variant={event.registrationOpen ? "success" : "warning"}>{event.registrationOpen ? "Open" : "Closed"}</Badge>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <Info label="Date" value={event.startDatetime ? new Date(event.startDatetime).toLocaleString() : "Not set"} />
                  <Info label="Registration" value={`${formatDate(event.registrationStart)} to ${formatDate(event.registrationEnd)}`} />
                  <Info label="Rounds" value={event.roundsCount} />
                  <Info label="Problem Statements" value={event.problemStatementCount} />
                  <Info label="Incharges" value={event.incharges.map((item) => `${item.label}${item.secondaryLabel ? ` (${item.secondaryLabel})` : ""}`).join(", ") || "Not assigned"} />
                  <Info label="Technical Areas" value={event.allowedTechnicalAreas.join(", ") || "SOFTWARE, HARDWARE"} />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href={`/student/events/${event.id}`}><Button type="button" variant="secondary">View</Button></Link>
                  <Link href={`/student/events/${event.id}`}>
                    <Button type="button" disabled={registered || !event.registrationOpen || event.status === "COMPLETED"}>
                      {registered ? "Registered" : event.eventType === "TEAM" ? "Create or Join Team" : "Register"}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
          {!events.length ? <Card>No eligible events found.</Card> : null}
        </div>
      )}
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-semibold text-kec-secondary">{label}</p>
      <p className="mt-1 text-kec-text">{value}</p>
    </div>
  );
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Not set";
}
