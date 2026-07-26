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
import { formatDateTime } from "@/lib/dateFormat";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [filters, setFilters] = useState({ search: "", categoryId: "", eventType: "", status: "", registrationOpen: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageInfo, setPageInfo] = useState({ totalElements: 0, totalPages: 0 });

  useEffect(() => {
    void getEventCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const loadEvents = useCallback(async (requestedPage = pageIndex) => {
    setLoading(true);
    setError("");
    try {
      const page = await getAdminEvents({ page: requestedPage, size: 10, ...filters });
      setEvents(page.content);
      setPageInfo({ totalElements: page.totalElements, totalPages: page.totalPages });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load events.");
    } finally {
      setLoading(false);
    }
  }, [filters, pageIndex]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadEvents(pageIndex), 300);
    return () => window.clearTimeout(timer);
  }, [loadEvents, pageIndex]);

  function updateFilter(name: keyof typeof filters, value: string) {
    setPageIndex(0);
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function handleCancel(id: number) {
    if (!window.confirm("Cancel this event? Registration will close and this action cannot be reversed.")) return;
    setError("");
    try {
      await cancelEvent(id);
      await loadEvents(pageIndex);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to cancel event.");
    }
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
          <Input label="Search" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} />
          <Select label="Category" value={filters.categoryId} onChange={(event) => updateFilter("categoryId", event.target.value)}>
            <option value="">All</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </Select>
          <Select label="Event Type" value={filters.eventType} onChange={(event) => updateFilter("eventType", event.target.value)}>
            <option value="">All</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="TEAM">Team</option>
          </Select>
          <Select label="Status" value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
            <option value="">All</option>
            {["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"].map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
          </Select>
          <Select label="Registration" value={filters.registrationOpen} onChange={(event) => updateFilter("registrationOpen", event.target.value)}>
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
            <Badge key="type" variant="purple">{formatStatus(event.eventType)}</Badge>,
            <Badge key="status" variant={event.status === "CANCELLED" ? "error" : event.status === "COMPLETED" ? "success" : "info"}>{formatStatus(event.status)}</Badge>,
            event.registrationOpen ? "Open" : "Closed",
            formatDateTime(event.startDatetime),
            <div key="actions" className="flex flex-wrap gap-2">
              <Link href={`/admin/events/${event.id}`}><Button type="button" variant="secondary">View</Button></Link>
              {!event.resultsPublished && event.status !== "COMPLETED" && event.status !== "CANCELLED" ? <Link href={`/admin/events/${event.id}/edit`}><Button type="button" variant="secondary">Edit</Button></Link> : null}
              {!event.resultsPublished && event.status !== "COMPLETED" && event.status !== "CANCELLED" ? <Button type="button" variant="danger" onClick={() => void handleCancel(event.id)}>Cancel Event</Button> : null}
            </div>
          ])}
          emptyMessage="No events found."
        />
      )}
      {!loading && pageInfo.totalPages > 1 ? (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-kec-border bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-kec-secondary">Page {pageIndex + 1} of {pageInfo.totalPages} ({pageInfo.totalElements} events)</p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" disabled={pageIndex === 0} onClick={() => setPageIndex((page) => Math.max(0, page - 1))}>Previous</Button>
            <Button type="button" variant="secondary" disabled={pageIndex + 1 >= pageInfo.totalPages} onClick={() => setPageIndex((page) => page + 1)}>Next</Button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function formatStatus(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
