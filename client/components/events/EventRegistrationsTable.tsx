import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import type { EventRegistration } from "@/lib/api";
import { formatDateTime } from "@/lib/dateFormat";

type EventRegistrationsTableProps = {
  registrations: EventRegistration[];
};

export default function EventRegistrationsTable({ registrations }: EventRegistrationsTableProps) {
  return (
    <DataTable
      headers={["Student", "Register No", "Department", "Team", "Problem", "Type", "Status", "Registered At"]}
      rows={registrations.map((registration) => [
        registration.studentName,
        registration.registerNumber,
        registration.departmentCode ?? "-",
        registration.teamName ? `${registration.teamName} (${registration.teamCode})` : "-",
        registration.problemStatementTitle ?? "-",
        registration.registrationType === "TEAM" ? "Team" : "Individual",
        <Badge key="status" variant={registration.status === "REGISTERED" ? "success" : "warning"}>{humanize(registration.status)}</Badge>,
        formatDateTime(registration.registeredAt)
      ])}
      emptyMessage="No registrations found."
    />
  );
}

function humanize(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
