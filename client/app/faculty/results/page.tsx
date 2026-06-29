"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import BackButton from "@/components/ui/BackButton";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { getFacultyEventResults, getFacultyEvents, type EventItem } from "@/lib/api";

type FacultyResultOverview = {
  event: EventItem;
  resultCount: number;
};

export default function FacultyResultsPage() {
  const [rows, setRows] = useState<FacultyResultOverview[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const assignedEvents = await getFacultyEvents();
        const summaries = await Promise.all(
          assignedEvents.map(async (event) => {
            const resultSummary = await getFacultyEventResults(event.id).catch(() => null);
            return { event, resultCount: resultSummary?.results.length ?? 0 };
          })
        );
        setRows(summaries);
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load assigned event results.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const totalResults = rows.reduce((total, item) => total + item.resultCount, 0);
  const publishedEvents = rows.filter((item) => item.event.resultsPublished).length;

  return (
    <AppShell expectedRole="FACULTY" title="Results">
      <PageHeader title="Results" subtitle="Result entry overview for your assigned events." actions={<BackButton fallbackHref="/faculty/dashboard" />} />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Assigned Events" value={rows.length} hint="Events you manage" />
        <StatCard label="Result Entries" value={totalResults} hint="Saved result tags" />
        <StatCard label="Published Results" value={publishedEvents} hint="Completed events" />
      </div>
      {loading ? <Card>Loading result overview...</Card> : (
        <DataTable
          headers={["Event", "Category", "Type", "Status", "Results", "Published", "Action"]}
          rows={rows.map(({ event, resultCount }) => [
            event.title,
            event.category?.name ?? "-",
            event.eventType,
            event.status,
            resultCount,
            event.resultsPublished ? "Yes" : "No",
            <Link key="results" href={`/faculty/events/${event.id}/results`}><Button type="button" variant="secondary">Enter Results</Button></Link>
          ])}
          emptyMessage="No assigned events found."
        />
      )}
    </AppShell>
  );
}
