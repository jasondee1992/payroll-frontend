import Link from "next/link";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { DashboardValueGrid } from "@/components/dashboard/dashboard-value-grid";
import { PayrollStatusBadge } from "@/components/payroll/payroll-status-badge";
import { ResourceEmptyState } from "@/components/shared/resource-state";
import { SectionCard } from "@/components/ui/section-card";
import { normalizePayrollStatus } from "@/lib/api/payroll";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardTone } from "@/types/dashboard";
import type {
  PayrollReconciliationComparisonRecord,
  PayrollReconciliationRecord,
  PayrollReconciliationWarningRecord,
} from "@/types/payroll";

type PayrollReconciliationViewProps = {
  reconciliation: PayrollReconciliationRecord;
};

export function PayrollReconciliationView({
  reconciliation,
}: PayrollReconciliationViewProps) {
  const warningCounts = countWarningsBySeverity(reconciliation.warnings);

  return (
    <div className="space-y-6">
      <DashboardValueGrid
        items={[
          {
            key: "employee-count",
            label: "Employees included",
            value: String(reconciliation.totals.employee_count),
            value_type: "count",
            context: "Employees currently included in the selected payroll batch.",
            tone: "strong",
          },
          {
            key: "gross-total",
            label: "Gross total",
            value: reconciliation.totals.gross_total,
            value_type: "currency",
            context: "Total gross payroll before deductions for this cutoff.",
            tone: "info",
          },
          {
            key: "deductions-total",
            label: "Deductions total",
            value: reconciliation.totals.deductions_total,
            value_type: "currency",
            context: "Employee deductions, including government and other payroll deductions.",
            tone: "warning",
          },
          {
            key: "employer-contributions-total",
            label: "Employer contributions",
            value: reconciliation.totals.employer_contributions_total,
            value_type: "currency",
            context: "Employer-side statutory contribution cost for the same cutoff.",
            tone: "info",
          },
          {
            key: "net-total",
            label: "Net total",
            value: reconciliation.totals.net_total,
            value_type: "currency",
            context: "Net payroll amount that would be released if this batch is approved and finalized.",
            tone:
              reconciliation.warnings.some((warning) => warning.severity === "danger")
                ? "warning"
                : "success",
          },
          {
            key: "flagged-records",
            label: "Flagged records",
            value: String(reconciliation.totals.flagged_record_count),
            value_type: "count",
            context: "Payroll records already carrying validation or review flags.",
            tone:
              reconciliation.totals.flagged_record_count > 0 ? "danger" : "success",
          },
        ]}
        variant="summary"
      />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title="Previous Cutoff Comparison"
          description="Use the latest earlier payroll batch with records as a quick reconciliation baseline before approval."
          action={
            reconciliation.comparison ? (
              <div className="flex flex-wrap items-center gap-2">
                <PayrollStatusBadge
                  status={normalizePayrollStatus(reconciliation.comparison.batch_status)}
                />
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  {formatDate(reconciliation.comparison.cutoff.cutoff_start)} to{" "}
                  {formatDate(reconciliation.comparison.cutoff.cutoff_end)}
                </span>
              </div>
            ) : null
          }
        >
          {reconciliation.comparison ? (
            <div className="space-y-3">
              {buildComparisonRows(reconciliation.comparison, reconciliation).map((row) => (
                <article
                  key={row.key}
                  className="rounded-[24px] border border-slate-200/80 bg-slate-50/70 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{row.label}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                        Current {row.currentValue}
                        <span className="mx-2 text-slate-300">/</span>
                        Previous {row.previousValue}
                      </p>
                    </div>
                    <DashboardStatusBadge label={row.deltaLabel} tone={row.tone} />
                  </div>
                  <p
                    className={cn(
                      "mt-3 text-lg font-semibold tracking-tight",
                      row.tone === "danger"
                        ? "text-rose-700"
                        : row.tone === "warning"
                          ? "text-amber-700"
                          : row.tone === "success"
                            ? "text-emerald-700"
                            : "text-slate-900",
                    )}
                  >
                    {row.deltaValue}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <ResourceEmptyState
              title="No previous cutoff comparison is available"
              description="The backend did not find an earlier payroll batch with calculated employee records to use as a comparison baseline."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Review Context"
          description="Keep the batch state, cutoff scope, and statutory totals visible while Finance reviews the payroll output."
        >
          <div className="grid gap-3">
            <ContextTile
              label="Current batch status"
              value={normalizeStatusLabel(reconciliation.batch_status)}
              detail="Approval and finalization stay in the main payroll workflow."
              accent={
                <PayrollStatusBadge
                  status={normalizePayrollStatus(reconciliation.batch_status)}
                />
              }
            />
            <ContextTile
              label="Current cutoff"
              value={`${formatDate(reconciliation.cutoff.cutoff_start)} to ${formatDate(reconciliation.cutoff.cutoff_end)}`}
              detail={`Attendance status: ${reconciliation.cutoff.status}`}
            />
            <ContextTile
              label="Government deductions total"
              value={formatCurrency(reconciliation.totals.government_deductions_total)}
              detail="Employee-side statutory deductions included inside total deductions."
            />
            <ContextTile
              label="Snapshot generated"
              value={formatDateTime(reconciliation.generated_at)}
              detail="Refresh or reopen the reconciliation view after batch recalculation."
            />
          </div>
        </SectionCard>
      </section>

      <SectionCard
        title="Warnings And Anomalies"
        description="Focus on validation issues and edge cases that should be reviewed before payroll is approved or finalized."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {warningCounts.danger > 0 ? (
              <DashboardStatusBadge label={`${warningCounts.danger} blocked`} tone="danger" />
            ) : null}
            {warningCounts.warning > 0 ? (
              <DashboardStatusBadge
                label={`${warningCounts.warning} attention`}
                tone="warning"
              />
            ) : null}
            {warningCounts.info > 0 ? (
              <DashboardStatusBadge label={`${warningCounts.info} info`} tone="info" />
            ) : null}
          </div>
        }
      >
        {reconciliation.warnings.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {reconciliation.warnings.map((warning) => (
              <WarningCard key={warning.key} warning={warning} />
            ))}
          </div>
        ) : (
          <ResourceEmptyState
            title="No active reconciliation warnings"
            description="The current payroll batch does not have any stored review warnings or reconciliation anomalies."
          />
        )}
      </SectionCard>
    </div>
  );
}

function WarningCard({
  warning,
}: {
  warning: PayrollReconciliationWarningRecord;
}) {
  const tone = toDashboardTone(warning.severity);

  return (
    <article
      className={cn(
        "rounded-[24px] border px-5 py-5",
        tone === "danger"
          ? "border-rose-200/80 bg-rose-50/50"
          : tone === "warning"
            ? "border-amber-200/80 bg-amber-50/50"
            : "border-slate-200/80 bg-slate-50/70",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-950">{warning.title}</p>
            <DashboardStatusBadge
              label={severityLabelMap[tone]}
              tone={tone}
            />
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{warning.description}</p>
        </div>
        <div className="rounded-2xl border border-white/80 bg-white/90 px-3 py-2 text-right shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Affected
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {warning.affected_count}
          </p>
        </div>
      </div>

      {warning.samples.length > 0 ? (
        <div className="mt-4 space-y-2">
          {warning.samples.map((sample) => (
            <Link
              key={`${warning.key}-${sample.payroll_record_id}`}
              href={`/employees/${sample.employee_id}`}
              className="block rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm transition hover:border-slate-300"
            >
              <p className="text-sm font-semibold text-slate-950">
                {sample.employee_name}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                {sample.employee_code} • Payroll record #{sample.payroll_record_id}
              </p>
            </Link>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function ContextTile({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: React.ReactNode;
}) {
  return (
    <article className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
        </div>
        {accent ? <div className="shrink-0">{accent}</div> : null}
      </div>
    </article>
  );
}

function buildComparisonRows(
  comparison: PayrollReconciliationComparisonRecord,
  reconciliation: PayrollReconciliationRecord,
) {
  return [
    {
      key: "employee-count",
      label: "Employees included",
      currentValue: reconciliation.totals.employee_count.toLocaleString("en-US"),
      previousValue: comparison.totals.employee_count.toLocaleString("en-US"),
      deltaValue: formatSignedCount(comparison.employee_count_delta),
      deltaLabel: deltaBadgeLabel(comparison.employee_count_delta),
      tone: deltaTone(comparison.employee_count_delta, { reversed: false }),
    },
    {
      key: "gross-total",
      label: "Gross total",
      currentValue: formatCurrency(reconciliation.totals.gross_total),
      previousValue: formatCurrency(comparison.totals.gross_total),
      deltaValue: formatSignedCurrency(comparison.gross_total_delta),
      deltaLabel: deltaBadgeLabel(Number(comparison.gross_total_delta)),
      tone: deltaTone(Number(comparison.gross_total_delta), { reversed: false }),
    },
    {
      key: "deductions-total",
      label: "Deductions total",
      currentValue: formatCurrency(reconciliation.totals.deductions_total),
      previousValue: formatCurrency(comparison.totals.deductions_total),
      deltaValue: formatSignedCurrency(comparison.deductions_total_delta),
      deltaLabel: deltaBadgeLabel(Number(comparison.deductions_total_delta)),
      tone: deltaTone(Number(comparison.deductions_total_delta), { reversed: true }),
    },
    {
      key: "employer-contributions-total",
      label: "Employer contributions",
      currentValue: formatCurrency(reconciliation.totals.employer_contributions_total),
      previousValue: formatCurrency(comparison.totals.employer_contributions_total),
      deltaValue: formatSignedCurrency(comparison.employer_contributions_total_delta),
      deltaLabel: deltaBadgeLabel(Number(comparison.employer_contributions_total_delta)),
      tone: deltaTone(
        Number(comparison.employer_contributions_total_delta),
        { reversed: true },
      ),
    },
    {
      key: "net-total",
      label: "Net total",
      currentValue: formatCurrency(reconciliation.totals.net_total),
      previousValue: formatCurrency(comparison.totals.net_total),
      deltaValue: formatSignedCurrency(comparison.net_total_delta),
      deltaLabel: deltaBadgeLabel(Number(comparison.net_total_delta)),
      tone: deltaTone(Number(comparison.net_total_delta), { reversed: false }),
    },
  ] satisfies Array<{
    key: string;
    label: string;
    currentValue: string;
    previousValue: string;
    deltaValue: string;
    deltaLabel: string;
    tone: DashboardTone;
  }>;
}

function countWarningsBySeverity(warnings: PayrollReconciliationWarningRecord[]) {
  return warnings.reduce(
    (accumulator, warning) => {
      const tone = toDashboardTone(warning.severity);
      accumulator[tone] += 1;
      return accumulator;
    },
    { info: 0, warning: 0, danger: 0 } as Record<
      ReturnType<typeof toDashboardTone>,
      number
    >,
  );
}

function toDashboardTone(severity: string): "info" | "warning" | "danger" {
  if (severity === "danger") {
    return "danger";
  }
  if (severity === "warning") {
    return "warning";
  }
  return "info";
}

function deltaTone(
  value: number,
  options: { reversed: boolean },
): DashboardTone {
  if (value === 0) {
    return "info";
  }

  if (options.reversed) {
    return value > 0 ? "warning" : "success";
  }

  return value > 0 ? "success" : "warning";
}

function deltaBadgeLabel(value: number) {
  if (value === 0) {
    return "No change";
  }

  return value > 0 ? "Higher" : "Lower";
}

function formatSignedCurrency(value: string) {
  const numericValue = Number(value);
  const absoluteValue = Math.abs(numericValue);

  return `${numericValue >= 0 ? "+" : "-"}${formatCurrency(absoluteValue)}`;
}

function formatSignedCount(value: number) {
  return `${value >= 0 ? "+" : "-"}${Math.abs(value).toLocaleString("en-US")}`;
}

function normalizeStatusLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

const severityLabelMap: Record<DashboardTone, string> = {
  neutral: "Info",
  info: "Review",
  success: "Lower",
  warning: "Attention",
  danger: "Blocked",
  strong: "Current",
};
