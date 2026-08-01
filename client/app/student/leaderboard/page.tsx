"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import BackButton from "@/components/ui/BackButton";
import { DepartmentLeaderboardTable, StudentLeaderboardTable } from "@/components/dashboard/LeaderboardTables";
import { getBestCoders, getDepartmentLeaderboard, getStudentLeaderboard, getTopEngagingStudents, type DepartmentLeaderboardRow, type StudentLeaderboardRow } from "@/lib/api";

export default function StudentLeaderboardPage() {
  const [college, setCollege] = useState<StudentLeaderboardRow[]>([]);
  const [departments, setDepartments] = useState<DepartmentLeaderboardRow[]>([]);
  const [coders, setCoders] = useState<StudentLeaderboardRow[]>([]);
  const [engaging, setEngaging] = useState<StudentLeaderboardRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [collegeRows, departmentRows, coderRows, engagingRows] = await Promise.all([
          getStudentLeaderboard({ size: 10 }),
          getDepartmentLeaderboard(),
          getBestCoders({ size: 10 }),
          getTopEngagingStudents({ size: 10 })
        ]);
        setCollege(collegeRows.content);
        setDepartments(departmentRows);
        setCoders(coderRows.content);
        setEngaging(engagingRows.content);
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load leaderboard.");
      }
    }
    void load();
  }, []);

  return (
    <AppShell expectedRole="STUDENT" title="Leaderboard">
      <PageHeader title="Leaderboard" subtitle="College, department, coding, and engagement rankings." actions={<BackButton fallbackHref="/student/dashboard" />} />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <p className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Points come from published final results. SuperAdmin configures the points for each category, and team members each receive their own points.
      </p>
      <div className="space-y-6">
        <Section title="College Leaderboard"><StudentLeaderboardTable rows={college} /></Section>
        <Section title="Department Leaderboard"><DepartmentLeaderboardTable rows={departments} /></Section>
        <Section title="Best Coders"><StudentLeaderboardTable rows={coders} /></Section>
        <Section title="Top Engaging Students"><StudentLeaderboardTable rows={engaging} /></Section>
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
