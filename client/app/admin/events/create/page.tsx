import EventForm from "@/components/events/EventForm";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import BackButton from "@/components/ui/BackButton";

export default function CreateEventPage() {
  return (
    <AppShell expectedRole="SUPER_ADMIN" title="Create Event">
      <PageHeader title="Create Event" subtitle="Configure event details, restrictions, and assigned faculty incharges." actions={<BackButton fallbackHref="/admin/events" />} />
      <EventForm mode="create" />
    </AppShell>
  );
}
