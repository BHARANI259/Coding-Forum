"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { getCurrentUser } from "@/lib/auth";
import {
  deleteAdminEventMedia,
  deleteFacultyEventMedia,
  eventMediaTypes,
  fetchAdminEventMediaBlob,
  fetchFacultyEventMediaBlob,
  getAdminEventMedia,
  getFacultyEventMedia,
  updateAdminEventMedia,
  updateFacultyEventMedia,
  uploadAdminEventMedia,
  uploadFacultyEventMedia,
  type EventMedia,
  type EventMediaType
} from "@/lib/api/eventMedia";
import { formatDateTime } from "@/lib/dateFormat";

type EventMediaManagerProps = {
  eventId: number;
  mode: "admin" | "faculty";
  eventCompleted?: boolean;
  readOnly?: boolean;
  onItemsChange?: (items: EventMedia[]) => void;
};

export default function EventMediaManager({ eventId, mode, eventCompleted = false, readOnly = false, onItemsChange }: EventMediaManagerProps) {
  const [items, setItems] = useState<EventMedia[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [mediaType, setMediaType] = useState<EventMediaType>("PHOTO");
  const [caption, setCaption] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ mediaType: EventMediaType; caption: string }>({ mediaType: "PHOTO", caption: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const currentUser = useMemo(() => getCurrentUser(), []);
  const canUpload = !readOnly && (mode === "admin" || eventCompleted);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const loadedItems = mode === "admin" ? await getAdminEventMedia(eventId) : await getFacultyEventMedia(eventId);
      setItems(loadedItems);
      onItemsChange?.(loadedItems);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load event media.");
    } finally {
      setLoading(false);
    }
  }, [eventId, mode, onItemsChange]);

  useEffect(() => {
    void load();
  }, [load]);

  function onFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    setFiles(selected);
  }

  async function upload(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setError("");
    setSuccess("");
    if (!files.length) {
      setError("Choose one or more image files.");
      return;
    }
    setSaving(true);
    try {
      if (mode === "admin") {
        await uploadAdminEventMedia(eventId, files, mediaType, caption);
      } else {
        await uploadFacultyEventMedia(eventId, files, mediaType, caption);
      }
      setFiles([]);
      setCaption("");
      setMediaType("PHOTO");
      setSuccess("Event media uploaded.");
      await load();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to upload event media.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item: EventMedia) {
    setEditingId(item.id);
    setEditForm({ mediaType: item.mediaType, caption: item.caption ?? "" });
  }

  async function saveEdit(mediaId: number) {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      if (mode === "admin") {
        await updateAdminEventMedia(eventId, mediaId, editForm);
      } else {
        await updateFacultyEventMedia(eventId, mediaId, editForm);
      }
      setEditingId(null);
      setSuccess("Event media updated.");
      await load();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to update event media.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(mediaId: number) {
    if (!window.confirm("Delete this event media item?")) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      if (mode === "admin") {
        await deleteAdminEventMedia(eventId, mediaId);
      } else {
        await deleteFacultyEventMedia(eventId, mediaId);
      }
      setSuccess("Event media deleted.");
      await load();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to delete event media.");
    }
  }

  function canManage(item: EventMedia) {
    return !readOnly && (mode === "admin" || item.uploadedByUserId === currentUser?.userId);
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-kec-text">{mode === "admin" ? "Event Media / Post-Event Gallery" : "Post-Event Media"}</h2>
          <p className="mt-1 text-sm text-kec-secondary">
            {readOnly ? "This cancelled event is read-only. Existing evidence remains available for review."
              : mode === "admin"
              ? "Faculty can upload media only after completion. SuperAdmin can upload for correction/admin purposes."
              : canUpload
                ? "Upload post-event proof photos, screenshots, and winner images for archive and reports."
                : "Media upload will be available after the event is completed."}
          </p>
        </div>
      </div>

      {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p> : null}

      <form className="mt-4 grid gap-4 rounded-xl border border-kec-border p-3 sm:p-4 lg:grid-cols-[1fr_220px_1fr_auto]" onSubmit={upload}>
        <label className="block">
          <span className="text-sm font-semibold text-kec-text">Images</span>
          <input
            className="mt-2 block w-full rounded-lg border border-kec-border px-3 py-2 text-base file:mr-3 file:rounded-md file:border-0 file:bg-kec-purple file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white sm:text-sm"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={!canUpload || saving}
            onChange={onFilesSelected}
          />
          <span className="mt-1 block text-xs text-kec-muted">JPG, PNG, or WEBP. Max 10 MB each. Up to 10 files.</span>
        </label>
        <Select label="Media Type" value={mediaType} disabled={!canUpload || saving} onChange={(event) => setMediaType(event.target.value as EventMediaType)}>
          {eventMediaTypes.map((type) => <option key={type} value={type}>{labelType(type)}</option>)}
        </Select>
        <Input label="Caption" value={caption} disabled={!canUpload || saving} onChange={(event) => setCaption(event.target.value)} />
        <Button className="w-full self-end lg:w-auto" type="submit" loading={saving} disabled={!canUpload}>Upload</Button>
      </form>

      {loading ? <p className="mt-5 text-sm text-kec-secondary">Loading event media...</p> : null}
      {!loading && !items.length ? (
        <div className="mt-5 rounded-xl border border-dashed border-kec-border p-8 text-center">
          <p className="font-semibold text-kec-text">No event media uploaded yet.</p>
          <p className="mt-1 text-sm text-kec-secondary">Post-event proof images will appear here.</p>
        </div>
      ) : null}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-xl border border-kec-border bg-white">
            <AuthenticatedMediaImage eventId={eventId} mediaId={item.id} mode={mode} alt={item.caption ?? item.originalFileName} />
            <div className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="purple">{labelType(item.mediaType)}</Badge>
                <span className="text-xs font-semibold text-kec-muted">{formatBytes(item.sizeBytes)}</span>
              </div>
              {editingId === item.id ? (
                <div className="space-y-3">
                  <Select label="Media Type" value={editForm.mediaType} onChange={(event) => setEditForm({ ...editForm, mediaType: event.target.value as EventMediaType })}>
                    {eventMediaTypes.map((type) => <option key={type} value={type}>{labelType(type)}</option>)}
                  </Select>
                  <Input label="Caption" value={editForm.caption} onChange={(event) => setEditForm({ ...editForm, caption: event.target.value })} />
                  <div className="grid gap-2 sm:flex sm:flex-wrap">
                    <Button type="button" className="w-full sm:w-auto" loading={saving} onClick={() => void saveEdit(item.id)}>Save</Button>
                    <Button type="button" className="w-full sm:w-auto" variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-kec-text">{item.caption || "No caption"}</p>
                  <p className="text-xs text-kec-secondary">Uploaded by {item.uploadedByName}</p>
                  <p className="text-xs text-kec-muted">{formatDateTime(item.uploadedAt)}</p>
                  {canManage(item) ? (
                    <div className="grid gap-2 sm:flex sm:flex-wrap">
                      <Button type="button" className="w-full sm:w-auto" variant="secondary" onClick={() => startEdit(item)}>Edit</Button>
                      <Button type="button" className="w-full sm:w-auto" variant="danger" onClick={() => void remove(item.id)}>Delete</Button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AuthenticatedMediaImage({ eventId, mediaId, mode, alt }: { eventId: number; mediaId: number; mode: "admin" | "faculty"; alt: string }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    async function load() {
      try {
        const blob = mode === "admin" ? await fetchAdminEventMediaBlob(eventId, mediaId) : await fetchFacultyEventMediaBlob(eventId, mediaId);
        if (!active) {
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch {
        setUrl("");
      }
    }
    void load();
    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [eventId, mediaId, mode]);

  if (!url) {
    return (
      <div className="flex aspect-video items-center justify-center bg-slate-100 text-xs font-semibold uppercase text-kec-muted">
        Image preview
      </div>
    );
  }

  return <img className="aspect-video w-full object-cover" src={url} alt={alt} loading="lazy" decoding="async" />;
}

function labelType(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
