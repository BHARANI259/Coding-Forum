export default function LoadingState({ label = "Loading portal..." }: { label?: string }) {
  return (
    <main className="portal-access-loader" aria-busy="true" aria-live="polite">
      <div className="portal-access-logo-wrap">
        <span className="portal-access-glow" aria-hidden="true" />
        <img
          src="/logo.png"
          alt="Kongu Engineering College"
          className="portal-access-logo"
        />
      </div>
      <p>{label}</p>
    </main>
  );
}
