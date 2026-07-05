"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import EventSummary from "@/components/events/EventSummary";
import EventRegistrationsTable from "@/components/events/EventRegistrationsTable";
import EventMediaManager from "@/components/events/EventMediaManager";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import BackButton from "@/components/ui/BackButton";
import Select from "@/components/ui/Select";
import {
  downloadFacultyEventPdf,
  downloadFacultyEventResultsExcel,
  downloadFacultyEventStudentsExcel,
  downloadFacultyEventTeamsExcel,
  getFacultyEvent,
  getFacultyEventRegistrations,
  getFacultyProblemStatements,
  getFacultyRounds,
  publishFacultyFinalResult,
  publishFacultyRoundResult,
  updateFacultyRoundStatus,
  type EventDetail,
  type EventRegistration,
  type EventRound,
  type ProblemStatement
} from "@/lib/api";

export default function FacultyEventDetailPage() {
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [reportDownloading, setReportDownloading] = useState("");
  const [publishingRoundId, setPublishingRoundId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      const id = Number(params.id);
      const [eventData, registrationData, problemData, roundData] = await Promise.all([
        getFacultyEvent(id),
        getFacultyEventRegistrations(id),
        getFacultyProblemStatements(id),
        getFacultyRounds(id)
      ]);
      setEvent(eventData);
      setRegistrations(registrationData);
      setProblemStatements(problemData);
      setRounds(roundData);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load event.");
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function downloadReport(key: string, action: () => Promise<void>) {
    setError("");
    setReportDownloading(key);
    try {
      await action();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to download report.");
    } finally {
      setReportDownloading("");
    }
  }

  async function publishRound(round: EventRound) {
    setError("");
    setSuccess("");
    setPublishingRoundId(round.id);
    try {
      if (round.finalRound) {
        await publishFacultyFinalResult(Number(params.id), round.id);
        setSuccess("Final results have been published. Event is completed. Editing is disabled.");
      } else {
        await publishFacultyRoundResult(Number(params.id), round.id);
        setSuccess("This round result has been published. Editing is disabled.");
      }
      await load();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to publish round result.");
    } finally {
      setPublishingRoundId(null);
    }
  }

  async function handleRoundStatus(roundId: number, status: string) {
    setError("");
    setSuccess("");
    try {
      await updateFacultyRoundStatus(Number(params.id), roundId, status);
      setSuccess("Round status updated.");
      await load();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to update round status.");
      await load();
    }
  }

  return (
    <AppShell expectedRole="FACULTY" title="Assigned Event Detail">
      <PageHeader
        title="Assigned Event Detail"
        subtitle="Read-only event view with result entry for assigned incharges."
        actions={<BackButton fallbackHref="/faculty/events" />}
      />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p> : null}
      {event ? (
        <div className="space-y-5">
          <EventSummary event={event} />
          <EventMediaManager eventId={Number(params.id)} mode="faculty" eventCompleted={event.status === "COMPLETED" || event.resultsPublished} />
          <Card>
            <h2 className="text-base font-bold text-kec-text">Reports</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" loading={reportDownloading === "pdf"} onClick={() => void downloadReport("pdf", () => downloadFacultyEventPdf(Number(params.id)))}>Download Event PDF</Button>
              <Button type="button" variant="secondary" loading={reportDownloading === "students"} onClick={() => void downloadReport("students", () => downloadFacultyEventStudentsExcel(Number(params.id)))}>Download Students Excel</Button>
              <Button type="button" variant="secondary" loading={reportDownloading === "teams"} onClick={() => void downloadReport("teams", () => downloadFacultyEventTeamsExcel(Number(params.id)))}>Download Teams Excel</Button>
              <Button type="button" variant="secondary" loading={reportDownloading === "results"} onClick={() => void downloadReport("results", () => downloadFacultyEventResultsExcel(Number(params.id)))}>Download Results Excel</Button>
            </div>
          </Card>
          <Card>
            <h2 className="text-base font-bold text-kec-text">Problem Statements</h2>
            <DataTable
              headers={["Title", "Description", "Links", "Status"]}
              rows={problemStatements.map((item) => [
                item.title,
                item.description ?? "-",
                item.links.length ? (
                  <div key="links" className="flex flex-wrap gap-2">
                    {item.links.map((link) => <a key={`${link.id}-${link.url}`} className="rounded-full bg-kec-purple/10 px-3 py-1 text-xs font-semibold text-kec-purple" href={link.url} target="_blank" rel="noopener noreferrer">{link.label || shortUrl(link.url)}</a>)}
                  </div>
                ) : "-",
                item.active ? "Active" : "Inactive"
              ])}
              emptyMessage="No problem statements."
            />
          </Card>
          <Card>
            <h2 className="text-base font-bold text-kec-text">Rounds</h2>
            <p className="mt-2 text-sm text-kec-secondary">Rounds are configured by the SuperAdmin. Publish each round result from the matching row.</p>
            <div className="mt-4">
              <DataTable
                headers={["Order", "Round", "Final", "Status", "Result Published", "Published At", "Publish"]}
                rows={rounds.map((round) => [
                  round.roundOrder,
                  round.roundName,
                  round.finalRound ? "Yes" : "No",
                  <Select key="status" label="Status" value={round.status} disabled={round.resultPublished} onChange={(changeEvent) => void handleRoundStatus(round.id, changeEvent.target.value)}>
                    {["NOT_STARTED", "ONGOING", "COMPLETED", "CANCELLED"].map((status) => <option key={status}>{status}</option>)}
                  </Select>,
                  round.resultPublished ? "Published / Locked" : "Not Published",
                  round.resultPublishedAt ? new Date(round.resultPublishedAt).toLocaleString() : "-",
                  <Button
                    key="publish"
                    type="button"
                    loading={publishingRoundId === round.id}
                    disabled={round.resultPublished || (round.finalRound && event.resultsPublished)}
                    onClick={() => void publishRound(round)}
                  >
                    {round.finalRound ? "Publish Final Result" : "Publish Round Result"}
                  </Button>
                ])}
                emptyMessage="No rounds configured."
              />
            </div>
          </Card>
          <div>
            <h2 className="mb-4 text-base font-bold text-kec-text">Event Registrations</h2>
            <EventRegistrationsTable registrations={registrations} />
          </div>
        </div>
      ) : <Card>Loading event...</Card>}
    </AppShell>
  );
}

function shortUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return value.length > 28 ? `${value.slice(0, 25)}...` : value;
  }
}
