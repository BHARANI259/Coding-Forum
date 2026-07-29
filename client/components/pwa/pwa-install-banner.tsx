"use client";

import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import { usePwaInstall } from "./pwa-install-provider";

const EXCLUDED_PREFIXES = ["/auth", "/offline"];

export function PwaInstallBanner() {
  const pathname = usePathname();
  const { dismissInstallBanner, install, installInProgress, isIos, shouldShowInstallBanner } = usePwaInstall();

  if (!shouldShowInstallBanner || EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <section className="mb-4 rounded-xl border border-kec-purple/20 bg-white p-4 shadow-sm" aria-label="Install application">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-kec-text">Install KEC Coding Forum</p>
          <p className="mt-1 text-sm text-kec-secondary">
            {isIos
              ? "Add the portal to your Home Screen for faster access."
              : "Install the portal for faster access from your device."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            loading={installInProgress}
            onClick={() => {
              void install();
            }}
          >
            {isIos ? "Show Guide" : "Install"}
          </Button>
          <Button type="button" variant="ghost" onClick={dismissInstallBanner}>
            Not now
          </Button>
        </div>
      </div>
    </section>
  );
}
