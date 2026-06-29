"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import EventForm from "@/components/events/EventForm";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import BackButton from "@/components/ui/BackButton";
import { getAdminEvent, type EventDetail } from "@/lib/api";

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminEvent(Number(params.id)).then(setEvent).catch((exception) => setError(exception instanceof Error ? exception.message : "Unable to load event."));
  }, [params.id]);

  return (
    <AppShell expectedRole="SUPER_ADMIN" title="Edit Event">
      <PageHeader title="Edit Event" subtitle="Update event configuration and replace restrictions or incharges." actions={<BackButton fallbackHref={`/admin/events/${params.id}`} />} />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {event ? <EventForm mode="edit" event={event} /> : <Card>Loading event...</Card>}
    </AppShell>
  );
}
