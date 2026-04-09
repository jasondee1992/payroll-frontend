"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Landmark,
  ReceiptText,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { ResourceEmptyState, ResourceErrorState, ResourceTableSkeleton } from "@/components/shared/resource-state";
import { SectionCard } from "@/components/ui/section-card";
import { getPayrollReportingSnapshot } from "@/lib/api/payroll";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { usePreservedScroll } from "@/lib/use-preserved-scroll";
import { cn } from "@/lib/utils";
import type {
  PayrollReportCutoffDetailRecord,
  PayrollReportCutoffSummaryRecord,
  PayrollReportEmployerContributionSummaryRecord,
  PayrollReportGovernmentSummaryRecord,
  PayrollReportTrendPointRecord,
  PayrollReportingSnapshotRecord,
} from "@/types/payroll";
import type { AppRole } from "@/lib/auth/session";

type ReportFilters = {
  year: number | null;
  status: string | null;
  cutoffId: number | null;
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  neutral: "ui-badge-neutral",
  warning: "ui-badge-warning",
  success: "ui-badge-success",
  info: "ui-badge-info",
  strong: "bg-slate-900 text-white ring-slate-900/10",
};

const DATA_STATE_BADGE_STYLES: Record<"live" | "approved" | "not_started", string> = {
  live: "ui-badge-warning",
  approved: "ui-badge-success",
  not_started: "ui-badge-neutral",
};

