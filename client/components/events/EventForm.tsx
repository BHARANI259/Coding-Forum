"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import EventPosterUpload from "@/components/events/EventPosterUpload";
import {
  createEvent,
  createAdminRound,
  createProblemStatement,
  getDepartments,
  getEventCategories,
  getFaculty,
  updateEvent,
  type Department,
  type EventDetail,
  type EventPayload,
  type EventCategory,
  type Faculty,
  type ProblemStatementLink,
  type RoundPayload
} from "@/lib/api";
import { removeEventPoster, uploadEventPoster } from "@/lib/api/adminEventPosters";

type EventFormProps = {
  mode: "create" | "edit";
  event?: EventDetail;
};

type FormState = {
  title: string;
  description: string;
  categoryId: string;
  eventType: "TEAM" | "INDIVIDUAL";
  venue: string;
  startDatetime: string;
  endDatetime: string;
  registrationStart: string;
  registrationEnd: string;
  registrationOpen: boolean;
  status: string;
  minTeamSize: string;
  maxTeamSize: string;
  maxParticipants: string;
  maxTeams: string;
  placementWillingOnly: boolean;
  mandatoryEvent: boolean;
  allowedDepartmentIds: number[];
  allowedYears: number[];
  allowedSections: string[];
  allowedTechnicalAreas: string[];
  inchargeFacultyIds: number[];
};

type ProblemDraft = {
  title: string;
  description: string;
  active: boolean;
  links: ProblemStatementLink[];
};

type RoundDraft = {
  roundName: string;
  roundOrder: string;
  finalRound: boolean;
  description: string;
  scheduledAt: string;
};

const initialState: FormState = {
  title: "",
  description: "",
  categoryId: "",
  eventType: "INDIVIDUAL",
  venue: "",
  startDatetime: "",
  endDatetime: "",
  registrationStart: "",
  registrationEnd: "",
  registrationOpen: false,
  status: "DRAFT",
  minTeamSize: "",
  maxTeamSize: "",
  maxParticipants: "",
  maxTeams: "",
  placementWillingOnly: false,
  mandatoryEvent: false,
  allowedDepartmentIds: [],
  allowedYears: [],
  allowedSections: [],
  allowedTechnicalAreas: [],
  inchargeFacultyIds: []
};

