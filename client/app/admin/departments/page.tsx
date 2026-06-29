"use client";

import { FormEvent, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import BackButton from "@/components/ui/BackButton";
import { createDepartment, getDepartments, type Department } from "@/lib/api";

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadDepartments();
  }, []);

  async function loadDepartments() {
    setLoading(true);
    setError("");
    try {
      setDepartments(await getDepartments());
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load departments.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const created = await createDepartment({ code, name });
      setMessage(`${created.code} department created.`);
      setCode("");
      setName("");
      await loadDepartments();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to create department.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell expectedRole="SUPER_ADMIN" title="Departments">
      <PageHeader title="Departments" subtitle="Create and view active departments used for student and faculty profiles." actions={<BackButton fallbackHref="/admin/dashboard" />} />

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card>
          <h2 className="text-base font-bold text-kec-text">Create Department</h2>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <Input label="Department Code" value={code} onChange={(event) => setCode(event.target.value)} required />
            <Input label="Department Name" value={name} onChange={(event) => setName(event.target.value)} required />
            {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            {message ? <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p> : null}
            <Button type="submit" loading={saving}>Create Department</Button>
          </form>
        </Card>

        <div>
          {loading ? (
            <Card>Loading departments...</Card>
          ) : (
            <DataTable
              headers={["Code", "Name", "Status"]}
              rows={departments.map((department) => [
                department.code,
                department.name,
                department.active ? "Active" : "Inactive"
              ])}
              emptyMessage="No departments found."
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
