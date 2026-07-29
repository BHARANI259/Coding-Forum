"use client";

import { useEffect, useState } from "react";

type NetworkNotice = {
  id: number;
  message: string;
  tone: "offline" | "online";
};

export function NetworkStatusToast() {
  const [notice, setNotice] = useState<NetworkNotice | null>(null);

  useEffect(() => {
    const showNotice = (message: string, tone: NetworkNotice["tone"]) => {
      setNotice({ id: Date.now(), message, tone });
    };

    const handleOffline = () => {
      showNotice("You appear to be offline. Online actions are temporarily unavailable.", "offline");
    };

    const handleOnline = () => {
      showNotice("Connection restored.", "online");
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  if (!notice) {
    return null;
  }

  return (
    <div className={`pwa-network-toast pwa-network-toast-${notice.tone}`} role="status">
      {notice.message}
    </div>
  );
}
