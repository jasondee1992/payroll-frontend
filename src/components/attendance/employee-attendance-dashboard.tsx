"use client";

import { useState } from "react";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { PageHeader } from "@/components/shared/page-header";
import { formatDate } from "@/lib/format";
import type { EmployeeAttendanceMonthRecord } from "@/lib/mock/employee-attendance";
import { cn } from "@/lib/utils";

type EmployeeAttendanceDashboardProps = {
  months: EmployeeAttendanceMonthRecord[];
  showHeader?: boolean;
};

export function EmployeeAttendanceDashboard({
  months,
  showHeader = true,
}: EmployeeAttendanceDashboardProps) {
  const [selectedMonthKey, setSelectedMonthKey] = useState(months[0]?.monthKey ?? "");
  const selectedMonth =
    months.find((month) => month.monthKey === selectedMonthKey) ?? months[0];

  if (!selectedMonth) {
    return (
      <>
        {showHeader ? (
          <PageHeader
            title="Attendance"
            description="Review your monthly attendance records and daily time entries from one self-service page."
          />
        ) : null}

        <section className="panel p-6 sm:p-7">
          <p className="text-sm text-slate-600">
            No attendance records are available yet for this employee account.
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      {showHeader ? (
        <PageHeader
          title="Attendance"
          description="Review your monthly attendance records and daily time entries from one self-service page."
        />
      ) : null}

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
        Employee attendance data is currently using frontend dummy records while
        the backend employee attendance API is still unavailable.
      </div>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.4fr]">
        <DashboardSection
          title="Attendance by month"
          description="Select a month to review the attendance summary and daily records."
        >
          <div className="space-y-3">
            {months.map((month) => {
              const active = month.monthKey === selectedMonth.monthKey;

              return (
                <button
                  key={month.monthKey}
                  type="button"
                  onClick={() => setSelectedMonthKey(month.monthKey)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-4 text-left transition",
                    active
                      ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                      : "border-slate-200/80 bg-slate-50/80 text-slate-900 hover:border-slate-300 hover:bg-white",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{month.monthLabel}</p>
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          active ? "text-slate-300" : "text-slate-500",
                        )}
                      >
                        {month.payrollCutoff}
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
                      {month.attendanceRate}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MiniMetric
                      label="Worked days"
                      value={String(month.totalWorkedDays)}
                      active={active}
                    />
                    <MiniMetric
                      label="Late"
                      value={String(month.totalLateCount)}
                      active={active}
                    />
                    <MiniMetric
                      label="Absent"
                      value={String(month.totalAbsentCount)}
                      active={active}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </DashboardSection>

        <DashboardSection
          title="Monthly attendance details"
          description="Daily attendance entries for the selected month."
          action={
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {selectedMonth.monthLabel}
            </span>
          }
        >
          <div className="grid gap-4 md:grid-cols-4">
            <SummaryStat label="Worked days" value={String(selectedMonth.totalWorkedDays)} />
            <SummaryStat label="Late count" value={String(selectedMonth.totalLateCount)} />
            <SummaryStat label="Absent count" value={String(selectedMonth.totalAbsentCount)} />
            <SummaryStat
              label="OT hours"
              value={selectedMonth.totalOvertimeHours.toFixed(1)}
            />
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200/80">
            <div className="grid grid-cols-[112px_110px_110px_110px_90px_minmax(0,1fr)] gap-3 border-b border-slate-200/80 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <span>Date</span>
              <span>Status</span>
              <span>Time in</span>
              <span>Time out</span>
              <span>OT</span>
              <span>Remarks</span>
            </div>

            <div className="divide-y divide-slate-200/80 bg-white">
              {selectedMonth.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-[112px_110px_110px_110px_90px_minmax(0,1fr)] gap-3 px-4 py-4 text-sm text-slate-700"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {formatDate(entry.workDate)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{entry.dayLabel}</p>
                  </div>
                  <div>
                    <StatusBadge status={entry.status} />
                  </div>
                  <p>{entry.timeIn}</p>
                  <p>{entry.timeOut}</p>
                  <p>{entry.overtimeHours.toFixed(1)}h</p>
                  <p className="leading-6 text-slate-600">{entry.remarks}</p>
                </div>
              ))}
            </div>
          </div>
        </DashboardSection>
      </section>
    </>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-3 py-3",
        active
          ? "border-white/10 bg-white/8"
          : "border-slate-200/80 bg-white",
      )}
    >
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.16em]",
          active ? "text-slate-300" : "text-slate-500",
        )}
      >
        {label}
      </p>
      <p className="mt-2 text-base font-semibold">{value}</p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "Present" | "Late" | "Absent" | "Leave";
}) {
  const tone =
    status === "Present"
      ? "bg-emerald-100 text-emerald-700"
      : status === "Late"
        ? "bg-amber-100 text-amber-700"
        : status === "Absent"
          ? "bg-rose-100 text-rose-700"
          : "bg-slate-100 text-slate-700";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
        tone,
      )}
    >
      {status}
    </span>
  );
}
