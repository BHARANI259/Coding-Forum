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

  return (
    <AppShell expectedRole="SUPER_ADMIN" title="Event Detail">
      <PageHeader
        title="Event Detail"
        actions={(
          <>
            <BackButton fallbackHref="/admin/events" />
            <Link href={`/admin/events/${id}/results`}><Button>Manage Results</Button></Link>
          </>
        )}
      />
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p> : null}
      {event ? (
        <div className="space-y-5">
          <EventSummary event={event} />
          <EventSetupChecklist
            event={event}
            inchargeCount={incharges.length}
            roundCount={rounds.length}
            problemStatementCount={problemStatements.length}
            mediaCount={mediaItems.length}
          />
          <div id="event-media">
            <EventMediaManager eventId={id} mode="admin" eventCompleted={event.status === "COMPLETED" || event.resultsPublished} onItemsChange={setMediaItems} />
          </div>
          <Card id="admin-controls">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-bold text-kec-text">Faculty Incharges</h2>
              <Link href={`/admin/event-incharges?eventId=${id}`}><Button type="button" variant="secondary">Add Incharge</Button></Link>
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
                  assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleString() : "-",
                  <div key="actions" className="flex flex-wrap gap-2">
                    {editingInchargeId === assignment.assignmentId ? (
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
          <Card>
            <h2 className="text-base font-bold text-kec-text">Admin Controls</h2>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <Select label="Status" value={event.status} onChange={(changeEvent) => void setStatus(changeEvent.target.value)}>
                {["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"].map((status) => <option key={status}>{status}</option>)}
              </Select>
              <Button
                type="button"
                variant="secondary"
                disabled={!event.registrationOpen && (event.status === "COMPLETED" || event.status === "CANCELLED")}
                onClick={() => void toggleRegistration()}
              >
                {event.registrationOpen ? "Close Registration" : "Open Registration"}
              </Button>
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
            <div id="problem-statements" className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-kec-text">Problem Statements</h2>
                <p className="mt-1 text-sm text-kec-secondary">Add event problem statements with multiple reference links.</p>
              </div>
              {editingProblemId ? <Button type="button" variant="secondary" onClick={() => { setEditingProblemId(null); setProblemForm(emptyProblemForm()); }}>Cancel Edit</Button> : null}
            </div>
            <form className="mt-4 space-y-4 rounded-xl border border-kec-border p-4" onSubmit={handleSaveProblem}>
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
                    <div key={index} className="grid gap-3 rounded-lg border border-kec-border p-3 md:grid-cols-[1fr_2fr_auto]">
                      <Input label="Label" value={link.label ?? ""} onChange={(changeEvent) => updateProblemLink(index, { label: changeEvent.target.value })} />
                      <Input label="URL" type="url" value={link.url} onChange={(changeEvent) => updateProblemLink(index, { url: changeEvent.target.value })} />
                      <Button className="self-end" type="button" variant="ghost" onClick={() => removeProblemLink(index)}>Remove</Button>
                    </div>
                  ))}
                  {!problemForm.links.length ? <p className="text-sm text-kec-muted">Reference links are optional. Add Google Drive, docs, websites, or dataset links if available.</p> : null}
                </div>
              </div>
              <Button type="submit">{editingProblemId ? "Save Problem Statement" : "Add Problem Statement"}</Button>
            </form>
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
                  <div key="actions" className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={() => editProblem(item)}>Edit</Button>
                    <Button type="button" variant="secondary" onClick={() => void updateProblemStatementStatus(id, item.id, !item.active).then(load)}>{item.active ? "Deactivate" : "Activate"}</Button>
                    <Button type="button" variant="danger" onClick={() => void removeProblem(item.id)}>Delete</Button>
                  </div>
                ])}
                emptyMessage="No problem statements."
              />
            </div>
          </Card>
          <section id="event-rounds" className="event-rounds-card">
            <div className="event-rounds-header">
              <div className="event-rounds-heading">
                <div className="event-rounds-icon-box" aria-hidden="true">R</div>
                <div>
                  <h2 className="event-rounds-title">Event Rounds</h2>
                  <p className="event-rounds-subtitle">Configure the flow of rounds for this event and publish results round-wise.</p>
                </div>
              </div>
            </div>

            <form className="event-rounds-form-card" onSubmit={handleCreateRound}>
              <div>
                <h3 className="event-rounds-section-title">Add New Round</h3>
                <p className="event-rounds-section-subtitle">Define round details and the order of progression</p>
              </div>
              <div className="event-rounds-form-grid">
                <label className="event-rounds-field">
                  <span>Round Name</span>
                  <input
                    id="event-rounds-round-name"
                    className="event-rounds-input"
                    placeholder="e.g. Prelims"
                    value={roundName}
                    onChange={(changeEvent) => setRoundName(changeEvent.target.value)}
                    required
                  />
                </label>
                <label className="event-rounds-field">
                  <span>Order</span>
                  <input
                    className="event-rounds-input"
                    type="number"
                    min="1"
                    value={roundOrder}
                    onChange={(changeEvent) => setRoundOrder(changeEvent.target.value)}
                    required
                  />
                </label>
                <label className="event-rounds-toggle-row">
                  <button
                    className={`event-rounds-toggle ${roundFinal ? "event-rounds-toggle-on" : ""}`}
                    type="button"
                    role="switch"
                    aria-checked={roundFinal}
                    onClick={() => setRoundFinal((current) => !current)}
                  >
                    <span />
                  </button>
                  <span>Final Round</span>
                </label>
                <button className="event-rounds-save-btn" type="submit">Save Round</button>
              </div>
            </form>

            <div className="event-rounds-configured">
              <div>
                <h3 className="event-rounds-section-title">Configured Rounds</h3>
                <p className="event-rounds-section-subtitle">Manage and publish results for each round</p>
              </div>
              {rounds.length ? (
                <div className="event-rounds-timeline">
                  {[...rounds].sort((first, second) => first.roundOrder - second.roundOrder).map((round, index) => (
                    <article className={`event-rounds-item ${round.finalRound ? "event-rounds-item-final" : ""}`} key={round.id}>
                      <div className="event-rounds-marker">{index + 1}</div>
                      <div className="event-rounds-item-card">
                        <div className="event-rounds-round-main">
                          <div className="event-rounds-round-icon" aria-hidden="true">{round.finalRound ? "F" : round.status === "COMPLETED" ? "C" : "R"}</div>
                          <div>
                            <div className="event-rounds-round-title-row">
                              <h4 className="event-rounds-round-title">{round.roundName}</h4>
                              <span className="event-rounds-badge event-rounds-badge-order">Order: {round.roundOrder}</span>
                            </div>
                            <div className="event-rounds-badge-row">
                              <span className={`event-rounds-badge ${round.finalRound ? "event-rounds-badge-final" : "event-rounds-badge-neutral"}`}>
                                {round.finalRound ? "Final Round" : "Not Final"}
                              </span>
                              <span className={`event-rounds-badge ${statusBadgeClass(round.status)}`}>{statusLabel(round.status)}</span>
                              <span className={`event-rounds-badge ${round.resultPublished ? "event-rounds-badge-success" : "event-rounds-badge-danger"}`}>
                                {round.resultPublished ? "Published" : "Not Published"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="event-rounds-meta-grid">
                          <div>
                            <p className="event-rounds-meta-label">Status</p>
                            <select
                              id={`event-rounds-status-${round.id}`}
                              className="event-rounds-select"
                              value={round.status}
                              disabled={round.resultPublished}
                              onChange={(changeEvent) => void handleRoundStatus(round.id, changeEvent.target.value)}
                            >
                              {["NOT_STARTED", "ONGOING", "COMPLETED", "CANCELLED"].map((status) => <option key={status}>{status}</option>)}
                            </select>
                          </div>
                          <div>
                            <p className="event-rounds-meta-label">Result</p>
                            <p className="event-rounds-meta-value">{round.resultPublished ? "Published / Locked" : "Awaiting publish"}</p>
                          </div>
                          <div>
                            <p className="event-rounds-meta-label">Published At</p>
                            <p className="event-rounds-meta-value">{round.resultPublishedAt ? new Date(round.resultPublishedAt).toLocaleString() : "-"}</p>
                          </div>
                        </div>

                        <div className="event-rounds-actions">
                          <button
                            className="event-rounds-action-btn event-rounds-action-primary"
                            type="button"
                            disabled={round.resultPublished || (round.finalRound && event.resultsPublished)}
                            onClick={() => void handlePublishRound(round)}
                          >
                            {publishingRoundId === round.id ? "Publishing..." : round.finalRound ? "Publish Final Result" : "Publish Result"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="event-rounds-empty">
              <div className="event-rounds-empty-icon" aria-hidden="true">+</div>
                  <p>No rounds configured yet</p>
                  <span>Add the first round to define how this event will progress.</span>
                </div>
              )}
            </div>

            <div className="event-rounds-info-box">
              <div className="event-rounds-info-icon" aria-hidden="true">i</div>
              <div>
                <h3>How it works</h3>
                <p>Rounds will be displayed to participants in the order specified. Results can be published for each round individually. Only the final round allows winner selection.</p>
              </div>
            </div>
          </section>
          <div>
            <h2 className="mb-4 text-base font-bold text-kec-text">Event Registrations</h2>
            <EventRegistrationsTable registrations={registrations} />
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

function EventSetupChecklist({ event, inchargeCount, roundCount, problemStatementCount, mediaCount }: { event: EventDetail; inchargeCount: number; roundCount: number; problemStatementCount: number; mediaCount: number }) {
  const items = [
    {
      label: "Poster/Flyer uploaded",
      complete: Boolean(event.posterImageUrl),
      href: `/admin/events/${event.id}/edit`,
      action: "Upload poster"
    },
    {
      label: "Faculty incharges assigned",
      complete: inchargeCount > 0,
      href: `/admin/event-incharges?eventId=${event.id}`,
      action: "Assign faculty"
    },
    {
      label: "Rounds configured",
      complete: roundCount > 0,
      href: "#event-rounds",
      action: "Add rounds"
    },
    {
      label: "Problem statements added",
      complete: problemStatementCount > 0,
      href: "#problem-statements",
      action: "Add problem"
    },
    {
      label: "Registration status set",
      complete: event.registrationOpen || event.status === "COMPLETED" || event.status === "CANCELLED",
      href: "#admin-controls",
      action: "Review status"
    },
    {
      label: "Results published",
      complete: event.resultsPublished,
      href: `/admin/events/${event.id}/results`,
      action: "Manage results"
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
              <div className="flex items-center gap-2">
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${item.complete ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {item.complete ? "Y" : "!"}
                </span>
                <p className="text-sm font-semibold text-kec-text">{item.label}</p>
              </div>
              <p className="mt-1 text-xs text-kec-secondary">{item.complete ? "Ready" : "Needs attention"}</p>
            </div>
            <Link className="shrink-0 text-xs font-semibold text-kec-purple hover:text-kec-purpleHover" href={item.href}>{item.action}</Link>
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
  return status.replaceAll("_", " ");
}

function statusBadgeClass(status: string) {
  if (status === "COMPLETED") {
    return "event-rounds-badge-success";
  }
  if (status === "CANCELLED") {
    return "event-rounds-badge-danger";
  }
  if (status === "ONGOING") {
    return "event-rounds-badge-info";
  }
  return "event-rounds-badge-neutral";
}
