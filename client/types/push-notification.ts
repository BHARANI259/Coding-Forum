export type NotificationPermissionState = "default" | "granted" | "denied" | "unsupported";

export type PushSubscriptionStatus =
  | "unsupported"
  | "insecure-context"
  | "permission-required"
  | "permission-denied"
  | "subscribed"
  | "unsubscribed"
  | "error";

export type PushSubscriptionPayload = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  deviceName?: string;
  platform?: string;
  browser?: string;
  permissionStatus?: string;
};

export type PushDevice = {
  id: number;
  active: boolean;
  deviceName: string | null;
  platform: string | null;
  browser: string | null;
  permissionStatus: string | null;
  createdAt: string;
  lastSeenAt: string | null;
};
