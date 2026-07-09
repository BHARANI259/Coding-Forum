"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, type CurrentUser, type UserRole } from "@/lib/api";
import { clearAuth, getCurrentUser, getLoginPath, getToken, updateStoredUser } from "@/lib/auth";
import LoadingState from "@/components/ui/LoadingState";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileSidebar from "./MobileSidebar";

type AppShellProps = {
  expectedRole: UserRole;
  title: string;
  children: ReactNode;
  fullWidth?: boolean;
};

export default function AppShell({ expectedRole, title, children, fullWidth = false }: AppShellProps) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = getToken();
    const storedUser = getCurrentUser();

    if (!token || !storedUser) {
      clearAuth();
      router.replace(getLoginPath(expectedRole));
      return;
    }

    if (storedUser.firstLoginRequired) {
      router.replace("/auth/change-password");
      return;
    }

    if (storedUser.role !== expectedRole) {
      router.replace(getLoginPath(storedUser.role));
      return;
    }

    setUser(storedUser);
    getMe()
      .then((freshUser) => {
        updateStoredUser(freshUser);
        setUser(freshUser);
      })
      .catch(() => {
        clearAuth();
        router.replace(getLoginPath(expectedRole));
      });
  }, [expectedRole, router]);

  function handleLogout() {
    clearAuth();
    router.replace("/");
  }

  if (!user) {
    return <LoadingState label="Checking portal access..." />;
  }

  return (
    <div className="min-h-screen bg-kec-bg">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-[260px] lg:block">
        <Sidebar user={user} onLogout={handleLogout} />
      </div>

      <MobileSidebar
        open={mobileOpen}
        user={user}
        onClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
      />

      <div className="lg:pl-[260px]">
        <Topbar
          title={title}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className={fullWidth ? "w-full px-4 py-6 sm:px-6 lg:px-8" : "mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"}>{children}</main>
      </div>
    </div>
  );
}
