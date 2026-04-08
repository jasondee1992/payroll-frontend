import Link from "next/link";
import { ArrowRight, FileBarChart2, Radar } from "lucide-react";
import { DashboardActivityFeed } from "@/components/dashboard/dashboard-activity-feed";
import { DashboardPendingActions } from "@/components/dashboard/dashboard-pending-actions";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { DashboardValueGrid } from "@/components/dashboard/dashboard-value-grid";
import { QuickActionsPanel } from "@/components/dashboard/quick-actions-panel";
import { ResourceEmptyState } from "@/components/shared/resource-state";
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
