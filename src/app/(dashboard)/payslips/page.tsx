import { Search } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { PayrollStatusBadge } from "@/components/payroll/payroll-status-badge";
import { PayslipPreviewCard } from "@/components/payslips/payslip-preview-card";
import { RecentPayslipsTable } from "@/components/payslips/recent-payslips-table";
import { ExportActions } from "@/components/shared/export-actions";
import { PageHeader } from "@/components/shared/page-header";

const recentPayslips = [
  {
    employeeId: "EMP-1001",
    employeeName: "Olivia Bennett",
    period: "March 2026 Monthly Payroll",
    releasedOn: "Apr 05, 2026",
    netPay: "PHP 44,230.00",
    status: "Paid" as const,
  },
  {
    employeeId: "EMP-1008",
    employeeName: "Marcus Rivera",
    period: "March 2026 Monthly Payroll",
    releasedOn: "Apr 05, 2026",
    netPay: "PHP 35,500.00",
    status: "Paid" as const,
  },
  {
    employeeId: "EMP-1015",
    employeeName: "Sophia Turner",
    period: "March 2026 Monthly Payroll",
    releasedOn: "Apr 05, 2026",
    netPay: "PHP 49,810.00",
    status: "Needs review" as const,
  },
  {
    employeeId: "EMP-1022",
    employeeName: "Daniel Kim",
    period: "March 2026 Monthly Payroll",
    releasedOn: "Apr 05, 2026",
    netPay: "PHP 32,880.00",
    status: "Paid" as const,
  },
];

export default function PayslipsPage() {
  return (
    <>
      <PageHeader
        title="Payslips"
        description="Preview employee payslips, review recent releases, and prepare export or download actions for payroll statements."
      />

      <section className="panel p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)_auto]">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Payroll Period
            </span>
            <select
              defaultValue="March 2026 Monthly Payroll"
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
            >
              <option>March 2026 Monthly Payroll</option>
              <option>April 2026 Monthly Payroll</option>
              <option>March 2026 Off-cycle Adjustments</option>
            </select>
          </label>

          <label className="relative block">
            <span className="sr-only">Search employee payslips</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search employee or select an employee payslip"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
            />
          </label>

          <div className="flex items-end">
            <ExportActions
              actions={[
                { label: "Download PDF" },
                { label: "Export ZIP" },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <PayslipPreviewCard
          employeeName="Olivia Bennett"
          employeeId="EMP-1001"
          period="March 2026 Monthly Payroll"
          grossPay="PHP 51,500.00"
          deductions="PHP 7,270.00"
          netPay="PHP 44,230.00"
        />

        <DashboardSection
          title="Release status"
          description="Current statement and distribution status for the selected employee."
        >
          <div className="grid gap-3">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Publish status
              </p>
              <div className="mt-2">
                <PayrollStatusBadge status="Paid" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Delivery channel
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Employee self-service portal and HR archive export
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Last generated
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Apr 05, 2026 at 8:12 AM
              </p>
            </div>
          </div>
        </DashboardSection>
      </section>

      <DashboardSection
        title="Recent payslips"
        description="Latest released and review-pending employee payslip records."
      >
        <RecentPayslipsTable items={recentPayslips} />
      </DashboardSection>
    </>
  );
}

