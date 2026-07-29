"use client";

export function RetryConnectionButton() {
  return (
    <button className="offline-primary-action" type="button" onClick={() => window.location.reload()}>
      Try Again
    </button>
  );
}
