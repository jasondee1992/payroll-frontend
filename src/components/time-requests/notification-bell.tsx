"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/api/notifications";
import { formatPhilippineDateTime } from "@/lib/format/philippine-time";
import type { AppRole } from "@/lib/auth/session";
import type { NotificationRecord } from "@/types/notifications";
import { cn } from "@/lib/utils";

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
  const [actionLoading, setActionLoading] = useState<"mark-all" | number | null>(null);
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
    const existingNotification = items.find((item) => item.id === notificationId);
    if (!existingNotification || existingNotification.is_read) {
      setOpen(false);
      return;
    }

    setActionLoading(notificationId);
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
      setActionLoading(null);
      setOpen(false);
    }
  }

  async function handleMarkAllAsRead() {
    if (unreadCount <= 0) {
      return;
    }

    const previousItems = items;
    setActionLoading("mark-all");
    setItems((current) =>
      current.map((item) =>
        item.is_read
          ? item
          : {
              ...item,
              is_read: true,
            },
      ),
    );

    try {
      await markAllNotificationsAsRead();
    } catch {
      setItems(previousItems);
    } finally {
      setActionLoading(null);
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
        <div className="absolute right-0 z-30 mt-3 w-[380px] rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-2xl shadow-slate-950/10">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div>
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

            <button
              type="button"
              onClick={() => {
                void handleMarkAllAsRead();
              }}
              disabled={unreadCount <= 0 || actionLoading === "mark-all"}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all
            </button>
          </div>

          {loading ? (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-sm leading-6 text-slate-500">
              Loading notifications...
            </div>
          ) : items.length > 0 ? (
            <div className="mt-3 space-y-3">
              {items.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    void handleNotificationClick(item.id);
                  }}
                  className={cn(
                    "block rounded-2xl border px-4 py-4 transition hover:border-slate-300 hover:bg-slate-100",
                    item.is_read
                      ? "border-slate-200/80 bg-slate-50/40 opacity-75"
                      : "border-slate-200/80 bg-slate-50/70",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-950">
                          {item.title}
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                            getSeverityTone(item.severity),
                          )}
                        >
                          {formatToken(item.severity)}
                        </span>
                        {!item.is_read ? (
                          <span className="inline-flex items-center rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                            Unread
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.message}
                      </p>
                    </div>
                    {actionLoading === item.id ? (
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Saving
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <span>{formatToken(item.category)}</span>
                    <span className="text-slate-300">•</span>
                    <span>{formatNotificationType(item.notification_type)}</span>
                    <span className="text-slate-300">•</span>
                    <span className="normal-case tracking-normal text-slate-500">
                      {formatPhilippineDateTime(item.created_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-sm leading-6 text-slate-500">
              No notifications.
            </div>
          )}

          <div className="mt-3 border-t border-slate-200/80 pt-3">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatNotificationType(value: string) {
  return formatToken(value);
}

function formatToken(value: string) {
  return value
    .split("_")
    .map((part) => `${part.charAt(0)}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

function getSeverityTone(severity: string) {
  switch (severity.toLowerCase()) {
    case "success":
      return "bg-emerald-100 text-emerald-800";
    case "warning":
      return "bg-amber-100 text-amber-900";
    case "critical":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-sky-100 text-sky-800";
  }
}
