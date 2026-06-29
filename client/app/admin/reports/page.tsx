"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import BackButton from "@/components/ui/BackButton";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import Select from "@/components/ui/Select";
import {
  downloadAdminCollegeLeaderboardExcel,
  downloadAdminDepartmentPdf,
  downloadAdminDepartmentStudentsExcel,
  downloadAdminEventPdf,
  downloadAdminEventResultsExcel,
  downloadAdminEventStudentsExcel,
  downloadAdminEventTeamsExcel,
  getAdminEvents,
  getDepartments,
  getEventCategories,
  type Department,
  type EventCategory,
  type EventItem
} from "@/lib/api";

export default function AdminReportsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [eventId, setEventId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [leaderboardDepartmentId, setLeaderboardDepartmentId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [downloading, setDownloading] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [eventPage, departmentList, categoryList] = await Promise.all([
          getAdminEvents({ page: 0, size: 100 }),
          getDepartments(),
          getEventCategories()
        ]);
        setEvents(eventPage.content);
        setDepartments(departmentList);
        setCategories(categoryList);
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load report options.");
      }
    }
    void load();
  }, []);

  async function runDownload(key: string, action: () => Promise<void>) {
    setError("");
    setDownloading(key);
    try {
      await action();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to download report.");
    } finally {
      setDownloading("");
    }
  }

  const selectedEventId = Number(eventId);
  const selectedDepartmentId = Number(departmentId);
  const filters = { categoryId, fromDate, toDate };
  const leaderboardFilters = { categoryId, departmentId: leaderboardDepartmentId, fromDate, toDate };

  return (
    <AppShell expectedRole="SUPER_ADMIN" title="Reports">
      <PageHeader title="Reports" subtitle="Generate PDF and Excel exports from live Coding Forum data." actions={<BackButton fallbackHref="/admin/dashboard" />} />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-5 xl:grid-cols-3">
        <Card>
          <h2 className="text-base font-bold text-kec-text">Event Reports</h2>
          <Select className="mt-4" label="Event" value={eventId} onChange={(event) => setEventId(event.target.value)}>
            <option value="">Select event</option>
            {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
          </Select>
          <div className="mt-4 grid gap-3">
            <Button type="button" disabled={!eventId} loading={downloading === "event-pdf"} onClick={() => void runDownload("event-pdf", () => downloadAdminEventPdf(selectedEventId))}>Event PDF Report</Button>
            <Button type="button" variant="secondary" disabled={!eventId} loading={downloading === "event-students"} onClick={() => void runDownload("event-students", () => downloadAdminEventStudentsExcel(selectedEventId))}>Student List Excel</Button>
            <Button type="button" variant="secondary" disabled={!eventId} loading={downloading === "event-teams"} onClick={() => void runDownload("event-teams", () => downloadAdminEventTeamsExcel(selectedEventId))}>Team List Excel</Button>
            <Button type="button" variant="secondary" disabled={!eventId} loading={downloading === "event-results"} onClick={() => void runDownload("event-results", () => downloadAdminEventResultsExcel(selectedEventId))}>Results Excel</Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-bold text-kec-text">Department Reports</h2>
          <div className="mt-4 space-y-3">
            <Select label="Department" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
              <option value="">Select department</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.code}</option>)}
            </Select>
            <Select label="Category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </Select>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="From Date" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
              <Input label="To Date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            <Button type="button" disabled={!departmentId} loading={downloading === "department-pdf"} onClick={() => void runDownload("department-pdf", () => downloadAdminDepartmentPdf(selectedDepartmentId, filters))}>Department PDF Report</Button>
            <Button type="button" variant="secondary" disabled={!departmentId} loading={downloading === "department-students"} onClick={() => void runDownload("department-students", () => downloadAdminDepartmentStudentsExcel(selectedDepartmentId, filters))}>Department Student Excel</Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-bold text-kec-text">Leaderboard Export</h2>
          <div className="mt-4 space-y-3">
            <Select label="Department" value={leaderboardDepartmentId} onChange={(event) => setLeaderboardDepartmentId(event.target.value)}>
              <option value="">All departments</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.code}</option>)}
            </Select>
            <Select label="Category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </Select>
            <Button type="button" loading={downloading === "leaderboard"} onClick={() => void runDownload("leaderboard", () => downloadAdminCollegeLeaderboardExcel(leaderboardFilters))}>College Leaderboard Excel</Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
