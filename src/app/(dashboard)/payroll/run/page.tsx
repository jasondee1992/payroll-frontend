import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { PayrollRunForm } from "@/components/payroll/payroll-run-form";
import { PageHeader } from "@/components/shared/page-header";

const processingItems = [
  { label: "Employees included", value: "248 active employees" },
  { label: "Payroll group", value: "All Active Employees" },
  { label: "Attendance records", value: "232 records synced for review" },
  { label: "Variable pay items", value: "18 adjustments pending confirmation" },
  { label: "Expected gross payout", value: "PHP 412,840.00" },
];

export default function PayrollRunPage() {
  return (
    <>
      <PageHeader
        title="Run Payroll"
        description="Prepare a payroll run by selecting the period, scope, and notes before moving to confirmation."
      />

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
        <DashboardSection
          title="Payroll run setup"
          description="Choose the payroll period and review scope before processing."
        >
          <PayrollRunForm />
        </DashboardSection>

        <div className="space-y-4">
          <DashboardSection
            title="Processing summary"
            description="Overview of what will be included in this payroll run."
          >
            <div className="grid gap-3">
              {processingItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </DashboardSection>

          <DashboardSection
            title="Confirmation note"
            description="This page is confirmation-ready but does not execute payroll."
          >
            <p className="text-sm leading-6 text-slate-600">
              Use this screen to finalize setup details, then wire the actual
              payroll processing workflow later when backend contracts are
              available.
            </p>
          </DashboardSection>
        </div>
      </section>
    </>
  );
}

