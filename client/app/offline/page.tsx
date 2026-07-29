import Image from "next/image";
import Link from "next/link";
import { RetryConnectionButton } from "../../components/pwa/retry-connection-button";

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <section className="offline-card" aria-labelledby="offline-title">
        <Image
          className="offline-logo"
          src="/logo.png"
          alt="Kongu Engineering College"
          width={260}
          height={100}
          priority
        />
        <p className="offline-kicker">KEC Coding Forum</p>
        <h1 id="offline-title">You&apos;re offline</h1>
        <p className="offline-copy">
          Check your internet connection and try again. Registration, results and account actions require an
          internet connection.
        </p>
        <div className="offline-actions">
          <RetryConnectionButton />
          <Link className="offline-secondary-action" href="/">
            Go to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
