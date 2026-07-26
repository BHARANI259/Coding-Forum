"use client";

import { FormEvent, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import Select from "@/components/ui/Select";
import StatCard from "@/components/ui/StatCard";
import BackButton from "@/components/ui/BackButton";
import {
  getMyPointHistory,
  getMyStatistics,
  getStudentProfile,
  changePassword,
  updateStudentProfile,
  type StudentPointHistory,
  type StudentProfile,
  type StudentStatistics
} from "@/lib/api";
import { getCurrentUser, updateStoredUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/dateFormat";

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [form, setForm] = useState({ name: "", email: "", contactNumber: "", section: "", technicalArea: "SOFTWARE" as "SOFTWARE" | "HARDWARE", placementWilling: false });
  const [stats, setStats] = useState<StudentStatistics | null>(null);
  const [history, setHistory] = useState<StudentPointHistory[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "security" | "statistics">("personal");
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const profileData = await getStudentProfile();
        setProfile(profileData);
        setForm({
          name: profileData.name,
          email: profileData.email,
          contactNumber: profileData.contactNumber ?? "",
          section: profileData.section ?? "",
          technicalArea: profileData.technicalArea,
          placementWilling: profileData.placementWilling
        });
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load profile statistics.");
      }
    }
    void load();
  }, []);

  useEffect(() => {
    if (activeTab !== "statistics" || stats) return;
    setStatsLoading(true);
    Promise.all([getMyStatistics(), getMyPointHistory({ size: 10 })])
      .then(([statistics, pointHistory]) => {
        setStats(statistics);
        setHistory(pointHistory.content);
      })
      .catch((exception) => setError(exception instanceof Error ? exception.message : "Unable to load profile statistics."))
      .finally(() => setStatsLoading(false));
  }, [activeTab, stats]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const updated = await updateStudentProfile(form);
      setProfile(updated);
      setForm({
        name: updated.name,
        email: updated.email,
        contactNumber: updated.contactNumber ?? "",
        section: updated.section ?? "",
        technicalArea: updated.technicalArea,
        placementWilling: updated.placementWilling
      });
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
    <AppShell expectedRole="STUDENT" title="Profile">
      <PageHeader
        title="Profile"
        subtitle={profile ? `${profile.name} (${profile.registerNumber})` : "Your coding forum statistics."}
        actions={<BackButton fallbackHref="/student/dashboard" />}
      />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p> : null}
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Profile sections">
        <Button type="button" variant={activeTab === "personal" ? "primary" : "secondary"} onClick={() => setActiveTab("personal")}>Personal Info</Button>
        <Button type="button" variant={activeTab === "security" ? "primary" : "secondary"} onClick={() => setActiveTab("security")}>Security</Button>
        <Button type="button" variant={activeTab === "statistics" ? "primary" : "secondary"} onClick={() => setActiveTab("statistics")}>Statistics</Button>
      </div>
      {activeTab === "personal" ? <Card className="mb-6">
        <h2 className="text-lg font-bold text-kec-text">Personal Information</h2>
        <form className="mt-4 space-y-4" onSubmit={handleSave}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Input label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <Input label="Kongu Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            <Input label="Contact Number" value={form.contactNumber} onChange={(event) => setForm({ ...form, contactNumber: event.target.value })} helperText="Used by faculty/admin for event coordination." />
            <Input label="Register Number" value={profile?.registerNumber ?? ""} disabled />
            <Input label="Department" value={profile?.department ? `${profile.department.code} - ${profile.department.name}` : "-"} disabled />
            <Input label="Year (Auto)" value={profile?.year ?? ""} disabled helperText="Calculated from register number and academic year." />
            <Input label="Section" value={form.section} onChange={(event) => setForm({ ...form, section: event.target.value })} />
            <Select label="Technical Area" value={form.technicalArea} onChange={(event) => setForm({ ...form, technicalArea: event.target.value as "SOFTWARE" | "HARDWARE" })}>
              <option value="SOFTWARE">Software</option>
              <option value="HARDWARE">Hardware</option>
            </Select>
            <label className="flex items-end gap-2 pb-3 text-sm font-semibold text-kec-text">
              <input type="checkbox" checked={form.placementWilling} onChange={(event) => setForm({ ...form, placementWilling: event.target.checked })} />
              Placement willing
            </label>
          </div>
          <Button type="submit" loading={saving}>Save Profile</Button>
        </form>
      </Card> : null}
      {activeTab === "security" ? <Card className="mb-6">
        <h2 className="text-lg font-bold text-kec-text">Change Password</h2>
        <form className="mt-4 grid gap-4 sm:grid-cols-3" onSubmit={handlePasswordChange}>
          <Input label="Current Password" type="password" autoComplete="current-password" value={passwordForm.oldPassword} onChange={(event) => setPasswordForm({ ...passwordForm, oldPassword: event.target.value })} required />
          <Input label="New Password" type="password" autoComplete="new-password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} required />
          <Input label="Confirm Password" type="password" autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} required />
          <div className="sm:col-span-3">
            <Button type="submit" loading={passwordSaving}>Change Password</Button>
          </div>
        </form>
      </Card> : null}
      {activeTab === "statistics" ? statsLoading ? <Card>Loading statistics...</Card> : <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Points" value={stats?.totalPoints ?? 0} hint={stats?.departmentCode ?? "Department"} />
        <StatCard label="Events Registered" value={stats?.totalEventsRegistered ?? 0} hint="Registration count" />
        <StatCard label="Results Declared" value={stats?.totalResultsDeclared ?? 0} hint="Result tags" />
        <StatCard label="Wins" value={stats?.winsCount ?? 0} hint="Winner tags" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-kec-text">Category Points</h2>
          <DataTable
            headers={["Category", "Points", "Events"]}
            rows={(stats?.categoryWisePoints ?? []).map((category) => [
              category.categoryName,
              category.totalPoints,
              category.eventsParticipated
            ])}
            emptyMessage="No category points yet."
          />
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-kec-text">Point History</h2>
          <DataTable
            headers={["Event", "Category", "Type", "Points", "Date"]}
            rows={history.map((item) => [
              item.eventTitle,
              item.categoryName,
              item.pointType,
              item.points,
              formatDateTime(item.createdAt)
            ])}
            emptyMessage="No point history yet."
          />
        </section>
      </div></> : null}
    </AppShell>
  );
}
