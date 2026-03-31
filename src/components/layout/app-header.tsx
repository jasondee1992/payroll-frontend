"use client";

import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

type AppHeaderProps = {
  collapsed: boolean;
  currentTitle: string;
  currentDescription: string;
  onToggleCollapsed: () => void;
  onOpenMobileNav: () => void;
};

export function AppHeader({
  collapsed,
  currentTitle,
  currentDescription,
  onToggleCollapsed,
  onOpenMobileNav,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/92 backdrop-blur">
      <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
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
          <LogoutButton />

          <div className="hidden rounded-2xl border border-emerald-200/80 bg-emerald-50 px-4 py-2.5 text-right sm:block">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
              Current period
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-900">
              Apr 1 - Apr 30
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">Payroll Admin</p>
              <p className="text-xs text-slate-500">Operations team</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
              PA
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
