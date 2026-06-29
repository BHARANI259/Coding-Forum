"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import BackButton from "@/components/ui/BackButton";
import { cancelEvent, getAdminEvents, getEventCategories, type EventCategory, type EventItem } from "@/lib/api";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [filters, setFilters] = useState({ search: "", categoryId: "", eventType: "", status: "", registrationOpen: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getEventCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const page = await getAdminEvents({ page: 0, size: 20, ...filters });
      setEvents(page.content);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load events.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  async function handleCancel(id: number) {
    await cancelEvent(id);
    await loadEvents();
  }

  return (
    <AppShell expectedRole="SUPER_ADMIN" title="Events">
      <PageHeader
        title="Events"
        subtitle="Create events, configure restrictions, and assign faculty incharges."
        actions={(
          <>
            <BackButton fallbackHref="/admin/dashboard" />
            <Link href="/admin/events/create"><Button>Create Event</Button></Link>
          </>
        )}
      />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <Card className="mb-5">
        <div className="grid gap-3 md:grid-cols-5">
          <Input label="Search" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
          <Select label="Category" value={filters.categoryId} onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}>
            <option value="">All</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </Select>
          <Select label="Event Type" value={filters.eventType} onChange={(event) => setFilters({ ...filters, eventType: event.target.value })}>
            <option value="">All</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="TEAM">Team</option>
          </Select>
          <Select label="Status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">All</option>
            {["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"].map((status) => <option key={status}>{status}</option>)}
          </Select>
          <Select label="Registration" value={filters.registrationOpen} onChange={(event) => setFilters({ ...filters, registrationOpen: event.target.value })}>
            <option value="">All</option>
            <option value="true">Open</option>
            <option value="false">Closed</option>
          </Select>
        </div>
      </Card>
      {loading ? <Card>Loading events...</Card> : (
        <DataTable
          headers={["Title", "Category", "Type", "Status", "Registration", "Start", "Actions"]}
          rows={events.map((event) => [
            event.title,
            event.category?.name ?? "-",
            <Badge key="type" variant="purple">{event.eventType}</Badge>,
            <Badge key="status" variant={event.status === "CANCELLED" ? "error" : "info"}>{event.status}</Badge>,
            event.registrationOpen ? "Open" : "Closed",
            event.startDatetime ? new Date(event.startDatetime).toLocaleString() : "-",
            <div key="actions" className="flex flex-wrap gap-2">
              <Link href={`/admin/events/${event.id}`}><Button type="button" variant="secondary">View</Button></Link>
              <Link href={`/admin/events/${event.id}/edit`}><Button type="button" variant="secondary">Edit</Button></Link>
              <Button type="button" variant="danger" onClick={() => void handleCancel(event.id)}>Cancel</Button>
            </div>
          ])}
          emptyMessage="No events found."
        />
      )}
    </AppShell>
  );
}
