"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import BackButton from "@/components/ui/BackButton";
import { getMyRegistrations, type MyRegistration } from "@/lib/api";

export default function StudentRegistrationsPage() {
  const [registrations, setRegistrations] = useState<MyRegistration[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadRegistrations();
  }, []);

  async function loadRegistrations() {
    setLoading(true);
    try {
      setRegistrations(await getMyRegistrations());
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load registrations.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell expectedRole="STUDENT" title="My Registrations">
      <PageHeader title="My Registrations" subtitle="Auto-approved registrations for individual and team events." actions={<BackButton fallbackHref="/student/dashboard" />} />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <Card>Loading registrations...</Card> : (
        <DataTable
          headers={["Event", "Category", "Type", "Team", "Problem", "Status", "Registered At"]}
          rows={registrations.map((registration) => [
            registration.eventTitle,
            registration.categoryName ?? "-",
            registration.eventType,
            registration.teamName ?? "-",
            registration.problemStatementTitle ?? "-",
            <Badge key="status" variant={registration.status === "REGISTERED" ? "success" : "warning"}>{registration.status}</Badge>,
            new Date(registration.registeredAt).toLocaleString()
          ])}
          emptyMessage="No registrations found."
        />
      )}
    </AppShell>
  );
}
