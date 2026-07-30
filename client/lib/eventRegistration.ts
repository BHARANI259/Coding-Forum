import type { EventDetail, EventItem } from "@/lib/api";
import { formatDateTime, parseAppDate } from "@/lib/dateFormat";

export type EventRegistrationState = {
  available: boolean;
  label: string;
  message: string;
  badgeVariant: "success" | "warning" | "info" | "error" | "default" | "purple";
};

export function getEventRegistrationState(event: EventItem | EventDetail, now = new Date()): EventRegistrationState {
  if (event.status === "COMPLETED" || event.resultsPublished) {
    return {
      available: false,
      label: "Completed",
      message: "This event has ended. Registration and team changes are closed.",
      badgeVariant: "info"
    };
  }

  if (event.status === "CANCELLED") {
    return {
      available: false,
      label: "Cancelled",
      message: "This event has been cancelled. Registration is closed.",
      badgeVariant: "error"
    };
  }

  if (event.endDatetime && now > parseAppDate(event.endDatetime)) {
    return {
      available: false,
      label: "Event Ended",
      message: "Event time has ended. Registration and team changes are closed.",
      badgeVariant: "warning"
    };
  }

  if (event.status !== "PUBLISHED") {
    return {
      available: false,
      label: "Not Open",
      message: "Registration is not open for this event.",
      badgeVariant: "warning"
    };
  }

  if (!event.registrationOpen) {
    return {
      available: false,
      label: "Closed",
      message: "Registration is closed for this event.",
      badgeVariant: "warning"
    };
  }

  if (event.registrationStart && now < parseAppDate(event.registrationStart)) {
    return {
      available: false,
      label: "Starts Soon",
      message: `Registration opens on ${formatDateTime(event.registrationStart)}.`,
      badgeVariant: "info"
    };
  }

  if (event.registrationEnd && now > parseAppDate(event.registrationEnd)) {
    return {
      available: false,
      label: "Window Ended",
      message: "Registration window has ended.",
      badgeVariant: "warning"
    };
  }

  return {
    available: true,
    label: "Registration Open",
    message: "Registration is open for this event.",
    badgeVariant: "success"
  };
}
