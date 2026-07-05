import { apiFetch, type EventCategory, type EventItem, type PageResponse } from "@/lib/api";

export type EventInchargeAssignment = {
  assignmentId: number;
  eventId: number;
  eventTitle: string;
  eventCategory: string | null;
  eventStatus: string;
  facultyId: number;
  facultyName: string;
  facultyCode: string | null;
  facultyEmail: string;
  facultyDepartmentCode: string | null;
  facultyDepartmentName: string | null;
  primaryIncharge: boolean;
  responsibility: string | null;
  assignedAt: string;
};

export type FacultyInchargeOption = {
  facultyId: number;
  facultyName: string;
  facultyCode: string | null;
  email: string;
  departmentCode: string | null;
  departmentName: string | null;
};

export type AssignEventInchargePayload = {
  facultyId: number;
  primaryIncharge: boolean;
  responsibility: string;
};

export type UpdateEventInchargePayload = {
  primaryIncharge: boolean;
  responsibility: string;
};

export function getEventInchargeAssignments(filters: Record<string, string | number | boolean | undefined> = {}) {
  return apiFetch<PageResponse<EventInchargeAssignment>>(`/admin/event-incharges${toQuery(filters)}`);
}

export function getEventIncharges(eventId: number) {
  return apiFetch<EventInchargeAssignment[]>(`/admin/events/${eventId}/incharges`);
}

export function assignEventIncharge(eventId: number, payload: AssignEventInchargePayload) {
  return apiFetch<EventInchargeAssignment>(`/admin/events/${eventId}/incharges`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function bulkUpdateEventIncharges(eventId: number, incharges: AssignEventInchargePayload[]) {
  return apiFetch<EventInchargeAssignment[]>(`/admin/events/${eventId}/incharges`, {
    method: "PUT",
    body: JSON.stringify({ incharges })
  });
}

export function updateEventIncharge(assignmentId: number, payload: UpdateEventInchargePayload) {
  return apiFetch<EventInchargeAssignment>(`/admin/event-incharges/${assignmentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function removeEventIncharge(assignmentId: number) {
  return apiFetch<void>(`/admin/event-incharges/${assignmentId}`, { method: "DELETE" });
}

export function getFacultyOptionsForIncharge(filters: Record<string, string | number | boolean | undefined> = {}) {
  return apiFetch<FacultyInchargeOption[]>(`/admin/event-incharges/faculty-options${toQuery(filters)}`);
}

export type EventOptionForIncharge = EventItem & {
  category: EventCategory | null;
};

function toQuery(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  const value = query.toString();
  return value ? `?${value}` : "";
}
