"use client";

import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NotificationBell } from "@/components/time-requests/notification-bell";
import { ProfileMenu } from "@/components/profile/profile-menu";
import type { AppRole } from "@/lib/auth/session";

type AppHeaderProps = {
  collapsed: boolean;
  currentTitle: string;
  onToggleCollapsed: () => void;
  onOpenMobileNav: () => void;
  currentRole: AppRole | null;
  currentUsername: string | null;
  currentDisplayRole: string | null;
};

export function AppHeader({
  collapsed,
  currentTitle,
  onToggleCollapsed,
  onOpenMobileNav,
  currentRole,
  currentUsername,
  currentDisplayRole,
}: AppHeaderProps) {
  const isSystemAdmin = currentRole === "system-admin";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/86 backdrop-blur-xl">
      <div className="flex min-h-22 w-full items-center justify-between gap-5 px-5 py-4 sm:px-6 lg:px-9">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="ui-icon-button lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onToggleCollapsed}
            className="ui-icon-button hidden lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>

          <div className="min-w-0 rounded-[24px] border border-slate-200/80 bg-white/92 px-4 py-3 shadow-[var(--shadow-soft)]">
            <p className="truncate text-lg font-semibold tracking-tight text-slate-950 sm:text-[19px]">
              {currentTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isSystemAdmin ? (
            <NotificationBell
              currentRole={currentRole}
              currentUsername={currentUsername}
            />
          ) : null}

          <ProfileMenu
            currentRole={currentRole}
            currentUsername={currentUsername}
            currentDisplayRole={currentDisplayRole}
          />
        </div>
      </div>
    </header>
  );
}
