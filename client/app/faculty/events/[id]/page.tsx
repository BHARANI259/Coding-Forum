"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import EventSummary from "@/components/events/EventSummary";
import EventRegistrationsTable from "@/components/events/EventRegistrationsTable";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DataTable from "@/components/ui/DataTable";
import BackButton from "@/components/ui/BackButton";
import {
  createFacultyRound,
  downloadFacultyEventPdf,
  downloadFacultyEventResultsExcel,
  downloadFacultyEventStudentsExcel,
  downloadFacultyEventTeamsExcel,
  getFacultyEvent,
  getFacultyEventRegistrations,
  getFacultyProblemStatements,
  getFacultyRounds,
  publishFacultyResults,
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
  const [roundName, setRoundName] = useState("");
  const [roundOrder, setRoundOrder] = useState("1");
  const [roundFinal, setRoundFinal] = useState(false);
  const [reportDownloading, setReportDownloading] = useState("");
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

  async function handleCreateRound(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setError("");
    setSuccess("");
    try {
      await createFacultyRound(Number(params.id), { roundName, roundOrder: Number(roundOrder), finalRound: roundFinal, description: "", scheduledAt: null });
      setRoundName("");
      setRoundOrder(String(Number(roundOrder) + 1));
      setRoundFinal(false);
      setSuccess("Round added.");
      await load();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to add round.");
    }
  }

  async function publishResults() {
    setError("");
    setSuccess("");
    try {
      const response = await publishFacultyResults(Number(params.id));
      setSuccess(response.message);
      await load();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to publish results.");
    }
  }

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

  return (
    <AppShell expectedRole="FACULTY" title="Assigned Event Detail">
      <PageHeader
        title="Assigned Event Detail"
        subtitle="Read-only event view with result entry for assigned incharges."
        actions={(
          <>
            <BackButton fallbackHref="/faculty/events" />
            <Link href={`/faculty/events/${params.id}/results`}><Button>Enter Results</Button></Link>
          </>
        )}
      />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p> : null}
      {event ? (
        <div className="space-y-5">
          <EventSummary event={event} />
          <Card>
            <h2 className="text-base font-bold text-kec-text">Result Publish</h2>
            <p className="mt-2 text-sm text-kec-secondary">Publishing results completes the event and closes registration.</p>
            <Button className="mt-4" type="button" disabled={event.resultsPublished} onClick={() => void publishResults()}>{event.resultsPublished ? "Results Published" : "Publish Results"}</Button>
          </Card>
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
              headers={["Title", "Description", "Link", "Status"]}
              rows={problemStatements.map((item) => [
                item.title,
                item.description ?? "-",
                item.referenceLink ? <a key="link" className="font-semibold text-kec-purple" href={item.referenceLink} target="_blank" rel="noreferrer">Open</a> : "-",
                item.active ? "Active" : "Inactive"
              ])}
              emptyMessage="No problem statements."
            />
          </Card>
          <Card>
            <h2 className="text-base font-bold text-kec-text">Rounds</h2>
            <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={handleCreateRound}>
              <Input label="Round Name" value={roundName} onChange={(changeEvent) => setRoundName(changeEvent.target.value)} required />
              <Input label="Order" type="number" value={roundOrder} onChange={(changeEvent) => setRoundOrder(changeEvent.target.value)} required />
              <label className="flex items-end gap-2 pb-3 text-sm font-semibold text-kec-text">
                <input type="checkbox" checked={roundFinal} onChange={(changeEvent) => setRoundFinal(changeEvent.target.checked)} />
                Final round
              </label>
              <Button type="submit">Add Round</Button>
            </form>
            <div className="mt-4">
              <DataTable
                headers={["Order", "Round", "Final", "Status", "Update"]}
                rows={rounds.map((round) => [
                  round.roundOrder,
                  round.roundName,
                  round.finalRound ? "Yes" : "No",
                  round.status,
                  <Select key="status" label="Status" value={round.status} onChange={(changeEvent) => void updateFacultyRoundStatus(Number(params.id), round.id, changeEvent.target.value).then(load)}>
                    {["NOT_STARTED", "ONGOING", "COMPLETED", "CANCELLED"].map((status) => <option key={status}>{status}</option>)}
                  </Select>
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
