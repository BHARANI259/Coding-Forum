export default function LoadingState({ label = "Loading portal..." }: { label?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-kec-bg px-6">
      <div className="rounded-xl border border-kec-border bg-white px-6 py-4 text-sm font-medium text-kec-secondary shadow-sm">
        {label}
      </div>
    </main>
  );
}
