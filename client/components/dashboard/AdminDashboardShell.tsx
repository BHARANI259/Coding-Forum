"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import DataTable from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import {
  getAdminAnalyticsSummary,
  getAdminRecentActivity,
  getDepartmentLeaderboard,
  type AdminAnalyticsSummary,
  type DepartmentLeaderboardRow,
  type RecentActivity
} from "@/lib/api";

export default function AdminDashboardShell() {
  const [summary, setSummary] = useState<AdminAnalyticsSummary | null>(null);
  const [topDepartments, setTopDepartments] = useState<DepartmentLeaderboardRow[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [analytics, departments, activity] = await Promise.all([
          getAdminAnalyticsSummary(),
          getDepartmentLeaderboard(),
          getAdminRecentActivity()
        ]);
        setSummary(analytics);
        setTopDepartments(departments.slice(0, 5));
        setRecentActivity(activity.slice(0, 5));
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load admin analytics.");
      }
    }
    void load();
  }, []);

  return (
    <AppShell expectedRole="SUPER_ADMIN" title="SuperAdmin Dashboard">
      <PageHeader
        title="SuperAdmin Dashboard"
        subtitle="Institution-level coding forum administration."
      />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={summary?.totalStudents ?? 0} hint="Active and inactive" />
        <StatCard label="Total Faculty" value={summary?.totalFaculty ?? 0} hint="Faculty accounts" />
        <StatCard label="Total Events" value={summary?.totalEvents ?? 0} hint="All statuses" />
        <StatCard label="Published Events" value={summary?.publishedEvents ?? 0} hint="Visible to students" />
        <StatCard label="Total Registrations" value={summary?.totalRegistrations ?? 0} hint="Registered rows" />
        <StatCard label="Total Teams" value={summary?.totalTeams ?? 0} hint="Created teams" />
        <StatCard label="Total Results" value={summary?.totalResults ?? 0} hint="Declared results" />
        <StatCard label="Total Points Awarded" value={summary?.totalPointsAwarded ?? 0} hint="From student points" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-kec-text">Top Departments</h2>
          <DataTable
            headers={["Rank", "Department", "Points", "Participants", "Wins"]}
            rows={topDepartments.map((row) => [
              row.rank,
              `${row.departmentCode} - ${row.departmentName}`,
              row.totalPoints,
              row.totalParticipants,
              row.wins
            ])}
            emptyMessage="No department points yet."
          />
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-kec-text">Recent Activity</h2>
          <DataTable
            headers={["Type", "Title", "Details", "Points", "Date"]}
            rows={recentActivity.map((item) => [
              item.activityType,
              item.title,
              item.subtitle,
              item.points,
              new Date(item.occurredAt).toLocaleString()
            ])}
            emptyMessage="No recent point or result activity."
          />
        </section>
      </div>
    </AppShell>
  );
}
