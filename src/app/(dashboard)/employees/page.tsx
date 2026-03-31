import Link from "next/link";
import { EmployeeListToolbar } from "@/components/employees/employee-list-toolbar";
import { EmployeePagination } from "@/components/employees/employee-pagination";
import { EmployeeTable } from "@/components/employees/employee-table";
import { PageHeader } from "@/components/shared/page-header";

const employees = [
  {
    id: "EMP-1001",
    fullName: "Olivia Bennett",
    department: "Finance",
    position: "Payroll Specialist",
    employmentType: "Full-time",
    payrollSchedule: "Monthly",
    status: "Active" as const,
  },
  {
    id: "EMP-1008",
    fullName: "Marcus Rivera",
    department: "Operations",
    position: "Attendance Coordinator",
    employmentType: "Full-time",
    payrollSchedule: "Bi-weekly",
    status: "Active" as const,
  },
  {
    id: "EMP-1015",
    fullName: "Sophia Turner",
    department: "Human Resources",
    position: "HR Business Partner",
    employmentType: "Full-time",
    payrollSchedule: "Monthly",
    status: "On Leave" as const,
  },
  {
    id: "EMP-1022",
    fullName: "Daniel Kim",
    department: "Engineering",
    position: "Frontend Engineer",
    employmentType: "Contract",
    payrollSchedule: "Bi-weekly",
    status: "Active" as const,
  },
  {
    id: "EMP-1031",
    fullName: "Priya Shah",
    department: "Customer Support",
    position: "Support Manager",
    employmentType: "Full-time",
    payrollSchedule: "Monthly",
    status: "Pending" as const,
  },
  {
    id: "EMP-1044",
    fullName: "Ethan Walker",
    department: "Sales",
    position: "Account Executive",
    employmentType: "Part-time",
    payrollSchedule: "Monthly",
    status: "Active" as const,
  },
  {
    id: "EMP-1056",
    fullName: "Ava Collins",
    department: "Compliance",
    position: "Compliance Analyst",
    employmentType: "Full-time",
    payrollSchedule: "Monthly",
    status: "Inactive" as const,
  },
];

export default function EmployeesPage() {
  return (
    <>
      <PageHeader
        title="Employees"
        description="Manage employee records, payroll assignments, and workforce status from a central directory."
        actions={
          <Link
            href="/employees/new"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/15"
          >
            Add Employee
          </Link>
        }
      />

      <section className="panel p-5 sm:p-6">
        <EmployeeListToolbar />

        <div className="mt-6">
          <EmployeeTable employees={employees} />
        </div>

        <div className="mt-6">
          <EmployeePagination
            currentPage={1}
            totalPages={8}
            pageSize={10}
            totalItems={76}
          />
        </div>
      </section>
    </>
  );
}
