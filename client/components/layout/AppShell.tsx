"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deactivateCurrentPushSubscription, getMe, type CurrentUser, type UserRole } from "@/lib/api";
import { clearAuth, getCurrentUser, getLoginPath, getToken, updateStoredUser } from "@/lib/auth";
import { currentBrowserSubscription, isPushSupported, subscriptionToPayload } from "@/lib/push-notifications";
import LoadingState from "@/components/ui/LoadingState";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileSidebar from "./MobileSidebar";
import { PwaInstallBanner } from "@/components/pwa/pwa-install-banner";

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

  async function handleLogout() {
    try {
      if (isPushSupported()) {
        const subscription = await currentBrowserSubscription();
        if (subscription) {
          await deactivateCurrentPushSubscription(subscriptionToPayload(subscription));
        }
      }
    } catch {
      // Logout must still clear the local session if push cleanup is unavailable.
    }
    clearAuth();
    router.replace("/");
  }

  if (!user) {
    return <LoadingState label="Checking portal access..." />;
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-kec-bg">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-[260px] lg:block">
        <Sidebar user={user} onLogout={handleLogout} />
      </div>

      <MobileSidebar
        open={mobileOpen}
        user={user}
        onClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
      />

      <div className="min-w-0 max-w-full lg:pl-[260px]">
        <Topbar
          title={title}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className={fullWidth ? "min-w-0 max-w-full overflow-x-hidden px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-6" : "mx-auto min-w-0 max-w-7xl overflow-x-hidden px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-6"}>
          <PwaInstallBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
