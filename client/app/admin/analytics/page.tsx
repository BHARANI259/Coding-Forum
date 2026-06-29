"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import DataTable from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import BackButton from "@/components/ui/BackButton";
import {
  getAdminAnalyticsSummary,
  getAdminCategoryAnalytics,
  getAdminDepartmentAnalytics,
  getAdminRecentActivity,
  type AdminAnalyticsSummary,
  type CategoryAnalytics,
  type DepartmentAnalytics,
  type RecentActivity
} from "@/lib/api";

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<AdminAnalyticsSummary | null>(null);
  const [departments, setDepartments] = useState<DepartmentAnalytics[]>([]);
  const [categories, setCategories] = useState<CategoryAnalytics[]>([]);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [summaryData, departmentData, categoryData, activityData] = await Promise.all([
          getAdminAnalyticsSummary(),
          getAdminDepartmentAnalytics(),
          getAdminCategoryAnalytics(),
          getAdminRecentActivity()
        ]);
        setSummary(summaryData);
        setDepartments(departmentData);
        setCategories(categoryData);
        setActivity(activityData);
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load analytics.");
      }
    }
    void load();
  }, []);

  return (
    <AppShell expectedRole="SUPER_ADMIN" title="Analytics">
      <PageHeader title="Analytics" subtitle="Institution-level participation, result, and point tracking." actions={<BackButton fallbackHref="/admin/dashboard" />} />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={summary?.totalStudents ?? 0} />
        <StatCard label="Faculty" value={summary?.totalFaculty ?? 0} />
        <StatCard label="Events" value={summary?.totalEvents ?? 0} />
        <StatCard label="Published Events" value={summary?.publishedEvents ?? 0} />
        <StatCard label="Registrations" value={summary?.totalRegistrations ?? 0} />
        <StatCard label="Teams" value={summary?.totalTeams ?? 0} />
        <StatCard label="Results" value={summary?.totalResults ?? 0} />
        <StatCard label="Points Awarded" value={summary?.totalPointsAwarded ?? 0} />
      </div>
      <div className="mt-6 space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-kec-text">Department Analytics</h2>
          <DataTable
            headers={["Department", "Points", "Students", "Active", "Participations", "Avg/Student", "Wins"]}
            rows={departments.map((department) => [
              `${department.departmentCode} - ${department.departmentName}`,
              department.totalPoints,
              department.totalStudents,
              department.activeStudents,
              department.totalEventParticipations,
              department.averageParticipationPerStudent.toFixed(2),
              department.winsCount
            ])}
            emptyMessage="No department analytics yet."
          />
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-kec-text">Category Performance</h2>
          <DataTable
            headers={["Category", "Points", "Results", "Participants"]}
            rows={categories.map((category) => [
              category.categoryName,
              category.totalPoints,
              category.totalResults,
              category.participantCount
            ])}
            emptyMessage="No category analytics yet."
          />
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-kec-text">Recent Activity</h2>
          <DataTable
            headers={["Type", "Title", "Details", "Points", "Date"]}
            rows={activity.map((item) => [
              item.activityType,
              item.title,
              item.subtitle,
              item.points,
              new Date(item.occurredAt).toLocaleString()
            ])}
            emptyMessage="No recent activity yet."
          />
        </section>
      </div>
    </AppShell>
  );
}
