"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import EventSummary from "@/components/events/EventSummary";
import EventRegistrationsTable from "@/components/events/EventRegistrationsTable";
import EventMediaManager from "@/components/events/EventMediaManager";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import DataTable from "@/components/ui/DataTable";
import BackButton from "@/components/ui/BackButton";
import Badge from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/dateFormat";
import {
  createAdminRound,
  createProblemStatement,
  deleteProblemStatement,
  downloadAdminEventPdf,
  downloadAdminEventResultsExcel,
  downloadAdminEventStudentsExcel,
  downloadAdminEventTeamsExcel,
  getAdminEvent,
  getAdminEventRegistrations,
  getAdminProblemStatements,
  getAdminRounds,
  publishAdminFinalResult,
  publishAdminRoundResult,
  updateAdminRoundStatus,
  updateEventRegistration,
  updateEventStatus,
  updateProblemStatementStatus,
  updateProblemStatement,
  type EventDetail,
  type EventRegistration,
  type EventRound,
  type ProblemStatement,
  type ProblemStatementLink
} from "@/lib/api";
import {
  getEventIncharges,
  removeEventIncharge,
  updateEventIncharge,
  type EventInchargeAssignment
} from "@/lib/api/adminEventIncharges";
import { getAdminEventMedia, type EventMedia } from "@/lib/api/eventMedia";

