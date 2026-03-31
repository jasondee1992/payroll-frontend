import Link from "next/link";
import { ArrowLeft, PencilLine } from "lucide-react";
import { EmployeeDetailGrid } from "@/components/employees/employee-detail-grid";
import { EmployeeDetailSection } from "@/components/employees/employee-detail-section";
import { EmployeeDetailTabs } from "@/components/employees/employee-detail-tabs";
import { EmployeePayrollHistoryTable } from "@/components/employees/employee-payroll-history-table";
import {
  EmployeeStatusBadge,
  type EmployeeStatus,
} from "@/components/employees/employee-status-badge";

type EmployeeDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type EmployeeProfile = {
  id: string;
  fullName: string;
  department: string;
  position: string;
  status: EmployeeStatus;
  employmentType: string;
  payrollSchedule: string;
  email: string;
  username: string;
  basicInformation: Array<{ label: string; value: string }>;
  workInformation: Array<{ label: string; value: string }>;
  governmentInformation: Array<{ label: string; value: string }>;
  salaryProfile: Array<{ label: string; value: string }>;
  payrollHistory: Array<{
    period: string;
    runDate: string;
    grossPay: string;
    netPay: string;
    status: string;
  }>;
};

export default async function EmployeeDetailPage({
  params,
}: EmployeeDetailPageProps) {
  const { id } = await params;
  const employee = getEmployeeProfile(id);

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
          <EmployeeDetailGrid items={employee.salaryProfile} columns="two" />
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
          <EmployeePayrollHistoryTable items={employee.payrollHistory} />
        </EmployeeDetailSection>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Employees
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Employee Profile
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Review employee profile details, payroll setup, and recent payroll
            activity from a single internal record screen.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/employees"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Employees
          </Link>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/15"
          >
            <PencilLine className="h-4 w-4" />
            Edit Employee
          </button>
        </div>
      </section>

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
            <QuickInfo label="Email" value={employee.email} />
            <QuickInfo label="Username" value={employee.username} />
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
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function QuickInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-700">{value}</p>
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

function getEmployeeProfile(id: string): EmployeeProfile {
  const profiles: Record<string, EmployeeProfile> = {
    "EMP-1001": {
      id: "EMP-1001",
      fullName: "Olivia Bennett",
      department: "Finance",
      position: "Payroll Specialist",
      status: "Active",
      employmentType: "Full-time",
      payrollSchedule: "Monthly",
      email: "olivia.bennett@northstarpayroll.com",
      username: "olivia.bennett",
      basicInformation: [
        { label: "First Name", value: "Olivia" },
        { label: "Middle Name", value: "Grace" },
        { label: "Last Name", value: "Bennett" },
        { label: "Birth Date", value: "June 18, 1991" },
        { label: "Hire Date", value: "January 8, 2021" },
        { label: "Suffix", value: "None" },
      ],
      workInformation: [
        { label: "Department", value: "Finance" },
        { label: "Position", value: "Payroll Specialist" },
        { label: "Employment Type", value: "Full-time" },
        { label: "Employment Status", value: "Active" },
        { label: "Payroll Schedule", value: "Monthly" },
        { label: "Work Location", value: "Manila HQ" },
      ],
      governmentInformation: [
        { label: "TIN", value: "123-456-789-000" },
        { label: "SSS Number", value: "34-5678901-2" },
        { label: "PhilHealth Number", value: "12-345678901-2" },
        { label: "Pag-IBIG Number", value: "1234-5678-9012" },
        { label: "Tax Status", value: "Single" },
        { label: "Withholding Setup", value: "Standard monthly withholding" },
      ],
      salaryProfile: [
        { label: "Basic Salary", value: "PHP 48,000.00" },
        { label: "Rate Type", value: "Monthly" },
        { label: "Allowance", value: "PHP 3,500.00" },
        { label: "Bank Account", value: "Metrobank ending in 2481" },
      ],
      payrollHistory: [
        {
          period: "March 2026",
          runDate: "March 15, 2026",
          grossPay: "PHP 51,500.00",
          netPay: "PHP 44,230.00",
          status: "Paid",
        },
        {
          period: "February 2026",
          runDate: "February 15, 2026",
          grossPay: "PHP 51,500.00",
          netPay: "PHP 44,180.00",
          status: "Paid",
        },
        {
          period: "January 2026",
          runDate: "January 15, 2026",
          grossPay: "PHP 51,500.00",
          netPay: "PHP 44,160.00",
          status: "Paid",
        },
      ],
    },
  };

  return (
    profiles[id] ?? {
      id,
      fullName: "Jordan Lee",
      department: "Operations",
      position: "Workforce Coordinator",
      status: "Pending",
      employmentType: "Full-time",
      payrollSchedule: "Bi-weekly",
      email: "jordan.lee@northstarpayroll.com",
      username: "jordan.lee",
      basicInformation: [
        { label: "First Name", value: "Jordan" },
        { label: "Middle Name", value: "A." },
        { label: "Last Name", value: "Lee" },
        { label: "Birth Date", value: "September 2, 1994" },
        { label: "Hire Date", value: "March 30, 2026" },
        { label: "Suffix", value: "None" },
      ],
      workInformation: [
        { label: "Department", value: "Operations" },
        { label: "Position", value: "Workforce Coordinator" },
        { label: "Employment Type", value: "Full-time" },
        { label: "Employment Status", value: "Pending" },
        { label: "Payroll Schedule", value: "Bi-weekly" },
        { label: "Work Location", value: "Cebu Operations Center" },
      ],
      governmentInformation: [
        { label: "TIN", value: "Pending setup" },
        { label: "SSS Number", value: "Pending setup" },
        { label: "PhilHealth Number", value: "Pending setup" },
        { label: "Pag-IBIG Number", value: "Pending setup" },
        { label: "Tax Status", value: "Single" },
        { label: "Withholding Setup", value: "For review during onboarding" },
      ],
      salaryProfile: [
        { label: "Basic Salary", value: "PHP 32,000.00" },
        { label: "Rate Type", value: "Bi-weekly" },
        { label: "Allowance", value: "PHP 1,500.00" },
        { label: "Bank Account", value: "To be enrolled" },
      ],
      payrollHistory: [
        {
          period: "April 2026",
          runDate: "Scheduled for April 5, 2026",
          grossPay: "PHP 33,500.00",
          netPay: "Pending release",
          status: "Scheduled",
        },
      ],
    }
  );
}
