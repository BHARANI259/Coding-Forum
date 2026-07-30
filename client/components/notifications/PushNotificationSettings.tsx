"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  deactivateCurrentPushSubscription,
  getWebPushVapidPublicKey,
  sendPushTestNotification,
  subscribeCurrentDeviceToPush
} from "@/lib/api";
import {
  createBrowserSubscription,
  currentBrowserSubscription,
  isPushSecureContext,
  isPushSupported,
  subscriptionToPayload
} from "@/lib/push-notifications";
import type { PushSubscriptionStatus } from "@/types/push-notification";

export default function PushNotificationSettings() {
  const [status, setStatus] = useState<PushSubscriptionStatus>("unsupported");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadDevices = useCallback(async () => {
    if (!isPushSupported()) {
      setStatus("unsupported");
      return;
    }
    if (!isPushSecureContext()) {
      setStatus("insecure-context");
      return;
    }
    try {
      const subscription = await currentBrowserSubscription();
      if (Notification.permission === "denied") {
        setStatus("permission-denied");
      } else if (subscription) {
        await subscribeCurrentDeviceToPush(subscriptionToPayload(subscription));
        setStatus("subscribed");
      } else if (Notification.permission === "granted") {
        setStatus("unsubscribed");
      } else {
        setStatus("permission-required");
      }
    } catch (exception) {
      setStatus("error");
      setError(exception instanceof Error ? exception.message : "Unable to load push notification settings.");
    }
  }, []);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  async function enableNotifications() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!isPushSupported()) {
        setStatus("unsupported");
        return;
      }
      if (!isPushSecureContext()) {
        setStatus("insecure-context");
        return;
      }

      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }
      if (permission === "denied") {
        setStatus("permission-denied");
        return;
      }
      if (permission !== "granted") {
        setStatus("permission-required");
        return;
      }

      let subscription = await currentBrowserSubscription();
      if (!subscription) {
        const publicKey = await resolveWebPushPublicKey();
        subscription = await createBrowserSubscription(publicKey);
      }
      await subscribeCurrentDeviceToPush(subscriptionToPayload(subscription));
      setMessage("Push notifications are enabled on this device.");
      await loadDevices();
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : "Unable to enable push notifications.";
      setStatus(message.toLowerCase().includes("not configured") || message.toLowerCase().includes("public key") ? "not-configured" : "error");
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function disableCurrentDevice() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const subscription = await currentBrowserSubscription();
      if (subscription) {
        await deactivateCurrentPushSubscription(subscriptionToPayload(subscription));
        await subscription.unsubscribe();
      }
      setMessage("Push notifications are disabled on this device.");
      await loadDevices();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to disable this device.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const subscription = await currentBrowserSubscription();
      if (!subscription) {
        throw new Error("This device is not subscribed yet.");
      }
      await sendPushTestNotification(subscriptionToPayload(subscription));
      setMessage("Test notification sent to this device.");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to send a test notification.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-kec-text">Push Notifications</h2>
          <p className="mt-1 text-sm text-kec-secondary">
            Receive important event updates, registration reminders, and published results even when the portal is closed.
            Notifications are optional and may appear on your device lock screen.
          </p>
          <p className="mt-2 text-sm text-kec-muted">{statusMessage(status)}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          {status === "subscribed" ? (
            <Button type="button" variant="secondary" loading={busy} onClick={() => void disableCurrentDevice()}>
              Disable this device
            </Button>
          ) : (
            <Button
              type="button"
              loading={busy}
              disabled={status === "unsupported" || status === "insecure-context" || status === "permission-denied" || status === "not-configured"}
              onClick={() => void enableNotifications()}
            >
              Enable notifications
            </Button>
          )}
          <Button type="button" variant="secondary" loading={busy} disabled={status !== "subscribed"} onClick={() => void sendTest()}>
            Send test notification
          </Button>
        </div>
      </div>

      {message ? <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p> : null}
      {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </Card>
  );
}

function statusMessage(status: PushSubscriptionStatus) {
  switch (status) {
    case "subscribed":
      return "This browser is subscribed.";
    case "permission-required":
      return "Click Enable notifications when you are ready. The browser permission prompt will appear only after that click.";
    case "permission-denied":
      return "Notifications are blocked in your browser. Change site permissions to enable them again.";
    case "not-configured":
      return "Push notifications are not configured on the server yet. In-app notifications still work.";
    case "insecure-context":
      return "Push notifications require HTTPS in production. Localhost is allowed for development.";
    case "unsubscribed":
      return "Browser permission is granted, but this device is not subscribed.";
    case "error":
      return "Unable to confirm push notification status.";
    default:
      return "This browser does not support standard Web Push notifications.";
  }
}

async function resolveWebPushPublicKey() {
  const envKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
  if (envKey) {
    return envKey;
  }

  const response = await getWebPushVapidPublicKey();
  const serverKey = response.publicKey?.trim();
  if (!serverKey) {
    throw new Error("Push notifications are not configured. Add the Web Push VAPID keys in the backend environment.");
  }
  return serverKey;
}
