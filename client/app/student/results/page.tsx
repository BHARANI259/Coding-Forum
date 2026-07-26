"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import ResultBadge from "@/components/events/ResultBadge";
import BackButton from "@/components/ui/BackButton";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { getMyRegistrations, getMyResults, type MyRegistration, type StudentResult } from "@/lib/api";
import { formatDateTime } from "@/lib/dateFormat";

export default function StudentResultsPage() {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [registrations, setRegistrations] = useState<MyRegistration[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [resultData, registrationData] = await Promise.all([getMyResults(), getMyRegistrations()]);
        setResults(resultData);
        setRegistrations(registrationData.filter((item) => item.status === "REGISTERED"));
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load results.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <AppShell expectedRole="STUDENT" title="Results">
      <PageHeader title="Results" subtitle="Your declared final results and generated points." actions={<BackButton fallbackHref="/student/dashboard" />} />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <Card>Loading results...</Card> : <div className="space-y-5">
        {results.length ? <DataTable
          headers={["Event", "Category", "Type", "Team", "Result", "Points", "Declared At"]}
          rows={results.map((result) => [
            result.eventTitle,
            result.categoryName ?? "-",
            result.eventType,
            result.teamName ?? "-",
            <ResultBadge key="badge" resultType={result.resultType} />,
            result.pointsEarned,
            formatDateTime(result.declaredAt)
          ])}
          emptyMessage="No published final results."
        /> : (
          <Card>
            <h2 className="text-base font-bold text-kec-text">No final results published yet</h2>
            <p className="mt-2 text-sm text-kec-secondary">Published final results and points from your registered events will appear here.</p>
            <Link className="mt-4 inline-block" href="/student/registrations"><Button type="button" variant="secondary">View My Registrations</Button></Link>
          </Card>
        )}
        {registrations.filter((registration) => !results.some((result) => result.eventId === registration.eventId)).length ? (
          <Card>
            <h2 className="text-base font-bold text-kec-text">Awaiting Final Results</h2>
            <div className="mt-3 space-y-2">
              {registrations.filter((registration) => !results.some((result) => result.eventId === registration.eventId)).map((registration) => (
                <div key={registration.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-kec-border px-4 py-3">
                  <div><p className="font-semibold text-kec-text">{registration.eventTitle}</p><p className="text-sm text-kec-secondary">Final result not published yet.</p></div>
                  <Link href={`/student/events/${registration.eventId}`}><Button type="button" variant="secondary">View Event Progress</Button></Link>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>}
    </AppShell>
  );
}
