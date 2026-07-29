import Breadcrumbs from "./Breadcrumbs";
import NotificationButton from "@/components/notifications/NotificationButton";
import { InstallAppButton } from "@/components/pwa/install-app-button";

type TopbarProps = {
  title: string;
  onMenuClick: () => void;
};

export default function Topbar({ title, onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex min-h-16 max-w-full items-center justify-between gap-2 border-b border-violet-500 bg-kec-purple px-3 py-2 shadow-sm sm:gap-3 sm:border-kec-border sm:bg-white sm:px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={onMenuClick}
          className="inline-flex min-h-10 shrink-0 items-center rounded-lg border border-white/35 bg-white/12 px-3 py-2 text-sm font-semibold text-white lg:hidden"
        >
          Menu
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white sm:hidden">{title}</p>
          <Breadcrumbs title={title} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <InstallAppButton compact className="hidden sm:inline-flex" />
        <NotificationButton />
        <div className="hidden max-w-[220px] truncate text-sm font-semibold text-kec-secondary sm:block">Kongu Engineering College</div>
      </div>
    </header>
  );
}
