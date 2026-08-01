"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import BackButton from "@/components/ui/BackButton";
import { createEventCategory, getEventCategories, updateEventCategory, updateEventCategoryStatus, type EventCategory } from "@/lib/api";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [editing, setEditing] = useState<EventCategory | null>(null);
  const [form, setForm] = useState({
    name: "",
    weightage: "1",
    categoryType: "GENERAL" as EventCategory["categoryType"],
    winnerPoints: "100",
    runnerUpPoints: "60",
    secondRunnerUpPoints: "40",
    participantPoints: "10",
    disqualifiedPoints: "0",
    notPresentedPoints: "0",
    active: true
  });
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCategories(await getEventCategories({ search }));
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load categories.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        weightage: Number(form.weightage || "1"),
        categoryType: form.categoryType,
        winnerPoints: Number(form.winnerPoints || "0"),
        runnerUpPoints: Number(form.runnerUpPoints || "0"),
        secondRunnerUpPoints: Number(form.secondRunnerUpPoints || "0"),
        participantPoints: Number(form.participantPoints || "0"),
        disqualifiedPoints: Number(form.disqualifiedPoints || "0"),
        notPresentedPoints: Number(form.notPresentedPoints || "0"),
        active: form.active
      };
      if (editing) {
        await updateEventCategory(editing.id, payload);
      } else {
        await createEventCategory(payload);
      }
      setEditing(null);
      setForm(defaultForm());
      await loadCategories();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to save category.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(category: EventCategory) {
    setEditing(category);
    setForm({
      name: category.name,
      weightage: String(category.weightage ?? 1),
      categoryType: category.categoryType ?? "GENERAL",
      winnerPoints: String(category.winnerPoints ?? 100),
      runnerUpPoints: String(category.runnerUpPoints ?? 60),
      secondRunnerUpPoints: String(category.secondRunnerUpPoints ?? 40),
      participantPoints: String(category.participantPoints ?? 10),
      disqualifiedPoints: String(category.disqualifiedPoints ?? 0),
      notPresentedPoints: String(category.notPresentedPoints ?? 0),
      active: category.active
    });
  }

  async function toggleStatus(category: EventCategory) {
    await updateEventCategoryStatus(category.id, !category.active);
    await loadCategories();
  }

  return (
    <AppShell expectedRole="SUPER_ADMIN" title="Event Categories">
      <PageHeader title="Event Categories" subtitle="Manage event workflows and result points for each category." actions={<BackButton fallbackHref="/admin/dashboard" />} />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card>
          <h2 className="text-base font-bold text-kec-text">{editing ? "Edit Category" : "Create Category"}</h2>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <Input label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <Select label="Category Workflow" value={form.categoryType} onChange={(event) => setForm({ ...form, categoryType: event.target.value as EventCategory["categoryType"] })}>
              <option value="GENERAL">General event</option>
              <option value="CONTEST">Contest / Placement drill</option>
              <option value="DOMAIN">Paper / Project domain</option>
            </Select>
            <div className="rounded-xl border border-kec-border bg-kec-bg p-3">
              <p className="text-sm font-bold text-kec-text">Result Points</p>
              <p className="mt-1 text-xs text-kec-secondary">These values are used directly when final results are published.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Input label="Winner" type="number" min="0" value={form.winnerPoints} onChange={(event) => setForm({ ...form, winnerPoints: event.target.value })} required />
                <Input label="Runner-up" type="number" min="0" value={form.runnerUpPoints} onChange={(event) => setForm({ ...form, runnerUpPoints: event.target.value })} required />
                <Input label="Second runner-up" type="number" min="0" value={form.secondRunnerUpPoints} onChange={(event) => setForm({ ...form, secondRunnerUpPoints: event.target.value })} required />
                <Input label="Participant" type="number" min="0" value={form.participantPoints} onChange={(event) => setForm({ ...form, participantPoints: event.target.value })} required />
                <Input label="Disqualified" type="number" min="0" value={form.disqualifiedPoints} onChange={(event) => setForm({ ...form, disqualifiedPoints: event.target.value })} required />
                <Input label="Not presented" type="number" min="0" value={form.notPresentedPoints} onChange={(event) => setForm({ ...form, notPresentedPoints: event.target.value })} required />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-kec-text">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
              Active
            </label>
            <div className="flex gap-2">
              <Button type="submit" loading={saving}>{editing ? "Update" : "Create"}</Button>
              {editing ? <Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm(defaultForm()); }}>Cancel</Button> : null}
            </div>
          </form>
        </Card>
        <div className="space-y-4">
          <Card>
            <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
          </Card>
          {loading ? <Card>Loading categories...</Card> : (
            <DataTable
              headers={["Name", "Workflow", "Points", "Status", "Actions"]}
              rows={categories.map((category) => [
                category.name,
                formatWorkflow(category.categoryType),
                `W ${category.winnerPoints} / R ${category.runnerUpPoints} / SR ${category.secondRunnerUpPoints} / P ${category.participantPoints}`,
                <Badge key="status" variant={category.active ? "success" : "warning"}>{category.active ? "Active" : "Inactive"}</Badge>,
                <div key="actions" className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => startEdit(category)}>Edit</Button>
                  <Button type="button" variant={category.active ? "danger" : "secondary"} onClick={() => void toggleStatus(category)}>{category.active ? "Deactivate" : "Activate"}</Button>
                </div>
              ])}
              emptyMessage="No categories found."
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}

function defaultForm() {
  return {
    name: "",
    weightage: "1",
    categoryType: "GENERAL" as EventCategory["categoryType"],
    winnerPoints: "100",
    runnerUpPoints: "60",
    secondRunnerUpPoints: "40",
    participantPoints: "10",
    disqualifiedPoints: "0",
    notPresentedPoints: "0",
    active: true
  };
}

function formatWorkflow(value: string) {
  if (value === "CONTEST") return "Contest / Placement drill";
  if (value === "DOMAIN") return "Paper / Project domain";
  return "General event";
}
