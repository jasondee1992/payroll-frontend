"use client";

import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SessionActivityManager } from "@/components/auth/session-activity-manager";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { getActiveNavigationItem, type NavigationRole } from "@/config/navigation";
import type { AppRole } from "@/lib/auth/session";
import type { BrandingRecord } from "@/types/branding";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "payroll.sidebar.collapsed";

export function AppShell({
  children,
  currentRole = null,
  currentUsername = null,
  currentDisplayRole = null,
  branding,
}: Readonly<{
  children: React.ReactNode;
  currentRole?: AppRole | null;
  currentUsername?: string | null;
  currentDisplayRole?: string | null;
  branding: BrandingRecord;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [isNavigating, startNavigation] = useTransition();

  useEffect(() => {
    const storedValue = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);

    if (storedValue) {
      setCollapsed(storedValue === "true");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!pendingHref) {
      return;
    }

    if (pathname === pendingHref || pathname.startsWith(`${pendingHref}/`)) {
      setPendingHref(null);
    }
  }, [pathname, pendingHref]);

  const navigationRole = useMemo<NavigationRole | null>(() => {
    return currentDisplayRole === "system-admin"
      ? "system-admin"
      : currentRole;
  }, [currentDisplayRole, currentRole]);

  const currentItem = useMemo(
    () => getActiveNavigationItem(pathname, navigationRole),
    [navigationRole, pathname],
  );

  const pendingItem = useMemo(
    () =>
      pendingHref
        ? getActiveNavigationItem(pendingHref, navigationRole)
        : currentItem,
    [currentItem, navigationRole, pendingHref],
  );

  const displayedItem = pendingHref ? pendingItem : currentItem;
  const isNavigationPending = Boolean(pendingHref) || isNavigating;

  const handleNavigate = useCallback(
    (href: string) => {
      if (href === pathname) {
        setMobileOpen(false);
        return;
      }

      setPendingHref(href);
      setMobileOpen(false);
      startNavigation(() => {
        router.push(href);
      });
    },
    [pathname, router],
  );

  return (
    <div className="min-h-screen text-slate-900">
      <SessionActivityManager />

      <div
        className={cn(
          "fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
      />

      <div className="flex min-h-screen">
        <AppSidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          currentRole={navigationRole}
          branding={branding}
          activeHref={displayedItem.href}
          pendingHref={isNavigationPending ? pendingHref : null}
          onNavigate={handleNavigate}
          onClose={() => setMobileOpen(false)}
        />

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col transition-[padding-left] duration-300",
            collapsed ? "lg:pl-24" : "lg:pl-72",
          )}
        >
          <AppHeader
            collapsed={collapsed}
            currentTitle={displayedItem.title}
            currentDescription={displayedItem.description}
            currentRole={currentRole}
            currentUsername={currentUsername}
            currentDisplayRole={currentDisplayRole}
            branding={branding}
            onToggleCollapsed={() => setCollapsed((current) => !current)}
            onOpenMobileNav={() => setMobileOpen(true)}
          />

          <main className="flex-1 px-4 py-5 sm:px-5 sm:py-6 lg:px-4 lg:py-7">
            <div className="relative mx-auto w-full max-w-[1680px]">
              <div
                className={cn(
                  "pointer-events-none absolute inset-x-0 top-0 z-20 overflow-hidden rounded-full transition-opacity duration-200",
                  isNavigationPending ? "opacity-100" : "opacity-0",
                )}
                aria-hidden={!isNavigationPending}
              >
                <div className="h-1 rounded-full bg-slate-200/80">
                  <div className="h-full w-1/3 animate-pulse rounded-full bg-blue-500" />
                </div>
              </div>

              {isNavigationPending ? (
                <div className="pointer-events-none absolute inset-0 z-10 flex min-h-[14rem] flex-col gap-4 rounded-[28px] border border-slate-200/70 bg-white/88 p-5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.22)] backdrop-blur-sm sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                        <LoaderCircle className="h-4 w-4 animate-spin text-blue-600" />
                        Loading {displayedItem.title}
                      </div>
                      <p className="max-w-2xl text-sm text-slate-600">
                        Opening the selected page now. Data panels will fill in as
                        soon as the next screen is ready.
                      </p>
                    </div>
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                      Loading
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-24 animate-pulse rounded-3xl bg-slate-100"
                      />
                    ))}
                  </div>

                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-14 animate-pulse rounded-2xl bg-slate-100"
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <div
                className={cn(
                  "flex w-full flex-col gap-7 transition-opacity duration-200",
                  isNavigationPending && "opacity-40",
                )}
              >
              {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
