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
  const statusLabel =
    currentRole === "employee"
      ? "Portal access"
      : isSystemAdmin
        ? "Workspace mode"
        : "Current period";
  const statusValue =
    currentRole === "employee"
      ? "Payslips only"
      : isSystemAdmin
        ? `${branding.companyName} setup`
        : "Apr 1 - Apr 30";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/86 backdrop-blur-xl">
      <div className="flex min-h-22 w-full items-center justify-between gap-4 px-4 py-3 sm:px-5 lg:px-4">
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
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Workspace
              </p>
              <span className="ui-badge ui-badge-neutral hidden sm:inline-flex">
                {statusLabel}
              </span>
              <span className="ui-badge ui-badge-info hidden md:inline-flex">
                {statusValue}
              </span>
            </div>
            <p className="mt-2 truncate text-xl font-semibold tracking-tight text-slate-950">
              {currentTitle}
            </p>
            <p className="mt-1 hidden truncate text-sm text-slate-500 sm:block">
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

          <div className="hidden rounded-[24px] border border-blue-200/80 bg-linear-to-r from-blue-50/90 to-white px-4 py-2.5 text-right shadow-sm lg:block">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-700">
              {statusLabel}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {statusValue}
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
