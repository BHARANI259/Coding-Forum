import { apiFetch, type EventPoster } from "@/lib/api";

export function uploadEventPoster(eventId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<EventPoster>(`/admin/events/${eventId}/poster`, {
    method: "POST",
    body: formData
  });
}

export function removeEventPoster(eventId: number) {
  return apiFetch<EventPoster>(`/admin/events/${eventId}/poster`, {
    method: "DELETE"
  });
}
