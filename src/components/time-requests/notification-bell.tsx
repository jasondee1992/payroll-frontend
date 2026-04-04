"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  getNotifications,
  markNotificationAsRead,
} from "@/lib/api/attendance";
import type { NotificationRecord } from "@/types/attendance";
import type { AppRole } from "@/lib/auth/session";
import { formatPhilippineDateTime } from "@/lib/format/philippine-time";

type NotificationBellProps = {
  currentRole: AppRole | null;
  currentUsername: string | null;
};

const NOTIFICATION_REFRESH_INTERVAL_MS = 5000;

export function NotificationBell({
  currentRole,
  currentUsername,
}: NotificationBellProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoadedNotifications, setHasLoadedNotifications] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadNotifications(options?: { background?: boolean }) {
      const shouldShowLoadingState =
        !options?.background && !hasLoadedNotifications;

      if (shouldShowLoadingState) {
        setLoading(true);
      }

      try {
        const nextItems = await getNotifications();
        if (!isCancelled) {
          setItems(nextItems);
          setHasLoadedNotifications(true);
        }
      } catch {
        if (!isCancelled) {
          setItems([]);
        }
      } finally {
        if (!isCancelled && shouldShowLoadingState) {
          setLoading(false);
        }
      }
    }

    void loadNotifications();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadNotifications({ background: true });
      }
    }, NOTIFICATION_REFRESH_INTERVAL_MS);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [hasLoadedNotifications]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const unreadCount = items.filter((item) => !item.is_read).length;

  async function handleNotificationClick(notificationId: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === notificationId
          ? {
              ...item,
              is_read: true,
            }
          : item,
      ),
    );

    try {
      await markNotificationAsRead(notificationId);
    } catch {
      setItems((current) =>
        current.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                is_read: false,
              }
            : item,
        ),
      );
    } finally {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        aria-label="Open notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -left-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-3 w-[360px] rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-2xl shadow-slate-950/10">
          <div className="border-b border-slate-200/80 pb-3">
            <p className="text-sm font-semibold text-slate-950">Notifications</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {currentUsername
                ? `Operational updates for ${currentUsername}.`
                : "Operational updates for this account."}
            </p>
            {currentRole ? (
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                {currentRole.replace(/-/g, " ")}
              </p>
            ) : null}
          </div>

          {loading ? (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-sm leading-6 text-slate-500">
              Loading notifications...
            </div>
          ) : items.length > 0 ? (
            <div className="mt-3 space-y-3">
              {items.slice(0, 8).map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    void handleNotificationClick(item.id);
                  }}
                  className={
                    item.is_read
                      ? "block rounded-2xl border border-slate-200/80 bg-slate-50/40 px-4 py-4 opacity-75 transition hover:border-slate-300 hover:bg-slate-100"
                      : "block rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4 transition hover:border-slate-300 hover:bg-slate-100"
                  }
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {item.message}
                  </p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {formatNotificationType(item.notification_type)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {formatPhilippineDateTime(item.created_at)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-sm leading-6 text-slate-500">
              No notifications.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function formatNotificationType(value: string) {
  return value
    .split("_")
    .map((part) => `${part.charAt(0)}${part.slice(1).toLowerCase()}`)
    .join(" ");
}
