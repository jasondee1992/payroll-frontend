import Link from "next/link";
import { ArrowLeft, PencilLine } from "lucide-react";
import { EmployeeDetailGrid } from "@/components/employees/employee-detail-grid";
import { EmployeeDetailSection } from "@/components/employees/employee-detail-section";
import { EmployeeDetailTabs } from "@/components/employees/employee-detail-tabs";
import { EmployeePayrollHistoryTable } from "@/components/employees/employee-payroll-history-table";
import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import { DetailItem } from "@/components/ui/detail-item";
import { PageHeader } from "@/components/shared/page-header";
import {
  ResourceEmptyState,
  ResourceErrorState,
} from "@/components/shared/resource-state";
import { getEmployeeProfileResource } from "@/lib/api/employee-details";

type EmployeeDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function EmployeeDetailPage({
  params,
}: EmployeeDetailPageProps) {
  const { id } = await params;
  const { data: employee, errorMessage } = await getEmployeeProfileResource(id);

  if (errorMessage || !employee) {
    return (
      <ResourceErrorState
        title="Unable to load employee profile"
        description={errorMessage ?? "Employee data is unavailable."}
        action={
          <Link href="/employees" className="ui-button-secondary">
            Back to Employees
          </Link>
        }
      />
    );
  }

  const tabs = [
    {
      id: "basic-information",
      label: "Basic Information",
      content: (
        <EmployeeDetailSection
          title="Basic Information"
          description="Core identity records and employment dates used in payroll and workforce administration."
        >
          <EmployeeDetailGrid items={employee.basicInformation} />
        </EmployeeDetailSection>
      ),
    },
    {
      id: "work-information",
      label: "Work Information",
      content: (
        <EmployeeDetailSection
          title="Work Information"
          description="Current role assignment, department ownership, and payroll-related employment settings."
        >
          <EmployeeDetailGrid items={employee.workInformation} />
        </EmployeeDetailSection>
      ),
    },
    {
      id: "government-information",
      label: "Government Information",
      content: (
        <EmployeeDetailSection
          title="Government Information"
          description="Statutory records used for tax, social contributions, and payroll compliance."
        >
          <EmployeeDetailGrid items={employee.governmentInformation} />
        </EmployeeDetailSection>
      ),
    },
    {
      id: "salary-profile",
      label: "Salary Profile",
      content: (
        <EmployeeDetailSection
          title="Salary Profile"
          description="Compensation details and recurring amounts used during payroll preparation."
        >
          <div className="space-y-5">
            <EmployeeDetailGrid items={employee.salaryProfileSummary} columns="two" />

            <div className="rounded-[26px] border border-slate-200/80 bg-slate-50/80 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    Allowance Breakdown
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Recurring allowances currently attached to this employee&apos;s
                    salary profile.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                    Allowance subtotal
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {employee.salaryAllowanceTotal}
                  </p>
                </div>
              </div>

              {employee.salaryAllowanceItems.length > 0 ? (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {employee.salaryAllowanceItems.map((allowance) => (
                    <div
                      key={allowance.label}
                      className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4"
                    >
                      <DetailItem
                        label={allowance.label}
                        value={allowance.value}
                        valueClassName="font-medium text-slate-900"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-500">
                  No allowance amounts are currently assigned to this employee.
                </div>
              )}
            </div>
          </div>
        </EmployeeDetailSection>
      ),
    },
    {
      id: "payroll-rules",
      label: "Payroll Rules",
      content: (
        <EmployeeDetailSection
          title="Payroll Rules"
          description="Effective payroll behavior resolved from the employee's assigned policy profile and work arrangement type."
        >
          <div className="space-y-5">
            <EmployeeDetailGrid items={employee.payrollPolicySummary} columns="two" />

            {employee.payrollRulesErrorMessage ? (
              <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/80 px-4 py-4 text-sm leading-6 text-amber-900">
                {employee.payrollRulesErrorMessage}
              </div>
            ) : (
              <EmployeeDetailGrid items={employee.payrollRuleSummary} columns="two" />
            )}
          </div>
        </EmployeeDetailSection>
      ),
    },
    {
      id: "payroll-history",
      label: "Payroll History",
      content: (
        <EmployeeDetailSection
          title="Payroll History"
          description="Recent payroll runs and release summaries for this employee."
        >
          {employee.payrollHistory.length > 0 ? (
            <EmployeePayrollHistoryTable items={employee.payrollHistory} />
          ) : (
            <ResourceEmptyState
              title="No payroll history found"
              description="The backend returned no payroll runs linked to this employee yet."
            />
          )}
        </EmployeeDetailSection>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Profile"
        description="Review employee profile details, payroll setup, and recent payroll activity from a single internal record screen."
        eyebrow="Employees"
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href="/employees" className="ui-button-secondary gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Employees
            </Link>
            <Link href={`/employees/${id}/edit`} className="ui-button-primary gap-2">
              <PencilLine className="h-4 w-4" />
              Edit Employee
            </Link>
          </div>
        }
      />

      <section className="panel p-6 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-slate-900 text-lg font-semibold text-white shadow-sm shadow-slate-900/10">
              {getInitials(employee.fullName)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="truncate text-2xl font-semibold tracking-tight text-slate-950">
                  {employee.fullName}
                </h2>
                <EmployeeStatusBadge status={employee.status} />
              </div>
              <p className="mt-2 text-sm text-slate-500">Employee ID: {employee.id}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <HeaderMeta label="Department" value={employee.department} />
                <HeaderMeta label="Position" value={employee.position} />
                <HeaderMeta label="Employment Type" value={employee.employmentType} />
                <HeaderMeta
                  label="Payroll Schedule"
                  value={employee.payrollSchedule}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 sm:min-w-72">
            <DetailItem label="Email" value={employee.email} />
            <DetailItem label="Username" value={employee.username} />
          </div>
        </div>
      </section>

      <EmployeeDetailTabs tabs={tabs} />
    </div>
  );
}

function HeaderMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
      <DetailItem
        label={label}
        value={value}
        valueClassName="font-medium text-slate-900"
      />
    </div>
  );
}

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
