"use client";

import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import BackButton from "@/components/ui/BackButton";
import EventResultsManager from "@/components/events/EventResultsManager";

export default function FacultyEventResultsPage() {
  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);

  return (
    <AppShell expectedRole="FACULTY" title="Event Results">
      <PageHeader title="Event Results" subtitle="Declare final results for your assigned event." actions={<BackButton fallbackHref={`/faculty/events/${eventId}`} />} />
      <EventResultsManager eventId={eventId} mode="faculty" />
    </AppShell>
  );
}