export function PayrollReportingWorkspace({ role }: { role: AppRole | null }) {
  const { captureScrollPosition, restoreScrollPosition } = usePreservedScroll();
  const snapshotRef = useRef<PayrollReportingSnapshotRecord | null>(null);
  const filtersRef = useRef<ReportFilters>({ year: null, status: null, cutoffId: null });
  const requestIdRef = useRef(0);
  const [snapshot, setSnapshot] = useState<PayrollReportingSnapshotRecord | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    year: null,
    status: null,
    cutoffId: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const loadSnapshot = useCallback(
    async (
      nextFilters?: Partial<ReportFilters>,
      options?: { preserveScroll?: boolean },
    ) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      const mergedFilters: ReportFilters = {
        year: nextFilters?.year ?? filtersRef.current.year,
        status:
          nextFilters?.status === undefined ? filtersRef.current.status : nextFilters.status,
        cutoffId:
          nextFilters?.cutoffId === undefined
            ? filtersRef.current.cutoffId
            : nextFilters.cutoffId,
      };
      const scrollPosition = options?.preserveScroll ? captureScrollPosition() : null;

      if (snapshotRef.current == null) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      try {
        const nextSnapshot = await getPayrollReportingSnapshot({
          year: mergedFilters.year ?? undefined,
          status: mergedFilters.status,
          cutoffId: mergedFilters.cutoffId,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        setSnapshot(nextSnapshot);
        const reconciledFilters: ReportFilters = {
          year: nextSnapshot.selected_year,
          status: nextSnapshot.selected_status ?? null,
          cutoffId: nextSnapshot.selected_cutoff_id ?? null,
        };
        setFilters(reconciledFilters);
        filtersRef.current = reconciledFilters;
      } catch (nextError) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setError(
          nextError instanceof Error
            ? nextError.message
            : "Unable to load payroll reporting data.",
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
          if (scrollPosition != null) {
            restoreScrollPosition(scrollPosition);
          }
        }
      }
    },
    [captureScrollPosition, restoreScrollPosition],
  );

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  const applyFilters = useCallback(
    (nextFilters: Partial<ReportFilters>, preserveScroll = true) => {
      const mergedFilters: ReportFilters = {
        ...filtersRef.current,
        ...nextFilters,
      };
      setFilters(mergedFilters);
      filtersRef.current = mergedFilters;
      void loadSnapshot(mergedFilters, { preserveScroll });
    },
    [loadSnapshot],
  );

  const maxTrendValue = useMemo(() => {
    if (snapshot == null) {
      return 0;
    }
    return Math.max(
      ...snapshot.monthly_trends.map((item) => Number(item.total_gross_pay)),
      0,
    );
  }, [snapshot]);

  if (loading && snapshot == null) {
    return <ReportingWorkspaceSkeleton />;
  }

  if (snapshot == null) {
    return (
      <section className="panel p-6 sm:p-7">
        <ResourceErrorState
          title="Payroll reporting is unavailable"
          description={error ?? "Unable to load the reporting snapshot from the backend."}
          action={
            <button
              type="button"
              className="ui-button-primary"
              onClick={() => {
                void loadSnapshot(undefined, { preserveScroll: true });
              }}
            >
              Retry report load
            </button>
          }
        />
      </section>
    );
  }

  const activeCutoff = snapshot.selected_cutoff;
  const yearOptions =
    snapshot.available_years.length > 0
      ? snapshot.available_years
      : [snapshot.selected_year];
  const latestActiveMonth =
    [...snapshot.monthly_summaries]
      .reverse()
      .find((month) => Number(month.total_gross_pay) > 0)?.month ?? 1;
  const today = new Date();
  const effectiveMonth =
    snapshot.selected_year === today.getFullYear()
      ? today.getMonth() + 1
      : latestActiveMonth;
  const currentMonthSummary =
    snapshot.monthly_summaries.find((month) => month.month === effectiveMonth) ??
    snapshot.monthly_summaries[0];
  const approvedCutoffCount = snapshot.cutoff_summaries.filter(
    (cutoff) => cutoff.is_finalized || cutoff.status === "approved",
  ).length;
  const unapprovedCutoffCount = snapshot.cutoff_summaries.filter(
    (cutoff) => cutoff.has_payroll_data && !cutoff.is_finalized && cutoff.status !== "approved",
  ).length;
  const notStartedCutoffCount = snapshot.cutoff_summaries.filter(
    (cutoff) => !cutoff.has_payroll_data,
  ).length;

  return (
    <div className="space-y-6">
      {role !== "admin-finance" ? (
        <div className="ui-state-banner ui-state-banner-info">
          This reporting workspace is optimized for Admin-Finance review. You can inspect current payroll totals here, but approval and posting decisions remain tied to Admin-Finance workflow controls.
        </div>
      ) : null}

      <SectionCard
        title="Report filters"
        description="Filter payroll reporting by year, payroll status, and selected cutoff detail."
        className="ui-sticky-band z-20"
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_auto]">
          <label className="space-y-2">
            <span className="ui-label">Reporting year</span>
            <select
              className="ui-select"
              value={filters.year ?? snapshot.selected_year}
              onChange={(event) => {
                applyFilters({ year: Number(event.target.value), cutoffId: null });
              }}
              disabled={refreshing}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="ui-label">Payroll status</span>
            <select
              className="ui-select"
              value={filters.status ?? ""}
              onChange={(event) => {
                applyFilters({ status: event.target.value || null, cutoffId: null });
              }}
              disabled={refreshing}
            >
              <option value="">All payroll statuses</option>
              {snapshot.available_statuses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.count})
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              className="ui-button-secondary w-full sm:w-auto"
              onClick={() => {
                void loadSnapshot(undefined, { preserveScroll: true });
              }}
              disabled={refreshing}
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", refreshing ? "animate-spin" : "")} />
              Refresh report
            </button>
          </div>
        </div>

        {error ? <div className="ui-state-banner ui-state-banner-warning mt-4">{error}</div> : null}
      </SectionCard>

      <SectionCard
        title="Admin-Finance overview"
        description="This answers the main reporting questions first: processed payroll year to date, current month processing volume, cutoff approval status, and statutory cost exposure."
      >
        <div className="grid gap-4 xl:grid-cols-4">
          <div className="ui-report-card-primary">
            <p className="ui-report-kicker">Processed payroll this year</p>
            <p className="mt-3 text-[30px] font-semibold tracking-tight text-slate-950">
              {formatCurrency(snapshot.year_to_date.total_gross_pay)}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Gross payroll across {snapshot.year_to_date.total_cutoff_runs} processed payroll runs.
            </p>
          </div>
          <div className="ui-report-card-secondary">
            <p className="ui-report-kicker">Payroll in process this month</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {formatCurrency(currentMonthSummary?.total_gross_pay ?? 0)}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {currentMonthSummary?.label ?? "Current month"} gross payroll with{" "}
              {currentMonthSummary?.processed_cutoff_count ?? 0} processed cutoffs.
            </p>
          </div>
          <div className="ui-report-card-secondary">
            <p className="ui-report-kicker">Approved vs unapproved cutoffs</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="ui-badge ui-badge-success">{approvedCutoffCount} approved/final</span>
              <span className="ui-badge ui-badge-warning">{unapprovedCutoffCount} live/unapproved</span>
              <span className="ui-badge ui-badge-neutral">{notStartedCutoffCount} not started</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Use the cutoff summary below to open any unapproved payroll for detailed review.
            </p>
          </div>
          <div className="ui-report-card-secondary">
            <p className="ui-report-kicker">Employer vs employee statutory totals</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              Employer: {formatCurrency(snapshot.employer_contribution_summary.total_employer_contribution_cost)}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              Employee: {formatCurrency(snapshot.year_to_date.total_employee_deductions)}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Government remittances currently total {formatCurrency(snapshot.government_summary.total_government_remittances)}.
            </p>
          </div>
        </div>
      </SectionCard>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
        <SummaryMetricCard
          title="Gross pay YTD"
          value={formatCurrency(snapshot.year_to_date.total_gross_pay)}
          note={`${snapshot.year_to_date.total_cutoff_runs} payroll runs included`}
          icon={ReceiptText}
          emphasis="primary"
        />
        <SummaryMetricCard
          title="Net pay YTD"
          value={formatCurrency(snapshot.year_to_date.total_net_pay)}
          note={`${snapshot.year_to_date.total_records_processed} payroll records processed`}
          icon={TrendingUp}
          emphasis="primary"
        />
        <SummaryMetricCard
          title="Employer cost YTD"
          value={formatCurrency(snapshot.year_to_date.total_employer_contributions)}
          note="Employer-paid government cost"
          icon={Building2}
        />
        <SummaryMetricCard
          title="Government remittances YTD"
          value={formatCurrency(snapshot.year_to_date.total_government_remittances)}
          note={`${snapshot.year_to_date.total_employees_processed} employees covered`}
          icon={Landmark}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CompactMetricCard
          title="Employee deductions"
          value={formatCurrency(snapshot.year_to_date.total_employee_deductions)}
          note="Attendance, loans, and government"
        />
        <CompactMetricCard
          title="Government deductions"
          value={formatCurrency(snapshot.year_to_date.total_government_deductions)}
          note="Captured in payroll runs"
        />
        <CompactMetricCard
          title="Basic pay"
          value={formatCurrency(snapshot.year_to_date.total_basic_pay)}
          note={`Reporting year ${snapshot.year_to_date.year}`}
        />
        <CompactMetricCard
          title="Employees processed"
          value={String(snapshot.year_to_date.total_employees_processed)}
          note="Unique employees this year"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(21rem,0.65fr)]">
        <SectionCard
          title="Monthly payroll summary"
          description="Track month-to-month payroll totals for the selected reporting year."
        >
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="ui-report-stat-strip">
                <p className="ui-report-kicker">Months with payroll</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {
                    snapshot.monthly_summaries.filter((month) => Number(month.total_gross_pay) > 0)
                      .length
                  }
                </p>
              </div>
              <div className="ui-report-stat-strip">
                <p className="ui-report-kicker">Total processed cutoffs</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {snapshot.monthly_summaries.reduce((sum, month) => sum + month.processed_cutoff_count, 0)}
                </p>
              </div>
              <div className="ui-report-stat-strip">
                <p className="ui-report-kicker">Year net total</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {formatCurrency(snapshot.year_to_date.total_net_pay)}
                </p>
              </div>
            </div>

            <div className="ui-report-table overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50/90 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3">Gross pay</th>
                    <th className="px-4 py-3">Net pay</th>
                    <th className="px-4 py-3">Employer cost</th>
                    <th className="px-4 py-3">Deductions</th>
                    <th className="px-4 py-3">Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {snapshot.monthly_summaries.map((month) => {
                    const hasActivity = Number(month.total_gross_pay) > 0;

                    return (
                      <tr
                        key={month.month}
                        className={cn(
                          "ui-report-table-row",
                          hasActivity ? "bg-white/80" : "bg-slate-50/40 text-slate-500",
                        )}
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900">{month.label}</td>
                        <td className="px-4 py-3 text-slate-700">{formatCurrency(month.total_gross_pay)}</td>
                        <td className="px-4 py-3 text-slate-700">{formatCurrency(month.total_net_pay)}</td>
                        <td className="px-4 py-3 text-slate-700">{formatCurrency(month.total_employer_contributions)}</td>
                        <td className="px-4 py-3 text-slate-700">{formatCurrency(month.total_employee_deductions)}</td>
                        <td className="px-4 py-3">
                          <span className={cn("ui-badge", hasActivity ? "ui-badge-info" : "ui-badge-neutral")}>
                            {month.processed_cutoff_count}/{month.cutoff_count} cutoffs
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Trend view"
          description="A compact month-to-month comparison of gross payroll, employer cost, and deductions."
        >
          <MonthlyTrendList trends={snapshot.monthly_trends} maxTrendValue={maxTrendValue} />
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Government contribution and remittance summary"
          description="Employee share, employer share, and withholding totals across the selected reporting scope."
        >
          <BreakdownList
            rows={[
              { label: "SSS employee share", value: snapshot.government_summary.sss_employee },
              { label: "SSS employer share", value: snapshot.government_summary.sss_employer },
              { label: "PhilHealth employee share", value: snapshot.government_summary.philhealth_employee },
              { label: "PhilHealth employer share", value: snapshot.government_summary.philhealth_employer },
              { label: "Pag-IBIG employee share", value: snapshot.government_summary.pagibig_employee },
              { label: "Pag-IBIG employer share", value: snapshot.government_summary.pagibig_employer },
              { label: "Withholding tax", value: snapshot.government_summary.withholding_tax },
            ]}
            footerRows={[
              { label: "Total employee contributions", value: snapshot.government_summary.total_employee_contributions },
              { label: "Total remittances", value: snapshot.government_summary.total_government_remittances },
            ]}
          />
        </SectionCard>

        <SectionCard
          title="Employer contribution summary"
          description="Employer-paid government cost visible separately for admin-finance review."
        >
          <BreakdownList
            rows={[
              { label: "SSS employer share", value: snapshot.employer_contribution_summary.sss_employer },
              { label: "PhilHealth employer share", value: snapshot.employer_contribution_summary.philhealth_employer },
              { label: "Pag-IBIG employer share", value: snapshot.employer_contribution_summary.pagibig_employer },
            ]}
            footerRows={[
              { label: "Total employer shares", value: snapshot.employer_contribution_summary.total_employer_shares },
              { label: "Total employer contribution cost", value: snapshot.employer_contribution_summary.total_employer_contribution_cost },
            ]}
          />
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
        <SectionCard
          title="Payroll cutoff summary"
          description="Select a payroll cutoff to review its detailed payroll and remittance breakdown."
          contentClassName="space-y-4"
        >
          {snapshot.cutoff_summaries.length === 0 ? (
            <ResourceEmptyState
              title="No cutoffs match the current report filter"
              description="Try another reporting year or widen the payroll status filter to bring cutoffs back into scope."
            />
          ) : (
            <CutoffSummaryTable
              cutoffs={snapshot.cutoff_summaries}
              selectedCutoffId={filters.cutoffId}
              onSelect={(cutoffId) => {
                applyFilters({ cutoffId });
              }}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Selected cutoff detail"
          description="Detailed payroll totals for the selected cutoff, including contributions and deductions."
          contentClassName="space-y-4"
        >
          {activeCutoff == null ? (
            <ResourceEmptyState
              title="No cutoff selected"
              description="Choose a payroll cutoff from the list to inspect its detailed payroll breakdown."
            />
          ) : (
            <SelectedCutoffPanel cutoff={activeCutoff} />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function SummaryMetricCard({
  title,
  value,
  note,
  icon: Icon,
  emphasis = "secondary",
}: {
  title: string;
  value: string;
  note: string;
  icon: typeof ReceiptText;
  emphasis?: "primary" | "secondary";
}) {
  return (
    <article className={cn(emphasis === "primary" ? "ui-report-card-primary" : "ui-metric-card")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="ui-report-kicker">{title}</p>
          <p className={cn("mt-3 font-semibold tracking-tight text-slate-950", emphasis === "primary" ? "text-[30px]" : "text-2xl")}>{value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>
        </div>
        <div className={cn("rounded-2xl border p-3 text-slate-700 shadow-sm", emphasis === "primary" ? "border-slate-300/80 bg-slate-900 text-white" : "border-slate-200/80 bg-white")}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

function CompactMetricCard({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <article className="ui-report-card-secondary">
      <p className="ui-report-kicker">{title}</p>
      <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{note}</p>
    </article>
  );
}

function ReportingStatusBadge({ label, tone }: { label: string; tone: string }) {
  return (
    <span className={cn("ui-badge", STATUS_BADGE_STYLES[tone] ?? "ui-badge-neutral")}>
      {label}
    </span>
  );
}

function DataStateBadge({
  state,
}: {
  state: "live" | "approved" | "not_started";
}) {
  const label =
    state === "live"
      ? "Live / Unapproved"
      : state === "approved"
        ? "Approved / Final"
        : "Not started";

  return (
    <span className={cn("ui-badge", DATA_STATE_BADGE_STYLES[state])}>{label}</span>
  );
}

function CutoffSummaryTable({
  cutoffs,
  selectedCutoffId,
  onSelect,
}: {
  cutoffs: PayrollReportCutoffSummaryRecord[];
  selectedCutoffId: number | null;
  onSelect: (cutoffId: number) => void;
}) {
  return (
    <div className="ui-report-table overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50/90 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          <tr>
            <th className="px-4 py-3">Cutoff</th>
            <th className="px-4 py-3">Workflow status</th>
            <th className="px-4 py-3">Data state</th>
            <th className="px-4 py-3">Employees</th>
            <th className="px-4 py-3">Gross</th>
            <th className="px-4 py-3">Net</th>
            <th className="px-4 py-3">Deductions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {cutoffs.map((cutoff) => {
            const isSelected = cutoff.cutoff_id === selectedCutoffId;
            const dataState: "live" | "approved" | "not_started" =
              !cutoff.has_payroll_data
                ? "not_started"
                : cutoff.is_finalized || cutoff.status === "approved"
                  ? "approved"
                  : "live";

            return (
              <tr
                key={cutoff.cutoff_id}
                className={cn("ui-report-table-row cursor-pointer", isSelected && "ui-report-table-row-active")}
                onClick={() => {
                  onSelect(cutoff.cutoff_id);
                }}
              >
                <td className="px-4 py-4">
                  <div>
                    <p className={cn("font-semibold", isSelected ? "text-white" : "text-slate-950")}>{cutoff.label}</p>
                    <p className={cn("mt-1 text-xs", isSelected ? "text-slate-200" : "text-slate-500")}>
                      {formatDate(cutoff.cutoff_start)} to {formatDate(cutoff.cutoff_end)}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <ReportingStatusBadge label={cutoff.status_label} tone={isSelected ? "strong" : cutoff.status_tone} />
                </td>
                <td className="px-4 py-4">
                  <DataStateBadge state={dataState} />
                </td>
                <td className={cn("px-4 py-4 font-medium", isSelected ? "text-white" : "text-slate-700")}>
                  {cutoff.employee_count}
                </td>
                <td className={cn("px-4 py-4 font-medium", isSelected ? "text-white" : "text-slate-700")}>
                  {formatCurrency(cutoff.total_gross_pay)}
                </td>
                <td className={cn("px-4 py-4 font-medium", isSelected ? "text-white" : "text-slate-700")}>
                  {formatCurrency(cutoff.total_net_pay)}
                </td>
                <td className={cn("px-4 py-4 font-medium", isSelected ? "text-white" : "text-slate-700")}>
                  {formatCurrency(cutoff.total_deductions)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MonthlyTrendList({
  trends,
  maxTrendValue,
}: {
  trends: PayrollReportTrendPointRecord[];
  maxTrendValue: number;
}) {
  const populatedTrends = trends.filter((item) => Number(item.total_gross_pay) > 0);

  if (populatedTrends.length === 0) {
    return (
      <ResourceEmptyState
        title="No monthly payroll movement yet"
        description="Once payroll batches are calculated, the monthly movement view will show the year-to-date trend here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {populatedTrends.map((trend) => {
        const grossWidth =
          maxTrendValue === 0
            ? 0
            : Math.max((Number(trend.total_gross_pay) / maxTrendValue) * 100, 8);

        return (
          <div key={trend.month} className="rounded-[22px] border border-slate-200/80 bg-white/90 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-900">{trend.label}</p>
              <p className="text-sm text-slate-500">{formatCurrency(trend.total_gross_pay)}</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-slate-900" style={{ width: `${grossWidth}%` }} />
            </div>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
              <span>Employer: {formatCurrency(trend.total_employer_contributions)}</span>
              <span>Deductions: {formatCurrency(trend.total_deductions)}</span>
              <span className={cn(Number(trend.gross_pay_delta) >= 0 ? "text-emerald-700" : "text-rose-700")}>
                Delta: {formatCurrency(trend.gross_pay_delta)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BreakdownList({
  rows,
  footerRows,
}: {
  rows: Array<{ label: string; value: string }>;
  footerRows: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4 rounded-[20px] border border-slate-200/80 bg-white/90 px-4 py-3">
          <span className="text-sm text-slate-600">{row.label}</span>
          <span className="text-sm font-semibold text-slate-950">{formatCurrency(row.value)}</span>
        </div>
      ))}

      <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/90 p-4">
        {footerRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
            <span className="text-sm font-medium text-slate-700">{row.label}</span>
            <span className="text-sm font-semibold text-slate-950">{formatCurrency(row.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectedCutoffPanel({ cutoff }: { cutoff: PayrollReportCutoffDetailRecord }) {
  const payRows = [
    { label: "Basic pay", value: cutoff.total_basic_pay },
    { label: "Allowances", value: cutoff.total_allowances },
    { label: "Leave pay", value: cutoff.total_leave_pay },
    { label: "Overtime pay", value: cutoff.total_overtime_pay },
    { label: "Night differential", value: cutoff.total_night_differential_pay },
  ];
  const employeeDeductionRows = [
    { label: "Late deductions", value: cutoff.total_late_deductions },
    { label: "Undertime deductions", value: cutoff.total_undertime_deductions },
    { label: "Absence deductions", value: cutoff.total_absence_deductions },
    { label: "Employee loan deductions", value: cutoff.total_loan_deductions },
  ];
  const dataState: "live" | "approved" | "not_started" =
    !cutoff.has_payroll_data
      ? "not_started"
      : cutoff.is_finalized || cutoff.status === "approved"
        ? "approved"
        : "live";

  return (
    <div className="space-y-4">
      <div className="ui-report-card-primary">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="ui-report-kicker">Selected cutoff</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{cutoff.label}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ReportingStatusBadge label={cutoff.status_label} tone={cutoff.status_tone} />
            <DataStateBadge state={dataState} />
          </div>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {formatDate(cutoff.cutoff_start)} to {formatDate(cutoff.cutoff_end)}. Updated{" "}
          {formatDateTime(cutoff.last_updated_at)}.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="ui-report-stat-strip">
            <p className="ui-report-kicker">Employees</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{cutoff.employee_count}</p>
          </div>
          <div className="ui-report-stat-strip">
            <p className="ui-report-kicker">Gross pay</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{formatCurrency(cutoff.total_gross_pay)}</p>
          </div>
          <div className="ui-report-stat-strip">
            <p className="ui-report-kicker">Net pay</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{formatCurrency(cutoff.total_net_pay)}</p>
          </div>
          <div className="ui-report-stat-strip">
            <p className="ui-report-kicker">Total deductions</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{formatCurrency(cutoff.total_deductions)}</p>
          </div>
        </div>
        {cutoff.remarks ? (
          <p className="mt-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-600">
            {cutoff.remarks}
          </p>
        ) : null}
      </div>

      {!cutoff.has_payroll_data ? (
        <ResourceEmptyState
          title="No payroll calculation yet for this cutoff"
          description="This cutoff exists in attendance, but there is no calculated payroll batch yet. Once payroll is calculated, the real totals and remittance details will appear here."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="ui-report-section-soft">
              <p className="ui-report-kicker">Employee pay</p>
              <p className="mt-1 text-sm text-slate-600">Core earnings and payable employee income for this cutoff.</p>
              <div className="mt-4 space-y-3">
                {payRows.map((row) => (
                  <DetailRow key={row.label} label={row.label} value={row.value} />
                ))}
                <DetailRow label="Gross pay" value={cutoff.total_gross_pay} emphasized />
                <DetailRow label="Net pay" value={cutoff.total_net_pay} emphasized />
              </div>
            </div>
            <div className="ui-report-section-soft">
              <p className="ui-report-kicker">Employee deductions</p>
              <p className="mt-1 text-sm text-slate-600">Operational deductions taken directly from employee pay.</p>
              <div className="mt-4 space-y-3">
                {employeeDeductionRows.map((row) => (
                  <DetailRow key={row.label} label={row.label} value={row.value} />
                ))}
                <DetailRow label="Employee contributions" value={cutoff.total_employee_contributions} emphasized />
                <DetailRow label="Government deductions" value={cutoff.total_government_deductions} emphasized />
                <DetailRow label="Total deductions" value={cutoff.total_deductions} emphasized />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="ui-report-section-soft">
              <p className="ui-report-kicker">Government totals</p>
              <p className="mt-1 text-sm text-slate-600">Employee share, employer share, and withholding remittance visibility.</p>
              <div className="mt-4 space-y-3">
                <GovernmentSummaryRows summary={cutoff.government_summary} />
              </div>
            </div>
            <div className="ui-report-section-soft">
              <p className="ui-report-kicker">Employer contributions</p>
              <p className="mt-1 text-sm text-slate-600">Direct employer-paid statutory cost tracked separately for finance review.</p>
              <div className="mt-4 space-y-3">
                <EmployerContributionRows summary={cutoff.employer_contribution_summary} />
                <DetailRow label="Total employer contribution cost" value={cutoff.total_employer_contributions} emphasized />
                <DetailRow label="Government remittances" value={cutoff.total_government_remittances} emphasized />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <span className={cn("text-sm", emphasized ? "font-medium text-slate-800" : "text-slate-600")}>{label}</span>
      <span className={cn("text-sm font-semibold", emphasized ? "text-slate-950" : "text-slate-900")}>{formatCurrency(value)}</span>
    </div>
  );
}

function GovernmentSummaryRows({ summary }: { summary: PayrollReportGovernmentSummaryRecord }) {
  return (
    <>
      <DetailRow label="SSS employee" value={summary.sss_employee} />
      <DetailRow label="SSS employer" value={summary.sss_employer} />
      <DetailRow label="PhilHealth employee" value={summary.philhealth_employee} />
      <DetailRow label="PhilHealth employer" value={summary.philhealth_employer} />
      <DetailRow label="Pag-IBIG employee" value={summary.pagibig_employee} />
      <DetailRow label="Pag-IBIG employer" value={summary.pagibig_employer} />
      <DetailRow label="Withholding tax" value={summary.withholding_tax} />
      <DetailRow label="Total remittances" value={summary.total_government_remittances} emphasized />
    </>
  );
}

function EmployerContributionRows({
  summary,
}: {
  summary: PayrollReportEmployerContributionSummaryRecord;
}) {
  return (
    <>
      <DetailRow label="SSS employer share" value={summary.sss_employer} />
      <DetailRow label="PhilHealth employer share" value={summary.philhealth_employer} />
      <DetailRow label="Pag-IBIG employer share" value={summary.pagibig_employer} />
      <DetailRow label="Total employer shares" value={summary.total_employer_shares} emphasized />
    </>
  );
}

function ReportingWorkspaceSkeleton() {
  return (
    <div className="space-y-6">
      <section className="panel-strong p-6 sm:p-7">
        <ResourceTableSkeleton filterCount={3} rowCount={1} />
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-[24px] border border-slate-200/80 bg-white/85" />
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="panel-strong p-6 sm:p-7">
          <ResourceTableSkeleton filterCount={1} rowCount={6} />
        </div>
        <div className="panel-strong p-6 sm:p-7">
          <ResourceTableSkeleton filterCount={1} rowCount={5} />
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
        <div className="panel-strong p-6 sm:p-7">
          <ResourceTableSkeleton filterCount={1} rowCount={5} />
        </div>
        <div className="panel-strong p-6 sm:p-7">
          <ResourceTableSkeleton filterCount={1} rowCount={8} />
        </div>
      </section>
    </div>
  );
}
