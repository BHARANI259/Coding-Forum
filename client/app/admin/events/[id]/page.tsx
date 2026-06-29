"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import EventSummary from "@/components/events/EventSummary";
import EventRegistrationsTable from "@/components/events/EventRegistrationsTable";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import DataTable from "@/components/ui/DataTable";
import BackButton from "@/components/ui/BackButton";
import {
  createAdminRound,
  createProblemStatement,
  downloadAdminEventPdf,
  downloadAdminEventResultsExcel,
  downloadAdminEventStudentsExcel,
  downloadAdminEventTeamsExcel,
  getAdminEvent,
  getAdminEventRegistrations,
  getAdminProblemStatements,
  getAdminRounds,
  publishAdminResults,
  updateAdminRoundStatus,
  updateEventRegistration,
  updateEventStatus,
  updateProblemStatementStatus,
  type EventDetail,
  type EventRegistration,
  type EventRound,
  type ProblemStatement
} from "@/lib/api";

export default function AdminEventDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [problemTitle, setProblemTitle] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [problemLink, setProblemLink] = useState("");
  const [roundName, setRoundName] = useState("");
  const [roundOrder, setRoundOrder] = useState("1");
  const [roundFinal, setRoundFinal] = useState(false);
  const [reportDownloading, setReportDownloading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      setEvent(await getAdminEvent(id));
      setRegistrations(await getAdminEventRegistrations(id));
      setProblemStatements(await getAdminProblemStatements(id));
      setRounds(await getAdminRounds(id));
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load event.");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(status: string) {
    setEvent(await updateEventStatus(id, status));
  }

  async function toggleRegistration() {
    if (event) {
      setEvent(await updateEventRegistration(id, !event.registrationOpen));
    }
  }

  async function handleCreateProblem(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setError("");
    setSuccess("");
    try {
      await createProblemStatement(id, { title: problemTitle, description: problemDescription, referenceLink: problemLink, active: true });
      setProblemTitle("");
      setProblemDescription("");
      setProblemLink("");
      setSuccess("Problem statement added.");
      await load();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to add problem statement.");
    }
  }

  async function handleCreateRound(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setError("");
    setSuccess("");
    try {
      await createAdminRound(id, { roundName, roundOrder: Number(roundOrder), finalRound: roundFinal, description: "", scheduledAt: null });
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
      const response = await publishAdminResults(id);
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
    <AppShell expectedRole="SUPER_ADMIN" title="Event Detail">
      <PageHeader
        title="Event Detail"
        actions={(
          <>
            <BackButton fallbackHref="/admin/events" />
            <Link href={`/admin/events/${id}/results`}><Button>Manage Results</Button></Link>
            <Link href={`/admin/events/${id}/edit`}><Button variant="secondary">Edit Event</Button></Link>
          </>
        )}
      />
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p> : null}
      {event ? (
        <div className="space-y-5">
          <EventSummary event={event} />
          <Card>
            <h2 className="text-base font-bold text-kec-text">Admin Controls</h2>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <Select label="Status" value={event.status} onChange={(changeEvent) => void setStatus(changeEvent.target.value)}>
                {["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"].map((status) => <option key={status}>{status}</option>)}
              </Select>
              <Button type="button" variant="secondary" onClick={() => void toggleRegistration()}>{event.registrationOpen ? "Close Registration" : "Open Registration"}</Button>
              <Button type="button" onClick={() => void publishResults()} disabled={event.resultsPublished}>{event.resultsPublished ? "Results Published" : "Publish Results"}</Button>
            </div>
          </Card>
          <Card>
            <h2 className="text-base font-bold text-kec-text">Reports</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" loading={reportDownloading === "pdf"} onClick={() => void downloadReport("pdf", () => downloadAdminEventPdf(id))}>Download Event PDF</Button>
              <Button type="button" variant="secondary" loading={reportDownloading === "students"} onClick={() => void downloadReport("students", () => downloadAdminEventStudentsExcel(id))}>Download Students Excel</Button>
              <Button type="button" variant="secondary" loading={reportDownloading === "teams"} onClick={() => void downloadReport("teams", () => downloadAdminEventTeamsExcel(id))}>Download Teams Excel</Button>
              <Button type="button" variant="secondary" loading={reportDownloading === "results"} onClick={() => void downloadReport("results", () => downloadAdminEventResultsExcel(id))}>Download Results Excel</Button>
            </div>
          </Card>
          <Card>
            <h2 className="text-base font-bold text-kec-text">Problem Statements</h2>
            <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={handleCreateProblem}>
              <Input label="Title" value={problemTitle} onChange={(changeEvent) => setProblemTitle(changeEvent.target.value)} required />
              <Input label="Description" value={problemDescription} onChange={(changeEvent) => setProblemDescription(changeEvent.target.value)} />
              <Input label="Reference Link" value={problemLink} onChange={(changeEvent) => setProblemLink(changeEvent.target.value)} />
              <Button type="submit">Add</Button>
            </form>
            <div className="mt-4">
              <DataTable
                headers={["Title", "Link", "Status", "Action"]}
                rows={problemStatements.map((item) => [
                  item.title,
                  item.referenceLink ? <a key="link" className="font-semibold text-kec-purple" href={item.referenceLink} target="_blank" rel="noreferrer">Open</a> : "-",
                  item.active ? "Active" : "Inactive",
                  <Button key="status" type="button" variant="secondary" onClick={() => void updateProblemStatementStatus(id, item.id, !item.active).then(load)}>{item.active ? "Deactivate" : "Activate"}</Button>
                ])}
                emptyMessage="No problem statements."
              />
            </div>
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
                  <Select key="status" label="Status" value={round.status} onChange={(changeEvent) => void updateAdminRoundStatus(id, round.id, changeEvent.target.value).then(load)}>
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
