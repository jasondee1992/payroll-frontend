import { Clock3 } from "lucide-react";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { ResourceEmptyState } from "@/components/shared/resource-state";
import { formatDateTime } from "@/lib/format";
import type { DashboardActivityRecord } from "@/types/dashboard";

type DashboardActivityFeedProps = {
  items: DashboardActivityRecord[];
  emptyTitle?: string | null;
  emptyDescription?: string | null;
};

export function DashboardActivityFeed({
  items,
  emptyTitle,
  emptyDescription,
}: DashboardActivityFeedProps) {
  if (items.length === 0) {
    return (
      <ResourceEmptyState
        title={emptyTitle ?? "No recent activity"}
        description={
          emptyDescription ??
          "Recent operational events will appear here once activity is available."
        }
      />
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <article
          key={item.key}
          className="rounded-[24px] border border-slate-200/80 bg-slate-50/70 px-4 py-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                {item.status_label && item.status_tone ? (
                  <DashboardStatusBadge
                    label={item.status_label}
                    tone={item.status_tone}
                    className="shrink-0"
                  />
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </div>

            {item.occurred_at ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
                <Clock3 className="h-3.5 w-3.5" />
                {formatDateTime(item.occurred_at)}
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
