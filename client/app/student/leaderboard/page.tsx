"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import BackButton from "@/components/ui/BackButton";
import Card from "@/components/ui/Card";
import { StudentLeaderboardTable } from "@/components/dashboard/LeaderboardTables";
import { getStudentLeaderboard, getStudentProfile, type StudentLeaderboardRow } from "@/lib/api";

export default function StudentLeaderboardPage() {
  const [rows, setRows] = useState<StudentLeaderboardRow[]>([]);
  const [year, setYear] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const profile = await getStudentProfile();
        setYear(profile.year);
        const leaderboard = await getStudentLeaderboard({ year: profile.year, size: 20 });
        setRows(leaderboard.content);
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load leaderboard.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <AppShell expectedRole="STUDENT" title="Leaderboard">
      <PageHeader title="Leaderboard" subtitle={year ? `Year ${year} student rankings.` : "Your year-wise student ranking."} actions={<BackButton fallbackHref="/student/dashboard" />} />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <p className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        This leaderboard shows students from your current year only. Points come from published final results configured by SuperAdmin.
      </p>
      {loading ? (
        <Card>Loading year leaderboard...</Card>
      ) : (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-kec-text">{year ? `Year ${year} Leaderboard` : "Year Leaderboard"}</h2>
          <StudentLeaderboardTable rows={rows} />
        </section>
      )}
    </AppShell>
  );
}
