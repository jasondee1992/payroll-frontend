"use client";

import { useBackendStatus } from "@/lib/api/use-backend-status";

export function LoginBackendStatusCard() {
  const backendStatus = useBackendStatus();

  if (backendStatus?.available !== true) {
    return null;
  }

  return (
    <div className="mt-6 rounded-[18px] border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 shadow-sm">
      <p className="text-[12px] font-semibold text-emerald-900">
        FastAPI auth is connected
      </p>
    </div>
  );
}
