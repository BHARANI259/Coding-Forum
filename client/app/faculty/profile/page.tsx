"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import BackButton from "@/components/ui/BackButton";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import RoleBadge from "@/components/ui/RoleBadge";
import StatCard from "@/components/ui/StatCard";
import { changePassword, getFacultyDepartmentSummary, getFacultyEvents, getFacultyProfile, updateFacultyProfile, type EventItem, type FacultyDepartmentSummary, type FacultyProfile } from "@/lib/api";
import { getCurrentUser, updateStoredUser } from "@/lib/auth";

export default function FacultyProfilePage() {
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [form, setForm] = useState({ name: "", email: "", contactNumber: "" });
  const [events, setEvents] = useState<EventItem[]>([]);
  const [summary, setSummary] = useState<FacultyDepartmentSummary | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [profileData, assignedEvents] = await Promise.all([
          getFacultyProfile(),
          getFacultyEvents()
        ]);
        setProfile(profileData);
        setForm({ name: profileData.name, email: profileData.email, contactNumber: profileData.contactNumber ?? "" });
        setEvents(assignedEvents);
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load assigned events.");
      }

      try {
        setSummary(await getFacultyDepartmentSummary());
      } catch {
        setSummary(null);
      }
    }
    void load();
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const updated = await updateFacultyProfile(form);
      setProfile(updated);
      setForm({ name: updated.name, email: updated.email, contactNumber: updated.contactNumber ?? "" });
      const user = getCurrentUser();
      if (user) {
        updateStoredUser({ ...user, name: updated.name, email: updated.email });
      }
      setSuccess("Profile updated successfully.");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess("Password changed successfully.");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to change password.");
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <AppShell expectedRole="FACULTY" title="Profile">
      <PageHeader title="Profile" subtitle="Faculty portal account and assigned-event overview." actions={<BackButton fallbackHref="/faculty/dashboard" />} />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p> : null}
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <Card>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-kec-purple text-lg font-bold text-white">
            {profile?.name.charAt(0).toUpperCase() ?? "F"}
          </div>
          <div className="mt-4">
            <RoleBadge role="FACULTY" />
            <h2 className="mt-3 text-lg font-bold text-kec-text">{profile?.name ?? "Faculty"}</h2>
            <form className="mt-4 space-y-3" onSubmit={handleSave}>
              <Input label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              <Input label="Kongu Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
              <Input label="Contact Number" value={form.contactNumber} onChange={(event) => setForm({ ...form, contactNumber: event.target.value })} helperText="Shown to students on assigned event cards." />
              <Input label="Faculty Code" value={profile?.facultyCode ?? "-"} disabled />
              <Input label="Department" value={profile?.department ? `${profile.department.code} - ${profile.department.name}` : "-"} disabled />
              <p className="text-sm text-kec-secondary">
                Department monitoring: {profile?.deptMonitoringEnabled ? "Enabled" : "Not enabled"}
              </p>
              <Button type="submit" loading={saving}>Save Profile</Button>
            </form>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Assigned Events" value={events.length} hint="Events managed" />
          <StatCard label="Open Registrations" value={events.filter((event) => event.registrationOpen).length} hint="Currently open" />
          <StatCard label="Department Points" value={summary?.departmentTotalPoints ?? "-"} hint={summary?.departmentCode ?? "Monitoring not enabled"} />
        </div>
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-bold text-kec-text">Change Password</h2>
        <form className="mt-4 grid gap-4 sm:grid-cols-3" onSubmit={handlePasswordChange}>
          <Input label="Current Password" type="password" autoComplete="current-password" value={passwordForm.oldPassword} onChange={(event) => setPasswordForm({ ...passwordForm, oldPassword: event.target.value })} required />
          <Input label="New Password" type="password" autoComplete="new-password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} required />
          <Input label="Confirm Password" type="password" autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} required />
          <div className="sm:col-span-3">
            <Button type="submit" loading={passwordSaving}>Change Password</Button>
          </div>
        </form>
      </Card>

      <section className="mt-6 space-y-3">
        <h2 className="text-lg font-bold text-kec-text">Assigned Events</h2>
        <DataTable
          headers={["Event", "Category", "Type", "Status", "Registration", "Action"]}
          rows={events.map((event) => [
            event.title,
            event.category?.name ?? "-",
            event.eventType,
            event.status,
            event.registrationOpen ? "Open" : "Closed",
            <Link key="view" href={`/faculty/events/${event.id}`}><Button type="button" variant="secondary">View</Button></Link>
          ])}
          emptyMessage="No assigned events found."
        />
      </section>
    </AppShell>
  );
}
