"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import {
  createEvent,
  getDepartments,
  getEventCategories,
  getFaculty,
  updateEvent,
  type Department,
  type EventDetail,
  type EventPayload,
  type EventCategory,
  type Faculty
} from "@/lib/api";

type EventFormProps = {
  mode: "create" | "edit";
  event?: EventDetail;
};

type FormState = {
  title: string;
  description: string;
  categoryId: string;
  eventType: "TEAM" | "INDIVIDUAL";
  venue: string;
  startDatetime: string;
  endDatetime: string;
  registrationStart: string;
  registrationEnd: string;
  registrationOpen: boolean;
  status: string;
  minTeamSize: string;
  maxTeamSize: string;
  maxParticipants: string;
  maxTeams: string;
  placementWillingOnly: boolean;
  allowedDepartmentIds: number[];
  allowedYears: number[];
  allowedSections: string;
  allowedTechnicalAreas: string[];
  inchargeFacultyIds: number[];
};

const initialState: FormState = {
  title: "",
  description: "",
  categoryId: "",
  eventType: "INDIVIDUAL",
  venue: "",
  startDatetime: "",
  endDatetime: "",
  registrationStart: "",
  registrationEnd: "",
  registrationOpen: false,
  status: "DRAFT",
  minTeamSize: "",
  maxTeamSize: "",
  maxParticipants: "",
  maxTeams: "",
  placementWillingOnly: false,
  allowedDepartmentIds: [],
  allowedYears: [],
  allowedSections: "",
  allowedTechnicalAreas: [],
  inchargeFacultyIds: []
};

export default function EventForm({ mode, event }: EventFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [form, setForm] = useState<FormState>(() => event ? fromEvent(event) : initialState);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [categoryList, departmentList, facultyPage] = await Promise.all([
          getEventCategories({ active: true }),
          getDepartments(),
          getFaculty({ size: 100 })
        ]);
        setCategories(categoryList);
        setDepartments(departmentList);
        setFaculty(facultyPage.content);
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load event options.");
      }
    }
    void loadOptions();
  }, []);

  async function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = toPayload(form);
      const saved = mode === "create" ? await createEvent(payload) : await updateEvent(event?.id ?? 0, payload);
      router.push(`/admin/events/${saved.id}`);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to save event.");
    } finally {
      setSaving(false);
    }
  }

  function toggleNumber(listName: "allowedDepartmentIds" | "allowedYears" | "inchargeFacultyIds", value: number) {
    setForm((current) => {
      const list = current[listName];
      return { ...current, [listName]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] };
    });
  }

  function toggleText(listName: "allowedTechnicalAreas", value: string) {
    setForm((current) => {
      const list = current[listName];
      return { ...current, [listName]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] };
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <Card>
        <h2 className="text-base font-bold text-kec-text">Basic Details</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Select label="Category" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
            <option value="">Select category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </Select>
          <Select label="Event Type" value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value as FormState["eventType"] })}>
            <option value="INDIVIDUAL">Individual</option>
            <option value="TEAM">Team</option>
          </Select>
          <Input label="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-kec-text">Description</span>
          <textarea className="mt-2 min-h-28 w-full rounded-lg border border-kec-border px-3 py-2 text-sm outline-none focus:border-kec-purple focus:ring-4 focus:ring-kec-purple/15" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
      </Card>

      <Card>
        <h2 className="text-base font-bold text-kec-text">Date & Registration</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input label="Start Date Time" type="datetime-local" value={form.startDatetime} onChange={(e) => setForm({ ...form, startDatetime: e.target.value })} />
          <Input label="End Date Time" type="datetime-local" value={form.endDatetime} onChange={(e) => setForm({ ...form, endDatetime: e.target.value })} />
          <Input label="Registration Start" type="datetime-local" value={form.registrationStart} onChange={(e) => setForm({ ...form, registrationStart: e.target.value })} />
          <Input label="Registration End" type="datetime-local" value={form.registrationEnd} onChange={(e) => setForm({ ...form, registrationEnd: e.target.value })} />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"].map((status) => <option key={status}>{status}</option>)}
          </Select>
          <label className="flex items-end gap-2 pb-3 text-sm font-semibold text-kec-text">
            <input type="checkbox" checked={form.registrationOpen} onChange={(e) => setForm({ ...form, registrationOpen: e.target.checked })} />
            Registration open
          </label>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-bold text-kec-text">Team & Capacity</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Input label="Min Team Size" type="number" disabled={form.eventType !== "TEAM"} value={form.minTeamSize} onChange={(e) => setForm({ ...form, minTeamSize: e.target.value })} />
          <Input label="Max Team Size" type="number" disabled={form.eventType !== "TEAM"} value={form.maxTeamSize} onChange={(e) => setForm({ ...form, maxTeamSize: e.target.value })} />
          <Input label="Max Teams" type="number" disabled={form.eventType !== "TEAM"} value={form.maxTeams} onChange={(e) => setForm({ ...form, maxTeams: e.target.value })} />
          <Input label="Max Participants" type="number" value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })} />
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-bold text-kec-text">Restrictions</h2>
        <div className="mt-4 space-y-4">
          <Checklist title="Allowed Departments" items={departments.map((department) => ({ id: department.id, label: department.code }))} selected={form.allowedDepartmentIds} onToggle={(id) => toggleNumber("allowedDepartmentIds", id)} emptyLabel="No departments found." />
          <Checklist title="Allowed Years" items={[1, 2, 3, 4].map((year) => ({ id: year, label: `Year ${year}` }))} selected={form.allowedYears} onToggle={(id) => toggleNumber("allowedYears", id)} />
          <TextChecklist title="Allowed Technical Areas" items={["SOFTWARE", "HARDWARE"]} selected={form.allowedTechnicalAreas} onToggle={(value) => toggleText("allowedTechnicalAreas", value)} />
          <Input label="Allowed Sections" helperText="Comma separated, for example A,B,C. Leave empty for all sections." value={form.allowedSections} onChange={(e) => setForm({ ...form, allowedSections: e.target.value })} />
          <label className="flex items-center gap-2 text-sm font-semibold text-kec-text">
            <input type="checkbox" checked={form.placementWillingOnly} onChange={(e) => setForm({ ...form, placementWillingOnly: e.target.checked })} />
            Placement willing students only
          </label>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-bold text-kec-text">Event Incharges</h2>
        <div className="mt-4">
          <Checklist title="Faculty Incharges" items={faculty.map((member) => ({ id: member.id, label: `${member.name} (${member.email})` }))} selected={form.inchargeFacultyIds} onToggle={(id) => toggleNumber("inchargeFacultyIds", id)} emptyLabel="No faculty found." />
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/events")}>Cancel</Button>
        <Button type="submit" loading={saving}>{mode === "create" ? "Create Event" : "Update Event"}</Button>
      </div>
    </form>
  );
}

