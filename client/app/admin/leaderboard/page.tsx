"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import BackButton from "@/components/ui/BackButton";
import { DepartmentLeaderboardTable, StudentLeaderboardTable } from "@/components/dashboard/LeaderboardTables";
import { getDepartmentLeaderboard, getStudentLeaderboard, type DepartmentLeaderboardRow, type StudentLeaderboardRow } from "@/lib/api";

const YEARS = [1, 2, 3, 4, 5];

export default function AdminLeaderboardPage() {
  const [yearRows, setYearRows] = useState<Record<number, StudentLeaderboardRow[]>>({});
  const [departments, setDepartments] = useState<DepartmentLeaderboardRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [departmentRows, ...leaderboards] = await Promise.all([
          getDepartmentLeaderboard(),
          ...YEARS.map((year) => getStudentLeaderboard({ year, size: 20 }))
        ]);
        setDepartments(departmentRows);
        setYearRows(Object.fromEntries(YEARS.map((year, index) => [year, leaderboards[index].content])));
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load leaderboard.");
      }
    }
    void load();
  }, []);

  return (
    <AppShell expectedRole="SUPER_ADMIN" title="Leaderboard">
      <PageHeader title="Leaderboard" subtitle="Year-wise student rankings and department performance." actions={<BackButton fallbackHref="/admin/dashboard" />} />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="space-y-6">
        <Section title="Department Leaderboard"><DepartmentLeaderboardTable rows={departments} /></Section>
        {YEARS.map((year) => (
          <Section key={year} title={`Year ${year} Leaderboard`}>
            <StudentLeaderboardTable rows={yearRows[year] ?? []} />
          </Section>
        ))}
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-kec-text">{title}</h2>
      {children}
    </section>
  );
}
