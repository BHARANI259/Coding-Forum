"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import ResultBadge from "@/components/events/ResultBadge";
import BackButton from "@/components/ui/BackButton";
import { getMyResults, type StudentResult } from "@/lib/api";

export default function StudentResultsPage() {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setResults(await getMyResults());
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
      {loading ? <Card>Loading results...</Card> : (
        <DataTable
          headers={["Event", "Category", "Type", "Team", "Result", "Points", "Declared At"]}
          rows={results.map((result) => [
            result.eventTitle,
            result.categoryName ?? "-",
            result.eventType,
            result.teamName ?? "-",
            <ResultBadge key="badge" resultType={result.resultType} />,
            result.pointsEarned,
            new Date(result.declaredAt).toLocaleString()
          ])}
          emptyMessage="Result not published yet."
        />
      )}
    </AppShell>
  );
}