export default function EventForm({ mode, event }: EventFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [form, setForm] = useState<FormState>(() => event ? fromEvent(event) : initialState);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [problemDrafts, setProblemDrafts] = useState<ProblemDraft[]>([]);
  const [roundDrafts, setRoundDrafts] = useState<RoundDraft[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingPoster, setRemovingPoster] = useState(false);
  const selectedCategory = categories.find((category) => String(category.id) === form.categoryId) ?? null;
  const isContestCategory = selectedCategory?.categoryType === "CONTEST";
  const isDomainCategory = selectedCategory?.categoryType === "DOMAIN";
  const problemLabel = isDomainCategory ? "Domain" : "Problem Statement";
  const problemPluralLabel = isDomainCategory ? "Domains" : "Problem Statements";
  const finalRoundAssigned = cleanRoundDrafts(roundDrafts).some((round) => round.finalRound);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [categoryList, departmentList, facultyPage] = await Promise.all([
          getEventCategories({ active: true }),
          getDepartments(),
          getFaculty({ size: 100 })
        ]);
        setCategories(categoryList);
        setDepartments(departmentList);
        setFaculty(facultyPage.content);
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load event options.");
      }
    }
    void loadOptions();
  }, []);

  async function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setSaving(true);
    setError("");
    try {
      const applicableProblemDrafts = isContestCategory ? [] : problemDrafts;
      validateProblemDrafts(applicableProblemDrafts, problemLabel);
      const incompleteLink = applicableProblemDrafts.some((item) => item.links.some((link) => (link.label ?? "").trim() && !link.url.trim()));
      if (incompleteLink) {
        throw new Error("Every reference link with a label needs a URL. Complete it or remove the link row before saving.");
      }
      validateRoundDrafts(roundDrafts);
      const payload = toPayload(form);
      const saved = mode === "create" ? await createEvent(payload) : await updateEvent(event?.id ?? 0, payload);
      if (posterFile) {
        await uploadEventPoster(saved.id, posterFile);
      }
      for (const draft of cleanProblemDrafts(applicableProblemDrafts)) {
        const links = draft.links
          .map((link, index) => ({
            id: null,
            label: link.label?.trim() || null,
            url: link.url.trim(),
            displayOrder: index + 1
          }))
          .filter((link) => link.url);
        await createProblemStatement(saved.id, {
          title: draft.title.trim(),
          description: draft.description.trim(),
          active: draft.active,
          referenceLink: links[0]?.url ?? "",
          links
        });
      }
      for (const draft of cleanRoundDrafts(roundDrafts)) {
        const roundPayload: RoundPayload = {
          roundName: draft.roundName.trim(),
          roundOrder: Number(draft.roundOrder),
          finalRound: draft.finalRound,
          description: draft.description.trim(),
          scheduledAt: toIso(draft.scheduledAt)
        };
        await createAdminRound(saved.id, roundPayload);
      }
      router.push(`/admin/events/${saved.id}`);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to save event.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemovePoster() {
    if (!event?.id || !window.confirm("Remove this event poster?")) {
      return;
    }
    setRemovingPoster(true);
    setError("");
    try {
      await removeEventPoster(event.id);
      router.refresh();
      window.location.reload();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to remove poster.");
    } finally {
      setRemovingPoster(false);
    }
  }

  function toggleNumber(listName: "allowedDepartmentIds" | "allowedYears" | "inchargeFacultyIds", value: number) {
    setForm((current) => {
      const list = current[listName];
      return { ...current, [listName]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] };
    });
  }

  function toggleText(listName: "allowedTechnicalAreas" | "allowedSections", value: string) {
    setForm((current) => {
      const list = current[listName];
      return { ...current, [listName]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] };
    });
  }

  function addProblemDraft() {
    setProblemDrafts((current) => [...current, { title: "", description: "", active: true, links: [] }]);
  }

  function updateProblemDraft(index: number, patch: Partial<ProblemDraft>) {
    setProblemDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function removeProblemDraft(index: number) {
    setProblemDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function addProblemDraftLink(index: number) {
    setProblemDrafts((current) => current.map((item, itemIndex) => itemIndex === index
      ? { ...item, links: [...item.links, { id: null, label: "", url: "", displayOrder: item.links.length + 1 }] }
      : item));
  }

  function updateProblemDraftLink(problemIndex: number, linkIndex: number, patch: Partial<ProblemStatementLink>) {
    setProblemDrafts((current) => current.map((item, itemIndex) => itemIndex === problemIndex
      ? { ...item, links: item.links.map((link, index) => index === linkIndex ? { ...link, ...patch } : link) }
      : item));
  }

  function removeProblemDraftLink(problemIndex: number, linkIndex: number) {
    setProblemDrafts((current) => current.map((item, itemIndex) => itemIndex === problemIndex
      ? { ...item, links: item.links.filter((_, index) => index !== linkIndex) }
      : item));
  }

  function addRoundDraft() {
    if (finalRoundAssigned) {
      return;
    }
    setRoundDrafts((current) => [
      ...current,
      {
        roundName: "",
        roundOrder: String(nextRoundOrder(current)),
        finalRound: current.length === 0,
        description: "",
        scheduledAt: ""
      }
    ]);
  }

  function updateRoundDraft(index: number, patch: Partial<RoundDraft>) {
    setRoundDrafts((current) => current.map((item, itemIndex) => {
      if (patch.finalRound === true && itemIndex !== index) {
        return { ...item, finalRound: false };
      }
      return itemIndex === index ? { ...item, ...patch } : item;
    }));
  }

  function removeRoundDraft(index: number) {
    setRoundDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <Card>
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Events are saved as Draft first. After saving, configure exactly one final round and verify the setup checklist before publishing.
        </div>
        <h2 className="text-base font-bold text-kec-text">Basic Details</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Select label="Category" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
            <option value="">Select category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </Select>
          {selectedCategory ? (
            <div className="rounded-lg border border-kec-border bg-kec-bg px-3 py-2 text-sm text-kec-secondary md:col-span-2">
              <span className="font-bold text-kec-text">Workflow:</span> {formatCategoryType(selectedCategory.categoryType)}
              {isContestCategory ? " - Problem/domain selection is skipped. Import Codetantra marks from the final round result page." : null}
              {isDomainCategory ? " - Students will choose a domain during registration when active domains are configured." : null}
            </div>
          ) : null}
          <Select label="Event Type" value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value as FormState["eventType"] })}>
            <option value="INDIVIDUAL">Individual</option>
            <option value="TEAM">Team</option>
          </Select>
          <Input label="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-kec-text">Description</span>
          <textarea className="mt-2 min-h-28 w-full rounded-lg border border-kec-border px-3 py-2 text-base outline-none focus:border-kec-purple focus:ring-4 focus:ring-kec-purple/15 sm:text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
      </Card>

      <Card>
        <EventPosterUpload
          event={event}
          selectedFile={posterFile}
          onFileChange={setPosterFile}
          onRemove={mode === "edit" ? () => void handleRemovePoster() : undefined}
          removing={removingPoster}
          disabled={saving}
        />
      </Card>

      {isContestCategory ? (
        <Card>
          <h2 className="text-base font-bold text-kec-text">Contest Setup</h2>
          <p className="mt-1 text-sm text-kec-secondary">Contest categories do not need problem statement or domain selection. Use the final round result page to import marks from Codetantra Excel.</p>
          <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-kec-text">
            <input type="checkbox" checked={form.mandatoryEvent} onChange={(e) => setForm({ ...form, mandatoryEvent: e.target.checked })} />
            Mandatory contest for all eligible students
          </label>
          <p className="mt-2 text-xs text-kec-muted">Department, year, section, technical area, and placement restrictions below still apply.</p>
        </Card>
      ) : null}

      <details className={`${isContestCategory ? "hidden" : ""} rounded-xl border border-kec-border bg-white p-3 shadow-sm sm:p-4`}>
        <summary className="cursor-pointer text-base font-bold text-kec-text">Optional {problemPluralLabel}</summary>
        <p className="mt-1 text-sm text-kec-secondary">Add them now, or manage them from Event Detail after saving.</p>
      <Card className="mt-4 border-0 p-0 shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-kec-text">{problemPluralLabel}</h2>
            <p className="mt-1 text-sm text-kec-secondary">
              Add {problemPluralLabel.toLowerCase()} now, or manage them later from the event detail page.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={addProblemDraft}>Add {problemLabel}</Button>
        </div>
        {mode === "edit" && event ? (
          <p className="mt-3 rounded-lg border border-kec-border bg-slate-50 px-3 py-2 text-sm text-kec-secondary">
            Existing {problemPluralLabel.toLowerCase()} are edited from the event detail page. New entries added here will be appended when you update the event.
          </p>
        ) : null}
        <div className="mt-4 space-y-4">
          {problemDrafts.map((draft, problemIndex) => (
            <div key={problemIndex} className="rounded-xl border border-kec-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-kec-text">{problemLabel} {problemIndex + 1}</h3>
                <Button type="button" variant="ghost" onClick={() => removeProblemDraft(problemIndex)}>Remove</Button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input label="Title" value={draft.title} onChange={(event) => updateProblemDraft(problemIndex, { title: event.target.value })} />
                <label className="flex items-end gap-2 pb-3 text-sm font-semibold text-kec-text">
                  <input type="checkbox" checked={draft.active} onChange={(event) => updateProblemDraft(problemIndex, { active: event.target.checked })} />
                  Active
                </label>
              </div>
              <label className="mt-3 block">
                <span className="text-sm font-semibold text-kec-text">Description</span>
                <textarea className="mt-2 min-h-20 w-full rounded-lg border border-kec-border px-3 py-2 text-base outline-none focus:border-kec-purple focus:ring-4 focus:ring-kec-purple/15 sm:text-sm" value={draft.description} onChange={(event) => updateProblemDraft(problemIndex, { description: event.target.value })} />
              </label>
              <div className="mt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-kec-text">Reference Links</p>
                  <Button type="button" variant="secondary" onClick={() => addProblemDraftLink(problemIndex)}>Add Link</Button>
                </div>
                <div className="mt-3 space-y-3">
                  {draft.links.map((link, linkIndex) => (
                    <div key={linkIndex} className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
                      <Input label="Label" value={link.label ?? ""} onChange={(event) => updateProblemDraftLink(problemIndex, linkIndex, { label: event.target.value })} />
                      <Input label="URL" type="url" value={link.url} onChange={(event) => updateProblemDraftLink(problemIndex, linkIndex, { url: event.target.value })} />
                      <Button className="self-end" type="button" variant="ghost" onClick={() => removeProblemDraftLink(problemIndex, linkIndex)}>Remove</Button>
                    </div>
                  ))}
                  {!draft.links.length ? <p className="text-sm text-kec-muted">No links added. Links are optional.</p> : null}
                </div>
              </div>
            </div>
          ))}
          {!problemDrafts.length ? <p className="text-sm text-kec-secondary">No {problemPluralLabel.toLowerCase()} added yet.</p> : null}
        </div>
      </Card>
      </details>

      <details className="rounded-xl border border-kec-border bg-white p-3 shadow-sm sm:p-4" open={mode === "create"}>
        <summary className="cursor-pointer text-base font-bold text-kec-text">Event Rounds</summary>
        <p className="mt-1 text-sm text-kec-secondary">Add the round structure while creating the event. You can still manage rounds from Event Detail after saving.</p>
        <Card className="mt-4 border-0 p-0 shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-kec-text">Rounds</h2>
              <p className="mt-1 text-sm text-kec-secondary">Configure round names, order, and the final round.</p>
            </div>
            {!finalRoundAssigned ? (
              <Button type="button" variant="secondary" onClick={addRoundDraft}>Add Round</Button>
            ) : null}
          </div>
          {finalRoundAssigned ? (
            <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              Final round assigned. The round list is closed for new additions. Remove or unmark the final round to add more rounds.
            </p>
          ) : null}
          <div className="mt-4 space-y-3">
            {roundDrafts.map((draft, roundIndex) => (
              <div key={roundIndex} className="rounded-xl border border-kec-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-kec-text">Round {roundIndex + 1}</h3>
                  <Button type="button" variant="ghost" onClick={() => removeRoundDraft(roundIndex)}>Remove</Button>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[2fr_0.8fr_1fr]">
                  <Input label="Round Name" placeholder="e.g. Prelims" value={draft.roundName} onChange={(event) => updateRoundDraft(roundIndex, { roundName: event.target.value })} />
                  <Input label="Order" type="number" min={1} value={draft.roundOrder} onChange={(event) => updateRoundDraft(roundIndex, { roundOrder: event.target.value })} />
                  <label className="flex items-end gap-2 pb-3 text-sm font-semibold text-kec-text">
                    <input
                      type="checkbox"
                      checked={draft.finalRound}
                      onChange={(event) => updateRoundDraft(roundIndex, { finalRound: event.target.checked })}
                    />
                    Final round
                  </label>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Input label="Scheduled At" type="datetime-local" value={draft.scheduledAt} onChange={(event) => updateRoundDraft(roundIndex, { scheduledAt: event.target.value })} />
                  <label className="block">
                    <span className="text-sm font-semibold text-kec-text">Description</span>
                    <textarea
                      className="mt-2 min-h-11 w-full rounded-lg border border-kec-border px-3 py-2 text-base outline-none focus:border-kec-purple focus:ring-4 focus:ring-kec-purple/15 sm:text-sm"
                      value={draft.description}
                      onChange={(event) => updateRoundDraft(roundIndex, { description: event.target.value })}
                    />
                  </label>
                </div>
              </div>
            ))}
            {!roundDrafts.length ? (
              <p className="rounded-lg border border-dashed border-kec-border bg-slate-50 px-3 py-4 text-sm text-kec-secondary">
                No rounds added yet. Add rounds now, or configure them from the event detail page after creating the event.
              </p>
            ) : null}
          </div>
        </Card>
      </details>

      <Card>
        <h2 className="text-base font-bold text-kec-text">Date & Registration</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input label="Start Date Time" type="datetime-local" value={form.startDatetime} onChange={(e) => setForm({ ...form, startDatetime: e.target.value })} />
          <Input label="End Date Time" type="datetime-local" value={form.endDatetime} onChange={(e) => setForm({ ...form, endDatetime: e.target.value })} />
          <Input label="Registration Start" type="datetime-local" value={form.registrationStart} onChange={(e) => setForm({ ...form, registrationStart: e.target.value })} />
          <Input label="Registration End" type="datetime-local" value={form.registrationEnd} onChange={(e) => setForm({ ...form, registrationEnd: e.target.value })} />
          {mode === "edit" && event?.status === "PUBLISHED" ? (
            <label className="flex items-end gap-2 pb-3 text-sm font-semibold text-kec-text">
              <input type="checkbox" checked={form.registrationOpen} onChange={(e) => setForm({ ...form, registrationOpen: e.target.checked })} />
              Registration open
            </label>
          ) : (
            <p className="self-end pb-3 text-sm text-kec-secondary">Registration can be opened from Event Detail after the event is published.</p>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-bold text-kec-text">Team & Capacity</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Input label="Min Team Size" type="number" disabled={form.eventType !== "TEAM"} value={form.minTeamSize} onChange={(e) => setForm({ ...form, minTeamSize: e.target.value })} />
          <Input label="Max Team Size" type="number" disabled={form.eventType !== "TEAM"} value={form.maxTeamSize} onChange={(e) => setForm({ ...form, maxTeamSize: e.target.value })} />
          <Input label="Max Teams" type="number" disabled={form.eventType !== "TEAM"} value={form.maxTeams} onChange={(e) => setForm({ ...form, maxTeams: e.target.value })} />
          <Input label="Max Participants" type="number" value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })} />
        </div>
      </Card>

      <details className="rounded-xl border border-kec-border bg-white p-3 shadow-sm sm:p-4">
        <summary className="cursor-pointer text-base font-bold text-kec-text">Eligibility Restrictions</summary>
        <p className="mt-1 text-sm text-kec-secondary">Optional filters for departments, years, sections, technical area, and placement preference.</p>
      <Card className="mt-4 border-0 p-0 shadow-none">
        <h2 className="text-base font-bold text-kec-text">Restrictions</h2>
        <div className="mt-4 space-y-4">
          <Checklist title="Allowed Departments" items={departments.map((department) => ({ id: department.id, label: department.code }))} selected={form.allowedDepartmentIds} onToggle={(id) => toggleNumber("allowedDepartmentIds", id)} emptyLabel="No departments found." />
          <Checklist title="Allowed Years" items={[1, 2, 3, 4, 5].map((year) => ({ id: year, label: `Year ${year}` }))} selected={form.allowedYears} onToggle={(id) => toggleNumber("allowedYears", id)} />
          <TextChecklist title="Allowed Technical Areas" items={["SOFTWARE", "HARDWARE"]} selected={form.allowedTechnicalAreas} onToggle={(value) => toggleText("allowedTechnicalAreas", value)} />
          <TextChecklist title="Allowed Sections" items={["A", "B", "C", "D", "E"]} selected={form.allowedSections} onToggle={(value) => toggleText("allowedSections", value)} />
          <p className="text-xs text-kec-muted">Leave every section unselected to allow all sections.</p>
          <label className="flex items-center gap-2 text-sm font-semibold text-kec-text">
            <input type="checkbox" checked={form.placementWillingOnly} onChange={(e) => setForm({ ...form, placementWillingOnly: e.target.checked })} />
            Placement willing students only
          </label>
        </div>
      </Card>
      </details>

      <Card>
        <h2 className="text-base font-bold text-kec-text">Review Before Saving</h2>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <ReviewItem label="Event Type" value={form.eventType === "TEAM" ? "Team event" : "Individual event"} />
          <ReviewItem label="Departments" value={form.allowedDepartmentIds.length ? `${form.allowedDepartmentIds.length} selected` : "All departments"} />
          <ReviewItem label="Incharges" value={form.inchargeFacultyIds.length ? `${form.inchargeFacultyIds.length} selected` : "Assign after saving"} />
          <ReviewItem label="Rounds" value={roundDrafts.length ? `${roundDrafts.length} draft round${roundDrafts.length === 1 ? "" : "s"}` : "Add after saving"} />
          <ReviewItem label="Initial State" value={mode === "create" ? "Draft, registration closed" : formatFormStatus(form.status)} />
        </div>
      </Card>

      <details className="rounded-xl border border-kec-border bg-white p-3 shadow-sm sm:p-4">
        <summary className="cursor-pointer text-base font-bold text-kec-text">Faculty Incharges</summary>
        <p className="mt-1 text-sm text-kec-secondary">Select one or more active faculty coordinators.</p>
      <Card className="mt-4 border-0 p-0 shadow-none">
        <h2 className="text-base font-bold text-kec-text">Event Incharges</h2>
        {form.inchargeFacultyIds.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {form.inchargeFacultyIds.map((id) => {
              const member = faculty.find((item) => item.id === id);
              return (
                <span key={id} className="rounded-full bg-kec-purple/10 px-3 py-1 text-xs font-semibold text-kec-purple">
                  {member ? member.name : `Faculty ${id}`}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm text-kec-secondary">No faculty selected yet. Detailed primary/responsibility management is available from Event Incharges after saving.</p>
        )}
        <div className="mt-4">
          <Checklist title="Faculty Incharges" items={faculty.map((member) => ({ id: member.id, label: `${member.name} (${member.email})` }))} selected={form.inchargeFacultyIds} onToggle={(id) => toggleNumber("inchargeFacultyIds", id)} emptyLabel="No faculty found." />
        </div>
      </Card>
      </details>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => router.push("/admin/events")}>Cancel</Button>
        <Button type="submit" className="w-full sm:w-auto" loading={saving}>{mode === "create" ? "Create Event" : "Update Event"}</Button>
      </div>
    </form>
  );
}

