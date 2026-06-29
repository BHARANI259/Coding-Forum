import type { UserRole } from "@/lib/api";
import AppShell from "@/components/layout/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import BackButton from "@/components/ui/BackButton";

type PlaceholderModulePageProps = {
  role: UserRole;
  title: string;
  subtitle?: string;
};

export default function PlaceholderModulePage({ role, title, subtitle }: PlaceholderModulePageProps) {
  const dashboardPath = role === "STUDENT" ? "/student/dashboard" : role === "FACULTY" ? "/faculty/dashboard" : "/admin/dashboard";
  return (
    <AppShell expectedRole={role} title={title}>
      <PageHeader title={title} subtitle={subtitle} actions={<BackButton fallbackHref={dashboardPath} />} />
      <EmptyState title={title} description="This module will be implemented in a later block." />
    </AppShell>
  );
}
