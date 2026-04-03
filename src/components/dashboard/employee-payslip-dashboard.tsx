"use client";

import { useState } from "react";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import {
  formatCurrency,
  formatDate,
} from "@/lib/format";
import type {
  EmployeeMonthlyPayTrendRecord,
  EmployeePayslipRecord,
} from "@/lib/mock/employee-payslips";
import { cn } from "@/lib/utils";

type EmployeePayslipDashboardProps = {
  payslips: EmployeePayslipRecord[];
  monthlyTrend: EmployeeMonthlyPayTrendRecord[];
};

export function EmployeePayslipDashboard({
  payslips,
  monthlyTrend,
}: EmployeePayslipDashboardProps) {
  const [selectedPayslipId, setSelectedPayslipId] = useState(payslips[0]?.id ?? "");
  const selectedPayslip =
    payslips.find((payslip) => payslip.id === selectedPayslipId) ?? payslips[0];
  const latestTrendMonth = monthlyTrend[monthlyTrend.length - 1];

  if (!selectedPayslip) {
    return (
      <>
        <section className="panel p-6 sm:p-7">
          <p className="text-sm text-slate-600">
            No payslips are available yet for this employee account.
          </p>
        </section>
      </>
    );
  }

  const additionsTotal = selectedPayslip.additions.reduce(
    (total, item) => total + item.amount,
    0,
  );

  return (
    <>
      {latestTrendMonth ? (
        <DashboardSection
          title=""
          description="Your monthly salary trend for the last 12 months, ending on the latest available payslip month."
          action={
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Latest month: {latestTrendMonth.monthLabel}
            </span>
          }
        >
          <MonthlyPayTrendChart trend={monthlyTrend} />
        </DashboardSection>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Latest net pay"
          value={formatCurrency(selectedPayslip.netPay)}
          detail={`Released ${formatDate(selectedPayslip.payoutDate)}`}
        />
        <SummaryCard
          label="Gross pay"
          value={formatCurrency(selectedPayslip.grossPay)}
          detail={`${selectedPayslip.payrollSchedule} payroll cycle`}
        />
        <SummaryCard
          label="Total deductions"
          value={formatCurrency(selectedPayslip.totalDeductions)}
          detail={`For ${selectedPayslip.periodLabel}`}
        />
      </section>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
        Employee payslip data is currently using frontend dummy records while the
        backend payslips API is still unavailable.
      </div>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.35fr]">
        <DashboardSection
          title="Payslip history"
          description="Select a released payslip to review the salary computation and released amount."
        >
          <div className="space-y-3">
            {payslips.map((payslip) => {
              const active = payslip.id === selectedPayslip.id;

              return (
                <button
                  key={payslip.id}
                  type="button"
                  onClick={() => setSelectedPayslipId(payslip.id)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-4 text-left transition",
                    active
                      ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                      : "border-slate-200/80 bg-slate-50/80 text-slate-900 hover:border-slate-300 hover:bg-white",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{payslip.periodLabel}</p>
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          active ? "text-slate-300" : "text-slate-500",
                        )}
                      >
                        Payout date: {formatDate(payslip.payoutDate)}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                        active
                          ? "bg-white/12 text-white"
                          : "bg-emerald-100 text-emerald-700",
                      )}
                    >
                      {payslip.status}
                    </span>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p
                        className={cn(
                          "text-[11px] font-semibold uppercase tracking-[0.18em]",
                          active ? "text-slate-300" : "text-slate-500",
                        )}
                      >
                        Net pay
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatCurrency(payslip.netPay)}
                      </p>
                    </div>

                    <p
                      className={cn(
                        "text-xs",
                        active ? "text-slate-300" : "text-slate-500",
                      )}
                    >
                      {payslip.payrollSchedule}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </DashboardSection>

        <DashboardSection
          title="Payslip computation"
          description="Current breakdown of earnings, deductions, and final released amount for the selected payslip."
          action={
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {selectedPayslip.periodLabel}
            </span>
          }
        >
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <BreakdownCard
                title="Earnings"
                tone="positive"
                rows={[
                  { label: "Basic pay", amount: selectedPayslip.basicPay },
                  ...selectedPayslip.additions,
                ]}
                footerLabel="Gross pay"
                footerValue={selectedPayslip.grossPay}
              />

              <BreakdownCard
                title="Deductions"
                tone="neutral"
                rows={selectedPayslip.deductions}
                footerLabel="Total deductions"
                footerValue={selectedPayslip.totalDeductions}
              />
            </div>

            <div className="space-y-4">
              <div className="rounded-[26px] border border-slate-200/80 bg-slate-900 px-5 py-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Final net pay
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight">
                  {formatCurrency(selectedPayslip.netPay)}
                </p>
                <div className="mt-4 grid gap-3">
                  <MetricRow label="Basic pay" value={formatCurrency(selectedPayslip.basicPay)} />
                  <MetricRow label="Allowances and additions" value={formatCurrency(additionsTotal)} />
                  <MetricRow
                    label="Total deductions"
                    value={formatCurrency(selectedPayslip.totalDeductions)}
                  />
                </div>
              </div>

              <div className="rounded-[26px] border border-slate-200/80 bg-slate-50/80 px-5 py-5">
                <p className="text-sm font-semibold text-slate-950">
                  Released payslip details
                </p>
                <div className="mt-4 grid gap-3">
                  <MetaRow label="Payslip ID" value={selectedPayslip.id} />
                  <MetaRow label="Payout date" value={formatDate(selectedPayslip.payoutDate)} />
                  <MetaRow label="Payroll schedule" value={selectedPayslip.payrollSchedule} />
                  <MetaRow label="Status" value={selectedPayslip.status} />
                </div>
              </div>
            </div>
          </div>
        </DashboardSection>
      </section>
    </>
  );
}

function MonthlyPayTrendChart({
  trend,
}: {
  trend: EmployeeMonthlyPayTrendRecord[];
}) {
  const chartHeight = 260;
  const chartWidth = 960;
  const topPadding = 24;
  const bottomPadding = 56;
  const usableHeight = chartHeight - topPadding - bottomPadding;
  const barWidth = 30;
  const latestTrend = trend[trend.length - 1];
  const highestGrossPay = Math.max(...trend.map((item) => item.grossPay), 1);
  const step = chartWidth / trend.length;

  const points = trend.map((item, index) => {
    const centerX = step * index + step / 2;
    const grossHeight = (item.grossPay / highestGrossPay) * usableHeight;
    const netY =
      topPadding + usableHeight - (item.netPay / highestGrossPay) * usableHeight;

    return {
      ...item,
      centerX,
      grossTop: topPadding + usableHeight - grossHeight,
      grossHeight,
      netY,
      shortLabel: formatMonthShortLabel(item.monthKey),
    };
  });
  const linePath = points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.centerX.toFixed(2)} ${point.netY.toFixed(2)}`,
    )
    .join(" ");
  const gridLines = 4;

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto rounded-[28px] border border-slate-200/80 bg-white px-4 py-5 sm:px-5">
        <div className="min-w-[920px]">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <LegendPill colorClassName="bg-sky-500" label="Net pay" />
            <LegendPill colorClassName="bg-slate-200" label="Gross pay" />
            <LegendPill colorClassName="bg-amber-400" label="Latest month" />
          </div>

          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="h-[260px] w-full"
            role="img"
            aria-label="Net pay and gross pay monthly trend for the last 12 months"
          >
            {Array.from({ length: gridLines + 1 }, (_, index) => {
              const y = topPadding + (usableHeight / gridLines) * index;

              return (
                <line
                  key={`grid-${index}`}
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="rgb(226 232 240)"
                  strokeWidth="1"
                />
              );
            })}

            {points.map((point) => {
              const isLatestMonth = point.monthKey === latestTrend.monthKey;

              return (
                <g key={point.monthKey}>
                  <rect
                    x={point.centerX - barWidth / 2}
                    y={point.grossTop}
                    width={barWidth}
                    height={point.grossHeight}
                    rx="15"
                    fill={isLatestMonth ? "rgb(251 191 36)" : "rgb(207 229 233)"}
                    opacity={isLatestMonth ? "1" : "0.9"}
                  />
                </g>
              );
            })}

            <path
              d={linePath}
              fill="none"
              stroke="rgb(14 165 233)"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {points.map((point) => {
              const isLatestMonth = point.monthKey === latestTrend.monthKey;

              return (
                <g key={`${point.monthKey}-dot`}>
                  <circle
                    cx={point.centerX}
                    cy={point.netY}
                    r="7"
                    fill="white"
                    stroke={isLatestMonth ? "rgb(245 158 11)" : "rgb(14 165 233)"}
                    strokeWidth="3"
                  />
                  <text
                    x={point.centerX}
                    y={chartHeight - 18}
                    textAnchor="middle"
                    className="fill-slate-500 text-[11px] font-medium"
                  >
                    {point.shortLabel}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
            The graph starts from {trend[0]?.monthLabel} and ends on{" "}
            {latestTrend.monthLabel}, based on the latest available payslip month.
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[26px] border border-slate-200/80 bg-white px-5 py-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function LegendPill({
  colorClassName,
  label,
}: {
  colorClassName: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
      <span className={cn("h-2.5 w-2.5 rounded-full", colorClassName)} />
      {label}
    </span>
  );
}

function BreakdownCard({
  title,
  rows,
  footerLabel,
  footerValue,
  tone,
}: {
  title: string;
  rows: Array<{ label: string; amount: number }>;
  footerLabel: string;
  footerValue: number;
  tone: "positive" | "neutral";
}) {
  return (
    <div className="rounded-[26px] border border-slate-200/80 bg-white px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-950">{title}</p>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
            tone === "positive"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600",
          )}
        >
          {rows.length} item{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3"
          >
            <p className="text-sm text-slate-600">{row.label}</p>
            <p className="text-sm font-semibold text-slate-950">
              {formatCurrency(row.amount)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white">
        <p className="text-sm font-medium">{footerLabel}</p>
        <p className="text-sm font-semibold">{formatCurrency(footerValue)}</p>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/8 px-4 py-3">
      <p className="text-sm text-slate-300">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function formatMonthShortLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
  }).format(date);
}
