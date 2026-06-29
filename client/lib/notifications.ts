import { API_BASE_URL, type NotificationItem, type UserRole } from "./api";

export function notificationsPathForRole(role: UserRole) {
  if (role === "STUDENT") {
    return "/student/notifications";
  }
  if (role === "FACULTY") {
    return "/faculty/notifications";
  }
  return "/admin/notifications";
}

export function notificationTargetPath(notification: NotificationItem, role: UserRole) {
  if (!notification.relatedEntityType || !notification.relatedEntityId) {
    return null;
  }
  if (notification.relatedEntityType === "EVENT") {
    if (role === "STUDENT") {
      return `/student/events/${notification.relatedEntityId}`;
    }
    if (role === "FACULTY") {
      return `/faculty/events/${notification.relatedEntityId}`;
    }
    return `/admin/events/${notification.relatedEntityId}`;
  }
  if (notification.relatedEntityType === "TEAM" && role === "STUDENT") {
    return "/student/teams";
  }
  if (notification.relatedEntityType === "RESULT") {
    return role === "STUDENT" ? "/student/results" : null;
  }
  return null;
}

export function connectNotificationSocket(token: string, onMessage: (notification: NotificationItem) => void) {
  if (typeof window === "undefined") {
    return null;
  }
  const url = new URL(API_BASE_URL);
  const protocol = url.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(`${protocol}//${url.host}/ws?token=${encodeURIComponent(token)}`);
  socket.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data) as NotificationItem);
    } catch {
      // Ignore malformed real-time messages and keep REST polling active.
    }
  };
  return socket;
}

export function shortTime(value: string) {
  const timestamp = new Date(value).getTime();
  const diffSeconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  return new Date(value).toLocaleDateString();
}
