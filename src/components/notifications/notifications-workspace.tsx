"use client";

import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/api/notifications";
import { formatPhilippineDateTime } from "@/lib/format/philippine-time";
import {
  ResourceEmptyState,
  ResourceErrorState,
  ResourceTableSkeleton,
} from "@/components/shared/resource-state";
import { SectionCard } from "@/components/ui/section-card";
import type { NotificationRecord } from "@/types/notifications";
import { cn } from "@/lib/utils";

type NotificationFilter = "all" | "unread";

export function NotificationsWorkspace() {
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [actionLoading, setActionLoading] = useState<"mark-all" | number | null>(null);

  useEffect(() => {
    void loadNotifications();
  }, []);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.is_read).length,
    [items],
  );
  const visibleItems = filter === "unread"
    ? items.filter((item) => !item.is_read)
    : items;
  const highAttentionCount = useMemo(
    () =>
      items.filter((item) => {
        const severity = item.severity.toLowerCase();
        return severity === "warning" || severity === "critical";
      }).length,
    [items],
  );

  async function loadNotifications(options?: { background?: boolean }) {
    if (!options?.background) {
      setLoading(true);
    }
    setError(null);

    try {
      setItems(await getNotifications());
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to load notifications.",
      );
    } finally {
      if (!options?.background) {
        setLoading(false);
      }
    }
  }

  async function handleMarkAsRead(notificationId: number) {
    const previousItems = items;
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
    } catch (nextError) {
      setItems(previousItems);
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to update the notification.",
      );
    } finally {
      setActionLoading(null);
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
    } catch (nextError) {
      setItems(previousItems);
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to update notifications.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Total notifications"
          value={String(items.length)}
          description="Recent workflow and action-item updates for this account."
        />
        <SummaryCard
          label="Unread"
          value={String(unreadCount)}
          description="Items that still require acknowledgement or review."
        />
        <SummaryCard
          label="High attention"
          value={String(highAttentionCount)}
          description="Warnings and critical items that may need action."
        />
      </section>

      <SectionCard
        title="Notification inbox"
        description="Review payroll, attendance, request, and account action items in one place."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void loadNotifications()}
              className="ui-button-secondary h-11 px-4"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                void handleMarkAllAsRead();
              }}
              disabled={unreadCount <= 0 || actionLoading === "mark-all"}
              className="ui-button-primary h-11 px-4 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Mark all as read
            </button>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          {(["all", "unread"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition",
                filter === value
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              {value === "all" ? "All notifications" : "Unread only"}
            </button>
          ))}
        </div>

        {error ? (
          <ResourceErrorState
            className="mt-6"
            title="Notifications are unavailable"
            description={error}
            action={
              <button
                type="button"
                onClick={() => void loadNotifications()}
                className="ui-button-secondary"
              >
                Retry
              </button>
            }
          />
        ) : loading ? (
          <ResourceTableSkeleton className="mt-6" filterCount={2} rowCount={5} />
        ) : visibleItems.length > 0 ? (
          <div className="mt-6 space-y-3">
            {visibleItems.map((item) => (
              <article
                key={item.id}
                className={cn(
                  "rounded-[26px] border px-5 py-5 shadow-sm transition",
                  item.is_read
                    ? "border-slate-200/80 bg-white"
                    : "border-slate-300 bg-slate-50/80",
                )}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-slate-950">
                        {item.title}
                      </h2>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                          getSeverityTone(item.severity),
                        )}
                      >
                        {formatToken(item.severity)}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                        {formatToken(item.category)}
                      </span>
                      {!item.is_read ? (
                        <span className="inline-flex items-center rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                          Unread
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
                      {item.message}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      <span>{formatToken(item.notification_type)}</span>
                      <span className="text-slate-300">•</span>
                      <span className="normal-case tracking-normal text-slate-500">
                        {formatPhilippineDateTime(item.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {!item.is_read ? (
                      <button
                        type="button"
                        onClick={() => {
                          void handleMarkAsRead(item.id);
                        }}
                        disabled={actionLoading === item.id}
                        className="ui-button-secondary h-11 px-4 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionLoading === item.id ? "Saving..." : "Mark as read"}
                      </button>
                    ) : null}
                    <Link href={item.href} className="ui-button-primary h-11 px-4">
                      Open
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <ResourceEmptyState
            className="mt-6"
            title={
              filter === "unread"
                ? "No unread notifications"
                : "No notifications available"
            }
            description={
              filter === "unread"
                ? "New payroll and attendance events will appear here when they need your attention."
                : "Important workflow updates will appear here once they are generated."
            }
          />
        )}
      </SectionCard>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-[28px] border border-slate-200/80 bg-white px-5 py-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-[1.2rem] font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-3 text-[12px] leading-5 text-slate-600">{description}</p>
    </article>
  );
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
