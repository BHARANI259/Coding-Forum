"use client";

import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { usePwaInstall } from "./pwa-install-provider";

type InstallAppButtonProps = {
  compact?: boolean;
  className?: string;
};

export function InstallAppButton({ compact = false, className }: InstallAppButtonProps) {
  const { canInstall, install, installInProgress, isIos } = usePwaInstall();

  if (!canInstall) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="secondary"
      loading={installInProgress}
      aria-label={isIos ? "Show iPhone or iPad install guide" : "Install KEC Coding Forum app"}
      onClick={() => {
        void install();
      }}
      className={cn("gap-2 whitespace-nowrap", compact && "px-3", className)}
    >
      <span aria-hidden="true">+</span>
      {compact ? "Install" : isIos ? "Add to Home Screen" : "Install App"}
    </Button>
  );
}
