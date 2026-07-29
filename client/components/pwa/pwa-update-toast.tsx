"use client";

import Button from "@/components/ui/Button";
import { usePwaInstall } from "./pwa-install-provider";

export function PwaUpdateToast() {
  const { dismissUpdate, updateAvailable, updateNow } = usePwaInstall();

  if (!updateAvailable) {
    return null;
  }

  return (
    <section className="pwa-update-toast" aria-live="polite" aria-label="Application update available">
      <div className="min-w-0">
        <p className="text-sm font-bold text-kec-text">New version available</p>
        <p className="mt-1 text-sm text-kec-secondary">Update the application to use the latest improvements.</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" onClick={updateNow}>
          Update now
        </Button>
        <Button type="button" variant="ghost" onClick={dismissUpdate}>
          Later
        </Button>
      </div>
    </section>
  );
}
