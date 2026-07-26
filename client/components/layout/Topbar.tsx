import Breadcrumbs from "./Breadcrumbs";
import NotificationButton from "@/components/notifications/NotificationButton";

type TopbarProps = {
  title: string;
  onMenuClick: () => void;
};

export default function Topbar({ title, onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-kec-border bg-white px-3 py-2 sm:px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={onMenuClick}
          className="rounded-lg border border-kec-border px-3 py-2 text-sm font-semibold text-kec-text lg:hidden"
        >
          Menu
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-kec-text sm:hidden">{title}</p>
          <Breadcrumbs title={title} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <NotificationButton />
        <div className="hidden text-sm font-semibold text-kec-secondary sm:block">Kongu Engineering College</div>
      </div>
    </header>
  );
}
