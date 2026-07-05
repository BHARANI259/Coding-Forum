"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import AppShell from "@/components/layout/AppShell";
import BackButton from "@/components/ui/BackButton";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import Select from "@/components/ui/Select";
import StatCard from "@/components/ui/StatCard";
import {
  getAdminAnalyticsFilters,
  getAdminAnalyticsSummary,
  getCategoryParticipation,
  getDepartmentParticipation,
  getDepartmentPoints,
  getEventEngagement,
  getEventStatusSummary,
  getRegistrationTrend,
  getResultDistribution,
  getTechnicalAreaParticipation,
  getTopDepartments,
  getTopStudents,
  type AdminAnalyticsFilters,
  type AdminAnalyticsSummary,
  type CategoryParticipationChartRow,
  type DepartmentParticipationChartRow,
  type DepartmentPointsChartRow,
  type EventEngagementRow,
  type EventStatusSummaryRow,
  type RegistrationTrendRow,
  type ResultDistributionRow,
  type TechnicalAreaParticipationRow,
  type TopDepartmentAnalyticsRow,
  type TopStudentAnalyticsRow
} from "@/lib/api";

type AnalyticsFiltersState = {
  departmentId: string;
  categoryId: string;
  technicalArea: string;
  fromDate: string;
  toDate: string;
};

const emptyFilters: AnalyticsFiltersState = {
  departmentId: "",
  categoryId: "",
  technicalArea: "",
  fromDate: "",
  toDate: ""
};

const chartColors = ["#6D4CC2", "#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#0891B2", "#9333EA"];

