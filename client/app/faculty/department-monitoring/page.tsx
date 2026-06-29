"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { StudentLeaderboardTable } from "@/components/dashboard/LeaderboardTables";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import BackButton from "@/components/ui/BackButton";
import {
  getFacultyDepartmentLeaderboard,
  getFacultyDepartmentStudents,
  getFacultyDepartmentSummary,
  type DepartmentStudentStats,
  type FacultyDepartmentSummary,
  type StudentLeaderboardRow
} from "@/lib/api";

export default function FacultyDepartmentMonitoringPage() {
  const [summary, setSummary] = useState<FacultyDepartmentSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<StudentLeaderboardRow[]>([]);
  const [students, setStudents] = useState<DepartmentStudentStats[]>([]);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [departmentSummary, departmentLeaderboard, departmentStudents] = await Promise.all([
          getFacultyDepartmentSummary(),
          getFacultyDepartmentLeaderboard(),
          getFacultyDepartmentStudents({ size: 20 })
        ]);
        setSummary(departmentSummary);
        setLeaderboard(departmentLeaderboard.content);
        setStudents(departmentStudents.content);
      } catch (exception) {
        const message = exception instanceof Error ? exception.message : "Unable to load department monitoring.";
        setForbidden(message.toLowerCase().includes("monitoring") || message.toLowerCase().includes("forbidden"));
        setError(message);
      }
    }
    void load();
  }, []);

  return (
    <AppShell expectedRole="FACULTY" title="Department Monitoring">
      <PageHeader title="Department Monitoring" subtitle="Department-only statistics for enabled faculty monitors." actions={<BackButton fallbackHref="/faculty/dashboard" />} />
      {forbidden ? (
        <Card>
          <h2 className="text-lg font-bold text-kec-text">Permission Required</h2>
          <p className="mt-2 text-sm text-kec-secondary">
            Department monitoring is not enabled for this faculty account.
          </p>
        </Card>
      ) : (
        <>
          {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Department Students" value={summary?.departmentStudents ?? 0} hint={summary?.departmentCode ?? "Department"} />
            <StatCard label="Total Points" value={summary?.departmentTotalPoints ?? 0} hint="Department total" />
            <StatCard label="Participations" value={summary?.departmentParticipations ?? 0} hint="Registered event rows" />
          </div>
          <div className="mt-6 space-y-6">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-kec-text">Department Student Leaderboard</h2>
              <StudentLeaderboardTable rows={leaderboard} />
            </section>
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-kec-text">Student Statistics</h2>
              <DataTable
                headers={["Register No", "Student", "Points", "Events", "Wins"]}
                rows={students.map((student) => [
                  student.registerNumber,
                  student.studentName,
                  student.totalPoints,
                  student.eventsParticipated,
                  student.wins
                ])}
                emptyMessage="No department student statistics yet."
              />
            </section>
          </div>
        </>
      )}
    </AppShell>
  );
}
