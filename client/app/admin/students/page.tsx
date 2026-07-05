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
  createStudent,
  getDepartments,
  getStudents,
  importStudents,
  type Department,
  type Student,
  type StudentImportResult
} from "@/lib/api";

const emptyStudentForm = {
  registerNumber: "",
  name: "",
  email: "",
  departmentId: "",
  year: "1",
  section: "",
  technicalArea: "SOFTWARE" as "SOFTWARE" | "HARDWARE",
  placementWilling: false
};

export default function AdminStudentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    departmentId: "",
    year: "",
    section: "",
    technicalArea: "",
    placementWilling: ""
  });
  const [form, setForm] = useState(emptyStudentForm);
  const [file, setFile] = useState<File | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [importResult, setImportResult] = useState<StudentImportResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const loadStudents = useCallback(async () => {
    try {
      const page = await getStudents({
        page: 0,
        size: 20,
        search: filters.search,
        departmentId: filters.departmentId,
        year: filters.year,
        section: filters.section,
        technicalArea: filters.technicalArea,
        placementWilling: filters.placementWilling
      });
      setStudents(page.content);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load students.");
    }
  }, [filters]);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const departmentList = await getDepartments();
      setDepartments(departmentList);
      const studentPage = await getStudents({ page: 0, size: 20 });
      setStudents(studentPage.content);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load students.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

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
      const created = await createStudent({
        registerNumber: form.registerNumber,
        name: form.name,
        email: form.email,
        departmentId: Number(form.departmentId),
        year: Number(form.year),
        section: form.section,
        technicalArea: form.technicalArea,
        placementWilling: form.placementWilling
      });
      setTemporaryPassword(created.temporaryPassword);
      setForm(emptyStudentForm);
      await loadStudents();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to create student.");
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
      const result = await importStudents(file);
      setImportResult(result);
      setFile(null);
      await loadStudents();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to import students.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <AppShell expectedRole="SUPER_ADMIN" title="Students">
      <PageHeader title="Students" subtitle="Create student profiles, linked login accounts, and import student batches." actions={<BackButton fallbackHref="/admin/dashboard" />} />

      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <div className="space-y-5">
          <Card>
            <h2 className="text-base font-bold text-kec-text">Add Student</h2>
            <form className="mt-4 space-y-4" onSubmit={handleCreate}>
              <Input label="Register Number" name="registerNumber" value={form.registerNumber} onChange={updateForm} required />
              <Input label="Name" name="name" value={form.name} onChange={updateForm} required />
              <Input label="Kongu Email" name="email" type="email" value={form.email} onChange={updateForm} required />
              <Select label="Department" name="departmentId" value={form.departmentId} onChange={updateForm} required>
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>{department.code}</option>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Year" name="year" value={form.year} onChange={updateForm}>
                  {[1, 2, 3, 4, 5].map((year) => <option key={year} value={year}>{year}</option>)}
                </Select>
                <Input label="Section" name="section" value={form.section} onChange={updateForm} />
              </div>
              <Select label="Technical Area" name="technicalArea" value={form.technicalArea} onChange={updateForm}>
                <option value="SOFTWARE">Software</option>
                <option value="HARDWARE">Hardware</option>
              </Select>
              <label className="flex items-center gap-2 text-sm font-semibold text-kec-text">
                <input type="checkbox" name="placementWilling" checked={form.placementWilling} onChange={updateForm} />
                Placement willing
              </label>
              {temporaryPassword ? (
                <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  Student created. Temporary password: <strong>{temporaryPassword}</strong>
                </p>
              ) : null}
              <Button type="submit" loading={saving}>Create Student</Button>
            </form>
          </Card>

          <Card>
            <h2 className="text-base font-bold text-kec-text">Import Students</h2>
            <p className="mt-2 text-sm text-kec-secondary">
              Required columns: registerNumber, name, email, departmentCode, year, section, placementWilling. Optional: technicalArea.
            </p>
            <input
              className="mt-4 block w-full text-sm text-kec-secondary file:mr-4 file:rounded-lg file:border-0 file:bg-kec-purple file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              type="file"
              accept=".csv,.xlsx"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <Button type="button" className="mt-4" loading={importing} onClick={handleImport}>Import Students</Button>
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
              <Select label="Year" value={filters.year} onChange={(event) => setFilters({ ...filters, year: event.target.value })}>
                <option value="">All</option>
                {[1, 2, 3, 4, 5].map((year) => <option key={year} value={year}>{year}</option>)}
              </Select>
              <Input label="Section" value={filters.section} onChange={(event) => setFilters({ ...filters, section: event.target.value })} />
              <Select label="Technical Area" value={filters.technicalArea} onChange={(event) => setFilters({ ...filters, technicalArea: event.target.value })}>
                <option value="">All</option>
                <option value="SOFTWARE">Software</option>
                <option value="HARDWARE">Hardware</option>
              </Select>
              <Select label="Placement Willing" value={filters.placementWilling} onChange={(event) => setFilters({ ...filters, placementWilling: event.target.value })}>
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
            </div>
          </Card>

          {loading ? (
            <Card>Loading students...</Card>
          ) : (
            <DataTable
              headers={["Register No", "Name", "Email", "Department", "Year", "Section", "Area", "Placement", "User ID"]}
              rows={students.map((student) => [
                student.registerNumber,
                student.name,
                student.email,
                student.department?.code ?? "-",
                student.year,
                student.section ?? "-",
                student.technicalArea,
                student.placementWilling ? "Yes" : "No",
                student.linkedUserId ?? "-"
              ])}
              emptyMessage="No students found."
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
                  headers={["Register No", "Email", "Temporary Password"]}
                  rows={importResult.created.map((item) => [item.registerNumber, item.email, item.temporaryPassword])}
                  emptyMessage="No students created."
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
