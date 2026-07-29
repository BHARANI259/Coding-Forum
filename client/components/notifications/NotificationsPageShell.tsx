"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import BackButton from "@/components/ui/BackButton";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Select from "@/components/ui/Select";
import PushNotificationSettings from "@/components/notifications/PushNotificationSettings";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
  type UserRole
} from "@/lib/api";
import { notificationTargetPath, shortTime } from "@/lib/notifications";
import { useRouter } from "next/navigation";

type NotificationsPageShellProps = {
  role: UserRole;
  fallbackHref: string;
};

const TYPES = [
  "EVENT_PUBLISHED",
  "REGISTRATION_COMPLETED",
  "TEAM_JOINED",
  "RESULT_PUBLISHED",
  "EVENT_COMPLETED",
  "REGISTRATION_CLOSED",
  "ROUND_UPDATED",
  "PROBLEM_STATEMENT_UPDATED",
  "SYSTEM"
];

export default function NotificationsPageShell({ role, fallbackHref }: NotificationsPageShellProps) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadOnly, setUnreadOnly] = useState("false");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getNotifications({
        size: 50,
        unreadOnly: unreadOnly === "true",
        type: type || undefined
      });
      setItems(response.content);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [type, unreadOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openItem(item: NotificationItem) {
    try {
      const updated = item.read ? item : await markNotificationRead(item.id);
      setItems((current) => current.map((notification) => notification.id === updated.id ? updated : notification));
      const target = notificationTargetPath(item, role);
      if (target) {
        router.push(target);
      }
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to open notification.");
    }
  }

  async function handleMarkAllRead() {
    setSaving(true);
    setError("");
    try {
      await markAllNotificationsRead();
      await load();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to mark notifications as read.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell expectedRole={role} title="Notifications">
      <PageHeader
        title="Notifications"
        subtitle="Recent forum updates and action confirmations."
        actions={<BackButton fallbackHref={fallbackHref} />}
      />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <PushNotificationSettings />
      <Card className="mb-5">
        <div className="grid gap-4 md:grid-cols-[180px_260px_auto] md:items-end">
          <Select label="View" value={unreadOnly} onChange={(event) => setUnreadOnly(event.target.value)}>
            <option value="false">All</option>
            <option value="true">Unread</option>
          </Select>
          <Select label="Type" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">All types</option>
            {TYPES.map((item) => <option key={item} value={item}>{friendlyType(item)}</option>)}
          </Select>
          <Button type="button" className="w-full md:w-auto" variant="secondary" loading={saving} disabled={!items.some((item) => !item.read)} onClick={() => void handleMarkAllRead()}>
            Mark all as read
          </Button>
        </div>
      </Card>

      {loading ? <Card>Loading notifications...</Card> : null}
      {!loading && !items.length ? <Card>No notifications yet.</Card> : null}
      <div className="space-y-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => void openItem(item)}
            className={`w-full rounded-xl border p-4 text-left shadow-sm transition hover:border-kec-purple ${item.read ? "border-kec-border bg-white" : "border-purple-200 bg-purple-50"}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  {!item.read ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-kec-purple" /> : null}
                  <h2 className="min-w-0 break-words text-base font-bold text-kec-text sm:truncate">{item.title}</h2>
                </div>
                <p className="mt-2 break-words text-sm text-kec-secondary">{item.message}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                <Badge variant={item.read ? "default" : "purple"}>{friendlyType(item.notificationType)}</Badge>
                <span className="text-xs text-kec-muted">{shortTime(item.createdAt)}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </AppShell>
  );
}

function friendlyType(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
