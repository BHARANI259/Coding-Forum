"use client";

import Link from "next/link";
import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import BackButton from "@/components/ui/BackButton";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import Select from "@/components/ui/Select";
import { getAdminEvents, getDepartments, getEventCategories, type Department, type EventCategory, type EventItem } from "@/lib/api";
import { formatDateTime } from "@/lib/dateFormat";
import {
  assignEventIncharge,
  getEventInchargeAssignments,
  getFacultyOptionsForIncharge,
  removeEventIncharge,
  updateEventIncharge,
  type EventInchargeAssignment,
  type FacultyInchargeOption
} from "@/lib/api/adminEventIncharges";

export default function AdminEventInchargesPage() {
  return (
    <Suspense fallback={<AppShell expectedRole="SUPER_ADMIN" title="Event Incharges"><Card>Loading event incharges...</Card></AppShell>}>
      <AdminEventInchargesContent />
    </Suspense>
  );
}

function AdminEventInchargesContent() {
  const searchParams = useSearchParams();
  const initialEventId = searchParams.get("eventId") ?? "";
  const [assignForm, setAssignForm] = useState({ eventId: initialEventId, facultyId: "", primaryIncharge: false, responsibility: "" });
  const [filters, setFilters] = useState({ search: "", eventId: initialEventId, facultyId: "", departmentId: "", categoryId: "", eventStatus: "" });
  const [events, setEvents] = useState<EventItem[]>([]);
  const [faculty, setFaculty] = useState<FacultyInchargeOption[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [assignments, setAssignments] = useState<EventInchargeAssignment[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ primaryIncharge: false, responsibility: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getEventInchargeAssignments({
        size: 100,
        search: filters.search,
        eventId: filters.eventId || undefined,
        facultyId: filters.facultyId || undefined,
        departmentId: filters.departmentId || undefined,
        categoryId: filters.categoryId || undefined,
        eventStatus: filters.eventStatus || undefined
      });
      setAssignments(response.content);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load event incharges.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [eventPage, facultyOptions, departmentList, categoryList] = await Promise.all([
          getAdminEvents({ size: 200 }),
          getFacultyOptionsForIncharge({}),
          getDepartments(),
          getEventCategories({})
        ]);
        setEvents(eventPage.content);
        setFaculty(facultyOptions);
        setDepartments(departmentList);
        setCategories(categoryList);
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load options.");
      }
    }
    void loadOptions();
  }, []);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  async function handleAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await assignEventIncharge(Number(assignForm.eventId), {
        facultyId: Number(assignForm.facultyId),
        primaryIncharge: assignForm.primaryIncharge,
        responsibility: assignForm.responsibility
      });
      setAssignForm((current) => ({ ...current, facultyId: "", primaryIncharge: false, responsibility: "" }));
      setSuccess("Faculty assigned to event.");
      await loadAssignments();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to assign faculty.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(assignmentId: number) {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await updateEventIncharge(assignmentId, editForm);
      setEditId(null);
      setSuccess("Assignment updated.");
      await loadAssignments();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to update assignment.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(assignmentId: number) {
    if (!window.confirm("Remove this faculty incharge from the event?")) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await removeEventIncharge(assignmentId);
      setSuccess("Assignment removed.");
      await loadAssignments();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to remove assignment.");
    }
  }

  function beginEdit(assignment: EventInchargeAssignment) {
    setEditId(assignment.assignmentId);
    setEditForm({ primaryIncharge: assignment.primaryIncharge, responsibility: assignment.responsibility ?? "" });
  }

  return (
    <AppShell expectedRole="SUPER_ADMIN" title="Event Incharges" fullWidth>
      <PageHeader
        title="Event Incharges"
        subtitle="Assign and manage faculty coordinators for coding forum events."
        actions={<BackButton fallbackHref="/admin/dashboard" />}
      />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p> : null}

      <Card className="mb-5">
        <h2 className="text-base font-bold text-kec-text">Assign Faculty</h2>
        <form className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1.4fr_1fr_auto]" onSubmit={handleAssign}>
          <Select label="Event" value={assignForm.eventId} onChange={(event) => setAssignForm({ ...assignForm, eventId: event.target.value })} required>
            <option value="">Select event</option>
            {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
          </Select>
          <Select label="Faculty" value={assignForm.facultyId} onChange={(event) => setAssignForm({ ...assignForm, facultyId: event.target.value })} required>
            <option value="">Select faculty</option>
            {faculty.map((member) => <option key={member.facultyId} value={member.facultyId}>{member.facultyName} ({member.email})</option>)}
          </Select>
          <Input label="Responsibility" value={assignForm.responsibility} onChange={(event) => setAssignForm({ ...assignForm, responsibility: event.target.value })} placeholder="Overall coordinator" />
          <div className="flex min-w-0 flex-col justify-end gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-kec-text">
              <input type="checkbox" checked={assignForm.primaryIncharge} onChange={(event) => setAssignForm({ ...assignForm, primaryIncharge: event.target.checked })} />
              Primary
            </label>
            <Button type="submit" loading={saving}>Assign</Button>
          </div>
        </form>
      </Card>

      <Card className="mb-5">
        <h2 className="text-base font-bold text-kec-text">Filters</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Input label="Search" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
          <Select label="Event" value={filters.eventId} onChange={(event) => setFilters({ ...filters, eventId: event.target.value })}>
            <option value="">All events</option>
            {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
          </Select>
          <Select label="Faculty" value={filters.facultyId} onChange={(event) => setFilters({ ...filters, facultyId: event.target.value })}>
            <option value="">All faculty</option>
            {faculty.map((member) => <option key={member.facultyId} value={member.facultyId}>{member.facultyName}</option>)}
          </Select>
          <Select label="Department" value={filters.departmentId} onChange={(event) => setFilters({ ...filters, departmentId: event.target.value })}>
            <option value="">All departments</option>
            {departments.map((department) => <option key={department.id} value={department.id}>{department.code}</option>)}
          </Select>
          <Select label="Category" value={filters.categoryId} onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}>
            <option value="">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </Select>
          <Select label="Status" value={filters.eventStatus} onChange={(event) => setFilters({ ...filters, eventStatus: event.target.value })}>
            <option value="">All statuses</option>
            {["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"].map((status) => <option key={status}>{status}</option>)}
          </Select>
        </div>
      </Card>

      {loading ? <Card>Loading assignments...</Card> : (
        <DataTable
          headers={["Event", "Category", "Status", "Faculty", "Faculty Code", "Department", "Email", "Primary", "Responsibility", "Assigned At", "Actions"]}
          rows={assignments.map((assignment) => [
            <Link key="event" href={`/admin/events/${assignment.eventId}`} className="font-semibold text-kec-purple">{assignment.eventTitle}</Link>,
            assignment.eventCategory ?? "-",
            <Badge key="status" variant={statusVariant(assignment.eventStatus)}>{assignment.eventStatus}</Badge>,
            assignment.facultyName,
            assignment.facultyCode ?? "-",
            assignment.facultyDepartmentCode ?? "-",
            assignment.facultyEmail,
            editId === assignment.assignmentId ? (
              <input key="primary" type="checkbox" checked={editForm.primaryIncharge} onChange={(event) => setEditForm({ ...editForm, primaryIncharge: event.target.checked })} />
            ) : (
              <Badge key="primary" variant={assignment.primaryIncharge ? "purple" : "default"}>{assignment.primaryIncharge ? "Primary" : "Co-incharge"}</Badge>
            ),
            editId === assignment.assignmentId ? (
              <Input key="responsibility" label="Responsibility" value={editForm.responsibility} onChange={(event) => setEditForm({ ...editForm, responsibility: event.target.value })} />
            ) : assignment.responsibility ?? "-",
            formatDateTime(assignment.assignedAt),
            <div key="actions" className="grid gap-2 sm:flex sm:flex-wrap">
              {editId === assignment.assignmentId ? (
                <>
                  <Button type="button" loading={saving} onClick={() => void handleUpdate(assignment.assignmentId)}>Save</Button>
                  <Button type="button" variant="secondary" onClick={() => setEditId(null)}>Cancel</Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="secondary" onClick={() => beginEdit(assignment)}>Edit</Button>
                  <Button type="button" variant="danger" onClick={() => void handleRemove(assignment.assignmentId)}>Remove</Button>
                </>
              )}
            </div>
          ])}
          emptyMessage="No event incharges assigned yet."
        />
      )}
    </AppShell>
  );
}

function statusVariant(status: string) {
  if (status === "PUBLISHED" || status === "ONGOING") {
    return "success";
  }
  if (status === "COMPLETED") {
    return "info";
  }
  if (status === "CANCELLED") {
    return "error";
  }
  return "warning";
}
