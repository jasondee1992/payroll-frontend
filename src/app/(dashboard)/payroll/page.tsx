import Link from "next/link";
import {
  CalendarRange,
  FileChartColumn,
  FileText,
  PlayCircle,
} from "lucide-react";
import { PayrollModuleLinkCard } from "@/components/payroll/payroll-module-link-card";
import { PageHeader } from "@/components/shared/page-header";

export default function PayrollPage() {
  return (
    <>
      <PageHeader
        title="Payroll"
        description="Manage payroll cycles, run processing steps, review results, and move through the payroll workflow from one module."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PayrollModuleLinkCard
          title="Payroll Periods"
          description="Create, review, and manage active and upcoming pay cycles."
          href="/payroll/periods"
          icon={CalendarRange}
          meta="4 tracked periods"
        />
        <PayrollModuleLinkCard
          title="Run Payroll"
          description="Prepare a payroll run with the selected period, group, and reviewer notes."
          href="/payroll/run"
          icon={PlayCircle}
          meta="1 run ready"
        />
        <PayrollModuleLinkCard
          title="Payroll Results"
          description="Review gross pay, deductions, tax, and final net pay outcomes."
          href="/payroll/results"
          icon={FileChartColumn}
          meta="248 results available"
        />
        <PayrollModuleLinkCard
          title="Payslips"
          description="Move to payslip publishing and employee-facing payroll statement records."
          href="/payslips"
          icon={FileText}
          meta="Next release Apr 5"
        />
      </section>

      <section className="panel p-6 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Current payroll cycle
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              April 2026 monthly payroll is in review and ready to move into
              processing after final attendance adjustments are approved.
            </p>
          </div>
          <Link
            href="/payroll/run"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Continue Payroll Run
          </Link>
        </div>
      </section>
    </>
  );
}