export default function AdminAnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFiltersState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<AnalyticsFiltersState>(emptyFilters);
  const [filterOptions, setFilterOptions] = useState<AdminAnalyticsFilters | null>(null);
  const [overview, setOverview] = useState<AdminAnalyticsSummary | null>(null);
  const [departmentParticipation, setDepartmentParticipation] = useState<DepartmentParticipationChartRow[]>([]);
  const [departmentPoints, setDepartmentPoints] = useState<DepartmentPointsChartRow[]>([]);
  const [categoryParticipation, setCategoryParticipation] = useState<CategoryParticipationChartRow[]>([]);
  const [registrationTrend, setRegistrationTrend] = useState<RegistrationTrendRow[]>([]);
  const [resultDistribution, setResultDistribution] = useState<ResultDistributionRow[]>([]);
  const [technicalAreaParticipation, setTechnicalAreaParticipation] = useState<TechnicalAreaParticipationRow[]>([]);
  const [eventStatusSummary, setEventStatusSummary] = useState<EventStatusSummaryRow[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudentAnalyticsRow[]>([]);
  const [topDepartments, setTopDepartments] = useState<TopDepartmentAnalyticsRow[]>([]);
  const [eventEngagement, setEventEngagement] = useState<EventEngagementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const queryFilters = useMemo(() => toQueryFilters(appliedFilters), [appliedFilters]);

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        setFilterOptions(await getAdminAnalyticsFilters());
      } catch {
        setFilterOptions({ departments: [], categories: [], technicalAreas: ["SOFTWARE", "HARDWARE"], eventStatuses: [] });
      }
    }
    void loadFilterOptions();
  }, []);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      setError("");
      const results = await Promise.allSettled([
        getAdminAnalyticsSummary(),
        getDepartmentParticipation(queryFilters),
        getDepartmentPoints(queryFilters),
        getCategoryParticipation(queryFilters),
        getRegistrationTrend(queryFilters),
        getResultDistribution(queryFilters),
        getTechnicalAreaParticipation(queryFilters),
        getEventStatusSummary(),
        getTopStudents({ ...queryFilters, limit: 10 }),
        getTopDepartments({ ...queryFilters, limit: 10 }),
        getEventEngagement({ ...queryFilters, limit: 10 })
      ]);

      const rejected = results.find((result) => result.status === "rejected");
      if (rejected?.status === "rejected") {
        setError(rejected.reason instanceof Error ? rejected.reason.message : "Some analytics could not be loaded.");
      }

      setOverview(valueOr(results[0], null));
      setDepartmentParticipation(valueOr(results[1], []));
      setDepartmentPoints(valueOr(results[2], []));
      setCategoryParticipation(valueOr(results[3], []));
      setRegistrationTrend(valueOr(results[4], []));
      setResultDistribution(valueOr(results[5], []));
      setTechnicalAreaParticipation(valueOr(results[6], []));
      setEventStatusSummary(valueOr(results[7], []));
      setTopStudents(valueOr(results[8], []));
      setTopDepartments(valueOr(results[9], []));
      setEventEngagement(valueOr(results[10], []));
      setLoading(false);
    }
    void loadAnalytics();
  }, [queryFilters]);

  const departmentParticipationRows = departmentParticipation.map((row) => ({
    department: row.departmentCode,
    registrations: row.totalRegistrations,
    students: row.uniqueStudentsParticipated
  }));
  const departmentPointsRows = departmentPoints.map((row) => ({
    department: row.departmentCode,
    points: row.totalPoints,
    wins: row.wins,
    runnerUps: row.runnerUps
  }));
  const categoryRows = categoryParticipation.map((row) => ({
    name: row.categoryName,
    value: row.registrationCount
  }));
  const resultRows = resultDistribution.map((row) => ({
    name: formatResultType(row.resultType),
    value: row.count
  }));
  const technicalRows = technicalAreaParticipation.map((row) => ({
    name: row.technicalArea,
    value: row.registrationCount
  }));
  const statusRows = eventStatusSummary.map((row) => ({
    name: row.status,
    value: row.count
  }));

  return (
    <AppShell expectedRole="SUPER_ADMIN" title="Analytics">
      <PageHeader
        title="Analytics"
        subtitle="Monitor coding forum participation, performance, and event engagement."
        actions={<BackButton fallbackHref="/admin/dashboard" />}
      />

      {error ? <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}

      <Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Select label="Department" value={filters.departmentId} onChange={(event) => setFilters({ ...filters, departmentId: event.target.value })}>
            <option value="">All departments</option>
            {filterOptions?.departments.map((department) => (
              <option key={department.id} value={department.id}>{department.label}</option>
            ))}
          </Select>
          <Select label="Category" value={filters.categoryId} onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}>
            <option value="">All categories</option>
            {filterOptions?.categories.map((category) => (
              <option key={category.id} value={category.id}>{category.label}</option>
            ))}
          </Select>
          <Select label="Technical Area" value={filters.technicalArea} onChange={(event) => setFilters({ ...filters, technicalArea: event.target.value })}>
            <option value="">All areas</option>
            {filterOptions?.technicalAreas.map((technicalArea) => (
              <option key={technicalArea} value={technicalArea}>{technicalArea}</option>
            ))}
          </Select>
          <Input label="From Date" type="date" value={filters.fromDate} onChange={(event) => setFilters({ ...filters, fromDate: event.target.value })} />
          <Input label="To Date" type="date" value={filters.toDate} onChange={(event) => setFilters({ ...filters, toDate: event.target.value })} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" onClick={() => setAppliedFilters(filters)}>Apply Filters</Button>
          <Button type="button" variant="secondary" onClick={() => { setFilters(emptyFilters); setAppliedFilters(emptyFilters); }}>Reset Filters</Button>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={overview?.totalStudents ?? 0} />
        <StatCard label="Total Faculty" value={overview?.totalFaculty ?? 0} />
        <StatCard label="Total Events" value={overview?.totalEvents ?? 0} />
        <StatCard label="Published Events" value={overview?.publishedEvents ?? 0} />
        <StatCard label="Completed Events" value={overview?.completedEvents ?? 0} />
        <StatCard label="Registrations" value={overview?.totalRegistrations ?? 0} />
        <StatCard label="Teams" value={overview?.totalTeams ?? 0} />
        <StatCard label="Points Awarded" value={overview?.totalPointsAwarded ?? 0} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Department-wise Participation" subtitle="Registrations and unique students by department." loading={loading} empty={!hasChartData(departmentParticipationRows, ["registrations", "students"])}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentParticipationRows}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="department" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="registrations" fill="#6D4CC2" name="Registrations" />
              <Bar dataKey="students" fill="#2563EB" name="Unique Students" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Department-wise Points" subtitle="Performance from student_points." loading={loading} empty={!hasChartData(departmentPointsRows, ["points", "wins"])}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentPointsRows}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="department" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="points" fill="#6D4CC2" name="Points" />
              <Bar dataKey="wins" fill="#16A34A" name="Wins" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Event Category Participation" subtitle="Which event categories attract registrations." loading={loading} empty={!hasPieData(categoryRows)}>
          <PiePanel data={categoryRows} />
        </ChartCard>

        <ChartCard title="Registration Trend" subtitle="Daily registration activity. Defaults to the last 30 days." loading={loading} empty={!hasChartData(registrationTrend, ["registrationCount"])}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={registrationTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="registrationCount" stroke="#6D4CC2" strokeWidth={2} name="Registrations" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Result Distribution" subtitle="Final result tags across declared results." loading={loading} empty={!hasPieData(resultRows)}>
          <PiePanel data={resultRows} />
        </ChartCard>

        <ChartCard title="Software vs Hardware Participation" subtitle="Participation split by student technical area." loading={loading} empty={!hasPieData(technicalRows)}>
          <PiePanel data={technicalRows} />
        </ChartCard>

        <ChartCard title="Event Status Summary" subtitle="Current event lifecycle status." loading={loading} empty={!hasPieData(statusRows)}>
          <PiePanel data={statusRows} />
        </ChartCard>

        <ChartCard title="Event Engagement" subtitle="Events with the highest registration activity." loading={loading} empty={eventEngagement.length === 0}>
          <DataTable
            headers={["Event", "Category", "Type", "Registrations", "Teams", "Results"]}
            rows={eventEngagement.map((row) => [
              row.eventTitle,
              row.categoryName,
              row.eventType,
              row.registrationCount,
              row.teamCount,
              row.resultsPublished ? "Published" : "Pending"
            ])}
            emptyMessage="No event engagement data."
          />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Top Students" subtitle="Highest scoring students from live point data." loading={loading} empty={topStudents.length === 0}>
          <DataTable
            headers={["Rank", "Student", "Register No", "Dept", "Area", "Points", "Events", "Wins"]}
            rows={topStudents.map((row) => [
              row.rank,
              row.studentName,
              row.registerNumber,
              row.departmentCode ?? "-",
              row.technicalArea,
              row.totalPoints,
              row.eventsParticipated,
              row.wins
            ])}
            emptyMessage="No top student data."
          />
        </ChartCard>

        <ChartCard title="Top Departments" subtitle="Department ranking by points, participation, and wins." loading={loading} empty={topDepartments.length === 0}>
          <DataTable
            headers={["Rank", "Department", "Points", "Participations", "Wins"]}
            rows={topDepartments.map((row) => [
              row.rank,
              `${row.departmentCode} - ${row.departmentName}`,
              row.totalPoints,
              row.participationCount,
              row.wins
            ])}
            emptyMessage="No top department data."
          />
        </ChartCard>
      </div>
    </AppShell>
  );
}

function ChartCard({ title, subtitle, loading, empty, children }: { title: string; subtitle: string; loading: boolean; empty: boolean; children: React.ReactNode }) {
  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-base font-bold text-kec-text">{title}</h2>
        <p className="mt-1 text-sm text-kec-secondary">{subtitle}</p>
      </div>
      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-kec-border text-sm text-kec-muted">Loading analytics...</div>
      ) : empty ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-kec-border px-4 text-center text-sm text-kec-muted">No data available for the selected filters.</div>
      ) : children}
    </Card>
  );
}

function PiePanel({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={96} innerRadius={48} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function toQueryFilters(filters: AnalyticsFiltersState) {
  return {
    departmentId: filters.departmentId || undefined,
    categoryId: filters.categoryId || undefined,
    technicalArea: filters.technicalArea || undefined,
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined
  };
}

function valueOr<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

function hasChartData<T extends Record<string, unknown>>(rows: T[], keys: string[]) {
  return rows.some((row) => keys.some((key) => Number(row[key] ?? 0) > 0));
}

function hasPieData(rows: Array<{ value: number }>) {
  return rows.some((row) => row.value > 0);
}

function formatResultType(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
