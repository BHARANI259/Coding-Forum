"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import BackButton from "@/components/ui/BackButton";
import { createEventCategory, getEventCategories, updateEventCategory, updateEventCategoryStatus, type EventCategory } from "@/lib/api";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [editing, setEditing] = useState<EventCategory | null>(null);
  const [form, setForm] = useState({ name: "", weightage: "1", active: true });
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
      const payload = { name: form.name, weightage: Number(form.weightage), active: form.active };
      if (editing) {
        await updateEventCategory(editing.id, payload);
      } else {
        await createEventCategory(payload);
      }
      setEditing(null);
      setForm({ name: "", weightage: "1", active: true });
      await loadCategories();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to save category.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(category: EventCategory) {
    setEditing(category);
    setForm({ name: category.name, weightage: String(category.weightage), active: category.active });
  }

  async function toggleStatus(category: EventCategory) {
    await updateEventCategoryStatus(category.id, !category.active);
    await loadCategories();
  }

  return (
    <AppShell expectedRole="SUPER_ADMIN" title="Event Categories">
      <PageHeader title="Event Categories" subtitle="Manage scoring categories and category weightage for future event workflows." actions={<BackButton fallbackHref="/admin/dashboard" />} />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card>
          <h2 className="text-base font-bold text-kec-text">{editing ? "Edit Category" : "Create Category"}</h2>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <Input label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <Input label="Weightage" type="number" step="0.01" min="0.01" value={form.weightage} onChange={(event) => setForm({ ...form, weightage: event.target.value })} required />
            <label className="flex items-center gap-2 text-sm font-semibold text-kec-text">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
              Active
            </label>
            <div className="flex gap-2">
              <Button type="submit" loading={saving}>{editing ? "Update" : "Create"}</Button>
              {editing ? <Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm({ name: "", weightage: "1", active: true }); }}>Cancel</Button> : null}
            </div>
          </form>
        </Card>
        <div className="space-y-4">
          <Card>
            <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
          </Card>
          {loading ? <Card>Loading categories...</Card> : (
            <DataTable
              headers={["Name", "Weightage", "Status", "Actions"]}
              rows={categories.map((category) => [
                category.name,
                category.weightage,
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