function Checklist({ title, items, selected, onToggle, emptyLabel = "No items found." }: { title: string; items: { id: number; label: string }[]; selected: number[]; onToggle: (id: number) => void; emptyLabel?: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-kec-text">{title}</p>
      <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {items.length ? items.map((item) => (
          <label key={item.id} className="flex items-center gap-2 rounded-lg border border-kec-border px-3 py-2 text-sm text-kec-text">
            <input type="checkbox" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} />
            {item.label}
          </label>
        )) : <p className="text-sm text-kec-muted">{emptyLabel}</p>}
      </div>
    </div>
  );
}

function TextChecklist({ title, items, selected, onToggle }: { title: string; items: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div>
      <p className="text-sm font-semibold text-kec-text">{title}</p>
      <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <label key={item} className="flex items-center gap-2 rounded-lg border border-kec-border px-3 py-2 text-sm text-kec-text">
            <input type="checkbox" checked={selected.includes(item)} onChange={() => onToggle(item)} />
            {item}
          </label>
        ))}
      </div>
    </div>
  );
}

function toPayload(form: FormState): EventPayload {
  return {
    title: form.title,
    description: form.description,
    categoryId: Number(form.categoryId),
    eventType: form.eventType,
    venue: form.venue,
    startDatetime: toIso(form.startDatetime),
    endDatetime: toIso(form.endDatetime),
    registrationOpen: form.registrationOpen,
    registrationStart: toIso(form.registrationStart),
    registrationEnd: toIso(form.registrationEnd),
    minTeamSize: form.eventType === "TEAM" ? toNumber(form.minTeamSize) : null,
    maxTeamSize: form.eventType === "TEAM" ? toNumber(form.maxTeamSize) : null,
    maxParticipants: toNumber(form.maxParticipants),
    maxTeams: form.eventType === "TEAM" ? toNumber(form.maxTeams) : null,
    placementWillingOnly: form.placementWillingOnly,
    status: form.status,
    allowedDepartmentIds: form.allowedDepartmentIds,
    allowedYears: form.allowedYears,
    allowedSections: form.allowedSections.split(",").map((section) => section.trim()).filter(Boolean),
    allowedTechnicalAreas: form.allowedTechnicalAreas,
    inchargeFacultyIds: form.inchargeFacultyIds
  };
}

function fromEvent(event: EventDetail): FormState {
  return {
    title: event.title,
    description: event.description ?? "",
    categoryId: String(event.category?.id ?? ""),
    eventType: event.eventType,
    venue: event.venue ?? "",
    startDatetime: toInputDate(event.startDatetime),
    endDatetime: toInputDate(event.endDatetime),
    registrationStart: toInputDate(event.registrationStart),
    registrationEnd: toInputDate(event.registrationEnd),
    registrationOpen: event.registrationOpen,
    status: event.status,
    minTeamSize: event.minTeamSize ? String(event.minTeamSize) : "",
    maxTeamSize: event.maxTeamSize ? String(event.maxTeamSize) : "",
    maxParticipants: event.maxParticipants ? String(event.maxParticipants) : "",
    maxTeams: event.maxTeams ? String(event.maxTeams) : "",
    placementWillingOnly: event.placementWillingOnly,
    allowedDepartmentIds: event.allowedDepartments.map((item) => item.id),
    allowedYears: event.allowedYears,
    allowedSections: event.allowedSections.join(", "),
    allowedTechnicalAreas: event.allowedTechnicalAreas,
    inchargeFacultyIds: event.incharges.map((item) => item.id)
  };
}

function toNumber(value: string) {
  return value ? Number(value) : null;
}

function toIso(value: string) {
  return value ? value : null;
}

function toInputDate(value: string | null) {
  return value ? value.slice(0, 16) : "";
}
