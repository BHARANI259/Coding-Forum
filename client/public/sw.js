const STATIC_CACHE = "kec-forum-static-v1";
const PAGE_CACHE = "kec-forum-pages-v1";
const MAX_STATIC_CACHE_ENTRIES = 140;
const NAVIGATION_TIMEOUT_MS = 10000;

const PRECACHE_URLS = [
  "/offline",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-512x512-maskable.png",
  "/icons/apple-touch-icon.png",
  "/favicon.png",
  "/logo.png",
];

const SAFE_STATIC_PREFIXES = [
  "/_next/static/",
  "/icons/",
];

const SAFE_STATIC_PATHS = new Set([
  "/favicon.png",
  "/logo.png",
]);

const API_OR_SENSITIVE_PREFIXES = [
  "/api/",
  "/uploads/",
  "/profile-images/",
  "/event-photos/",
  "/attachments/",
  "/private/",
  "/notifications/",
  "/users/",
  "/students/",
  "/faculty/",
  "/admin/",
  "/student/",
  "/results/",
  "/registrations/",
  "/rounds/",
  "/reports/",
  "/leaderboard/",
];

const AUTH_PATH_PARTS = [
  "/login",
  "/logout",
  "/refresh",
  "/token",
];

const ALLOWED_NOTIFICATION_PREFIXES = [
  "/admin/",
  "/faculty/",
  "/student/",
  "/notifications",
  "/offline",
];

function isApiOrSensitivePath(pathname) {
  return (
    API_OR_SENSITIVE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    AUTH_PATH_PARTS.some((part) => pathname.includes(part))
  );
}

function isSafeStaticPath(pathname) {
  return SAFE_STATIC_PATHS.has(pathname) || SAFE_STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function safeNotificationUrl(value) {
  try {
    const url = new URL(value || "/notifications", self.location.origin);
    if (url.origin !== self.location.origin) {
      return "/notifications";
    }
    if (url.pathname !== "/" && !ALLOWED_NOTIFICATION_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(prefix))) {
      return "/notifications";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/notifications";
  }
}

async function hasVisibleClient() {
  const clientsList = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  return clientsList.some((client) => client.visibilityState === "visible" && client.focused);
}

function parsePushPayload(event) {
  if (!event.data) {
    return {
      title: "KEC Coding Forum",
      body: "You have a new notification.",
      url: "/notifications",
      type: "SYSTEM",
      notificationId: null,
    };
  }

  try {
    const payload = event.data.json();
    return {
      title: payload.title || "KEC Coding Forum",
      body: payload.body || "You have a new notification.",
      url: safeNotificationUrl(payload.url),
      type: payload.type || "SYSTEM",
      notificationId: payload.notificationId || null,
    };
  } catch {
    return {
      title: "KEC Coding Forum",
      body: event.data.text() || "You have a new notification.",
      url: "/notifications",
      type: "SYSTEM",
      notificationId: null,
    };
  }
}

function isCacheableResponse(response) {
  if (!response || !response.ok || response.status !== 200) {
    return false;
  }

  if (!["basic", "default"].includes(response.type)) {
    return false;
  }

  const cacheControl = response.headers.get("Cache-Control") || "";
  if (cacheControl.toLowerCase().includes("no-store") || cacheControl.toLowerCase().includes("private")) {
    return false;
  }

  if (response.headers.has("Set-Cookie")) {
    return false;
  }

  return true;
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) {
    return;
  }

  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

async function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  const activeCaches = new Set([STATIC_CACHE, PAGE_CACHE]);

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith("kec-forum-") && !activeCaches.has(cacheName))
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  if (request.headers.has("authorization") || request.headers.has("range")) {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetchWithTimeout(request, NAVIGATION_TIMEOUT_MS).catch(async () => {
        const offlineResponse = await caches.match("/offline");

        return (
          offlineResponse ||
          new Response("You are offline.", {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
            },
          })
        );
      })
    );

    return;
  }

  if (isApiOrSensitivePath(url.pathname)) {
    return;
  }

  if (isSafeStaticPath(url.pathname)) {
    event.respondWith(
      caches.match(request).then(async (cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        const networkResponse = await fetch(request);

        if (isCacheableResponse(networkResponse)) {
          const cache = await caches.open(STATIC_CACHE);
          await cache.put(request, networkResponse.clone());
          await trimCache(STATIC_CACHE, MAX_STATIC_CACHE_ENTRIES);
        }

        return networkResponse;
      })
    );
  }
});

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    const payload = parsePushPayload(event);
    const clientsList = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    clientsList.forEach((client) => {
      client.postMessage({
        type: "PUSH_NOTIFICATION_RECEIVED",
        payload,
      });
    });

    if (await hasVisibleClient()) {
      return;
    }

    await self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      tag: payload.notificationId ? `kec-notification-${payload.notificationId}` : undefined,
      data: {
        url: payload.url,
        notificationId: payload.notificationId,
        type: payload.type,
      },
      actions: [
        {
          action: "view",
          title: "View",
        },
      ],
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = safeNotificationUrl(event.notification.data?.url);

  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    for (const client of clientsList) {
      const clientUrl = new URL(client.url);
      if (clientUrl.origin === self.location.origin && "focus" in client) {
        await client.focus();
        client.postMessage({
          type: "PUSH_NOTIFICATION_CLICKED",
          payload: {
            url: targetUrl,
            notificationId: event.notification.data?.notificationId || null,
            type: event.notification.data?.type || "SYSTEM",
          },
        });
        return;
      }
    }

    await self.clients.openWindow(targetUrl);
  })());
});
