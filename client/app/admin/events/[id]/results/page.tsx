"use client";

import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import BackButton from "@/components/ui/BackButton";
import EventResultsManager from "@/components/events/EventResultsManager";

export default function AdminEventResultsPage() {
  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);

  return (
    <AppShell expectedRole="SUPER_ADMIN" title="Event Results">
      <PageHeader title="Round Results" subtitle="Review round shortlists and publish final positions from the configured final round." actions={<BackButton fallbackHref={`/admin/events/${eventId}`} />} />
      <EventResultsManager eventId={eventId} mode="admin" />
    </AppShell>
  );
}
