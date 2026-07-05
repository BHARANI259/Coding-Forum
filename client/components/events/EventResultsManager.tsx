"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import ResultBadge from "@/components/events/ResultBadge";
import {
  clearAdminResult,
  declareAdminRoundStudentResult,
  declareAdminRoundTeamResult,
  declareFacultyRoundStudentResult,
  declareFacultyRoundTeamResult,
  getAdminEvent,
  getAdminEventRegistrations,
  getAdminEventResults,
  getAdminRoundResults,
  getAdminRounds,
  getFacultyEvent,
  getFacultyEventRegistrations,
  getFacultyEventResults,
  getFacultyRoundResults,
  getFacultyRounds,
  publishAdminFinalResult,
  publishAdminRoundResult,
  publishFacultyFinalResult,
  publishFacultyRoundResult,
  updateAdminRoundStatus,
  updateFacultyRoundStatus,
  type EventDetail,
  type EventRegistration,
  type EventResultSummary,
  type EventRound,
  type ResultItem,
  type RoundResult
} from "@/lib/api";

const finalResultTypes = ["WINNER", "RUNNER_UP", "SECOND_RUNNER_UP", "PARTICIPANT", "DISQUALIFIED"];

type EventResultsManagerProps = {
  eventId: number;
  mode: "admin" | "faculty";
};

