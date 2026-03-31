"use client";

import { useEffect, useState } from "react";
import type { BackendStatus } from "@/lib/api/health";

const BACKEND_STATUS_POLL_INTERVAL_MS = 5000;

export function useBackendStatus(initialStatus: BackendStatus | null = null) {
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(
    initialStatus,
  );

  useEffect(() => {
    let cancelled = false;

    async function refreshBackendStatus() {
      try {
        const response = await fetch("/api/backend-status", {
          cache: "no-store",
        });
        const nextStatus = (await response.json()) as BackendStatus;

        if (!cancelled) {
          setBackendStatus(nextStatus);
        }
      } catch {
        if (!cancelled) {
          setBackendStatus({
            available: false,
            message: "Backend status check failed from the frontend.",
          });
        }
      }
    }

    void refreshBackendStatus();

    const intervalId = window.setInterval(
      refreshBackendStatus,
      BACKEND_STATUS_POLL_INTERVAL_MS,
    );

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return backendStatus;
}
