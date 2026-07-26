"use client";

import { ChangeEvent, useState } from "react";
import Button from "@/components/ui/Button";
import EventPosterPreview from "@/components/events/EventPosterPreview";
import type { EventDetail } from "@/lib/api";
import { formatDateTime } from "@/lib/dateFormat";

type EventPosterUploadProps = {
  event?: EventDetail;
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  onRemove?: () => void;
  removing?: boolean;
  disabled?: boolean;
};

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxBytes = 5 * 1024 * 1024;

export default function EventPosterUpload({ event, selectedFile, onFileChange, onRemove, removing = false, disabled = false }: EventPosterUploadProps) {
  const previewUrl = selectedFile ? URL.createObjectURL(selectedFile) : event?.posterImageUrl;
  const [fileError, setFileError] = useState("");

  function handleFileChange(changeEvent: ChangeEvent<HTMLInputElement>) {
    const file = changeEvent.target.files?.[0] ?? null;
    if (!file) {
      setFileError("");
      onFileChange(null);
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      changeEvent.target.value = "";
      setFileError("Poster must be a JPG, PNG, or WEBP image.");
      onFileChange(null);
      return;
    }
    if (file.size > maxBytes) {
      changeEvent.target.value = "";
      setFileError("Poster must be 5 MB or smaller.");
      onFileChange(null);
      return;
    }
    setFileError("");
    onFileChange(file);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <EventPosterPreview posterImageUrl={previewUrl} title={event?.title} className="aspect-video" />
      <div>
        <h3 className="text-sm font-bold text-kec-text">Event Flyer / Poster</h3>
        <p className="mt-1 text-sm text-kec-secondary">Upload JPG, PNG, or WEBP. Max size 5 MB.</p>
        {event?.posterOriginalName ? (
          <div className="mt-3 rounded-lg border border-kec-border bg-slate-50 px-3 py-2 text-sm text-kec-secondary">
            <p><span className="font-semibold text-kec-text">Current:</span> {event.posterOriginalName}</p>
            <p>{formatBytes(event.posterSizeBytes)}{event.posterUploadedAt ? `, uploaded ${formatDateTime(event.posterUploadedAt)}` : ""}</p>
          </div>
        ) : null}
        {selectedFile ? (
          <div className="mt-3 rounded-lg border border-kec-border bg-purple-50 px-3 py-2 text-sm text-kec-purple">
            Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})
          </div>
        ) : null}
        {fileError ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{fileError}</p> : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-kec-border bg-white px-4 py-2 text-sm font-semibold text-kec-text hover:bg-slate-50">
            {event?.posterImageUrl ? "Replace Poster" : "Upload Poster"}
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={handleFileChange} />
          </label>
          {selectedFile ? <Button type="button" variant="ghost" onClick={() => onFileChange(null)}>Clear Selection</Button> : null}
          {event?.posterImageUrl && onRemove ? (
            <Button type="button" variant="danger" loading={removing} onClick={onRemove}>Remove Poster</Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatBytes(value?: number | null) {
  if (!value) {
    return "0 KB";
  }
  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
