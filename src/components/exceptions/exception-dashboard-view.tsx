import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { DashboardValueGrid } from "@/components/dashboard/dashboard-value-grid";
import { ResourceEmptyState } from "@/components/shared/resource-state";
import type { ExceptionDashboardRecord } from "@/types/exceptions";
import { cn } from "@/lib/utils";

type ExceptionDashboardViewProps = {
  dashboard: ExceptionDashboardRecord;
};

export function ExceptionDashboardView({
  dashboard,
}: ExceptionDashboardViewProps) {
  if (dashboard.groups.length === 0) {
    return (
      <>
        <DashboardValueGrid items={dashboard.summary_metrics} variant="summary" />

        <ResourceEmptyState
          className="mt-6"
          title="No active exception groups"
          description="The backend did not find any current payroll-readiness blockers or validation exceptions."
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardValueGrid items={dashboard.summary_metrics} variant="summary" />

      <section className="grid gap-4 xl:grid-cols-2">
        {dashboard.groups.map((group) => (
          <DashboardSection
            key={group.key}
            title={group.title}
            description={group.description}
            action={
              <div className="flex items-center gap-2">
                <DashboardStatusBadge
                  label={severityLabel[group.severity] ?? "Review"}
                  tone={group.severity}
                />
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  {group.total_affected} flagged
                </span>
              </div>
            }
          >
            <div className="space-y-3">
              {group.items.map((item) => (
                <article
                  key={item.key}
                  className={cn(
                    "rounded-[24px] border px-4 py-4",
                    item.severity === "danger"
                      ? "border-rose-200/80 bg-rose-50/50"
                      : item.severity === "warning"
                        ? "border-amber-200/80 bg-amber-50/40"
                        : "border-slate-200/80 bg-slate-50/70",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-950">
                          {item.title}
                        </p>
                        <DashboardStatusBadge
                          label={severityLabel[item.severity] ?? "Review"}
                          tone={item.severity}
                        />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>
                    </div>

                    <div className="shrink-0 rounded-2xl border border-white/80 bg-white/80 px-3 py-2 text-right shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Affected
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-950">
                        {item.affected_count}
                      </p>
                    </div>
                  </div>

                  {item.details.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {item.details.slice(0, 6).map((detail) => (
                        <DetailRow key={detail.key} detail={detail} />
                      ))}
                      {item.details.length > 6 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-500">
                          {item.details.length - 6} more record(s) are available in this exception category.
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {item.href ? (
                    <div className="mt-4">
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                      >
                        Open related workspace
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </DashboardSection>
        ))}
      </section>
    </div>
  );
}

function DetailRow({
  detail,
}: {
  detail: ExceptionDashboardRecord["groups"][number]["items"][number]["details"][number];
}) {
  const content = (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 shadow-sm">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        <TriangleAlert className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-950">{detail.label}</p>
        {detail.description ? (
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {detail.description}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (detail.href) {
    return (
      <Link href={detail.href} className="block transition hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}

const severityLabel: Partial<Record<ExceptionDashboardRecord["groups"][number]["severity"], string>> = {
  danger: "Blocked",
  warning: "Attention",
  info: "Review",
  success: "Clear",
  strong: "Current",
};
