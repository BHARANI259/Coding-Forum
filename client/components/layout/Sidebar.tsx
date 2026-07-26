"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CurrentUser } from "@/lib/api";
import { roleNavigation } from "@/lib/navigation";
import { cn } from "@/lib/cn";
import RoleBadge from "@/components/ui/RoleBadge";
import Button from "@/components/ui/Button";

type SidebarProps = {
  user: CurrentUser;
  onLogout: () => void;
  onNavigate?: () => void;
};

export default function Sidebar({ user, onLogout, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const items = roleNavigation[user.role];
  const displayName = user.name || user.email;

  return (
    <aside className="flex h-full w-[260px] flex-col bg-kec-sidebar text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <img
          src="/logo.png"
          alt="Kongu Engineering College"
          className="h-15 w-full rounded-md object-contain p-2"
        />
        <div className="mt-2 text-center text-xs font-bold tracking-wide text-white/70">
          KEC CODING FORUM
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Portal navigation">
        {items.map((item, index) => {
          const active = pathname === item.href || (item.href !== `/${user.role === "SUPER_ADMIN" ? "admin" : user.role.toLowerCase()}/dashboard` && pathname.startsWith(`${item.href}/`));
          const showGroup = item.group && item.group !== items[index - 1]?.group;
          return (
            <div key={item.href}>
              {showGroup ? <p className={`${index ? "mt-4" : ""} px-3 pb-1 text-[11px] font-bold text-white/45`}>{item.group}</p> : null}
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "block rounded-lg px-3 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-kec-purpleActive",
                  active && "bg-kec-purpleActive text-white shadow-sm"
                )}
              >
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="text-center">
          <RoleBadge role={user.role} />
          <p className="mt-3 truncate text-sm font-semibold text-white">{displayName}</p>
          <p className="mt-1 truncate text-xs text-white/55">{user.email}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={onLogout}
          className="mt-3 w-full justify-center bg-kec-sidebarDark text-white hover:bg-white/10"
        >
          Logout
        </Button>
      </div>
    </aside>
  );
}
