"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import BackButton from "@/components/ui/BackButton";
import StudentEventCard from "@/components/events/StudentEventCard";
import { getMyRegistrations, getStudentEvents, type EventItem } from "@/lib/api";

export default function StudentEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const currentEvents = events.filter((event) => isCurrentAcademicYear(event.startDatetime));
  const previousEvents = events.filter((event) => !isCurrentAcademicYear(event.startDatetime));

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
      <PageHeader title="Events" subtitle="Eligible published, ongoing, and completed events based on your department, year, section, placement preference, and technical area." actions={<BackButton fallbackHref="/student/dashboard" />} />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <Card>Loading events...</Card> : null}
      {!loading && !events.length ? <Card>No eligible events found.</Card> : null}
      {!loading && currentEvents.length ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-kec-text">Current Academic Year</h2>
            <p className="text-sm text-kec-secondary">Events from the current May-to-April academic cycle.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {currentEvents.map((event) => (
              <StudentEventCard key={event.id} event={event} registered={registeredEventIds.has(event.id)} />
            ))}
          </div>
        </section>
      ) : null}
      {!loading && previousEvents.length ? (
        <section className="mt-8 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-kec-text">Previous Academic Years</h2>
            <p className="text-sm text-kec-secondary">Completed or older events are kept here for history and result reference.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {previousEvents.map((event) => (
              <StudentEventCard key={event.id} event={event} registered={registeredEventIds.has(event.id)} />
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}

function isCurrentAcademicYear(value: string | null) {
  if (!value) {
    return true;
  }
  const eventDate = new Date(value);
  const now = new Date();
  const currentStartYear = now.getMonth() + 1 >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  const start = new Date(currentStartYear, 4, 1, 0, 0, 0, 0);
  const end = new Date(currentStartYear + 1, 4, 1, 0, 0, 0, 0);
  return eventDate >= start && eventDate < end;
}
