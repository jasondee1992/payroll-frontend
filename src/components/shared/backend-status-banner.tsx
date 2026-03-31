"use client";

import { AlertTriangle, PlugZap } from "lucide-react";
import { useBackendStatus } from "@/lib/api/use-backend-status";

export function BackendStatusBanner() {
  const backendStatus = useBackendStatus();

  if (!backendStatus || backendStatus.available) {
    return null;
  }

  return (
    <div className="border-b border-amber-300/80 bg-amber-50/95 text-amber-950 backdrop-blur">
      <div className="flex w-full items-start gap-3 px-4 py-3 sm:px-5 lg:px-4">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <AlertTriangle className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Backend is offline</p>
          <p className="mt-1 text-sm text-amber-900/90">
            {backendStatus.message}
          </p>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-amber-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 sm:inline-flex">
          <PlugZap className="h-3.5 w-3.5" />
          Offline
        </div>
      </div>
    </div>
  );
}
