import type { PushSubscriptionPayload } from "@/types/push-notification";

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function isPushSecureContext() {
  return typeof window !== "undefined" && window.isSecureContext;
}

export function urlBase64ToUint8Array(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Web Push public key is missing.");
  }
  const padding = "=".repeat((4 - (trimmed.length % 4)) % 4);
  const base64 = `${trimmed}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }
  return output;
}

export async function currentBrowserSubscription() {
  if (!isPushSupported()) {
    return null;
  }
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export function subscriptionToPayload(subscription: PushSubscription): PushSubscriptionPayload {
  const json = subscription.toJSON();
  const keys = json.keys;
  if (!json.endpoint || !keys?.p256dh || !keys.auth) {
    throw new Error("Browser returned an incomplete push subscription.");
  }
  return {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: {
      p256dh: keys.p256dh,
      auth: keys.auth
    },
    userAgent: navigator.userAgent,
    deviceName: deviceName(),
    platform: navigator.platform || "Unknown platform",
    browser: browserName(),
    permissionStatus: Notification.permission
  };
}

export async function createBrowserSubscription(publicKey: string) {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey)
  });
}

function deviceName() {
  const platform = navigator.platform || "Device";
  return `${browserName()} on ${platform}`;
}

function browserName() {
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Edg/")) return "Microsoft Edge";
  if (userAgent.includes("Chrome/")) return "Chrome";
  if (userAgent.includes("Firefox/")) return "Firefox";
  if (userAgent.includes("Safari/")) return "Safari";
  return "Browser";
}
