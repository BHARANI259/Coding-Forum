import { API_BASE_URL, apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

export type EventMediaType = "PHOTO" | "GEOTAG_SCREENSHOT" | "PARTICIPANT_GROUP" | "WINNER_PHOTO" | "EVENT_PROOF" | "OTHER";

export type EventMedia = {
  id: number;
  eventId: number;
  mediaType: EventMediaType;
  caption: string | null;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  fileUrl: string;
  uploadedByName: string;
  uploadedByUserId: number;
  uploadedAt: string;
  deleted: boolean;
};

export type UpdateEventMediaPayload = {
  mediaType: EventMediaType;
  caption: string;
};

export const eventMediaTypes: EventMediaType[] = [
  "PHOTO",
  "GEOTAG_SCREENSHOT",
  "PARTICIPANT_GROUP",
  "WINNER_PHOTO",
  "EVENT_PROOF",
  "OTHER"
];

export function getAdminEventMedia(eventId: number) {
  return apiFetch<EventMedia[]>(`/admin/events/${eventId}/media`);
}

export function uploadAdminEventMedia(eventId: number, files: File[], mediaType: EventMediaType, caption: string) {
  const form = mediaForm(files, mediaType, caption);
  return apiFetch<EventMedia[]>(`/admin/events/${eventId}/media`, {
    method: "POST",
    body: form
  });
}

export function updateAdminEventMedia(eventId: number, mediaId: number, payload: UpdateEventMediaPayload) {
  return apiFetch<EventMedia>(`/admin/events/${eventId}/media/${mediaId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function deleteAdminEventMedia(eventId: number, mediaId: number) {
  return apiFetch<void>(`/admin/events/${eventId}/media/${mediaId}`, { method: "DELETE" });
}

export function fetchAdminEventMediaBlob(eventId: number, mediaId: number) {
  return fetchMediaBlob(`/admin/events/${eventId}/media/${mediaId}/file`);
}

export function getFacultyEventMedia(eventId: number) {
  return apiFetch<EventMedia[]>(`/faculty/events/${eventId}/media`);
}

export function uploadFacultyEventMedia(eventId: number, files: File[], mediaType: EventMediaType, caption: string) {
  const form = mediaForm(files, mediaType, caption);
  return apiFetch<EventMedia[]>(`/faculty/events/${eventId}/media`, {
    method: "POST",
    body: form
  });
}

export function updateFacultyEventMedia(eventId: number, mediaId: number, payload: UpdateEventMediaPayload) {
  return apiFetch<EventMedia>(`/faculty/events/${eventId}/media/${mediaId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function deleteFacultyEventMedia(eventId: number, mediaId: number) {
  return apiFetch<void>(`/faculty/events/${eventId}/media/${mediaId}`, { method: "DELETE" });
}

export function fetchFacultyEventMediaBlob(eventId: number, mediaId: number) {
  return fetchMediaBlob(`/faculty/events/${eventId}/media/${mediaId}/file`);
}

function mediaForm(files: File[], mediaType: EventMediaType, caption: string) {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));
  form.append("mediaType", mediaType);
  if (caption.trim()) {
    form.append("caption", caption.trim());
  }
  return form;
}

async function fetchMediaBlob(endpoint: string) {
  const headers = new Headers();
  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
  if (!response.ok) {
    throw new Error("Unable to load event media image.");
  }
  return response.blob();
}
