import { TriangleAlert } from "lucide-react";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { ResourceEmptyState } from "@/components/shared/resource-state";
import { formatDashboardValue } from "@/components/dashboard/dashboard-value-grid";
import type {
  DashboardAlertRecord,
  DashboardSectionRecord,
  DashboardTone,
} from "@/types/dashboard";

type DashboardPendingActionsProps = {
  alerts: DashboardAlertRecord[];
  sections: DashboardSectionRecord[];
};

type PendingActionItem = {
  key: string;
  source: string;
  title: string;
  description: string;
  tone: DashboardTone;
};

export function DashboardPendingActions({
  alerts,
  sections,
}: DashboardPendingActionsProps) {
  const items = buildPendingActionItems(alerts, sections);

  if (items.length === 0) {
    return (
      <ResourceEmptyState
        title="No immediate follow-up"
        description="Current dashboard data does not show any open blockers or pending operational checks."
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
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {item.source}
              </p>
              <div className="mt-2 flex items-start gap-2">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <TriangleAlert className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>

            <DashboardStatusBadge
              label={toneLabel[item.tone] ?? "Watch"}
              tone={item.tone}
              className="shrink-0"
            />
          </div>
        </article>
      ))}
    </div>
  );
}

const toneLabel: Partial<Record<DashboardTone, string>> = {
  warning: "Action",
  danger: "Blocked",
  info: "Review",
  success: "Clear",
  strong: "Current",
};

function buildPendingActionItems(
  alerts: DashboardAlertRecord[],
  sections: DashboardSectionRecord[],
) {
  const alertItems: PendingActionItem[] = alerts.map((alert) => ({
    key: `alert-${alert.key}`,
    source: "Alert",
    title: alert.title,
    description: alert.description,
    tone: alert.tone,
  }));

  const metricItems: PendingActionItem[] = sections.flatMap((section) =>
    section.items
      .filter((item) => item.tone === "warning" || item.tone === "danger")
      .map((item) => ({
        key: `${section.key}-${item.key}`,
        source: section.title,
        title: item.label,
        description: item.context
          ? `${formatDashboardValue(item)}. ${item.context}`
          : `${formatDashboardValue(item)} currently requires review.`,
        tone: item.tone,
      })),
  );

  return [...alertItems, ...metricItems].slice(0, 6);
}