export default function AdminEventDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [incharges, setIncharges] = useState<EventInchargeAssignment[]>([]);
  const [mediaItems, setMediaItems] = useState<EventMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInchargeId, setEditingInchargeId] = useState<number | null>(null);
  const [inchargeEdit, setInchargeEdit] = useState({ primaryIncharge: false, responsibility: "" });
  const [editingProblemId, setEditingProblemId] = useState<number | null>(null);
  const [problemForm, setProblemForm] = useState<ProblemFormState>(emptyProblemForm());
  const [roundName, setRoundName] = useState("");
  const [roundOrder, setRoundOrder] = useState("1");
  const [roundFinal, setRoundFinal] = useState(false);
  const [publishingRoundId, setPublishingRoundId] = useState<number | null>(null);
  const [reportDownloading, setReportDownloading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [eventData, registrationData, problemData, roundData, inchargeData, mediaData] = await Promise.all([
        getAdminEvent(id),
        getAdminEventRegistrations(id),
        getAdminProblemStatements(id),
        getAdminRounds(id),
        getEventIncharges(id),
        getAdminEventMedia(id)
      ]);
      setEvent(eventData);
      setRegistrations(registrationData);
      setProblemStatements(problemData);
      setRounds(roundData);
      setIncharges(inchargeData);
      setMediaItems(mediaData);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load event.");
    } finally {
      setLoading(false);
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

  async function handleSaveProblem(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setError("");
    setSuccess("");
    try {
      const links = problemForm.links
        .map((link, index) => ({
          ...link,
          displayOrder: index + 1,
          label: link.label?.trim() || null,
          url: link.url.trim()
        }))
        .filter((link) => link.url);
      const payload = {
        title: problemForm.title,
        description: problemForm.description,
        referenceLink: links[0]?.url ?? "",
        active: problemForm.active,
        links
      };
      if (editingProblemId) {
        await updateProblemStatement(id, editingProblemId, payload);
        setSuccess("Problem statement updated.");
      } else {
        await createProblemStatement(id, payload);
        setSuccess("Problem statement added.");
      }
      setEditingProblemId(null);
      setProblemForm(emptyProblemForm());
      await load();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to save problem statement.");
    }
  }

  async function removeProblem(problemStatementId: number) {
    if (!window.confirm("Delete this problem statement? Used problem statements will be deactivated instead.")) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      const response = await deleteProblemStatement(id, problemStatementId);
      setSuccess(response.active ? "Problem statement deleted." : "Problem statement is already used in registrations. It has been deactivated instead.");
      await load();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to delete problem statement.");
    }
  }

  function editProblem(item: ProblemStatement) {
    setEditingProblemId(item.id);
    setProblemForm({
      title: item.title,
      description: item.description ?? "",
      active: item.active,
      links: item.links.length ? item.links.map((link, index) => ({
        id: link.id,
        label: link.label ?? "",
        url: link.url,
        displayOrder: link.displayOrder ?? index + 1
      })) : (item.referenceLink ? [{ id: null, label: "Reference Link", url: item.referenceLink, displayOrder: 1 }] : [])
    });
  }

  function updateProblemLink(index: number, patch: Partial<ProblemStatementLink>) {
    setProblemForm((current) => ({
      ...current,
      links: current.links.map((link, linkIndex) => linkIndex === index ? { ...link, ...patch } : link)
    }));
  }

  function addProblemLink() {
    setProblemForm((current) => ({
      ...current,
      links: [...current.links, { id: null, label: "", url: "", displayOrder: current.links.length + 1 }]
    }));
  }

  function removeProblemLink(index: number) {
    setProblemForm((current) => ({
      ...current,
      links: current.links.filter((_, linkIndex) => linkIndex !== index).map((link, linkIndex) => ({ ...link, displayOrder: linkIndex + 1 }))
    }));
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

  async function handleRoundStatus(roundId: number, status: string) {
    setError("");
    setSuccess("");
    try {
      await updateAdminRoundStatus(id, roundId, status);
      setSuccess("Round status updated.");
      await load();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to update round status.");
      await load();
    }
  }

  async function handlePublishRound(round: EventRound) {
    setError("");
    setSuccess("");
    setPublishingRoundId(round.id);
    try {
      if (round.finalRound) {
        await publishAdminFinalResult(id, round.id);
        setSuccess("Final results have been published. Event is completed.");
      } else {
        await publishAdminRoundResult(id, round.id);
        setSuccess("Round result published. This round is now locked.");
      }
      await load();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to publish round result.");
    } finally {
      setPublishingRoundId(null);
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

  async function saveIncharge(assignmentId: number) {
    setError("");
    setSuccess("");
    try {
      await updateEventIncharge(assignmentId, inchargeEdit);
      setEditingInchargeId(null);
      setSuccess("Incharge updated.");
      await load();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to update incharge.");
    }
  }

  async function removeIncharge(assignmentId: number) {
    if (!window.confirm("Remove this faculty incharge from the event?")) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await removeEventIncharge(assignmentId);
      setSuccess("Incharge removed.");
      await load();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to remove incharge.");
    }
  }

  function editIncharge(assignment: EventInchargeAssignment) {
    setEditingInchargeId(assignment.assignmentId);
    setInchargeEdit({ primaryIncharge: assignment.primaryIncharge, responsibility: assignment.responsibility ?? "" });
  }

  const eventClosed = Boolean(event && (event.resultsPublished || event.status === "COMPLETED" || event.status === "CANCELLED"));
  const eventActive = Boolean(event && !eventClosed && (event.status === "PUBLISHED" || event.status === "ONGOING"));
  const setupEditable = event?.status === "DRAFT" && !eventClosed;
  const finalRoundAssigned = rounds.some((round) => round.finalRound);

  return (
    <AppShell expectedRole="SUPER_ADMIN" title="Event Detail">
      <PageHeader
        title="Event Detail"
        actions={(
          <>
            <BackButton fallbackHref="/admin/events" />
            {event?.status === "COMPLETED" || event?.resultsPublished ? (
              <Link href={`/admin/events/${id}/results`}><Button variant="secondary">View Final Results</Button></Link>
            ) : eventActive ? (
              <Link href={`/admin/events/${id}/results`}><Button>Manage Round Results</Button></Link>
            ) : null}
          </>
        )}
      />
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p> : null}
      {event ? (
        <div className="space-y-5">
          <EventSummary event={event} />
          {eventClosed ? (
            <p className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              This event is {event.status.toLowerCase()}. Event setup, registration, rounds, and results are read-only.
            </p>
          ) : null}
          <nav className="sticky top-[68px] z-10 flex gap-2 overflow-x-auto rounded-xl border border-kec-border bg-white/95 p-2 shadow-sm backdrop-blur" aria-label="Event detail sections">
            <a className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-kec-purple hover:bg-kec-purple/10" href="#event-setup">Setup</a>
            <a className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-kec-purple hover:bg-kec-purple/10" href="#event-participation">Participation</a>
            <a className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-kec-purple hover:bg-kec-purple/10" href="#event-reports">Reports</a>
            <a className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-kec-purple hover:bg-kec-purple/10" href="#event-media">Archive</a>
          </nav>
          <div id="event-setup" className="scroll-mt-28">
            <EventSetupChecklist
              event={event}
              inchargeCount={incharges.length}
              roundCount={rounds.length}
              finalRoundCount={rounds.filter((round) => round.finalRound).length}
              problemStatementCount={problemStatements.length}
              mediaCount={mediaItems.length}
            />
          </div>
          <Card id="admin-controls">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-bold text-kec-text">Faculty Incharges</h2>
              {!eventClosed ? <Link href={`/admin/event-incharges?eventId=${id}`}><Button type="button" variant="secondary">Manage Incharges</Button></Link> : null}
            </div>
            <div className="mt-4">
              <DataTable
                headers={["Faculty", "Code", "Department", "Email", "Primary", "Responsibility", "Assigned At", "Actions"]}
                rows={incharges.map((assignment) => [
                  assignment.facultyName,
                  assignment.facultyCode ?? "-",
                  assignment.facultyDepartmentCode ?? "-",
                  assignment.facultyEmail,
                  editingInchargeId === assignment.assignmentId ? (
                    <input key="primary" type="checkbox" checked={inchargeEdit.primaryIncharge} onChange={(changeEvent) => setInchargeEdit({ ...inchargeEdit, primaryIncharge: changeEvent.target.checked })} />
                  ) : (
                    <Badge key="primary" variant={assignment.primaryIncharge ? "purple" : "default"}>{assignment.primaryIncharge ? "Primary" : "Co-incharge"}</Badge>
                  ),
                  editingInchargeId === assignment.assignmentId ? (
                    <Input key="responsibility" label="Responsibility" value={inchargeEdit.responsibility} onChange={(changeEvent) => setInchargeEdit({ ...inchargeEdit, responsibility: changeEvent.target.value })} />
                  ) : assignment.responsibility ?? "-",
                  formatDateTime(assignment.assignedAt),
                  <div key="actions" className="flex flex-wrap gap-2">
                    {eventClosed ? "Read-only" : editingInchargeId === assignment.assignmentId ? (
                      <>
                        <Button type="button" onClick={() => void saveIncharge(assignment.assignmentId)}>Save</Button>
                        <Button type="button" variant="secondary" onClick={() => setEditingInchargeId(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button type="button" variant="secondary" onClick={() => editIncharge(assignment)}>Edit</Button>
                        <Button type="button" variant="danger" onClick={() => void removeIncharge(assignment.assignmentId)}>Remove</Button>
                      </>
                    )}
                  </div>
                ])}
                emptyMessage="No faculty incharges assigned."
              />
            </div>
          </Card>
          <Card id="event-reports" className="scroll-mt-28">
            <h2 className="text-base font-bold text-kec-text">Admin Controls</h2>
            {eventClosed ? (
              <p className="mt-2 text-sm text-kec-secondary">No lifecycle actions are available after an event is completed or cancelled.</p>
            ) : (
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <Select label="Event Status" value={event.status} onChange={(changeEvent) => void setStatus(changeEvent.target.value)}>
                  {event.status === "DRAFT" ? <option value="DRAFT">Draft</option> : null}
                  {event.status === "DRAFT" || event.status === "PUBLISHED" ? <option value="PUBLISHED">Published</option> : null}
                  {event.status === "PUBLISHED" || event.status === "ONGOING" ? <option value="ONGOING">Ongoing</option> : null}
                </Select>
                {event.status === "PUBLISHED" ? (
                  <Button type="button" variant="secondary" onClick={() => void toggleRegistration()}>
                    {event.registrationOpen ? "Close Registration" : "Open Registration"}
                  </Button>
                ) : null}
              </div>
            )}
          </Card>
          <Card>
            <h2 className="text-base font-bold text-kec-text">Reports</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" loading={reportDownloading === "pdf"} onClick={() => void downloadReport("pdf", () => downloadAdminEventPdf(id))}>Download Event Report (PDF)</Button>
              <Button type="button" variant="secondary" loading={reportDownloading === "students"} onClick={() => void downloadReport("students", () => downloadAdminEventStudentsExcel(id))}>Download Participant List (Excel)</Button>
              <Button type="button" variant="secondary" loading={reportDownloading === "teams"} onClick={() => void downloadReport("teams", () => downloadAdminEventTeamsExcel(id))}>Download Team List (Excel)</Button>
              <Button type="button" variant="secondary" loading={reportDownloading === "results"} onClick={() => void downloadReport("results", () => downloadAdminEventResultsExcel(id))}>Download Result List (Excel)</Button>
            </div>
          </Card>
          <Card>
            <div id="problem-statements" className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-kec-text">Problem Statements</h2>
                <p className="mt-1 text-sm text-kec-secondary">Add event problem statements with multiple reference links.</p>
              </div>
              {!eventClosed && editingProblemId ? <Button type="button" variant="secondary" onClick={() => { setEditingProblemId(null); setProblemForm(emptyProblemForm()); }}>Cancel Edit</Button> : null}
            </div>
            {!eventClosed ? <form className="mt-4 space-y-4 rounded-xl border border-kec-border p-3 sm:p-4" onSubmit={handleSaveProblem}>
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Title" value={problemForm.title} onChange={(changeEvent) => setProblemForm({ ...problemForm, title: changeEvent.target.value })} required />
                <label className="flex items-end gap-2 pb-3 text-sm font-semibold text-kec-text">
                  <input type="checkbox" checked={problemForm.active} onChange={(changeEvent) => setProblemForm({ ...problemForm, active: changeEvent.target.checked })} />
                  Active
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-kec-text">Description</span>
                <textarea className="mt-2 min-h-24 w-full rounded-lg border border-kec-border px-3 py-2 text-sm outline-none focus:border-kec-purple focus:ring-4 focus:ring-kec-purple/15" value={problemForm.description} onChange={(changeEvent) => setProblemForm({ ...problemForm, description: changeEvent.target.value })} required />
              </label>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-kec-text">Reference Links</p>
                  <Button type="button" variant="secondary" onClick={addProblemLink}>Add Link</Button>
                </div>
                <div className="mt-3 space-y-3">
                  {problemForm.links.map((link, index) => (
                    <div key={index} className="grid gap-3 rounded-lg border border-kec-border p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
                      <Input label="Label" value={link.label ?? ""} onChange={(changeEvent) => updateProblemLink(index, { label: changeEvent.target.value })} />
                      <Input label="URL" type="url" value={link.url} onChange={(changeEvent) => updateProblemLink(index, { url: changeEvent.target.value })} />
                      <Button className="w-full self-end md:w-auto" type="button" variant="ghost" onClick={() => removeProblemLink(index)}>Remove</Button>
                    </div>
                  ))}
                  {!problemForm.links.length ? <p className="text-sm text-kec-muted">Reference links are optional. Add Google Drive, docs, websites, or dataset links if available.</p> : null}
                </div>
              </div>
              <Button type="submit" className="w-full sm:w-auto">{editingProblemId ? "Save Problem Statement" : "Add Problem Statement"}</Button>
            </form> : <p className="mt-3 text-sm text-kec-secondary">Problem statements are retained for reference and cannot be changed after the event closes.</p>}
            <div className="mt-4">
              <DataTable
                headers={["Title", "Description", "Links", "Status", "Actions"]}
                rows={problemStatements.map((item) => [
                  item.title,
                  item.description ?? "-",
                  item.links.length ? (
                    <div key="links" className="flex flex-wrap gap-2">
                      {item.links.map((link) => <a key={`${link.id}-${link.url}`} className="rounded-full bg-kec-purple/10 px-3 py-1 text-xs font-semibold text-kec-purple" href={link.url} target="_blank" rel="noopener noreferrer">{link.label || shortUrl(link.url)}</a>)}
                    </div>
                  ) : "-",
                  <Badge key="status" variant={item.active ? "success" : "default"}>{item.active ? "Active" : "Inactive"}</Badge>,
                  eventClosed ? "Read-only" : <div key="actions" className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={() => editProblem(item)}>Edit</Button>
                    <Button type="button" variant="secondary" onClick={() => void updateProblemStatementStatus(id, item.id, !item.active).then(load)}>{item.active ? "Deactivate" : "Activate"}</Button>
                    <Button type="button" variant="danger" onClick={() => void removeProblem(item.id)}>Delete</Button>
                  </div>
                ])}
                emptyMessage="No problem statements."
              />
            </div>
          </Card>
          <Card id="event-rounds" className="scroll-mt-28">
            <div>
              <h2 className="text-base font-bold text-kec-text">Event Rounds</h2>
              <p className="mt-1 text-sm text-kec-secondary">Configure the round order and publish each result separately.</p>
            </div>

            {setupEditable && !finalRoundAssigned ? (
              <form className="mt-4 rounded-xl border border-kec-border p-3 sm:p-4" onSubmit={handleCreateRound}>
                <div>
                  <h3 className="text-sm font-bold text-kec-text">Add New Round</h3>
                  <p className="mt-1 text-sm text-kec-secondary">Define the round name, order, and whether it is the final round.</p>
                </div>
                <div className="mt-4 grid items-end gap-3 md:grid-cols-[minmax(0,2fr)_minmax(120px,0.7fr)_auto_auto]">
                  <Input
                    id="event-rounds-round-name"
                    label="Round Name"
                    placeholder="e.g. Prelims"
                    value={roundName}
                    onChange={(changeEvent) => setRoundName(changeEvent.target.value)}
                    required
                  />
                  <Input
                    label="Order"
                    type="number"
                    min="1"
                    value={roundOrder}
                    onChange={(changeEvent) => setRoundOrder(changeEvent.target.value)}
                    required
                  />
                  <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-kec-text">
                    <button
                      className={`event-rounds-toggle ${roundFinal ? "event-rounds-toggle-on" : ""}`}
                      type="button"
                      role="switch"
                      aria-checked={roundFinal}
                      aria-label="Final round"
                      onClick={() => setRoundFinal((current) => !current)}
                    >
                      <span />
                    </button>
                    <span>Final Round</span>
                  </label>
                  <Button type="submit" className="w-full md:w-auto">Save Round</Button>
                </div>
              </form>
            ) : finalRoundAssigned ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <h3 className="text-sm font-bold text-amber-900">Final round assigned</h3>
                <p className="mt-1 text-sm text-amber-800">Round creation is closed because this event already has a final round.</p>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-kec-border bg-slate-50 p-3">
                <h3 className="text-sm font-bold text-kec-text">Round Structure Locked</h3>
                <p className="mt-1 text-sm text-kec-secondary">Round names, order, and final-round selection can be changed only while the event is in Draft.</p>
              </div>
            )}

            <div className="mt-5">
              <h3 className="text-sm font-bold text-kec-text">Configured Rounds</h3>
              <p className="mt-1 text-sm text-kec-secondary">Review progress and use the available action for each round.</p>

              {rounds.length ? (
                <div className="mt-3 space-y-3">
                  {[...rounds].sort((first, second) => first.roundOrder - second.roundOrder).map((round, index) => (
                    <article
                      className={`rounded-xl border p-4 ${round.finalRound ? "border-amber-200 bg-amber-50/40" : "border-kec-border bg-white"}`}
                      key={round.id}
                    >
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] lg:items-center">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-kec-purple/10 text-sm font-bold text-kec-purple" aria-hidden="true">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-bold text-kec-text">{round.roundName}</h4>
                              <Badge>Order {round.roundOrder}</Badge>
                              <Badge variant={round.finalRound ? "warning" : "default"}>{round.finalRound ? "Final Round" : "Not Final"}</Badge>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant={round.status === "COMPLETED" ? "success" : round.status === "CANCELLED" ? "error" : round.status === "ONGOING" ? "info" : "default"}>
                                {statusLabel(round.status)}
                              </Badge>
                              <Badge variant={round.resultPublished ? "success" : "error"}>{round.resultPublished ? "Result Published" : "Result Not Published"}</Badge>
                            </div>
                          </div>
                        </div>

                        <dl className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <dt className="text-xs font-semibold text-kec-muted">Result</dt>
                            <dd className="mt-1 font-medium text-kec-text">{round.resultPublished ? "Published and locked" : "Awaiting publication"}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-kec-muted">Published At</dt>
                            <dd className="mt-1 font-medium text-kec-text">{formatDateTime(round.resultPublishedAt, "Not published")}</dd>
                          </div>
                        </dl>

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          {round.status === "NOT_STARTED" && eventActive ? (
                              <Button className="w-full sm:w-auto" variant="secondary" type="button" onClick={() => void handleRoundStatus(round.id, "ONGOING")}>Start Round</Button>
                          ) : null}
                          {round.status === "ONGOING" && eventActive ? (
                              <Button
                                className="w-full sm:w-auto"
                                type="button"
                              loading={publishingRoundId === round.id}
                              onClick={() => void handlePublishRound(round)}
                            >
                              {round.finalRound ? "Publish Final Result" : "Publish Round Result"}
                            </Button>
                          ) : null}
                          {round.resultPublished ? <span className="self-center text-xs font-semibold text-green-700">Editing locked</span> : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-lg border border-dashed border-kec-border px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-kec-text">No rounds configured yet</p>
                  <p className="mt-1 text-sm text-kec-secondary">Add the first round to define how this event will progress.</p>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <h3 className="text-sm font-bold text-blue-900">How it works</h3>
              <p className="mt-1 text-sm leading-6 text-blue-800">Rounds appear to participants in the configured order. Publish each round separately; only the final round allows winner selection.</p>
            </div>
          </Card>
          <div id="event-participation" className="scroll-mt-28">
            <h2 className="mb-4 text-base font-bold text-kec-text">Event Registrations</h2>
            <EventRegistrationsTable registrations={registrations} />
          </div>
          <div id="event-media" className="scroll-mt-28">
            <EventMediaManager eventId={id} mode="admin" eventCompleted={event.status === "COMPLETED" || event.resultsPublished} readOnly={event.status === "CANCELLED"} onItemsChange={setMediaItems} />
          </div>
        </div>
      ) : (
        <Card>
          <div className="space-y-3">
            <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-72 animate-pulse rounded bg-slate-100" />
            <p className="text-sm text-kec-secondary">{loading ? "Loading event details..." : "Event not found."}</p>
          </div>
        </Card>
      )}
    </AppShell>
  );
}

function EventSetupChecklist({ event, inchargeCount, roundCount, finalRoundCount, problemStatementCount, mediaCount }: { event: EventDetail; inchargeCount: number; roundCount: number; finalRoundCount: number; problemStatementCount: number; mediaCount: number }) {
  const eventClosed = event.status === "COMPLETED" || event.status === "CANCELLED" || event.resultsPublished;
  const items = [
    {
      label: "Poster/Flyer uploaded",
      complete: Boolean(event.posterImageUrl),
      href: eventClosed ? null : `/admin/events/${event.id}/edit`,
      action: event.posterImageUrl ? "Review poster" : "Upload poster"
    },
    {
      label: "Faculty incharges assigned",
      complete: inchargeCount > 0,
      href: eventClosed ? null : `/admin/event-incharges?eventId=${event.id}`,
      action: inchargeCount > 0 ? "Review faculty" : "Assign faculty"
    },
    {
      label: "Rounds configured with one final",
      complete: roundCount > 0 && finalRoundCount === 1,
      href: "#event-rounds",
      action: roundCount > 0 ? "Review rounds" : "Add rounds"
    },
    {
      label: "Problem statements added",
      complete: problemStatementCount > 0,
      href: "#problem-statements",
      action: problemStatementCount > 0 ? "Review problems" : "Add problem"
    },
    {
      label: "Registration status set",
      complete: event.registrationOpen || event.status === "COMPLETED" || event.status === "CANCELLED",
      href: eventClosed ? null : "#admin-controls",
      action: "Review status"
    },
    {
      label: "Results published",
      complete: event.resultsPublished,
      href: `/admin/events/${event.id}/results`,
      action: event.resultsPublished ? "View results" : "Manage results"
    },
    {
      label: "Post-event media uploaded",
      complete: mediaCount > 0,
      href: "#event-media",
      action: "Upload media"
    }
  ];

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-kec-text">Event Setup Checklist</h2>
          <p className="mt-1 text-sm text-kec-secondary">Use this readiness guide before publishing, reviewing, or closing an event.</p>
        </div>
        <Badge variant={items.every((item) => item.complete) ? "success" : "warning"}>
          {items.filter((item) => item.complete).length}/{items.length} complete
        </Badge>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-3 rounded-xl border border-kec-border bg-slate-50 px-4 py-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${item.complete ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {item.complete ? "Complete" : "Missing"}
                </span>
                <p className="text-sm font-semibold text-kec-text">{item.label}</p>
              </div>
              <p className="mt-1 text-xs text-kec-secondary">{item.complete ? "Ready" : "Needs attention"}</p>
            </div>
            {item.href ? <Link className="shrink-0 text-xs font-semibold text-kec-purple hover:text-kec-purpleHover" href={item.href}>{item.action}</Link> : (
              <span className="shrink-0 text-xs font-semibold text-kec-muted">Read-only</span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

type ProblemFormState = {
  title: string;
  description: string;
  active: boolean;
  links: ProblemStatementLink[];
};

function emptyProblemForm(): ProblemFormState {
  return {
    title: "",
    description: "",
    active: true,
    links: []
  };
}

function shortUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return value.length > 28 ? `${value.slice(0, 25)}...` : value;
  }
}

function statusLabel(status: string) {
  if (status === "NOT_STARTED") {
    return "Upcoming";
  }
  return status.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
