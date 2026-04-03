"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getTimeRequests, type TimeRequestRecord } from "@/lib/api/time-requests";
import type { AppRole } from "@/lib/auth/session";
import { formatPhilippineDateTime } from "@/lib/format/philippine-time";

type TimeRequestNotification = {
  id: string;
  requestId: number;
  title: string;
  subtitle: string;
  context: string;
  timestampLabel: string;
  timestampValue: string;
  href: string;
  sortTime: number;
};

type NotificationBellProps = {
  currentRole: AppRole | null;
  currentUsername: string | null;
};

const NOTIFICATION_REFRESH_INTERVAL_MS = 5000;
const NOTIFICATION_READ_STORAGE_KEY = "payroll-time-request-read-notifications";

export function NotificationBell({
  currentRole,
  currentUsername,
}: NotificationBellProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<TimeRequestNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoadedNotifications, setHasLoadedNotifications] = useState(false);

  useEffect(() => {
    setReadNotificationIds(loadReadNotificationIds(currentUsername, currentRole));
  }, [currentRole, currentUsername]);

  useEffect(() => {
    let isCancelled = false;

    async function loadNotifications(options?: { background?: boolean }) {
      const shouldShowLoadingState =
        !options?.background && !hasLoadedNotifications;

      if (shouldShowLoadingState) {
        setLoading(true);
      }

      try {
        const [myRequests, reviewerRequests] = await Promise.all([
          getTimeRequests("mine"),
          currentRole === "hr"
            ? getTimeRequests("all")
            : getTimeRequests("reviewer-all"),
        ]);

        if (!isCancelled) {
          setItems(buildNotifications(currentRole, myRequests, reviewerRequests));
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
  }, [currentRole, hasLoadedNotifications]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const unreadCount = items.filter((item) => !readNotificationIds.includes(item.id)).length;

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
        <div className="absolute right-0 z-30 mt-3 w-[340px] rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-2xl shadow-slate-950/10">
          <div className="border-b border-slate-200/80 pb-3">
            <p className="text-sm font-semibold text-slate-950">Notifications</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {currentUsername
                ? `Request updates and approvals for ${currentUsername}.`
                : "Request updates and approvals for this account."}
            </p>
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
                    markNotificationAsRead(
                      item.id,
                      currentUsername,
                      currentRole,
                      setReadNotificationIds,
                    );
                    setOpen(false);
                  }}
                  className={
                    readNotificationIds.includes(item.id)
                      ? "block rounded-2xl border border-slate-200/80 bg-slate-50/40 px-4 py-4 opacity-75 transition hover:border-slate-300 hover:bg-slate-100"
                      : "block rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4 transition hover:border-slate-300 hover:bg-slate-100"
                  }
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {item.subtitle}
                  </p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {item.context}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.timestampLabel} {item.timestampValue}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-sm leading-6 text-slate-500">
              No request notifications.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function buildNotifications(
  role: AppRole | null,
  myRequests: TimeRequestRecord[],
  reviewerRequests: TimeRequestRecord[],
) {
  const notifications = [
    ...myRequests
      .filter((item) => isRequesterNotification(item))
      .map((item) => buildRequesterNotification(item)),
    ...reviewerRequests
      .filter((item) => shouldNotifyApprover(role, item))
      .map((item) => buildApproverNotification(role, item)),
  ];

  return notifications
    .sort((left, right) => right.sortTime - left.sortTime)
    .slice(0, 12);
}

function isRequesterNotification(item: TimeRequestRecord) {
  return (
    (item.status === "approved" || item.status === "declined" || item.status === "returned") &&
    Boolean(item.reviewed_at)
  );
}

function shouldNotifyApprover(role: AppRole | null, item: TimeRequestRecord) {
  if (role === "hr") {
    return (
      item.status === "pending_manager_approval" ||
      item.status === "pending_hr_review"
    );
  }

  return item.status === "pending_manager_approval";
}

function buildRequesterNotification(item: TimeRequestRecord): TimeRequestNotification {
  const statusLabel =
    item.status === "approved" ? "Request approved" : "Request declined";

  return {
    id: `mine-${item.id}-${item.status}`,
    requestId: item.id,
    title: item.request_type_title,
    subtitle: statusLabel,
    context: "Visible in My Requests",
    timestampLabel: item.status === "approved" ? "Approved" : "Declined",
    timestampValue: formatNotificationTimestamp(item.reviewed_at ?? item.updated_at),
    href: buildNotificationHref(item.id, "mine"),
    sortTime: toNotificationTime(item.reviewed_at ?? item.updated_at),
  };
}

function buildApproverNotification(
  role: AppRole | null,
  item: TimeRequestRecord,
): TimeRequestNotification {
  return {
    id: `approval-${item.id}-${item.status}`,
    requestId: item.id,
    title: item.request_type_title,
    subtitle: item.employee_name_snapshot,
    context:
      role === "hr"
        ? "Visible in All Requests"
        : "Visible in All Requests as approver",
    timestampLabel: "Submitted",
    timestampValue: formatNotificationTimestamp(item.created_at),
    href: buildNotificationHref(item.id, "all"),
    sortTime: toNotificationTime(item.created_at),
  };
}

function formatNotificationTimestamp(value: string) {
  return formatPhilippineDateTime(value);
}

function buildNotificationHref(requestId: number, tab: "mine" | "all") {
  return `/leave-requests?tab=${tab}&requestId=${requestId}`;
}

function toNotificationTime(value: string) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function loadReadNotificationIds(
  currentUsername: string | null,
  currentRole: AppRole | null,
) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(
      buildNotificationStorageKey(currentUsername, currentRole),
    );

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    return Array.isArray(parsedValue)
      ? parsedValue.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function markNotificationAsRead(
  notificationId: string,
  currentUsername: string | null,
  currentRole: AppRole | null,
  setReadNotificationIds: React.Dispatch<React.SetStateAction<string[]>>,
) {
  setReadNotificationIds((current) => {
    if (current.includes(notificationId)) {
      return current;
    }

    const nextValue = [...current, notificationId];

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        buildNotificationStorageKey(currentUsername, currentRole),
        JSON.stringify(nextValue),
      );
    }

    return nextValue;
  });
}

function buildNotificationStorageKey(
  currentUsername: string | null,
  currentRole: AppRole | null,
) {
  return `${NOTIFICATION_READ_STORAGE_KEY}:${currentUsername ?? "anonymous"}:${currentRole ?? "unknown"}`;
}
