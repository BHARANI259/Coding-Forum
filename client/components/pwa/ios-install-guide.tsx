"use client";

import { useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import { usePwaInstall } from "./pwa-install-provider";

export function IosInstallGuide() {
  const { isIos, showIosGuide, setShowIosGuide } = usePwaInstall();
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!showIosGuide) {
      return;
    }

    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowIosGuide(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [setShowIosGuide, showIosGuide]);

  if (!isIos || !showIosGuide) {
    return null;
  }

  return (
    <div className="pwa-dialog-backdrop" role="presentation" onClick={() => setShowIosGuide(false)}>
      <section
        aria-describedby="ios-install-description"
        aria-labelledby="ios-install-title"
        aria-modal="true"
        className="pwa-dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pwa-dialog-header">
          <div>
            <h2 id="ios-install-title">Install on iPhone or iPad</h2>
            <p id="ios-install-description">Add KEC Coding Forum to your Home Screen using Safari.</p>
          </div>
          <button
            type="button"
            aria-label="Close install guide"
            className="pwa-dialog-close"
            onClick={() => setShowIosGuide(false)}
          >
            &times;
          </button>
        </div>

        <ol className="pwa-ios-steps">
          <li>Open this application in Safari.</li>
          <li>Tap the Share button in the Safari toolbar.</li>
          <li>Choose Add to Home Screen.</li>
          <li>Tap Add to confirm.</li>
        </ol>

        <p className="pwa-ios-note">
          If you are using another iOS browser, open this page in Safari first, then follow these steps.
        </p>

        <Button type="button" className="w-full" onClick={() => setShowIosGuide(false)}>
          Got it
        </Button>
      </section>
    </div>
  );
}
