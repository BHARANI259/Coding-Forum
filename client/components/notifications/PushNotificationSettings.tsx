"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  deactivateCurrentPushSubscription,
  getPushNotificationDevices,
  getWebPushVapidPublicKey,
  removePushNotificationDevice,
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
import type { PushDevice, PushSubscriptionStatus } from "@/types/push-notification";

export default function PushNotificationSettings() {
  const [status, setStatus] = useState<PushSubscriptionStatus>("unsupported");
  const [devices, setDevices] = useState<PushDevice[]>([]);
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
      const [subscription, deviceList] = await Promise.all([
        currentBrowserSubscription(),
        getPushNotificationDevices()
      ]);
      setDevices(deviceList);
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
        const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY || (await getWebPushVapidPublicKey()).publicKey;
        subscription = await createBrowserSubscription(publicKey);
      }
      await subscribeCurrentDeviceToPush(subscriptionToPayload(subscription));
      setMessage("Push notifications are enabled on this device.");
      await loadDevices();
    } catch (exception) {
      setStatus("error");
      setError(exception instanceof Error ? exception.message : "Unable to enable push notifications.");
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

  async function removeDevice(deviceId: number) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await removePushNotificationDevice(deviceId);
      setMessage("Notification device removed.");
      await loadDevices();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to remove notification device.");
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
              disabled={status === "unsupported" || status === "insecure-context" || status === "permission-denied"}
              onClick={() => void enableNotifications()}
            >
              Enable notifications
            </Button>
          )}
          <Button type="button" variant="secondary" loading={busy} disabled={!devices.length} onClick={() => void sendTest()}>
            Send test notification
          </Button>
        </div>
      </div>

      {message ? <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p> : null}
      {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="mt-5">
        <h3 className="text-sm font-bold text-kec-text">Notification devices</h3>
        {!devices.length ? (
          <p className="mt-2 text-sm text-kec-muted">No active push notification devices yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {devices.map((device) => (
              <div key={device.id} className="flex flex-col gap-3 rounded-lg border border-kec-border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-kec-text">{device.deviceName || "Notification device"}</p>
                  <p className="break-words text-sm text-kec-secondary">
                    {[device.browser, device.platform].filter(Boolean).join(" - ") || "Browser device"}
                  </p>
                  <p className="text-xs text-kec-muted">
                    Last seen: {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "Not recorded"}
                  </p>
                </div>
                <Button type="button" variant="secondary" loading={busy} onClick={() => void removeDevice(device.id)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
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
