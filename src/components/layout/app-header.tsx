"use client";

import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NotificationBell } from "@/components/time-requests/notification-bell";
import { ProfileMenu } from "@/components/profile/profile-menu";
import type { AppRole } from "@/lib/auth/session";
import type { BrandingRecord } from "@/types/branding";

type AppHeaderProps = {
  collapsed: boolean;
  currentTitle: string;
  currentDescription: string;
  onToggleCollapsed: () => void;
  onOpenMobileNav: () => void;
  currentRole: AppRole | null;
  currentUsername: string | null;
  currentDisplayRole: string | null;
  branding: BrandingRecord;
};

export function AppHeader({
  collapsed,
  currentTitle,
  currentDescription,
  onToggleCollapsed,
  onOpenMobileNav,
  currentRole,
  currentUsername,
  currentDisplayRole,
  branding,
}: AppHeaderProps) {
  const isSystemAdmin = currentRole === "system-admin";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/88 backdrop-blur-xl">
      <div className="flex min-h-20 w-full items-center justify-between gap-4 px-4 py-3 sm:px-5 lg:px-4">
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

          <div className="min-w-0 rounded-[22px] border border-slate-200/70 bg-white/70 px-3 py-2 shadow-sm sm:px-4">
            <p className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:block">
              Workspace
            </p>
            <p className="truncate text-lg font-semibold text-slate-950 sm:mt-1">
              {currentTitle}
            </p>
            <p className="hidden truncate text-sm text-slate-500 sm:block">
              {currentDescription}
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

          <div className="hidden rounded-[22px] border border-emerald-200/80 bg-emerald-50/90 px-4 py-2.5 text-right shadow-sm sm:block">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
              {currentRole === "employee"
                ? "Portal access"
                : isSystemAdmin
                  ? "Workspace mode"
                  : "Current period"}
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-900">
              {currentRole === "employee"
                ? "Payslips only"
                : isSystemAdmin
                  ? `${branding.companyName} setup`
                  : "Apr 1 - Apr 30"}
            </p>
          </div>

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
