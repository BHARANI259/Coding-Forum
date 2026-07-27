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
  importAdminRoundMarks,
  importFacultyRoundMarks,
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
import { formatDateTime } from "@/lib/dateFormat";

const finalResultTypes = ["WINNER", "RUNNER_UP", "SECOND_RUNNER_UP", "PARTICIPANT", "DISQUALIFIED", "NOT_PRESENTED"];
const roundShortlistStatuses = ["QUALIFIED", "DISQUALIFIED", "NOT_PRESENTED"];

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
  const [marksFile, setMarksFile] = useState<File | null>(null);
  const [importingMarks, setImportingMarks] = useState(false);

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
  const eventClosed = Boolean(event && (event.resultsPublished || event.status === "COMPLETED" || event.status === "CANCELLED"));
  const resultEntryOpen = Boolean(event && !event.resultsPublished && event.status !== "CANCELLED");
  const eventActive = Boolean(event && resultEntryOpen && (event.status === "PUBLISHED" || event.status === "ONGOING" || event.status === "COMPLETED"));
  const selectedRoundOpen = Boolean(selectedRound && selectedRound.status === "ONGOING" && !selectedRound.resultPublished && eventActive);
  const roundLocked = !selectedRoundOpen;
  const finalLocked = !selectedRoundOpen;

  useEffect(() => {
    async function loadRoundResults() {
      if (!selectedRound) {
        setRoundResults([]);
        return;
      }
      try {
        setRoundResults(mode === "admin"
          ? await getAdminRoundResults(eventId, selectedRound.id)
          : await getFacultyRoundResults(eventId, selectedRound.id));
      } catch (exception) {
        setRoundResults([]);
        setError(exception instanceof Error ? exception.message : "Unable to load this round.");
      }
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
      setError("Choose a final result first.");
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
      setError(exception instanceof Error ? exception.message : "Unable to save the result draft.");
    }
  }

  async function saveIndividualRoundStatus(studentId: number) {
    if (!selectedRound) {
      setError("Create or choose a round first.");
      return;
    }
    const status = selected[`student-round-${studentId}`] ?? roundResultsByStudent.get(studentId)?.status ?? "QUALIFIED";
    setError("");
    setSuccess("");
    try {
      if (mode === "admin") {
        await declareAdminRoundStudentResult(eventId, selectedRound.id, studentId, status);
      } else {
        await declareFacultyRoundStudentResult(eventId, selectedRound.id, studentId, status);
      }
      setSuccess("Round status draft saved.");
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
      setError("Choose a final result first.");
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
      setError(exception instanceof Error ? exception.message : "Unable to save the result draft.");
    }
  }

  async function saveTeamRoundStatus(teamId: number, teamCode: string) {
    if (!selectedRound) {
      setError("Create or choose a round first.");
      return;
    }
    if (!teamId) {
      setError("Team result can be saved after the team appears in admin data.");
      return;
    }
    const status = selected[`team-round-${teamCode}`] ?? roundResultsByTeam.get(teamId)?.status ?? "QUALIFIED";
    setError("");
    setSuccess("");
    try {
      if (mode === "admin") {
        await declareAdminRoundTeamResult(eventId, selectedRound.id, teamId, status);
      } else {
        await declareFacultyRoundTeamResult(eventId, selectedRound.id, teamId, status);
      }
      setSuccess(`Round status draft saved for ${teamCode}.`);
      await refreshResults();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to save round status.");
    }
  }

  async function importMarks() {
    if (!selectedRound || !marksFile) {
      setError("Choose the final round and an Excel file first.");
      return;
    }
    setImportingMarks(true);
    setError("");
    setSuccess("");
    try {
      if (mode === "admin") {
        await importAdminRoundMarks(eventId, selectedRound.id, marksFile);
      } else {
        await importFacultyRoundMarks(eventId, selectedRound.id, marksFile);
      }
      setSuccess("Marks imported and draft final results assigned.");
      setMarksFile(null);
      await refreshResults();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to import marks.");
    } finally {
      setImportingMarks(false);
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
        <p className="mt-1 text-sm text-kec-secondary">{event.category?.name ?? "Uncategorized"} - {formatLabel(event.eventType)}</p>
        {eventClosed && event.resultsPublished ? (
          <p className="mt-4 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            This event is {event.status.toLowerCase()}. Existing results are available for reference, but editing and publishing are disabled.
          </p>
        ) : null}
        {event?.status === "COMPLETED" && !event.resultsPublished ? (
          <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            The event time has ended, but final results are not published yet. Result entry remains open until final publish.
          </p>
        ) : null}
        <div className="mt-5">
          <DataTable
            headers={["Order", "Round", "Type", "Status", "Publish Status", "Published At", "Publish"]}
            rows={rounds.map((round) => [
              round.roundOrder,
              round.roundName,
              round.finalRound ? "Final" : "Shortlist",
              formatRoundStatus(round.status),
              round.resultPublished ? "Published / Locked" : "Not Published",
              formatDateTime(round.resultPublishedAt),
              <div key="actions" className="flex flex-wrap gap-2">
                {round.status === "NOT_STARTED" && eventActive ? <Button type="button" variant="secondary" onClick={() => void updateRoundStatus(round.id, "ONGOING")}>Start Round</Button> : null}
                {round.status === "ONGOING" && eventActive ? <Button type="button" onClick={() => void publishRound(round)}>{round.finalRound ? "Publish Final Result" : "Publish Round Result"}</Button> : null}
                {round.resultPublished ? <span className="text-xs font-semibold text-green-700">Locked</span> : null}
                {!eventActive && !round.resultPublished ? <span className="text-xs text-kec-muted">Unavailable</span> : null}
              </div>
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
            <Info label="Round Status" value={formatRoundStatus(selectedRound.status)} />
            <Info label="Publish Status" value={selectedRound.resultPublished ? "Published / Locked" : "Not Published"} />
            <Info label="Published At" value={formatDateTime(selectedRound.resultPublishedAt)} />
            <Info label="Round Type" value={selectedRound.finalRound ? "Final Round" : "Shortlisting Round"} />
          </div>
        ) : null}
        <p className="mt-3 text-sm text-kec-secondary">
          {!selectedRound ? "Choose a round to review its participants and result status."
            : selectedRound.status === "NOT_STARTED" ? "Start this round before changing participant results."
              : selectedRound.finalRound ? "Choose each final position, save the drafts, then publish the final result."
                : "Choose Qualified, Disqualified, or Not Presented for each participant or team, then publish this round result."}
        </p>
        {selectedRound?.resultPublished ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {selectedRound.finalRound ? "Final results have been published. Event is completed. Editing is disabled." : "This round result has been published. Editing is disabled."}
          </p>
        ) : null}
        {selectedRound?.finalRound && isMarksImportEvent(event) && selectedRoundOpen ? (
          <div className="mt-4 rounded-xl border border-kec-border bg-slate-50 p-4">
            <h3 className="text-sm font-bold text-kec-text">Import Marks Excel</h3>
            <p className="mt-1 text-sm text-kec-secondary">For coding contest and placement drill events. Columns: Register Number or Team Code, Marks, optional Status.</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input type="file" accept=".xlsx,.xls" onChange={(event) => setMarksFile(event.target.files?.[0] ?? null)} />
              <Button type="button" disabled={!marksFile} loading={importingMarks} onClick={() => void importMarks()}>Import Marks</Button>
            </div>
          </div>
        ) : null}
      </Card>

      {event.eventType === "INDIVIDUAL" ? (
        <DataTable
          headers={selectedRound?.finalRound
            ? ["Student", "Register No", "Department", "Round Status", "Marks", "Final Result", "Points", "Set Final Result", "Action"]
            : ["Student", "Register No", "Department", "Round Status", "Set Round Status", "Action"]}
          rows={registrations.filter((item) => item.status === "REGISTERED").map((registration) => {
            const result = resultsByStudent.get(registration.studentId);
            const roundResult = roundResultsByStudent.get(registration.studentId);
            return selectedRound?.finalRound ? [
              registration.studentName,
              registration.registerNumber,
              registration.departmentCode ?? "-",
              roundResult?.status ? formatLabel(roundResult.status) : "-",
              roundResult?.marks ?? "-",
              result ? <ResultBadge key="badge" resultType={result.resultType} /> : "-",
              result?.pointsAwarded ?? "-",
              <Select key="select" label="Final Result" disabled={finalLocked} value={selected[`student-${registration.studentId}`] ?? roundResult?.status ?? ""} onChange={(event) => setSelected({ ...selected, [`student-${registration.studentId}`]: event.target.value })}>
                <option value="">Choose</option>
                {finalResultTypes.map((type) => <option key={type} value={type}>{formatLabel(type)}</option>)}
              </Select>,
              <div key="actions" className="flex flex-wrap gap-2">
                <Button type="button" disabled={finalLocked} onClick={() => void saveIndividual(registration.studentId)}>Save Draft</Button>
                {mode === "admin" && result && !finalLocked ? <Button type="button" variant="danger" onClick={() => void clearResult(result.id)}>Clear Final</Button> : null}
              </div>
            ] : [
              registration.studentName,
              registration.registerNumber,
              registration.departmentCode ?? "-",
              formatLabel(roundResult?.status ?? "QUALIFIED"),
              <Select key="round-status" label="Round Status" disabled={roundLocked} value={selected[`student-round-${registration.studentId}`] ?? roundResult?.status ?? "QUALIFIED"} onChange={(event) => setSelected({ ...selected, [`student-round-${registration.studentId}`]: event.target.value })}>
                {roundShortlistStatuses.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}
              </Select>,
              <Button key="save" type="button" disabled={roundLocked} onClick={() => void saveIndividualRoundStatus(registration.studentId)}>Save</Button>
            ];
          })}
          emptyMessage="No registered students found."
        />
      ) : (
        <DataTable
          headers={selectedRound?.finalRound
            ? ["Team", "Members", "Round Status", "Marks", "Final Result", "Points", "Set Final Result", "Action"]
            : ["Team", "Members", "Round Status", "Set Round Status", "Action"]}
          rows={teamRows.map((team) => {
            const result = summary?.results.find((item) => item.teamCode === team.teamCode);
            const roundResult = roundResultsByTeam.get(team.teamId);
            return selectedRound?.finalRound ? [
              `${team.teamName} (${team.teamCode})`,
              team.members.join(", "),
              roundResult?.status ? formatLabel(roundResult.status) : "-",
              roundResult?.marks ?? "-",
              result ? <ResultBadge key="badge" resultType={result.resultType} /> : "-",
              result?.pointsAwarded ?? "-",
              <Select key="select" label="Final Result" disabled={finalLocked} value={selected[`team-${team.teamCode}`] ?? roundResult?.status ?? ""} onChange={(event) => setSelected({ ...selected, [`team-${team.teamCode}`]: event.target.value })}>
                <option value="">Choose</option>
                {finalResultTypes.map((type) => <option key={type} value={type}>{formatLabel(type)}</option>)}
              </Select>,
              <div key="actions" className="flex flex-wrap gap-2">
                <Button type="button" disabled={finalLocked} onClick={() => void saveTeam(team.teamId, team.teamCode)}>Save Draft</Button>
                {mode === "admin" && result && !finalLocked ? <Button type="button" variant="danger" onClick={() => void clearResult(result.id)}>Clear Final</Button> : null}
              </div>
            ] : [
              `${team.teamName} (${team.teamCode})`,
              team.members.join(", "),
              formatLabel(roundResult?.status ?? "QUALIFIED"),
              <Select key="round-status" label="Round Status" disabled={roundLocked} value={selected[`team-round-${team.teamCode}`] ?? roundResult?.status ?? "QUALIFIED"} onChange={(event) => setSelected({ ...selected, [`team-round-${team.teamCode}`]: event.target.value })}>
                {roundShortlistStatuses.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}
              </Select>,
              <Button key="save" type="button" disabled={roundLocked} onClick={() => void saveTeamRoundStatus(team.teamId, team.teamCode)}>Save</Button>
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

function formatRoundStatus(value: string) {
  if (value === "NOT_STARTED") return "Not started";
  return value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " ");
}

function formatLabel(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isMarksImportEvent(event: EventDetail) {
  const categoryName = event.category?.name?.toLowerCase() ?? "";
  return categoryName.includes("coding") || categoryName.includes("contest") || categoryName.includes("placement") || categoryName.includes("drill");
}
