"use client";

import type { CurrentUser } from "@/lib/api";
import Sidebar from "./Sidebar";

type MobileSidebarProps = {
  open: boolean;
  user: CurrentUser;
  onClose: () => void;
  onLogout: () => void;
};

export default function MobileSidebar({ open, user, onClose, onLogout }: MobileSidebarProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close sidebar"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 w-[260px] max-w-[82vw] shadow-xl">
        <Sidebar user={user} onLogout={onLogout} onNavigate={onClose} />
      </div>
    </div>
  );
}
