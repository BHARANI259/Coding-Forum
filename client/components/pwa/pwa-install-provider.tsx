"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

interface LegacyMediaQueryList extends MediaQueryList {
  addListener(listener: (event: MediaQueryListEvent) => void): void;
  removeListener(listener: (event: MediaQueryListEvent) => void): void;
}

type InstallOutcome = "accepted" | "dismissed" | "unavailable" | "ios-guide";

type PwaContextValue = {
  canInstall: boolean;
  installInProgress: boolean;
  isInstalled: boolean;
  isIos: boolean;
  isStandalone: boolean;
  showIosGuide: boolean;
  shouldShowInstallBanner: boolean;
  updateAvailable: boolean;
  install: () => Promise<InstallOutcome>;
  dismissInstallBanner: () => void;
  setShowIosGuide: (open: boolean) => void;
  setWaitingWorker: (worker: ServiceWorker | null) => void;
  updateNow: () => void;
  dismissUpdate: () => void;
};

const INSTALL_DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;
const INSTALL_DISMISSED_KEY = "kec-forum-install-dismissed-at";
const INSTALL_ACCEPTED_KEY = "kec-forum-install-accepted";

const PwaInstallContext = createContext<PwaContextValue | null>(null);

function isBrowserStandalone() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = window.navigator as NavigatorWithStandalone;

  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

function isIosDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();

  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
  );
}

function getDismissedUntilActive() {
  try {
    const dismissedAt = window.localStorage.getItem(INSTALL_DISMISSED_KEY);
    if (!dismissedAt) {
      return false;
    }

    const timestamp = Number(dismissedAt);
    return Number.isFinite(timestamp) && Date.now() - timestamp < INSTALL_DISMISS_DURATION;
  } catch {
    return false;
  }
}

function getInstallAccepted() {
  try {
    return window.localStorage.getItem(INSTALL_ACCEPTED_KEY) === "true";
  } catch {
    return false;
  }
}

function rememberInstallAccepted() {
  try {
    window.localStorage.setItem(INSTALL_ACCEPTED_KEY, "true");
  } catch {
    // Non-sensitive preference; safe to ignore when storage is unavailable.
  }
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installInProgress, setInstallInProgress] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [installBannerDismissed, setInstallBannerDismissed] = useState(false);
  const [waitingWorker, setWaitingWorkerState] = useState<ServiceWorker | null>(null);
  const [updateDismissed, setUpdateDismissed] = useState(false);
  const userRequestedUpdateRef = useRef(false);
  const hasReloadedRef = useRef(false);

  useEffect(() => {
    const standalone = isBrowserStandalone();
    setIsStandalone(standalone);
    setIsInstalled(standalone || getInstallAccepted());
    setIsIos(isIosDevice());
    setInstallBannerDismissed(getDismissedUntilActive());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsStandalone(true);
      setDeferredPrompt(null);
      setShowIosGuide(false);
      setInstallBannerDismissed(true);
      rememberInstallAccepted();
    };

    const handleDisplayModeChange = () => {
      const standalone = isBrowserStandalone();
      setIsStandalone(standalone);
      setIsInstalled(standalone);
      if (standalone) {
        setDeferredPrompt(null);
        setShowIosGuide(false);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleDisplayModeChange);
    } else {
      (mediaQuery as LegacyMediaQueryList).addListener(handleDisplayModeChange);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleDisplayModeChange);
      } else {
        (mediaQuery as LegacyMediaQueryList).removeListener(handleDisplayModeChange);
      }
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }

    const handleControllerChange = () => {
      if (!userRequestedUpdateRef.current || hasReloadedRef.current) {
        return;
      }

      hasReloadedRef.current = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  const canInstall = !isInstalled && !isStandalone && (Boolean(deferredPrompt) || isIos);
  const updateAvailable = Boolean(waitingWorker) && !updateDismissed;

  const install = useCallback(async (): Promise<InstallOutcome> => {
    if (isInstalled || isStandalone) {
      return "unavailable";
    }

    if (isIos) {
      setShowIosGuide(true);
      return "ios-guide";
    }

    if (!deferredPrompt) {
      return "unavailable";
    }

    setInstallInProgress(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice.outcome === "accepted") {
        setInstallBannerDismissed(true);
        setIsInstalled(true);
        rememberInstallAccepted();
      }
      return choice.outcome;
    } catch (error: unknown) {
      console.error("Unable to open the install prompt:", error);
      return "unavailable";
    } finally {
      setInstallInProgress(false);
    }
  }, [deferredPrompt, isInstalled, isIos, isStandalone]);

  const dismissInstallBanner = useCallback(() => {
    setInstallBannerDismissed(true);
    try {
      window.localStorage.setItem(INSTALL_DISMISSED_KEY, String(Date.now()));
    } catch {
      // Non-sensitive preference; safe to ignore when storage is unavailable.
    }
  }, []);

  const setWaitingWorker = useCallback((worker: ServiceWorker | null) => {
    setWaitingWorkerState(worker);
    setUpdateDismissed(false);
  }, []);

  const updateNow = useCallback(() => {
    if (!waitingWorker) {
      return;
    }

    const confirmed = window.confirm("Updating will reload the application. Make sure you have saved any changes.");
    if (!confirmed) {
      return;
    }

    userRequestedUpdateRef.current = true;
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }, [waitingWorker]);

  const dismissUpdate = useCallback(() => {
    setUpdateDismissed(true);
  }, []);

  const value = useMemo<PwaContextValue>(
    () => ({
      canInstall,
      installInProgress,
      isInstalled,
      isIos,
      isStandalone,
      showIosGuide,
      shouldShowInstallBanner: canInstall && !installBannerDismissed,
      updateAvailable,
      install,
      dismissInstallBanner,
      setShowIosGuide,
      setWaitingWorker,
      updateNow,
      dismissUpdate,
    }),
    [
      canInstall,
      dismissInstallBanner,
      dismissUpdate,
      install,
      installBannerDismissed,
      installInProgress,
      isInstalled,
      isIos,
      isStandalone,
      setWaitingWorker,
      showIosGuide,
      updateAvailable,
      updateNow,
    ]
  );

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstall() {
  const context = useContext(PwaInstallContext);
  if (!context) {
    throw new Error("usePwaInstall must be used within PwaInstallProvider");
  }
  return context;
}