function Checklist({ title, items, selected, onToggle, emptyLabel = "No items found." }: { title: string; items: { id: number; label: string }[]; selected: number[]; onToggle: (id: number) => void; emptyLabel?: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-kec-text">{title}</p>
      <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {items.length ? items.map((item) => (
          <label key={item.id} className="flex items-center gap-2 rounded-lg border border-kec-border px-3 py-2 text-sm text-kec-text">
            <input type="checkbox" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} />
            {item.label}
          </label>
        )) : <p className="text-sm text-kec-muted">{emptyLabel}</p>}
      </div>
    </div>
  );
}

function TextChecklist({ title, items, selected, onToggle }: { title: string; items: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div>
      <p className="text-sm font-semibold text-kec-text">{title}</p>
      <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <label key={item} className="flex items-center gap-2 rounded-lg border border-kec-border px-3 py-2 text-sm text-kec-text">
            <input type="checkbox" checked={selected.includes(item)} onChange={() => onToggle(item)} />
            {item}
          </label>
        ))}
      </div>
    </div>
  );
}

function toPayload(form: FormState): EventPayload {
  return {
    title: form.title,
    description: form.description,
    categoryId: Number(form.categoryId),
    eventType: form.eventType,
    venue: form.venue,
    startDatetime: toIso(form.startDatetime),
    endDatetime: toIso(form.endDatetime),
    registrationOpen: form.status === "PUBLISHED" ? form.registrationOpen : false,
    registrationStart: toIso(form.registrationStart),
    registrationEnd: toIso(form.registrationEnd),
    minTeamSize: form.eventType === "TEAM" ? toNumber(form.minTeamSize) : null,
    maxTeamSize: form.eventType === "TEAM" ? toNumber(form.maxTeamSize) : null,
    maxParticipants: toNumber(form.maxParticipants),
    maxTeams: form.eventType === "TEAM" ? toNumber(form.maxTeams) : null,
    placementWillingOnly: form.placementWillingOnly,
    mandatoryEvent: form.mandatoryEvent,
    status: form.status,
    allowedDepartmentIds: form.allowedDepartmentIds,
    allowedYears: form.allowedYears,
    allowedSections: form.allowedSections,
    allowedTechnicalAreas: form.allowedTechnicalAreas,
    inchargeFacultyIds: form.inchargeFacultyIds
  };
}

