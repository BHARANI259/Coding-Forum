"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import BackButton from "@/components/ui/BackButton";
import Button from "@/components/ui/Button";
import StudentEventCard from "@/components/events/StudentEventCard";
import { getMyRegistrations, getStudentEvents, type EventItem } from "@/lib/api";
import { parseAppDate } from "@/lib/dateFormat";

export default function StudentEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"OPEN" | "REGISTERED" | "COMPLETED" | "ALL">("OPEN");

  const visibleEvents = events.filter((event) => {
    if (view === "OPEN") return event.status === "PUBLISHED" && event.registrationOpen && !registeredEventIds.has(event.id);
    if (view === "REGISTERED") return registeredEventIds.has(event.id);
    if (view === "COMPLETED") return event.status === "COMPLETED" || event.resultsPublished;
    return true;
  });
  const currentEvents = visibleEvents.filter((event) => isCurrentAcademicYear(event.startDatetime));
  const previousEvents = visibleEvents.filter((event) => !isCurrentAcademicYear(event.startDatetime));

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
      {!loading ? (
        <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Event views">
          {(["OPEN", "REGISTERED", "COMPLETED", "ALL"] as const).map((item) => (
            <Button key={item} type="button" variant={view === item ? "primary" : "secondary"} onClick={() => setView(item)}>
              {item === "OPEN" ? "Open Now" : item.charAt(0) + item.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      ) : null}
      {!loading && !visibleEvents.length ? (
        <Card>
          <h2 className="text-base font-bold text-kec-text">{emptyTitle(view)}</h2>
          <p className="mt-2 text-sm text-kec-secondary">{emptyDescription(view)}</p>
        </Card>
      ) : null}
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

function emptyTitle(view: "OPEN" | "REGISTERED" | "COMPLETED" | "ALL") {
  if (view === "OPEN") return "No eligible registration is open now";
  if (view === "REGISTERED") return "You have not registered for an event yet";
  if (view === "COMPLETED") return "No completed events to show";
  return "No eligible events found";
}

function emptyDescription(view: "OPEN" | "REGISTERED" | "COMPLETED" | "ALL") {
  if (view === "OPEN") return "Registration may be closed, or current events may be restricted by department, year, section, technical area, or placement preference. Check All Events for history.";
  if (view === "REGISTERED") return "Open the Open Now view to find an event and complete registration.";
  if (view === "COMPLETED") return "Completed eligible events will remain here for result and history reference.";
  return "No published, ongoing, or completed event currently matches your eligibility profile.";
}

function isCurrentAcademicYear(value: string | null) {
  if (!value) {
    return true;
  }
  const eventDate = parseAppDate(value);
  const now = new Date();
  const currentStartYear = now.getMonth() + 1 >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  const start = new Date(currentStartYear, 4, 1, 0, 0, 0, 0);
  const end = new Date(currentStartYear + 1, 4, 1, 0, 0, 0, 0);
  return eventDate >= start && eventDate < end;
}
