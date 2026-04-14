import Link from "next/link";
import { ArrowRight, FileBarChart2, Radar, ShieldAlert, TimerReset } from "lucide-react";
import { DashboardActivityFeed } from "@/components/dashboard/dashboard-activity-feed";
import { DashboardPendingActions } from "@/components/dashboard/dashboard-pending-actions";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { DashboardValueGrid } from "@/components/dashboard/dashboard-value-grid";
import { QuickActionsPanel } from "@/components/dashboard/quick-actions-panel";
import { ResourceEmptyState } from "@/components/shared/resource-state";
import { formatDateTime } from "@/lib/format";
import type { AppRole } from "@/lib/auth/session";
import type { DashboardSectionRecord, DashboardSnapshotRecord } from "@/types/dashboard";

type DashboardSnapshotViewProps = {
  snapshot: DashboardSnapshotRecord;
  currentRole: AppRole | null;
};

export function DashboardSnapshotView({
  snapshot,
  currentRole,
}: DashboardSnapshotViewProps) {
  const metricSections = snapshot.sections.filter(
    (section) => section.variant === "metrics",
  );
  const activitySections = snapshot.sections.filter(
    (section) => section.variant === "activity",
  );
  const primarySections = pickPrimarySections(metricSections);
  const secondarySections = metricSections.filter(
    (section) => !primarySections.some((item) => item.key === section.key),
  );
  const canOpenReports =
    currentRole === "admin" ||
    currentRole === "admin-finance" ||
    currentRole === "finance";

  if (snapshot.summary_metrics.length === 0 && snapshot.sections.length === 0) {
    return (
      <ResourceEmptyState
        title="No dashboard data available"
        description="The backend responded successfully, but no operational dashboard sections are available for this role yet."
      />
    );
  }

  return (
    <>
      <DashboardValueGrid
        items={snapshot.summary_metrics}
        variant="summary"
      />

      <section className="grid gap-4 xl:grid-cols-[1.5fr_0.85fr]">
        <article className="ui-hero-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-100">
                Current cycle focus
              </p>
              <h2 className="mt-3 text-[30px] font-semibold tracking-tight text-white">
                {snapshot.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                {snapshot.description}
              </p>
            </div>
            <span className="ui-badge bg-white/10 text-white ring-white/10">
              {snapshot.role.replace("-", " ")}
            </span>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                Active alerts
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">{snapshot.alerts.length}</p>
              <p className="mt-2 text-sm text-slate-300">
                Items needing payroll, attendance, or approval attention.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                Data sections
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">{snapshot.sections.length}</p>
              <p className="mt-2 text-sm text-slate-300">
                Operational blocks available for review in this workspace.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                Snapshot freshness
              </p>
              <p className="mt-3 text-lg font-semibold text-white">{formatDateTime(snapshot.generated_at)}</p>
              <p className="mt-2 text-sm text-slate-300">
                Refresh this workspace when new approvals or payroll changes land.
              </p>
            </div>
          </div>
        </article>

        <article className="panel-strong p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Executive status
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                Action visibility for the current payroll cycle
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use the attention panel and operational sections below to move the cycle forward without losing context.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-[22px] border border-slate-200/80 bg-slate-50/88 p-4">
              <div className="flex items-center gap-3">
                <TimerReset className="h-4 w-4 text-blue-700" />
                <p className="text-sm font-semibold text-slate-950">Live workflow state</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Separate immediate blockers from historical reporting. This page stays focused on current-cycle execution.
              </p>
            </div>

            {canOpenReports ? (
              <Link
                href="/reports"
                className="rounded-[22px] border border-blue-200/80 bg-linear-to-r from-blue-50/90 to-white p-4 transition hover:border-blue-300"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                      Analysis
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      Open reporting workspace
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Use reporting for YTD, cutoff, and remittance trend analysis.
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-blue-700" />
                </div>
              </Link>
            ) : null}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="grid gap-4">
          <DashboardSection
            title="Operational Focus"
            description="Use the dashboard to monitor the current cycle, surface blockers, and decide the next operational step. Historical analysis stays in Reporting."
            action={
              canOpenReports ? (
                <Link
                  href="/reports"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-300"
                >
                  Open Reporting
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : null
            }
          >
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/70 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <Radar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">
                      Dashboard purpose
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      This view stays concise by emphasizing current status, pending work, and recent operational movement rather than trend reporting.
                    </p>
                  </div>
                </div>
              </div>

              {canOpenReports ? (
                <div className="rounded-[24px] border border-blue-200/80 bg-blue-50/70 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                      <FileBarChart2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950">
                        Need trend or history?
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Use Reporting for deeper monthly comparisons, year-to-date analysis, and breakdown history.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </DashboardSection>

          {primarySections.map((section) => (
            <DashboardSection
              key={section.key}
              title={section.title}
              description={section.description}
            >
              <DashboardValueGrid items={section.items} compact />
            </DashboardSection>
          ))}
        </div>

        <div className="grid gap-4">
          <DashboardSection
            title="Needs Attention"
            description="Operational checks and blockers that should be reviewed before moving deeper into the workflow."
          >
            <DashboardPendingActions
              alerts={snapshot.alerts}
              sections={metricSections}
            />
          </DashboardSection>

          <DashboardSection
            title="Quick Actions"
            description="Fast entry points into the modules this role is most likely to use next."
          >
            <QuickActionsPanel currentRole={currentRole} />
          </DashboardSection>
        </div>
      </section>

      {secondarySections.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {secondarySections.map((section) => (
            <DashboardSection
              key={section.key}
              title={section.title}
              description={section.description}
            >
              <DashboardValueGrid items={section.items} compact />
            </DashboardSection>
          ))}
        </section>
      ) : null}

      {activitySections.length > 0 ? (
        <section className="grid gap-4">
          {activitySections.map((section) => (
            <DashboardSection
              key={section.key}
              title={section.title}
              description={section.description}
            >
              <DashboardActivityFeed
                items={section.activities}
                emptyTitle={section.empty_title}
                emptyDescription={section.empty_description}
              />
            </DashboardSection>
          ))}
        </section>
      ) : null}
    </>
  );
}

function pickPrimarySections(sections: DashboardSectionRecord[]) {
  const keywordMatches = sections.filter((section) =>
    /overview|snapshot|current|payroll cost|financial breakdown/i.test(section.title),
  );

  if (keywordMatches.length >= 2) {
    return keywordMatches.slice(0, 2);
  }

  if (keywordMatches.length === 1 && sections.length > 1) {
    const nextSection = sections.find((section) => section.key !== keywordMatches[0].key);
    return nextSection ? [keywordMatches[0], nextSection] : keywordMatches;
  }

  return sections.slice(0, 2);
}
