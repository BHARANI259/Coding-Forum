import DataTable from "@/components/ui/DataTable";
import type { DepartmentLeaderboardRow, StudentLeaderboardRow } from "@/lib/api";

export function StudentLeaderboardTable({ rows }: { rows: StudentLeaderboardRow[] }) {
  return (
    <DataTable
      headers={["Rank", "Student", "Department", "Points", "Events", "Wins", "Runner-ups"]}
      rows={rows.map((row) => [
        row.rank,
        `${row.studentName} (${row.registerNumber})`,
        row.departmentCode ?? "-",
        row.totalPoints,
        row.eventsParticipated,
        row.wins,
        row.runnerUps
      ])}
      emptyMessage="No leaderboard data found."
    />
  );
}

export function DepartmentLeaderboardTable({ rows }: { rows: DepartmentLeaderboardRow[] }) {
  const rankedRows = rows.filter((row) => row.totalPoints > 0 || row.totalParticipants > 0);
  return (
    <DataTable
      headers={["Rank", "Department", "Points", "Participants", "Wins"]}
      rows={rankedRows.map((row) => [
        row.rank,
        `${row.departmentCode} - ${row.departmentName}`,
        row.totalPoints,
        row.totalParticipants,
        row.wins
      ])}
      emptyMessage="No department has earned points or recorded participation yet."
    />
  );
}
