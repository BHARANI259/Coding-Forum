"use client";

import { useEffect } from "react";
import { usePwaInstall } from "./pwa-install-provider";

export function ServiceWorkerRegister() {
  const { setWaitingWorker } = usePwaInstall();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }

    let intervalId: number | null = null;
    let registrationRef: ServiceWorkerRegistration | null = null;

    const trackInstallingWorker = (registration: ServiceWorkerRegistration) => {
      const installingWorker = registration.installing;
      if (!installingWorker) {
        return;
      }

      installingWorker.addEventListener("statechange", () => {
        if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting ?? installingWorker);
        }
      });
    };

    const checkForUpdates = () => {
      if (!registrationRef || !navigator.onLine) {
        return;
      }

      registrationRef.update().catch(() => {
        // Routine update checks should not interrupt the user.
      });
    };

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        registrationRef = registration;

        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting);
        }

        registration.addEventListener("updatefound", () => trackInstallingWorker(registration));

        await registration.update();
        intervalId = window.setInterval(checkForUpdates, 60 * 60 * 1000);
      } catch (error: unknown) {
        console.error("Service worker registration failed:", error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForUpdates();
      }
    };

    const handleFocus = () => {
      checkForUpdates();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    void registerServiceWorker();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [setWaitingWorker]);

  return null;
}
