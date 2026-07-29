"use client";

import { usePwaInstall } from "./pwa-install-provider";

export function LandingInstallCard() {
  const { canInstall, install, installInProgress, isInstalled, isIos } = usePwaInstall();

  return (
    <aside className="landing-install-card" aria-label="Install KEC Coding Forum app">
      <div className="landing-install-copy">
        <span className="landing-install-label">App available</span>
        <p>Install KEC Coding Forum for faster access from your phone or desktop.</p>
      </div>
      {isInstalled ? (
        <span className="landing-install-status">Installed</span>
      ) : canInstall ? (
        <button
          type="button"
          className="landing-install-button"
          disabled={installInProgress}
          onClick={() => {
            void install();
          }}
        >
          {installInProgress ? "Opening..." : isIos ? "Add to Home Screen" : "Install App"}
        </button>
      ) : (
        <span className="landing-install-hint">Use browser install option</span>
      )}
    </aside>
  );
}
