"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { getActiveNavigationItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "payroll.sidebar.collapsed";

export function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const currentItem = useMemo(
    () => getActiveNavigationItem(pathname),
    [pathname],
  );

  return (
    <div className="min-h-screen text-slate-900">
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
          onClose={() => setMobileOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader
            collapsed={collapsed}
            currentTitle={currentItem.title}
            currentDescription={currentItem.description}
            onToggleCollapsed={() => setCollapsed((current) => !current)}
            onOpenMobileNav={() => setMobileOpen(true)}
          />

          <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-7">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
