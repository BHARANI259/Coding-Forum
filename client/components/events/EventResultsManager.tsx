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
  type EventDetail,
  type EventRegistration,
  type EventResultSummary,
  type EventRound,
  type ResultItem,
  type RoundResult
} from "@/lib/api";

const finalResultTypes = ["WINNER", "RUNNER_UP", "PARTICIPANT", "DISQUALIFIED"];
const shortlistResultTypes = ["SELECTED", "DISQUALIFIED"];

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
  const statusOptions = selectedRound?.finalRound ? finalResultTypes : shortlistResultTypes;

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
        <div className="mt-4 max-w-sm">
          <Select label="Round" value={selectedRoundId} onChange={(changeEvent) => setSelectedRoundId(changeEvent.target.value)}>
            <option value="">Choose round</option>
            {rounds.map((round) => (
              <option key={round.id} value={round.id}>{round.roundOrder}. {round.roundName}{round.finalRound ? " (Final)" : ""}</option>
            ))}
          </Select>
        </div>
        <p className="mt-3 text-sm text-kec-secondary">
          {selectedRound?.finalRound
            ? "Final round statuses create official event results and points."
            : "Non-final round statuses shortlist teams or students for the next round."}
        </p>
      </Card>

      {event.eventType === "INDIVIDUAL" ? (
        <DataTable
          headers={["Student", "Register No", "Department", "Round Status", "Final Result", "Points", "Set Status", "Action"]}
          rows={registrations.filter((item) => item.status === "REGISTERED").map((registration) => {
            const result = resultsByStudent.get(registration.studentId);
            const roundResult = roundResultsByStudent.get(registration.studentId);
            return [
              registration.studentName,
              registration.registerNumber,
              registration.departmentCode ?? "-",
              roundResult?.status ?? "-",
              result ? <ResultBadge key="badge" resultType={result.resultType} /> : "-",
              result?.pointsAwarded ?? "-",
              <Select key="select" label={selectedRound?.finalRound ? "Final Result" : "Round Status"} value={selected[`student-${registration.studentId}`] ?? roundResult?.status ?? ""} onChange={(event) => setSelected({ ...selected, [`student-${registration.studentId}`]: event.target.value })}>
                <option value="">Choose</option>
                {statusOptions.map((type) => <option key={type} value={type}>{type}</option>)}
              </Select>,
              <div key="actions" className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void saveIndividual(registration.studentId)}>Save</Button>
                {mode === "admin" && result ? <Button type="button" variant="danger" onClick={() => void clearResult(result.id)}>Clear Final</Button> : null}
              </div>
            ];
          })}
          emptyMessage="No registered students found."
        />
      ) : (
        <DataTable
          headers={["Team", "Members", "Round Status", "Final Result", "Points", "Set Status", "Action"]}
          rows={teamRows.map((team) => {
            const result = summary?.results.find((item) => item.teamCode === team.teamCode);
            const roundResult = roundResultsByTeam.get(team.teamId);
            return [
              `${team.teamName} (${team.teamCode})`,
              team.members.join(", "),
              roundResult?.status ?? "-",
              result ? <ResultBadge key="badge" resultType={result.resultType} /> : "-",
              result?.pointsAwarded ?? "-",
              <Select key="select" label={selectedRound?.finalRound ? "Final Result" : "Round Status"} value={selected[`team-${team.teamCode}`] ?? roundResult?.status ?? ""} onChange={(event) => setSelected({ ...selected, [`team-${team.teamCode}`]: event.target.value })}>
                <option value="">Choose</option>
                {statusOptions.map((type) => <option key={type} value={type}>{type}</option>)}
              </Select>,
              <div key="actions" className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void saveTeam(team.teamId, team.teamCode)}>Save</Button>
                {mode === "admin" && result ? <Button type="button" variant="danger" onClick={() => void clearResult(result.id)}>Clear Final</Button> : null}
              </div>
            ];
          })}
          emptyMessage="No registered teams found."
        />
      )}
    </div>
  );
}
