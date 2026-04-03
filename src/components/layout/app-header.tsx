"use client";

import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationBell } from "@/components/time-requests/notification-bell";
import type { AppRole } from "@/lib/auth/session";

type AppHeaderProps = {
  collapsed: boolean;
  currentTitle: string;
  currentDescription: string;
  onToggleCollapsed: () => void;
  onOpenMobileNav: () => void;
  currentRole: AppRole | null;
  currentUsername: string | null;
  currentDisplayRole: string | null;
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
}: AppHeaderProps) {
  const userLabel = currentUsername ?? (currentRole === "employee" ? "Employee" : "Admin");
  const roleLabel = formatRoleLabel(currentDisplayRole ?? currentRole);
  const initials = getInitials(currentUsername ?? roleLabel ?? "Admin");

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/92 backdrop-blur">
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

          <div className="min-w-0">
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
          <NotificationBell currentUsername={currentUsername} />

          <LogoutButton />

          <div className="hidden rounded-2xl border border-emerald-200/80 bg-emerald-50 px-4 py-2.5 text-right sm:block">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
              {currentRole === "employee" ? "Portal access" : "Current period"}
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-900">
              {currentRole === "employee" ? "Payslips only" : "Apr 1 - Apr 30"}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{userLabel}</p>
              <p className="text-xs text-slate-500">{roleLabel ?? "Workspace access"}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
              {initials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function formatRoleLabel(value: string | AppRole | null) {
  if (!value) {
    return null;
  }

  return value
    .trim()
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(value: string) {
  const parts = value
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "NA";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}
