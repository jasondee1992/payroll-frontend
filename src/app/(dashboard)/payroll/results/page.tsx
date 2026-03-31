import { BadgeCheck, CircleDollarSign, Landmark, WalletCards } from "lucide-react";
import { PayrollResultsTable } from "@/components/payroll/payroll-results-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/shared/page-header";

const results = [
  {
    employeeId: "EMP-1001",
    name: "Olivia Bennett",
    grossPay: "PHP 51,500.00",
    deductions: "PHP 4,050.00",
    tax: "PHP 3,220.00",
    netPay: "PHP 44,230.00",
    status: "Paid" as const,
  },
  {
    employeeId: "EMP-1008",
    name: "Marcus Rivera",
    grossPay: "PHP 42,100.00",
    deductions: "PHP 3,680.00",
    tax: "PHP 2,920.00",
    netPay: "PHP 35,500.00",
    status: "Paid" as const,
  },
  {
    employeeId: "EMP-1015",
    name: "Sophia Turner",
    grossPay: "PHP 58,900.00",
    deductions: "PHP 4,410.00",
    tax: "PHP 4,680.00",
    netPay: "PHP 49,810.00",
    status: "Needs review" as const,
  },
  {
    employeeId: "EMP-1022",
    name: "Daniel Kim",
    grossPay: "PHP 38,700.00",
    deductions: "PHP 3,240.00",
    tax: "PHP 2,580.00",
    netPay: "PHP 32,880.00",
    status: "Paid" as const,
  },
  {
    employeeId: "EMP-1031",
    name: "Priya Shah",
    grossPay: "PHP 47,300.00",
    deductions: "PHP 3,820.00",
    tax: "PHP 3,610.00",
    netPay: "PHP 39,870.00",
    status: "Processing" as const,
  },
];

export default function PayrollResultsPage() {
  return (
    <>
      <PageHeader
        title="Payroll Results"
        description="Review payroll outputs, validate deduction and tax totals, and prepare payroll results for downstream release."
        actions={
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/10"
          >
            Export Results
          </button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Processed Employees"
          value="248"
          detail="Employees included in the current payroll result set."
          trend="97% ready"
          trendTone="positive"
          icon={BadgeCheck}
        />
        <StatCard
          title="Gross Payroll"
          value="PHP 412.8K"
          detail="Total gross pay before taxes and contribution deductions."
          trend="+2.8%"
          trendTone="positive"
          icon={CircleDollarSign}
        />
        <StatCard
          title="Total Deductions"
          value="PHP 36.4K"
          detail="Combined deductions for contributions, loans, and other payroll items."
          trend="Within range"
          icon={Landmark}
        />
        <StatCard
          title="Net Payout"
          value="PHP 347.6K"
          detail="Projected net payout after deductions and tax calculations."
          trend="3 records pending"
          trendTone="attention"
          icon={WalletCards}
        />
      </section>

      <section className="panel p-5 sm:p-6">
        <PayrollResultsTable results={results} />
      </section>
    </>
  );
}
