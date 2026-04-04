import { EmployeePayslipDashboard } from "@/components/dashboard/employee-payslip-dashboard";
import { PayslipWorkspace } from "@/components/payslips/payslip-workspace";
import { PageHeader } from "@/components/shared/page-header";
import { ResourceErrorState } from "@/components/shared/resource-state";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { canViewPayslips, canViewPayroll } from "@/lib/auth/session";

export default async function PayslipsPage() {
  const session = await getServerAuthSession();

  if (!canViewPayslips(session.role)) {
    return (
      <>
        <PageHeader
          title="Payslips"
          description="Review payroll statements and payroll release records."
        />
        <section className="panel p-6 sm:p-7">
          <ResourceErrorState
            title="Payslip access is unavailable"
            description="Only employees, Finance, and Admin-Finance can access payroll payslips."
          />
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Payslips"
        description={
          canViewPayroll(session.role)
            ? "Review generated payslips and inspect the payroll breakdown by employee."
            : "Review your generated payslips and salary breakdown."
        }
      />

      {session.role === "employee" ? <EmployeePayslipDashboard /> : <PayslipWorkspace />}
    </>
  );
}
