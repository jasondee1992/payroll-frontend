"use client";

import { Building2, ChevronLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  getActiveNavigationItem,
  getNavigationItemsForRole,
  type NavigationRole,
} from "@/config/navigation";
import { APP_NAME, APP_SUBTITLE } from "@/config/branding";
import { cn } from "@/lib/utils";
import { NavigationLink } from "./navigation-link";

type AppSidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onClose: () => void;
  currentRole: NavigationRole | null;
};

export function AppSidebar({
  collapsed,
  mobileOpen,
  onClose,
  currentRole,
}: AppSidebarProps) {
  const pathname = usePathname();
  const activeItem = getActiveNavigationItem(pathname, currentRole);
  const availableNavigationItems = getNavigationItemsForRole(currentRole);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-screen w-[82vw] max-w-72 shrink-0 -translate-x-full flex-col border-r border-white/8 bg-[var(--sidebar)] text-slate-100 transition-all duration-300 lg:w-72 lg:max-w-none lg:translate-x-0",
        mobileOpen && "translate-x-0 shadow-2xl shadow-slate-950/30",
        collapsed && "lg:w-24",
      )}
    >
      <div className="flex h-20 items-center justify-between border-b border-[var(--sidebar-border)] px-4 lg:px-5">
        <div
          className={cn(
            "flex min-w-0 items-center gap-3",
            collapsed && "lg:w-full lg:justify-center",
          )}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 ring-1 ring-white/10">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div className={cn("min-w-0", collapsed && "lg:hidden")}>
            <p className="truncate text-sm font-semibold text-white">
              {APP_NAME}
            </p>
            <p className="truncate text-xs text-slate-400">
              {APP_SUBTITLE}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/6 text-slate-200 transition hover:bg-white/10 lg:hidden"
          aria-label="Close navigation"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
        <div className="rounded-[22px] border border-white/8 bg-white/[0.05] p-4">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.24em] text-slate-400",
              collapsed && "lg:text-center",
            )}
          >
            {collapsed ? "FY26" : "Payroll cycle"}
          </p>
          <div className={cn("mt-3", collapsed && "lg:hidden")}>
            <p className="text-sm font-medium text-white">April 2026 cycle</p>
            <p className="mt-1 text-xs text-slate-400">
              Review time entries, finalize approvals, and publish payslips.
            </p>
          </div>
          <div
            className={cn(
              "mt-4 flex items-center justify-between rounded-xl bg-white/6 px-3 py-2 text-xs text-slate-300",
              collapsed && "lg:mt-3 lg:flex-col lg:gap-1",
            )}
          >
            <span>Progress</span>
            <span className="font-semibold text-white">78%</span>
          </div>
        </div>

        <div className={cn("space-y-3", collapsed && "lg:space-y-2")}>
          <p
            className={cn(
              "px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500",
              collapsed && "lg:sr-only",
            )}
          >
            Main navigation
          </p>
          <nav className="flex flex-col gap-2">
            {availableNavigationItems.map((item) => (
              <NavigationLink
                key={item.href}
                item={item}
                active={item.href === activeItem.href}
                collapsed={collapsed}
              />
            ))}
          </nav>
        </div>

        <div
          className={cn(
            "mt-auto rounded-[22px] border border-white/8 bg-white/[0.04] p-4",
            collapsed && "lg:hidden",
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Attention
          </p>
          <p className="mt-2 text-sm font-medium text-white">17 pending approvals</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Attendance corrections and variable pay items are still awaiting
            review.
          </p>
        </div>
      </div>
    </aside>
  );
}
