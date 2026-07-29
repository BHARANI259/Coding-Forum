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
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/dateFormat";
import { getEventRegistrationState } from "@/lib/eventRegistration";
import {
  createTeam,
  getMyEventResult,
  getMyRegistrations,
  getMyTeams,
  getStudentEvent,
  getStudentProblemStatements,
  getStudentRoundResult,
  getStudentRounds,
  joinTeamByCode,
  registerIndividual,
  registerTeam,
  type EventDetail,
  type EventRound,
  type ProblemStatement,
  type RoundResult,
  type StudentResult,
  type TeamDetail
} from "@/lib/api";

export default function StudentEventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [roundProgress, setRoundProgress] = useState<Record<number, RoundResult | null>>({});
  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  const [myResult, setMyResult] = useState<StudentResult | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [teams, setTeams] = useState<TeamDetail[]>([]);
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [eventData, roundData, problemData, teamData, registrationData] = await Promise.all([
        getStudentEvent(eventId),
        getStudentRounds(eventId),
        getStudentProblemStatements(eventId),
        getMyTeams(),
        getMyRegistrations()
      ]);
      setEvent(eventData);
      setRounds(roundData);
      setProblemStatements(problemData);
      setTeams(teamData.filter((team) => getTeamEventId(team) === eventId));
      const currentRegistration = registrationData.find((registration) => registration.eventId === eventId && registration.status === "REGISTERED");
      setAlreadyRegistered(Boolean(currentRegistration));
      if (currentRegistration?.problemStatementId) {
        setSelectedProblemId(String(currentRegistration.problemStatementId));
      }
      const progressEntries = await Promise.all(roundData.map(async (round) => {
        if (!round.resultPublished) {
          return [round.id, null] as const;
        }
        try {
          return [round.id, await getStudentRoundResult(eventId, round.id)] as const;
        } catch {
          return [round.id, null] as const;
        }
      }));
      setRoundProgress(Object.fromEntries(progressEntries));
      try {
        setMyResult(await getMyEventResult(eventId));
      } catch {
        setMyResult(null);
      }
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load event.");
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  function selectedProblemStatementId() {
    return selectedProblemId ? Number(selectedProblemId) : null;
  }

  function requireProblemSelection() {
    if (problemStatements.length && !selectedProblemId) {
      setError("Please select a problem statement before registering.");
      return false;
    }
    return true;
  }

  async function handleIndividualRegister() {
    if (!requireProblemSelection()) {
      return;
    }
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
    if (!requireProblemSelection()) {
      setSaving(false);
      return;
    }
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

  const currentStudentId = getCurrentUser()?.studentId;
  const registrationState = event ? getEventRegistrationState(event) : null;
  const eventClosed = Boolean(event && (event.resultsPublished || event.status === "COMPLETED" || event.status === "CANCELLED"));
  const registrationAvailable = Boolean(registrationState?.available && !alreadyRegistered);

  return (
    <AppShell expectedRole="STUDENT" title="Event Detail">
      <PageHeader title="Event Detail" subtitle="Review the schedule, rounds, problem statements, registration, and results." actions={<BackButton fallbackHref="/student/events" />} />
      {error && event ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p> : null}
      {!loading && error && !event ? (
        <Card>
          <h2 className="text-base font-bold text-kec-text">Event unavailable</h2>
          <p className="mt-2 text-sm text-kec-secondary">{error}</p>
          <div className="mt-4"><BackButton fallbackHref="/student/events" /></div>
        </Card>
      ) : event ? (
        <div className="space-y-5">
          <EventSummary event={event} />
          {!registrationAvailable && !alreadyRegistered ? (
            <p className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {registrationState?.message ?? "Registration is not open for this event."}
            </p>
          ) : null}
          {alreadyRegistered ? (
            <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
              {eventClosed ? "This event has ended. Your confirmed registration remains available in your history." : "Your registration is confirmed. Registration cannot be cancelled."}
            </p>
          ) : null}
          <Card>
            <h2 className="text-base font-bold text-kec-text">Rounds</h2>
            <DataTable
              headers={["Order", "Round", "Final", "Status", "Published", "My Progress", "Schedule"]}
              rows={rounds.map((round) => [
                round.roundOrder,
                round.roundName,
                round.finalRound ? "Yes" : "No",
                formatRoundStatus(round.status),
                round.resultPublished ? `Published ${formatDateTime(round.resultPublishedAt, "")}` : "Round result not published yet.",
                round.resultPublished ? formatStudentProgress(roundProgress[round.id], round.finalRound) : "Waiting for the faculty to publish this round result.",
                formatDateTime(round.scheduledAt)
              ])}
              emptyMessage="No rounds configured."
            />
          </Card>
          <Card>
            <h2 className="text-base font-bold text-kec-text">Problem Statements</h2>
            {problemStatements.length ? (
              <div className="mt-4 space-y-3">
                {registrationAvailable ? (
                  <Select label="Select Problem Statement" value={selectedProblemId} onChange={(changeEvent) => setSelectedProblemId(changeEvent.target.value)} required>
                    <option value="">Choose a problem statement</option>
                    {problemStatements.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </Select>
                ) : null}
                {problemStatements.map((item) => (
                  <div key={item.id} className="rounded-lg border border-kec-border p-3 text-sm">
                    <p className="break-words font-bold text-kec-text">{item.title}</p>
                    {item.description ? <p className="mt-1 break-words text-kec-secondary">{item.description}</p> : null}
                    {item.links.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.links.map((link) => <a key={`${link.id}-${link.url}`} className="max-w-full break-words rounded-full bg-kec-purple/10 px-3 py-1 text-xs font-semibold text-kec-purple" href={link.url} target="_blank" rel="noopener noreferrer">{link.label || shortUrl(link.url)}</a>)}
                      </div>
                    ) : null}
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
                <span className="text-kec-secondary">Declared {formatDateTime(myResult.declaredAt)}</span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-kec-secondary">Result not published yet.</p>
            )}
          </Card>
          {eventClosed || alreadyRegistered ? null : event.eventType === "INDIVIDUAL" ? (
            <Card>
              <h2 className="text-base font-bold text-kec-text">Individual Registration</h2>
              <p className="mt-2 text-sm text-kec-secondary">{registrationAvailable ? "Submit once to confirm your registration. Registrations cannot be cancelled later." : "Registration is unavailable."}</p>
              <Button className="mt-4 w-full sm:w-auto" type="button" loading={saving} disabled={!registrationAvailable} onClick={() => void handleIndividualRegister()}>Register for Event</Button>
            </Card>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              <Card>
                <h2 className="text-base font-bold text-kec-text">Create Team</h2>
                <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleCreateTeam}>
                  <Input label="Team Name" value={teamName} onChange={(changeEvent) => setTeamName(changeEvent.target.value)} required />
                  <Button type="submit" className="w-full sm:w-auto" loading={saving} disabled={!registrationAvailable}>Create Team</Button>
                </form>
              </Card>
              <Card>
                <h2 className="text-base font-bold text-kec-text">Join Team</h2>
                <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleJoinTeam}>
                  <Input label="Team Code" value={teamCode} onChange={(changeEvent) => setTeamCode(changeEvent.target.value)} required />
                  <Button type="submit" className="w-full sm:w-auto" loading={saving} disabled={!registrationAvailable}>Join Team</Button>
                </form>
              </Card>
              <Card className="xl:col-span-2">
                <h2 className="text-base font-bold text-kec-text">My Teams For This Event</h2>
                <DataTable
                  headers={["Team", "Code", "Member Progress", "Members", "Problem", "Status", "Action"]}
                  rows={teams.map((team) => [
                    team.teamName,
                    team.teamCode,
                    `${team.members.length} of ${event.minTeamSize ?? 1} minimum`,
                    team.members.map((member) => member.leader ? `${member.name} (Leader)` : member.name).join(", "),
                    team.problemStatementTitle ?? (!team.lockedAfterRegistration && team.leaderStudentId === currentStudentId && problemStatements.length ? (
                      <Select
                        key={`problem-${team.id}`}
                        label="Problem Statement"
                        value={selectedProblemId}
                        onChange={(changeEvent) => setSelectedProblemId(changeEvent.target.value)}
                        required
                      >
                        <option value="">Select problem</option>
                        {problemStatements.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                      </Select>
                    ) : !team.lockedAfterRegistration && team.leaderStudentId === currentStudentId ? "Select during enrollment" : "-"),
                    team.registrationStatus,
                    !team.lockedAfterRegistration && team.leaderStudentId === currentStudentId ? (
                      <Button
                        key="register"
                        type="button"
                        className="w-full sm:w-auto"
                        loading={saving}
                        disabled={!registrationAvailable || team.members.length < (event.minTeamSize ?? 1)}
                        onClick={() => void handleRegisterTeam(team.id)}
                      >
                        {team.members.length < (event.minTeamSize ?? 1) ? `Need ${event.minTeamSize ?? 1} members` : "Enroll Team"}
                      </Button>
                    ) : team.lockedAfterRegistration ? "Registered" : "Leader will enroll"
                  ])}
                  emptyMessage="Create or join a team for this event."
                />
              </Card>
            </div>
          )}
          <Link href="/student/events" className="block sm:inline-block"><Button type="button" className="w-full sm:w-auto" variant="secondary">Back</Button></Link>
        </div>
      ) : loading ? <Card>Loading event details...</Card> : null}
    </AppShell>
  );
}

function formatRoundStatus(value: string) {
  if (value === "NOT_STARTED") return "Not started";
  return value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " ");
}

function formatStudentProgress(result: RoundResult | null, finalRound: boolean) {
  if (!result) return "No progression recorded for you in this round.";
  if (result.status === "NOT_PRESENTED") return "Marked not presented for this round";
  if (result.status === "DISQUALIFIED") return "Disqualified in this round";
  if (!finalRound && result.status === "QUALIFIED") return "Qualified for the next round";
  return result.status.replaceAll("_", " ").toLowerCase().replace(/^./, (value) => value.toUpperCase());
}

function shortUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return value.length > 28 ? `${value.slice(0, 25)}...` : value;
  }
}

function getTeamEventId(team: TeamDetail) {
  return team.eventId ?? team.event.id;
}
