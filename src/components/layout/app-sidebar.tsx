"use client";

import { ChevronLeft } from "lucide-react";
import {
  getNavigationItemsForRole,
  type NavigationRole,
} from "@/config/navigation";
import { APP_SUBTITLE } from "@/config/branding";
import { BrandMark } from "@/components/shared/brand-mark";
import { resolveBrandingAssetUrl } from "@/lib/api/branding";
import type { BrandingRecord } from "@/types/branding";
import { cn } from "@/lib/utils";
import { NavigationLink } from "./navigation-link";

type AppSidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onClose: () => void;
  currentRole: NavigationRole | null;
  branding: BrandingRecord;
  activeHref: string;
  pendingHref?: string | null;
  onNavigate: (href: string) => void;
};

export function AppSidebar({
  collapsed,
  mobileOpen,
  onClose,
  currentRole,
  branding,
  activeHref,
  pendingHref = null,
  onNavigate,
}: AppSidebarProps) {
  const availableNavigationItems = getNavigationItemsForRole(currentRole);
  const companyLogoUrl = resolveBrandingAssetUrl(branding.companyLogoPath);
  const groupedNavigationItems = availableNavigationItems.reduce<
    Array<{ section: string; items: typeof availableNavigationItems }>
  >((groups, item) => {
    const section = item.section ?? "Workspace";
    const existing = groups.find((group) => group.section === section);

    if (existing) {
      existing.items.push(item);
      return groups;
    }

    groups.push({ section, items: [item] });
    return groups;
  }, []);

  return (
    <aside
      className={cn(
        "enterprise-sidebar fixed inset-y-0 left-0 z-40 flex h-screen w-[84vw] max-w-80 shrink-0 -translate-x-full flex-col border-r text-slate-100 transition-all duration-300 lg:w-[19rem] lg:max-w-none lg:translate-x-0",
        mobileOpen && "translate-x-0 shadow-2xl shadow-slate-950/30",
        collapsed && "lg:w-24",
      )}
      style={{ borderColor: "var(--sidebar-border)" }}
    >
      <div className="border-b border-[var(--sidebar-border)] px-4 py-5 lg:px-5">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex min-w-0 items-center gap-3",
              collapsed && "lg:w-full lg:justify-center",
            )}
          >
            <BrandMark
              companyName={branding.companyName}
              logoUrl={companyLogoUrl}
              subtitle={APP_SUBTITLE}
              compact={collapsed}
            />
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
      </div>

      <div className="sidebar-scroll flex flex-1 flex-col gap-7 overflow-y-auto px-4 py-8 pr-3">
        <nav className="flex flex-col gap-5">
          {groupedNavigationItems.map((group) => (
            <div key={group.section} className={cn("space-y-2", collapsed && "lg:space-y-3")}>
              <p
                className={cn(
                  "px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500",
                  collapsed && "lg:sr-only",
                )}
              >
                {group.section}
              </p>
              <div className="flex flex-col gap-2">
                {group.items.map((item) => (
                  <NavigationLink
                    key={item.href}
                    item={item}
                    active={item.href === activeHref}
                    collapsed={collapsed}
                    pending={item.href === pendingHref}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