export default function EventResultsManager({ eventId, mode }: EventResultsManagerProps) {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [summary, setSummary] = useState<EventResultSummary | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [eventDetail, eventRegistrations, results, roundList] = mode === "admin"
          ? await Promise.all([getAdminEvent(eventId), getAdminEventRegistrations(eventId), getAdminEventResults(eventId), getAdminRounds(eventId)])
          : await Promise.all([getFacultyEvent(eventId), getFacultyEventRegistrations(eventId), getFacultyEventResults(eventId), getFacultyRounds(eventId)]);
        setEvent(eventDetail);
        setRegistrations(eventRegistrations);
        setSummary(results);
        setRounds(roundList);
        setSelectedRoundId((current) => current || (roundList[0] ? String(roundList[0].id) : ""));
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load results.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [eventId, mode]);

  const selectedRound = useMemo(() => rounds.find((round) => String(round.id) === selectedRoundId) ?? null, [rounds, selectedRoundId]);
  const roundLocked = Boolean(selectedRound?.resultPublished);
  const finalLocked = Boolean(event?.resultsPublished || selectedRound?.resultPublished);

  useEffect(() => {
    async function loadRoundResults() {
      if (!selectedRound) {
        setRoundResults([]);
        return;
      }
      setRoundResults(mode === "admin"
        ? await getAdminRoundResults(eventId, selectedRound.id)
        : await getFacultyRoundResults(eventId, selectedRound.id));
    }
    void loadRoundResults();
  }, [eventId, mode, selectedRound]);

  const resultsByStudent = useMemo(() => {
    const map = new Map<number, ResultItem>();
    summary?.results.forEach((result) => {
      if (result.studentId) {
        map.set(result.studentId, result);
      }
    });
    return map;
  }, [summary]);

  const teamRows = useMemo(() => {
    const map = new Map<number, { teamId: number; teamName: string; teamCode: string; members: string[] }>();
    registrations.filter((item) => item.status === "REGISTERED" && item.teamName && item.teamCode).forEach((item) => {
      const key = item.teamId ?? 0;
      const existing = map.get(key);
      if (existing) {
        existing.members.push(item.studentName);
      } else {
        map.set(key, {
          teamId: item.teamId ?? 0,
          teamName: item.teamName ?? "-",
          teamCode: item.teamCode ?? "-",
          members: [item.studentName]
        });
      }
    });
    return [...map.values()];
  }, [registrations]);

  const roundResultsByStudent = useMemo(() => {
    const map = new Map<number, RoundResult>();
    roundResults.forEach((result) => {
      if (result.studentId) {
        map.set(result.studentId, result);
      }
    });
    return map;
  }, [roundResults]);

  const roundResultsByTeam = useMemo(() => {
    const map = new Map<number, RoundResult>();
    roundResults.forEach((result) => {
      if (result.teamId) {
        map.set(result.teamId, result);
      }
    });
    return map;
  }, [roundResults]);

  async function refreshResults() {
    setSummary(mode === "admin" ? await getAdminEventResults(eventId) : await getFacultyEventResults(eventId));
    setRounds(mode === "admin" ? await getAdminRounds(eventId) : await getFacultyRounds(eventId));
    if (selectedRound) {
      setRoundResults(mode === "admin" ? await getAdminRoundResults(eventId, selectedRound.id) : await getFacultyRoundResults(eventId, selectedRound.id));
    }
  }

  async function saveIndividual(studentId: number) {
    const resultType = selected[`student-${studentId}`];
    if (!selectedRound) {
      setError("Create or choose a round first.");
      return;
    }
    if (!resultType) {
      setError("Choose a round status first.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      if (mode === "admin") {
        await declareAdminRoundStudentResult(eventId, selectedRound.id, studentId, resultType);
      } else {
        await declareFacultyRoundStudentResult(eventId, selectedRound.id, studentId, resultType);
      }
      setSuccess(selectedRound.finalRound ? "Final result saved." : "Round shortlist saved.");
      await refreshResults();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to save round status.");
    }
  }

  async function saveIndividualDisqualification(studentId: number, disqualified: boolean) {
    if (!selectedRound) {
      setError("Create or choose a round first.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      const status = disqualified ? "DISQUALIFIED" : "QUALIFIED";
      if (mode === "admin") {
        await declareAdminRoundStudentResult(eventId, selectedRound.id, studentId, status);
      } else {
        await declareFacultyRoundStudentResult(eventId, selectedRound.id, studentId, status);
      }
      setSuccess("Round disqualification draft saved.");
      await refreshResults();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to save disqualification.");
    }
  }

  async function saveTeam(teamId: number, teamCode: string) {
    const resultType = selected[`team-${teamCode}`];
    if (!selectedRound) {
      setError("Create or choose a round first.");
      return;
    }
    if (!resultType) {
      setError("Choose a round status first.");
      return;
    }
    if (!teamId) {
      setError("Team result can be saved after the team appears in admin data.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      if (mode === "admin") {
        await declareAdminRoundTeamResult(eventId, selectedRound.id, teamId, resultType);
      } else {
        await declareFacultyRoundTeamResult(eventId, selectedRound.id, teamId, resultType);
      }
      setSuccess(selectedRound.finalRound ? "Final result saved." : "Round shortlist saved.");
      await refreshResults();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to save round status.");
    }
  }

  async function saveTeamDisqualification(teamId: number, teamCode: string, disqualified: boolean) {
    if (!selectedRound) {
      setError("Create or choose a round first.");
      return;
    }
    if (!teamId) {
      setError("Team result can be saved after the team appears in admin data.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      const status = disqualified ? "DISQUALIFIED" : "QUALIFIED";
      if (mode === "admin") {
        await declareAdminRoundTeamResult(eventId, selectedRound.id, teamId, status);
      } else {
        await declareFacultyRoundTeamResult(eventId, selectedRound.id, teamId, status);
      }
      setSuccess(`Round disqualification draft saved for ${teamCode}.`);
      await refreshResults();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to save disqualification.");
    }
  }

  async function publishRound(round: EventRound) {
    setError("");
    setSuccess("");
    try {
      if (round.finalRound) {
        if (mode === "admin") {
          await publishAdminFinalResult(eventId, round.id);
        } else {
          await publishFacultyFinalResult(eventId, round.id);
        }
        setSuccess("Final results have been published. Event is completed. Editing is disabled.");
      } else {
        if (mode === "admin") {
          await publishAdminRoundResult(eventId, round.id);
        } else {
          await publishFacultyRoundResult(eventId, round.id);
        }
        setSuccess("This round result has been published. Editing is disabled.");
      }
      await refreshResults();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to publish round result.");
    }
  }

  async function updateRoundStatus(roundId: number, status: string) {
    setError("");
    setSuccess("");
    try {
      if (mode === "admin") {
        await updateAdminRoundStatus(eventId, roundId, status);
      } else {
        await updateFacultyRoundStatus(eventId, roundId, status);
      }
      setSuccess("Round status updated.");
      await refreshResults();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to update round status.");
    }
  }

  async function clearResult(resultId: number) {
    setError("");
    setSuccess("");
    try {
      await clearAdminResult(resultId);
      setSuccess("Final result cleared.");
      await refreshResults();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to clear result.");
    }
  }

  if (loading) {
    return <Card>Loading results...</Card>;
  }

  if (!event) {
    return <Card>Event not found.</Card>;
  }

  return (
    <div className="space-y-5">
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p> : null}
      <Card>
        <h2 className="text-lg font-bold text-kec-text">{event.title}</h2>
        <p className="mt-1 text-sm text-kec-secondary">{event.category?.name ?? "Uncategorized"} - {event.eventType}</p>
        <div className="mt-5">
          <DataTable
            headers={["Order", "Round", "Type", "Status", "Publish Status", "Published At", "Publish"]}
            rows={rounds.map((round) => [
              round.roundOrder,
              round.roundName,
              round.finalRound ? "Final" : "Shortlist",
              <Select key="status" label="Status" value={round.status} disabled={round.resultPublished} onChange={(changeEvent) => void updateRoundStatus(round.id, changeEvent.target.value)}>
                {["NOT_STARTED", "ONGOING", "COMPLETED", "CANCELLED"].map((status) => <option key={status}>{status}</option>)}
              </Select>,
              round.resultPublished ? "Published / Locked" : "Not Published",
              round.resultPublishedAt ? new Date(round.resultPublishedAt).toLocaleString() : "-",
              <Button
                key="publish"
                type="button"
                disabled={round.resultPublished || (round.finalRound && event.resultsPublished)}
                onClick={() => void publishRound(round)}
              >
                {round.finalRound ? "Publish Final Result" : "Publish Round Result"}
              </Button>
            ])}
            emptyMessage="No rounds configured."
          />
        </div>
        <div className="mt-4 max-w-sm">
          <Select label="Round" value={selectedRoundId} onChange={(changeEvent) => setSelectedRoundId(changeEvent.target.value)}>
            <option value="">Choose round</option>
            {rounds.map((round) => (
              <option key={round.id} value={round.id}>{round.roundOrder}. {round.roundName}{round.finalRound ? " (Final)" : ""}</option>
            ))}
          </Select>
        </div>
        {selectedRound ? (
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
            <Info label="Round Status" value={selectedRound.status} />
            <Info label="Publish Status" value={selectedRound.resultPublished ? "Published / Locked" : "Not Published"} />
            <Info label="Published At" value={selectedRound.resultPublishedAt ? new Date(selectedRound.resultPublishedAt).toLocaleString() : "-"} />
            <Info label="Round Type" value={selectedRound.finalRound ? "Final Round" : "Shortlisting Round"} />
          </div>
        ) : null}
        <p className="mt-3 text-sm text-kec-secondary">
          {selectedRound?.finalRound
            ? "Final result dropdowns remain draft until Publish Final Result is clicked."
            : "Use the Disqualified switch for each participant/team, then publish this round result."}
        </p>
        {selectedRound?.resultPublished ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {selectedRound.finalRound ? "Final results have been published. Event is completed. Editing is disabled." : "This round result has been published. Editing is disabled."}
          </p>
        ) : null}
      </Card>

      {event.eventType === "INDIVIDUAL" ? (
        <DataTable
          headers={selectedRound?.finalRound
            ? ["Student", "Register No", "Department", "Round Status", "Final Result", "Points", "Set Final Result", "Action"]
            : ["Student", "Register No", "Department", "Round Status", "Disqualified", "Action"]}
          rows={registrations.filter((item) => item.status === "REGISTERED").map((registration) => {
            const result = resultsByStudent.get(registration.studentId);
            const roundResult = roundResultsByStudent.get(registration.studentId);
            return selectedRound?.finalRound ? [
              registration.studentName,
              registration.registerNumber,
              registration.departmentCode ?? "-",
              roundResult?.status ?? "-",
              result ? <ResultBadge key="badge" resultType={result.resultType} /> : "-",
              result?.pointsAwarded ?? "-",
              <Select key="select" label="Final Result" disabled={finalLocked} value={selected[`student-${registration.studentId}`] ?? roundResult?.status ?? ""} onChange={(event) => setSelected({ ...selected, [`student-${registration.studentId}`]: event.target.value })}>
                <option value="">Choose</option>
                {finalResultTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </Select>,
              <div key="actions" className="flex flex-wrap gap-2">
                <Button type="button" disabled={finalLocked} onClick={() => void saveIndividual(registration.studentId)}>Save Draft</Button>
                {mode === "admin" && result && !finalLocked ? <Button type="button" variant="danger" onClick={() => void clearResult(result.id)}>Clear Final</Button> : null}
              </div>
            ] : [
              registration.studentName,
              registration.registerNumber,
              registration.departmentCode ?? "-",
              roundResult?.status ?? "QUALIFIED",
              <input key="switch" type="checkbox" disabled={roundLocked} checked={roundResult?.status === "DISQUALIFIED"} onChange={(event) => void saveIndividualDisqualification(registration.studentId, event.target.checked)} />,
              roundLocked ? "Locked" : "Toggle to save"
            ];
          })}
          emptyMessage="No registered students found."
        />
      ) : (
        <DataTable
          headers={selectedRound?.finalRound
            ? ["Team", "Members", "Round Status", "Final Result", "Points", "Set Final Result", "Action"]
            : ["Team", "Members", "Round Status", "Disqualified", "Action"]}
          rows={teamRows.map((team) => {
            const result = summary?.results.find((item) => item.teamCode === team.teamCode);
            const roundResult = roundResultsByTeam.get(team.teamId);
            return selectedRound?.finalRound ? [
              `${team.teamName} (${team.teamCode})`,
              team.members.join(", "),
              roundResult?.status ?? "-",
              result ? <ResultBadge key="badge" resultType={result.resultType} /> : "-",
              result?.pointsAwarded ?? "-",
              <Select key="select" label="Final Result" disabled={finalLocked} value={selected[`team-${team.teamCode}`] ?? roundResult?.status ?? ""} onChange={(event) => setSelected({ ...selected, [`team-${team.teamCode}`]: event.target.value })}>
                <option value="">Choose</option>
                {finalResultTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </Select>,
              <div key="actions" className="flex flex-wrap gap-2">
                <Button type="button" disabled={finalLocked} onClick={() => void saveTeam(team.teamId, team.teamCode)}>Save Draft</Button>
                {mode === "admin" && result && !finalLocked ? <Button type="button" variant="danger" onClick={() => void clearResult(result.id)}>Clear Final</Button> : null}
              </div>
            ] : [
              `${team.teamName} (${team.teamCode})`,
              team.members.join(", "),
              roundResult?.status ?? "QUALIFIED",
              <input key="switch" type="checkbox" disabled={roundLocked} checked={roundResult?.status === "DISQUALIFIED"} onChange={(event) => void saveTeamDisqualification(team.teamId, team.teamCode, event.target.checked)} />,
              roundLocked ? "Locked" : "Toggle to save"
            ];
          })}
          emptyMessage="No registered teams found."
        />
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-semibold text-kec-secondary">{label}</p>
      <p className="mt-1 text-kec-text">{value}</p>
    </div>
  );
}
