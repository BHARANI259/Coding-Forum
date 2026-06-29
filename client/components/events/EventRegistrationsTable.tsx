import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import type { EventRegistration } from "@/lib/api";

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
        registration.registrationType,
        <Badge key="status" variant={registration.status === "REGISTERED" ? "success" : "warning"}>{registration.status}</Badge>,
        new Date(registration.registeredAt).toLocaleString()
      ])}
      emptyMessage="No registrations found."
    />
  );
}
