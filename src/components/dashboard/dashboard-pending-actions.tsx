import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { ResourceEmptyState } from "@/components/shared/resource-state";
import { AlertCard } from "@/components/ui/alert-card";
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
        <AlertCard
          key={item.key}
          eyebrow={item.source}
          title={item.title}
          description={item.description}
          tone={item.tone === "danger" ? "danger" : item.tone === "info" ? "info" : "warning"}
          badge={
            <DashboardStatusBadge
              label={toneLabel[item.tone] ?? "Watch"}
              tone={item.tone}
              className="shrink-0"
            />
          }
        />
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
