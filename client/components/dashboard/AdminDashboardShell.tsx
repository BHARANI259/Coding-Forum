"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import DataTable from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import {
  getAdminAnalyticsOverview,
  getEventEngagement,
  getTopDepartments,
  getTopStudents,
  type AdminAnalyticsSummary,
  type EventEngagementRow,
  type TopDepartmentAnalyticsRow,
  type TopStudentAnalyticsRow
} from "@/lib/api";

export default function AdminDashboardShell() {
  const [summary, setSummary] = useState<AdminAnalyticsSummary | null>(null);
  const [topDepartments, setTopDepartments] = useState<TopDepartmentAnalyticsRow[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudentAnalyticsRow[]>([]);
  const [eventEngagement, setEventEngagement] = useState<EventEngagementRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const results = await Promise.allSettled([
        getAdminAnalyticsOverview(),
        getTopDepartments({ limit: 5 }),
        getTopStudents({ limit: 5 }),
        getEventEngagement({ limit: 5 })
      ]);

      const [analytics, departments, students, events] = results;
      const failures: string[] = [];

      if (analytics.status === "fulfilled") {
        setSummary(analytics.value);
      } else {
        failures.push(`Overview: ${messageFromRejection(analytics.reason)}`);
      }

      if (departments.status === "fulfilled") {
        setTopDepartments(departments.value);
      } else {
        failures.push(`Top departments: ${messageFromRejection(departments.reason)}`);
      }

      if (students.status === "fulfilled") {
        setTopStudents(students.value);
      } else {
        failures.push(`Top students: ${messageFromRejection(students.reason)}`);
      }

      if (events.status === "fulfilled") {
        setEventEngagement(events.value);
      } else {
        setEventEngagement([]);
      }

      setError(failures.join(" "));
    }
    void load();
  }, []);

  return (
    <AppShell expectedRole="SUPER_ADMIN" title="SuperAdmin Dashboard">
      <PageHeader
        title="SuperAdmin Dashboard"
        subtitle="Institution-level coding forum administration."
        actions={<Link href="/admin/analytics"><Button type="button">View Full Analytics</Button></Link>}
      />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={summary?.totalStudents ?? 0} hint="Active and inactive" />
        <StatCard label="Total Faculty" value={summary?.totalFaculty ?? 0} hint="Faculty accounts" />
        <StatCard label="Total Events" value={summary?.totalEvents ?? 0} hint="All statuses" />
        <StatCard label="Published Events" value={summary?.publishedEvents ?? 0} hint="Visible to students" />
        <StatCard label="Completed Events" value={summary?.completedEvents ?? 0} hint="Closed events" />
        <StatCard label="Total Registrations" value={summary?.totalRegistrations ?? 0} hint="Registered rows" />
        <StatCard label="Total Teams" value={summary?.totalTeams ?? 0} hint="Created teams" />
        <StatCard label="Total Results" value={summary?.totalResults ?? 0} hint="Declared results" />
        <StatCard label="Total Points Awarded" value={summary?.totalPointsAwarded ?? 0} hint="From student points" />
      </div>
      <div className="mt-6 space-y-6">
        <Card>
          <h2 className="text-base font-bold text-kec-text">Top Departments</h2>
          <p className="mt-1 text-sm text-kec-secondary">Ranked by student points.</p>
          <div className="mt-4">
          <DataTable
            headers={["Rank", "Department", "Points", "Participants", "Wins"]}
            rows={topDepartments.map((row) => [
              row.rank,
              `${row.departmentCode} - ${row.departmentName}`,
              row.totalPoints,
              row.participationCount,
              row.wins
            ])}
            emptyMessage="No department points yet."
          />
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-bold text-kec-text">Top Students</h2>
          <p className="mt-1 text-sm text-kec-secondary">Highest scoring participants.</p>
          <div className="mt-4">
          <DataTable
            headers={["Rank", "Student", "Dept", "Points", "Wins"]}
            rows={topStudents.map((row) => [
              row.rank,
              `${row.studentName} (${row.registerNumber})`,
              row.departmentCode ?? "-",
              row.totalPoints,
              row.wins
            ])}
            emptyMessage="No student points yet."
          />
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-bold text-kec-text">Event Engagement</h2>
          <p className="mt-1 text-sm text-kec-secondary">Events with the most registrations.</p>
          <div className="mt-4">
            <DataTable
              headers={["Event", "Category", "Registrations", "Teams"]}
              rows={eventEngagement.map((row) => [
                row.eventTitle,
                row.categoryName,
                row.registrationCount,
                row.teamCount
              ])}
              emptyMessage="No event engagement yet."
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function messageFromRejection(reason: unknown) {
  return reason instanceof Error ? reason.message : "Unable to load this section.";
}
