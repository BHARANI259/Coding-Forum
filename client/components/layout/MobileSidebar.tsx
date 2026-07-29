"use client";

import { useEffect } from "react";
import type { CurrentUser } from "@/lib/api";
import Sidebar from "./Sidebar";

type MobileSidebarProps = {
  open: boolean;
  user: CurrentUser;
  onClose: () => void;
  onLogout: () => void | Promise<void>;
};

export default function MobileSidebar({ open, user, onClose, onLogout }: MobileSidebarProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation">
      <button
        type="button"
        aria-label="Close sidebar"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 w-[min(82vw,300px)] shadow-xl">
        <Sidebar user={user} onLogout={onLogout} onNavigate={onClose} />
      </div>
    </div>
  );
}
