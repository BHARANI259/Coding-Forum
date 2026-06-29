"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import BackButton from "@/components/ui/BackButton";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import Select from "@/components/ui/Select";
import { getCurrentUser } from "@/lib/auth";
import {
  downloadFacultyDepartmentPdf,
  downloadFacultyDepartmentStudentsExcel,
  downloadFacultyEventPdf,
  downloadFacultyEventResultsExcel,
  downloadFacultyEventStudentsExcel,
  downloadFacultyEventTeamsExcel,
  getEventCategories,
  getFacultyEvents,
  type EventCategory,
  type EventItem
} from "@/lib/api";

export default function FacultyReportsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [eventId, setEventId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [downloading, setDownloading] = useState("");
  const [error, setError] = useState("");
  const user = getCurrentUser();

  useEffect(() => {
    async function load() {
      try {
        const [eventList, categoryList] = await Promise.all([getFacultyEvents(), getEventCategories()]);
        setEvents(eventList);
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
  const filters = { categoryId, fromDate, toDate };

  return (
    <AppShell expectedRole="FACULTY" title="Reports">
      <PageHeader title="Reports" subtitle="Download reports for assigned events and monitored department data." actions={<BackButton fallbackHref="/faculty/dashboard" />} />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="text-base font-bold text-kec-text">Assigned Event Reports</h2>
          <Select className="mt-4" label="Event" value={eventId} onChange={(event) => setEventId(event.target.value)}>
            <option value="">Select assigned event</option>
            {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
          </Select>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button type="button" disabled={!eventId} loading={downloading === "event-pdf"} onClick={() => void runDownload("event-pdf", () => downloadFacultyEventPdf(selectedEventId))}>Event PDF Report</Button>
            <Button type="button" variant="secondary" disabled={!eventId} loading={downloading === "event-students"} onClick={() => void runDownload("event-students", () => downloadFacultyEventStudentsExcel(selectedEventId))}>Student List Excel</Button>
            <Button type="button" variant="secondary" disabled={!eventId} loading={downloading === "event-teams"} onClick={() => void runDownload("event-teams", () => downloadFacultyEventTeamsExcel(selectedEventId))}>Team List Excel</Button>
            <Button type="button" variant="secondary" disabled={!eventId} loading={downloading === "event-results"} onClick={() => void runDownload("event-results", () => downloadFacultyEventResultsExcel(selectedEventId))}>Results Excel</Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-bold text-kec-text">Department Reports</h2>
          {user?.deptMonitoringEnabled ? (
            <>
              <div className="mt-4 space-y-3">
                <Select label="Category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                  <option value="">All categories</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </Select>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="From Date" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
                  <Input label="To Date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Button type="button" loading={downloading === "department-pdf"} onClick={() => void runDownload("department-pdf", () => downloadFacultyDepartmentPdf(filters))}>Department PDF</Button>
                <Button type="button" variant="secondary" loading={downloading === "department-students"} onClick={() => void runDownload("department-students", () => downloadFacultyDepartmentStudentsExcel(filters))}>Department Student Excel</Button>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-kec-secondary">Department report access is available only when department monitoring is enabled for this account.</p>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
