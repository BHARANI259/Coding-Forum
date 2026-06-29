"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import DataTable from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { getMyPointHistory, getMyStatistics, type StudentPointHistory, type StudentStatistics } from "@/lib/api";

export default function StudentDashboardShell() {
  const [stats, setStats] = useState<StudentStatistics | null>(null);
  const [history, setHistory] = useState<StudentPointHistory[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [statistics, pointHistory] = await Promise.all([
          getMyStatistics(),
          getMyPointHistory({ size: 5 })
        ]);
        setStats(statistics);
        setHistory(pointHistory.content);
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load dashboard statistics.");
      }
    }
    void load();
  }, []);

  return (
    <AppShell expectedRole="STUDENT" title="Student Dashboard">
      <PageHeader
        title="Student Dashboard"
        subtitle="Overview of your coding forum activity."
      />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Points" value={stats?.totalPoints ?? 0} hint="From declared results" />
        <StatCard label="Events Participated" value={stats?.totalEventsRegistered ?? 0} hint="Registered events" />
        <StatCard label="Wins" value={stats?.winsCount ?? 0} hint="Winner tags" />
        <StatCard label="Runner-ups" value={stats?.runnerUpCount ?? 0} hint="Runner-up tags" />
        <StatCard label="Participation Count" value={stats?.participationCount ?? 0} hint="Participation points" />
      </div>
      <div className="mt-6 space-y-3">
        <h2 className="text-lg font-bold text-kec-text">Recent Point History</h2>
        <DataTable
          headers={["Event", "Category", "Type", "Points", "Date"]}
          rows={history.map((item) => [
            item.eventTitle,
            item.categoryName,
            item.pointType,
            item.points,
            new Date(item.createdAt).toLocaleString()
          ])}
          emptyMessage="No point history yet."
        />
      </div>
    </AppShell>
  );
}
