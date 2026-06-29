"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import BackButton from "@/components/ui/BackButton";
import {
  createFaculty,
  getDepartments,
  getFaculty,
  importFaculty,
  type Department,
  type Faculty,
  type FacultyImportResult
} from "@/lib/api";

const emptyFacultyForm = {
  facultyCode: "",
  name: "",
  email: "",
  departmentId: "",
  deptMonitoringEnabled: false
};

export default function AdminFacultyPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    departmentId: "",
    deptMonitoringEnabled: ""
  });
  const [form, setForm] = useState(emptyFacultyForm);
  const [file, setFile] = useState<File | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [importResult, setImportResult] = useState<FacultyImportResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const loadFaculty = useCallback(async () => {
    try {
      const page = await getFaculty({
        page: 0,
        size: 20,
        search: filters.search,
        departmentId: filters.departmentId,
        deptMonitoringEnabled: filters.deptMonitoringEnabled
      });
      setFaculty(page.content);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load faculty.");
    }
  }, [filters]);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setDepartments(await getDepartments());
      const page = await getFaculty({ page: 0, size: 20 });
      setFaculty(page.content);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load faculty.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    void loadFaculty();
  }, [loadFaculty]);

  function updateForm(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = event.target;
    const checked = type === "checkbox" ? (event.target as HTMLInputElement).checked : false;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setTemporaryPassword("");
    try {
      const created = await createFaculty({
        facultyCode: form.facultyCode,
        name: form.name,
        email: form.email,
        departmentId: Number(form.departmentId),
        deptMonitoringEnabled: form.deptMonitoringEnabled
      });
      setTemporaryPassword(created.temporaryPassword);
      setForm(emptyFacultyForm);
      await loadFaculty();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to create faculty.");
    } finally {
      setSaving(false);
    }
  }

  async function handleImport() {
    if (!file) {
      setError("Choose a CSV or XLSX file first.");
      return;
    }
    setImporting(true);
    setError("");
    setImportResult(null);
    try {
      const result = await importFaculty(file);
      setImportResult(result);
      setFile(null);
      await loadFaculty();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to import faculty.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <AppShell expectedRole="SUPER_ADMIN" title="Faculty">
      <PageHeader title="Faculty" subtitle="Create faculty profiles, linked login accounts, and department monitoring access." actions={<BackButton fallbackHref="/admin/dashboard" />} />

      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <div className="space-y-5">
          <Card>
            <h2 className="text-base font-bold text-kec-text">Add Faculty</h2>
            <form className="mt-4 space-y-4" onSubmit={handleCreate}>
              <Input label="Faculty Code" name="facultyCode" value={form.facultyCode} onChange={updateForm} helperText="Used as temporary password when provided." />
              <Input label="Name" name="name" value={form.name} onChange={updateForm} required />
              <Input label="Kongu Email" name="email" type="email" value={form.email} onChange={updateForm} required />
              <Select label="Department" name="departmentId" value={form.departmentId} onChange={updateForm} required>
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>{department.code}</option>
                ))}
              </Select>
              <label className="flex items-center gap-2 text-sm font-semibold text-kec-text">
                <input type="checkbox" name="deptMonitoringEnabled" checked={form.deptMonitoringEnabled} onChange={updateForm} />
                Department monitoring enabled
              </label>
              {temporaryPassword ? (
                <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  Faculty created. Temporary password: <strong>{temporaryPassword}</strong>
                </p>
              ) : null}
              <Button type="submit" loading={saving}>Create Faculty</Button>
            </form>
          </Card>

          <Card>
            <h2 className="text-base font-bold text-kec-text">Import Faculty</h2>
            <p className="mt-2 text-sm text-kec-secondary">
              Required columns: facultyCode, name, email, departmentCode, deptMonitoringEnabled
            </p>
            <input
              className="mt-4 block w-full text-sm text-kec-secondary file:mr-4 file:rounded-lg file:border-0 file:bg-kec-purple file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              type="file"
              accept=".csv,.xlsx"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <Button type="button" className="mt-4" loading={importing} onClick={handleImport}>Import Faculty</Button>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <h2 className="text-base font-bold text-kec-text">Filters</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Input label="Search" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
              <Select label="Department" value={filters.departmentId} onChange={(event) => setFilters({ ...filters, departmentId: event.target.value })}>
                <option value="">All</option>
                {departments.map((department) => <option key={department.id} value={department.id}>{department.code}</option>)}
              </Select>
              <Select label="Department Monitoring" value={filters.deptMonitoringEnabled} onChange={(event) => setFilters({ ...filters, deptMonitoringEnabled: event.target.value })}>
                <option value="">All</option>
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </Select>
            </div>
          </Card>

          {loading ? (
            <Card>Loading faculty...</Card>
          ) : (
            <DataTable
              headers={["Code", "Name", "Email", "Department", "Monitoring", "User ID"]}
              rows={faculty.map((member) => [
                member.facultyCode ?? "-",
                member.name,
                member.email,
                member.department?.code ?? "-",
                member.deptMonitoringEnabled ? "Enabled" : "Disabled",
                member.linkedUserId ?? "-"
              ])}
              emptyMessage="No faculty found."
            />
          )}

          {importResult ? (
            <Card>
              <h2 className="text-base font-bold text-kec-text">Import Summary</h2>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                <p>Total rows: <strong>{importResult.totalRows}</strong></p>
                <p>Created: <strong>{importResult.successCount}</strong></p>
                <p>Failed: <strong>{importResult.failedCount}</strong></p>
              </div>
              <div className="mt-4 space-y-4">
                <DataTable
                  headers={["Faculty Code", "Email", "Temporary Password"]}
                  rows={importResult.created.map((item) => [item.facultyCode ?? "-", item.email, item.temporaryPassword])}
                  emptyMessage="No faculty created."
                />
                <DataTable
                  headers={["Row", "Error"]}
                  rows={importResult.errors.map((item) => [item.rowNumber, item.message])}
                  emptyMessage="No row errors."
                />
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
