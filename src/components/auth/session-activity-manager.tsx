"use client";

import { useEffect, useRef } from "react";
import {
  AUTH_ACTIVITY_STORAGE_KEY,
  AUTH_FORCE_LOGOUT_STORAGE_KEY,
  AUTH_IDLE_TIMEOUT_MS,
  AUTH_SESSION_REFRESH_INTERVAL_MS,
} from "@/lib/auth/session";
import { performClientLogout } from "@/lib/auth/client-auth";

const ACTIVITY_WRITE_THROTTLE_MS = 5_000;
const IDLE_CHECK_INTERVAL_MS = 30_000;

export function SessionActivityManager() {
  const lastActivityAtRef = useRef(Date.now());
  const lastRefreshAtRef = useRef(0);
  const lastActivityWriteAtRef = useRef(0);
  const refreshInFlightRef = useRef(false);
  const logoutInFlightRef = useRef(false);

  useEffect(() => {
    function syncActivityTimestamp(nextTimestamp: number, force = false) {
      lastActivityAtRef.current = nextTimestamp;

      if (!force && nextTimestamp - lastActivityWriteAtRef.current < ACTIVITY_WRITE_THROTTLE_MS) {
        return;
      }

      lastActivityWriteAtRef.current = nextTimestamp;

      try {
        window.localStorage.setItem(AUTH_ACTIVITY_STORAGE_KEY, String(nextTimestamp));
      } catch {}
    }

    async function refreshSession() {
      if (refreshInFlightRef.current || logoutInFlightRef.current) {
        return;
      }

      refreshInFlightRef.current = true;

      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (response.status === 401) {
          triggerLogout();
          return;
        }

        if (response.ok) {
          lastRefreshAtRef.current = Date.now();
        }
      } catch {
        // Network failures should not immediately log the user out.
      } finally {
        refreshInFlightRef.current = false;
      }
    }

    function triggerLogout(broadcast = true) {
      if (logoutInFlightRef.current) {
        return;
      }

      logoutInFlightRef.current = true;

      if (broadcast) {
        try {
          window.localStorage.setItem(
            AUTH_FORCE_LOGOUT_STORAGE_KEY,
            String(Date.now()),
          );
        } catch {}
      }

      void performClientLogout("/login");
    }

    function handleActivity(force = false) {
      const now = Date.now();
      syncActivityTimestamp(now, force);

      if (
        document.visibilityState === "visible" &&
        now - lastRefreshAtRef.current >= AUTH_SESSION_REFRESH_INTERVAL_MS
      ) {
        void refreshSession();
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === AUTH_ACTIVITY_STORAGE_KEY && event.newValue) {
        const nextTimestamp = Number(event.newValue);

        if (Number.isFinite(nextTimestamp) && nextTimestamp > lastActivityAtRef.current) {
          lastActivityAtRef.current = nextTimestamp;
        }
      }

      if (event.key === AUTH_FORCE_LOGOUT_STORAGE_KEY && event.newValue) {
        triggerLogout(false);
      }
    }

    const storedActivityAt = Number(window.localStorage.getItem(AUTH_ACTIVITY_STORAGE_KEY) ?? "");
    if (Number.isFinite(storedActivityAt) && storedActivityAt > 0) {
      lastActivityAtRef.current = storedActivityAt;
    }

    handleActivity(true);

    const events: Array<keyof WindowEventMap> = [
      "click",
      "focus",
      "keydown",
      "mousemove",
      "pointerdown",
      "scroll",
      "touchstart",
    ];
    const handleWindowActivity = () => handleActivity();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleActivity(true);
      }
    };

    for (const eventName of events) {
      window.addEventListener(eventName, handleWindowActivity, { passive: true });
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorage);

    const intervalId = window.setInterval(() => {
      const now = Date.now();

      if (now - lastActivityAtRef.current >= AUTH_IDLE_TIMEOUT_MS) {
        triggerLogout();
        return;
      }

      if (
        document.visibilityState === "visible" &&
        now - lastRefreshAtRef.current >= AUTH_SESSION_REFRESH_INTERVAL_MS
      ) {
        void refreshSession();
      }
    }, IDLE_CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      for (const eventName of events) {
        window.removeEventListener(eventName, handleWindowActivity);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return null;
}