function cleanProblemDrafts(problemDrafts: ProblemDraft[]) {
  return problemDrafts.filter((item) => item.title.trim() && item.description.trim());
}

function validateProblemDrafts(problemDrafts: ProblemDraft[], label = "Problem statement") {
  for (const draft of problemDrafts) {
    if (!draft.title.trim() || !draft.description.trim()) {
      throw new Error(`Every added ${label.toLowerCase()} needs both a title and a description. Complete it or remove the draft before saving.`);
    }
    for (const link of draft.links) {
      if ((link.label ?? "").trim() && !link.url.trim()) {
        throw new Error("Every reference link with a label needs a URL. Complete it or remove the link row before saving.");
      }
      if (link.url.trim()) {
        validateReferenceUrl(link.url);
      }
    }
  }
}

function validateReferenceUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname) {
      throw new Error();
    }
  } catch {
    throw new Error("Reference links must be valid http or https URLs.");
  }
}

function cleanRoundDrafts(roundDrafts: RoundDraft[]) {
  return roundDrafts.filter((item) => item.roundName.trim() || item.roundOrder.trim() || item.description.trim() || item.scheduledAt || item.finalRound);
}

function validateRoundDrafts(roundDrafts: RoundDraft[]) {
  const drafts = cleanRoundDrafts(roundDrafts);
  if (!drafts.length) {
    return;
  }
  const finalCount = drafts.filter((item) => item.finalRound).length;
  if (finalCount !== 1) {
    throw new Error("Exactly one round must be marked as the final round.");
  }
  const seenOrders = new Set<number>();
  for (const draft of drafts) {
    if (!draft.roundName.trim()) {
      throw new Error("Every round needs a round name. Complete it or remove the draft before saving.");
    }
    const order = Number(draft.roundOrder);
    if (!Number.isInteger(order) || order < 1) {
      throw new Error("Every round needs a valid order number.");
    }
    if (seenOrders.has(order)) {
      throw new Error("Round order must be unique for each round.");
    }
    seenOrders.add(order);
  }
}

