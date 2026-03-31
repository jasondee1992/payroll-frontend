import { BarChart3, Building2, Receipt, Users2 } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { ReportPreviewCard } from "@/components/reports/report-preview-card";
import { ReportTypeCard } from "@/components/reports/report-type-card";
import { ExportActions } from "@/components/shared/export-actions";
import { PageHeader } from "@/components/shared/page-header";

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Prepare payroll, attendance, and workforce reporting outputs for internal review and export."
        actions={
          <ExportActions
            actions={[
              { label: "Export CSV" },
              { label: "Export Excel" },
              { label: "Export PDF" },
            ]}
          />
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportTypeCard
          title="Payroll Summary"
          description="Monthly payroll cost, deductions, taxes, and payout totals across the organization."
          icon={Receipt}
          meta="Most used"
        />
        <ReportTypeCard
          title="Attendance Variance"
          description="Late, undertime, and overtime trends that affect payroll computations."
          icon={BarChart3}
          meta="Operations review"
        />
        <ReportTypeCard
          title="Headcount by Department"
          description="Current workforce distribution and employment status across business units."
          icon={Users2}
          meta="HR reporting"
        />
        <ReportTypeCard
          title="Cost Center Allocation"
          description="Departmental payroll allocation views for finance and accounting reconciliation."
          icon={Building2}
          meta="Finance reporting"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.25fr]">
        <DashboardSection
          title="Filters"
          description="Adjust the report preview using period, department, and payroll schedule criteria."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FilterField
              label="Report Type"
              options={[
                "Payroll Summary",
                "Attendance Variance",
                "Headcount by Department",
              ]}
            />
            <FilterField
              label="Payroll Period"
              options={[
                "March 2026 Monthly Payroll",
                "April 2026 Monthly Payroll",
                "March 2026 Off-cycle Adjustments",
              ]}
            />
            <FilterField
              label="Department"
              options={["All Departments", "Finance", "Operations", "Engineering"]}
            />
            <FilterField
              label="Payroll Schedule"
              options={["All Schedules", "Monthly", "Bi-weekly", "Weekly"]}
            />
          </div>
        </DashboardSection>

        <ReportPreviewCard
          title="Report preview"
          description="Placeholder preview of a payroll summary report with key metrics for internal review."
          highlights={[
            { label: "Employees Included", value: "248" },
            { label: "Gross Payroll", value: "PHP 412,840" },
            { label: "Net Payout", value: "PHP 347,600" },
          ]}
        />
      </section>
    </>
  );
}

function FilterField({
  label,
  options,
}: {
  label: string;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10">
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
