"use client";

import { useParams, useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import BackButton from "@/components/ui/BackButton";
import EventResultsManager from "@/components/events/EventResultsManager";

export default function FacultyEventResultsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const eventId = Number(params.id);
  const roundId = Number(searchParams.get("roundId"));

  return (
    <AppShell expectedRole="FACULTY" title="Event Results">
      <PageHeader title="Round Results" subtitle="Shortlist participants round-wise, then declare final positions in the final round." actions={<BackButton fallbackHref={`/faculty/events/${eventId}`} />} />
      <EventResultsManager eventId={eventId} mode="faculty" initialRoundId={Number.isFinite(roundId) ? roundId : undefined} />
    </AppShell>
  );
}