function nextRoundOrder(roundDrafts: RoundDraft[]) {
  const highestOrder = roundDrafts
    .map((item) => Number(item.roundOrder))
    .filter((value) => Number.isInteger(value) && value > 0)
    .reduce((highest, value) => Math.max(highest, value), 0);
  return highestOrder + 1;
}

function fromEvent(event: EventDetail): FormState {
  return {
    title: event.title,
    description: event.description ?? "",
    categoryId: String(event.category?.id ?? ""),
    eventType: event.eventType,
    venue: event.venue ?? "",
    startDatetime: toInputDate(event.startDatetime),
    endDatetime: toInputDate(event.endDatetime),
    registrationStart: toInputDate(event.registrationStart),
    registrationEnd: toInputDate(event.registrationEnd),
    registrationOpen: event.registrationOpen,
    status: event.status,
    minTeamSize: event.minTeamSize ? String(event.minTeamSize) : "",
    maxTeamSize: event.maxTeamSize ? String(event.maxTeamSize) : "",
    maxParticipants: event.maxParticipants ? String(event.maxParticipants) : "",
    maxTeams: event.maxTeams ? String(event.maxTeams) : "",
    placementWillingOnly: event.placementWillingOnly,
    mandatoryEvent: event.mandatoryEvent,
    allowedDepartmentIds: event.allowedDepartments.map((item) => item.id),
    allowedYears: event.allowedYears,
    allowedSections: event.allowedSections,
    allowedTechnicalAreas: event.allowedTechnicalAreas,
    inchargeFacultyIds: event.incharges.map((item) => item.id)
  };
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-kec-border bg-slate-50 px-3 py-2"><p className="text-xs font-semibold text-kec-muted">{label}</p><p className="mt-1 font-semibold text-kec-text">{value}</p></div>;
}

function formatFormStatus(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " ");
}

function formatCategoryType(value: EventCategory["categoryType"]) {
  if (value === "CONTEST") return "Contest / Placement drill";
  if (value === "DOMAIN") return "Paper / Project domain";
  return "General event";
}

function toNumber(value: string) {
  return value ? Number(value) : null;
}

function toIso(value: string) {
  return value ? value : null;
}

function toInputDate(value: string | null) {
  return value ? value.slice(0, 16) : "";
}
