"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import EventSummary from "@/components/events/EventSummary";
import ResultBadge from "@/components/events/ResultBadge";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DataTable from "@/components/ui/DataTable";
import BackButton from "@/components/ui/BackButton";
import {
  createTeam,
  getMyEventResult,
  getMyTeams,
  getStudentEvent,
  getStudentProblemStatements,
  getStudentRounds,
  joinTeamByCode,
  registerIndividual,
  registerTeam,
  type EventDetail,
  type EventRound,
  type ProblemStatement,
  type StudentResult,
  type TeamDetail
} from "@/lib/api";

export default function StudentEventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  const [myResult, setMyResult] = useState<StudentResult | null>(null);
  const [teams, setTeams] = useState<TeamDetail[]>([]);
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [eventData, roundData, problemData, teamData] = await Promise.all([
        getStudentEvent(eventId),
        getStudentRounds(eventId),
        getStudentProblemStatements(eventId),
        getMyTeams()
      ]);
      setEvent(eventData);
      setRounds(roundData);
      setProblemStatements(problemData);
      setTeams(teamData.filter((team) => team.eventId === eventId));
      try {
        setMyResult(await getMyEventResult(eventId));
      } catch {
        setMyResult(null);
      }
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load event.");
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  function selectedProblemStatementId() {
    return selectedProblemId ? Number(selectedProblemId) : null;
  }

  async function handleIndividualRegister() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await registerIndividual(eventId, selectedProblemStatementId());
      setSuccess("Registration completed successfully.");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to register.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateTeam(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const team = await createTeam(eventId, { teamName });
      setTeamName("");
      setSuccess(`Team created. Team code: ${team.teamCode}`);
      await load();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to create team.");
    } finally {
      setSaving(false);
    }
  }

  async function handleJoinTeam(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const team = await joinTeamByCode(teamCode);
      setTeamCode("");
      setSuccess(`Joined ${team.teamName}.`);
      await load();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to join team.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegisterTeam(teamId: number) {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await registerTeam(teamId, selectedProblemStatementId());
      setSuccess("Team registration completed.");
      await load();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to register team.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell expectedRole="STUDENT" title="Event Detail">
      <PageHeader title="Event Detail" subtitle="View event details, choose a problem statement, and register." actions={<BackButton fallbackHref="/student/events" />} />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p> : null}
      {event ? (
        <div className="space-y-5">
          <EventSummary event={event} />
          <Card>
            <h2 className="text-base font-bold text-kec-text">Rounds</h2>
            <DataTable
              headers={["Order", "Round", "Final", "Status", "Schedule"]}
              rows={rounds.map((round) => [round.roundOrder, round.roundName, round.finalRound ? "Yes" : "No", round.status, round.scheduledAt ? new Date(round.scheduledAt).toLocaleString() : "-"])}
              emptyMessage="No rounds configured."
            />
          </Card>
          <Card>
            <h2 className="text-base font-bold text-kec-text">Problem Statements</h2>
            {problemStatements.length ? (
              <div className="mt-4 space-y-3">
                <Select label="Select Problem Statement" value={selectedProblemId} onChange={(changeEvent) => setSelectedProblemId(changeEvent.target.value)} required>
                  <option value="">Choose a problem statement</option>
                  {problemStatements.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </Select>
                {problemStatements.map((item) => (
                  <div key={item.id} className="rounded-lg border border-kec-border p-3 text-sm">
                    <p className="font-bold text-kec-text">{item.title}</p>
                    {item.description ? <p className="mt-1 text-kec-secondary">{item.description}</p> : null}
                    {item.referenceLink ? <a className="mt-2 inline-block font-semibold text-kec-purple" href={item.referenceLink} target="_blank" rel="noreferrer">Open reference</a> : null}
                  </div>
                ))}
              </div>
            ) : <p className="mt-2 text-sm text-kec-secondary">No problem statement selection required.</p>}
          </Card>
          <Card>
            <h2 className="text-base font-bold text-kec-text">My Result</h2>
            {myResult ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-kec-text">
                <ResultBadge resultType={myResult.resultType} />
                <span>{myResult.pointsEarned} points</span>
                <span className="text-kec-secondary">Declared {new Date(myResult.declaredAt).toLocaleString()}</span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-kec-secondary">Result not published yet.</p>
            )}
          </Card>
          {event.eventType === "INDIVIDUAL" ? (
            <Card>
              <h2 className="text-base font-bold text-kec-text">Individual Registration</h2>
              <Button className="mt-4" type="button" loading={saving} disabled={!event.registrationOpen || event.status === "COMPLETED"} onClick={() => void handleIndividualRegister()}>Register</Button>
            </Card>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              <Card>
                <h2 className="text-base font-bold text-kec-text">Create Team</h2>
                <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleCreateTeam}>
                  <Input label="Team Name" value={teamName} onChange={(changeEvent) => setTeamName(changeEvent.target.value)} required />
                  <Button type="submit" loading={saving} disabled={!event.registrationOpen || event.status === "COMPLETED"}>Create Team</Button>
                </form>
              </Card>
              <Card>
                <h2 className="text-base font-bold text-kec-text">Join Team</h2>
                <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleJoinTeam}>
                  <Input label="Team Code" value={teamCode} onChange={(changeEvent) => setTeamCode(changeEvent.target.value)} required />
                  <Button type="submit" loading={saving} disabled={!event.registrationOpen || event.status === "COMPLETED"}>Join Team</Button>
                </form>
              </Card>
              <Card className="xl:col-span-2">
                <h2 className="text-base font-bold text-kec-text">My Teams For This Event</h2>
                <DataTable
                  headers={["Team", "Code", "Members", "Problem", "Status", "Action"]}
                  rows={teams.map((team) => [
                    team.teamName,
                    team.teamCode,
                    team.members.map((member) => member.leader ? `${member.name} (Leader)` : member.name).join(", "),
                    team.problemStatementTitle ?? "-",
                    team.registrationStatus,
                    !team.lockedAfterRegistration ? (
                      <Button
                        key="register"
                        type="button"
                        loading={saving}
                        disabled={team.members.length < (event.minTeamSize ?? 1)}
                        onClick={() => void handleRegisterTeam(team.id)}
                      >
                        {team.members.length < (event.minTeamSize ?? 1) ? `Need ${event.minTeamSize ?? 1} members` : "Enroll Team"}
                      </Button>
                    ) : "Registered"
                  ])}
                  emptyMessage="Create or join a team for this event."
                />
              </Card>
            </div>
          )}
          <Link href="/student/events"><Button type="button" variant="secondary">Back</Button></Link>
        </div>
      ) : <Card>Loading event...</Card>}
    </AppShell>
  );
}
