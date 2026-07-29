"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Badge from "@/components/ui/Badge";
import {
  getRecentNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  type NotificationItem
} from "@/lib/api";
import { getCurrentUser, getToken } from "@/lib/auth";
import { connectNotificationSocket, notificationTargetPath, notificationsPathForRole, shortTime } from "@/lib/notifications";

export default function NotificationButton() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const user = getCurrentUser();

  useEffect(() => {
    let socket: WebSocket | null = null;
    let pollId: ReturnType<typeof setInterval> | null = null;

    async function loadCount() {
      try {
        const response = await getUnreadNotificationCount();
        setUnreadCount(response.count);
      } catch {
        // Session guards elsewhere handle auth expiry; notification polling stays quiet.
      }
    }

    async function refreshRecent() {
      try {
        const [recent, count] = await Promise.all([getRecentNotifications(), getUnreadNotificationCount()]);
        setItems(recent);
        setUnreadCount(count.count);
      } catch {
        // Push foreground refresh is best effort.
      }
    }

    function handleServiceWorkerMessage(event: MessageEvent) {
      if (event.data?.type === "PUSH_NOTIFICATION_RECEIVED") {
        void refreshRecent();
      }
      if (event.data?.type === "PUSH_NOTIFICATION_CLICKED") {
        const url = typeof event.data.payload?.url === "string" ? event.data.payload.url : "";
        if (url.startsWith("/") && !url.startsWith("//")) {
          router.push(url);
        }
      }
    }

    void loadCount();
    pollId = setInterval(() => void loadCount(), 45000);
    navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage);

    const token = getToken();
    if (token) {
      socket = connectNotificationSocket(token, (notification) => {
        setUnreadCount((count) => count + 1);
        setItems((current) => [notification, ...current.filter((item) => item.id !== notification.id)].slice(0, 5));
      });
      const activeSocket = socket;
      if (activeSocket) {
        activeSocket.onerror = () => activeSocket.close();
      }
    }

    return () => {
      if (pollId) {
        clearInterval(pollId);
      }
      navigator.serviceWorker?.removeEventListener("message", handleServiceWorkerMessage);
      socket?.close();
    };
  }, [router]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function toggle() {
    const nextOpen = !open;
    setOpen(nextOpen);
    setError("");
    if (nextOpen) {
      try {
        setItems(await getRecentNotifications());
        setUnreadCount((await getUnreadNotificationCount()).count);
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load notifications.");
      }
    }
  }

  async function openNotification(notification: NotificationItem) {
    try {
      const updated = notification.read ? notification : await markNotificationRead(notification.id);
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
      if (!notification.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      setOpen(false);
      if (user) {
        const target = notificationTargetPath(notification, user.role);
        if (target) {
          router.push(target);
        }
      }
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to open notification.");
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Open notifications"
        onClick={() => void toggle()}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-kec-border bg-white text-lg text-kec-text hover:bg-kec-bg focus:outline-none focus:ring-2 focus:ring-kec-purple"
      >
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-xs font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed left-3 right-3 top-16 z-50 overflow-hidden rounded-xl border border-kec-border bg-white shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-[min(360px,calc(100vw-2rem))]">
          <div className="flex items-center justify-between border-b border-kec-border px-4 py-3">
            <div>
              <p className="text-sm font-bold text-kec-text">Notifications</p>
              <p className="text-xs text-kec-secondary">{unreadCount} unread</p>
            </div>
            <Badge variant="purple">Recent 5</Badge>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {error ? <p className="px-4 py-3 text-sm text-red-600">{error}</p> : null}
            {!error && items.length === 0 ? <p className="px-4 py-6 text-center text-sm text-kec-secondary">No notifications yet</p> : null}
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void openNotification(item)}
                className="flex w-full gap-3 border-b border-kec-border px-4 py-3 text-left hover:bg-kec-bg"
              >
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.read ? "bg-kec-border" : "bg-kec-purple"}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-kec-text">{item.title}</span>
                  <span className="mt-1 line-clamp-2 block text-xs text-kec-secondary">{item.message}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-kec-muted">
                    <span>{shortTime(item.createdAt)}</span>
                    <span>{item.notificationType.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
          <Link
            href={notificationsPathForRole(user.role)}
            onClick={() => setOpen(false)}
            className="block bg-kec-bg px-4 py-3 text-center text-sm font-bold text-kec-purple hover:text-kec-purple-dark"
          >
            Show all
          </Link>
        </div>
      ) : null}
    </div>
  );
}
