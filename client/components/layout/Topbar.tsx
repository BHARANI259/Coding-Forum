import Breadcrumbs from "./Breadcrumbs";
import NotificationButton from "@/components/notifications/NotificationButton";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

type TopbarProps = {
  title: string;
  onMenuClick: () => void;
};

export default function Topbar({ title, onMenuClick }: TopbarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex min-h-16 max-w-full items-center justify-between gap-2 border-b border-white/10 bg-kec-sidebar px-3 py-2 shadow-sm sm:gap-3 sm:px-4 lg:sticky lg:inset-auto lg:border-kec-border lg:bg-white lg:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/35 bg-white/12 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60 lg:hidden"
        >
          <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
          </svg>
        </button>
        <div className="hidden min-w-0 sm:block">
          <Breadcrumbs title={title} />
        </div>
      </div>

      <div className="pointer-events-none absolute left-1/2 max-w-[calc(100%-7.5rem)] -translate-x-1/2 text-center text-sm font-black leading-5 text-white sm:hidden">
        Kongu Engineering College
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <InstallAppButton compact className="hidden sm:inline-flex" />
        <ThemeToggle className="hidden sm:inline-flex" />
        <NotificationButton />
        <div className="hidden max-w-[220px] truncate text-sm font-semibold text-white/90 sm:block lg:text-slate-600">Kongu Engineering College</div>
      </div>
    </header>
  );
}
