"use client";

import { FormEvent, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import BackButton from "@/components/ui/BackButton";
import { getCurrentUser } from "@/lib/auth";
import { getMyTeams, joinTeamByCode, leaveTeam, registerTeam, type TeamDetail } from "@/lib/api";

export default function StudentTeamsPage() {
  const [teams, setTeams] = useState<TeamDetail[]>([]);
  const [teamCode, setTeamCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const currentStudentId = getCurrentUser()?.studentId;

  useEffect(() => {
    void loadTeams();
  }, []);

  async function loadTeams() {
    setLoading(true);
    try {
      setTeams(await getMyTeams());
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load teams.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const team = await joinTeamByCode(teamCode);
      setSuccess(`Joined ${team.teamName}.`);
      setTeamCode("");
      await loadTeams();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to join team.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegister(teamId: number) {
    setError("");
    setSuccess("");
    try {
      await registerTeam(teamId);
      setSuccess("Team registration completed.");
      await loadTeams();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to register team.");
    }
  }

  async function handleLeave(teamId: number) {
    setError("");
    setSuccess("");
    try {
      await leaveTeam(teamId);
      setSuccess("Left team.");
      await loadTeams();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to leave team.");
    }
  }

  return (
    <AppShell expectedRole="STUDENT" title="My Teams">
      <PageHeader title="My Teams" subtitle="Join teams by code and register teams when you are the leader." actions={<BackButton fallbackHref="/student/dashboard" />} />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p> : null}
      <Card className="mb-5">
        <h2 className="text-base font-bold text-kec-text">Join Team</h2>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleJoin}>
          <Input label="Team Code" value={teamCode} onChange={(event) => setTeamCode(event.target.value)} required />
          <Button type="submit" loading={saving}>Join Team</Button>
        </form>
      </Card>
      {loading ? <Card>Loading teams...</Card> : (
        <DataTable
          headers={["Event", "Team", "Code", "Problem", "Members", "Status", "Actions"]}
          rows={teams.map((team) => {
            const leader = currentStudentId === team.leaderStudentId;
            const minTeamSize = team.event.minTeamSize ?? 1;
            const minimumMet = team.members.length >= minTeamSize;
            return [
              team.event.title,
              team.teamName,
              team.teamCode,
              team.problemStatementTitle ?? "-",
              team.members.map((member) => member.leader ? `${member.name} (Leader)` : member.name).join(", "),
              <Badge key="status" variant={team.lockedAfterRegistration ? "success" : "warning"}>{team.lockedAfterRegistration ? "Registered" : "Open"}</Badge>,
              <div key="actions" className="flex flex-wrap gap-2">
                {leader && !team.lockedAfterRegistration ? (
                  <Button type="button" disabled={!minimumMet} onClick={() => void handleRegister(team.id)}>
                    {minimumMet ? "Register Team" : `Need ${minTeamSize} members`}
                  </Button>
                ) : null}
                {!team.lockedAfterRegistration ? <Button type="button" variant="secondary" onClick={() => void handleLeave(team.id)}>Leave</Button> : null}
              </div>
            ];
          })}
          emptyMessage="No teams found."
        />
      )}
    </AppShell>
  );
}
