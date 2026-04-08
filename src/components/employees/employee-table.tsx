"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Eye } from "lucide-react";
import { DetailItem } from "@/components/ui/detail-item";
import { ResourceEmptyState } from "@/components/shared/resource-state";
import {
  DataTableBodyCell,
  DataTableHeaderCell,
  DataTableRow,
  DataTableShell,
} from "@/components/ui/data-table";
import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import type { EmployeeListItem } from "@/types/employees";

type EmployeeTableProps = {
  employees: EmployeeListItem[];
  canManageEmployees?: boolean;
};

export function EmployeeTable({
  employees,
  canManageEmployees = false,
}: EmployeeTableProps) {
  const router = useRouter();

  if (employees.length === 0) {
    return <EmployeeEmptyState canManageEmployees={canManageEmployees} />;
  }

  return (
    <>
      <DataTableShell className="hidden xl:block">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-slate-50/80">
              <tr className="text-left">
                <DataTableHeaderCell>Employee ID</DataTableHeaderCell>
                <DataTableHeaderCell>Full Name</DataTableHeaderCell>
                <DataTableHeaderCell>Department</DataTableHeaderCell>
                <DataTableHeaderCell>Position</DataTableHeaderCell>
                <DataTableHeaderCell>Employment Type</DataTableHeaderCell>
                <DataTableHeaderCell>Payroll Schedule</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
                <DataTableHeaderCell>Actions</DataTableHeaderCell>
              </tr>
            </thead>
            <tbody className="bg-white">
              {employees.map((employee) => (
                <DataTableRow
                  key={employee.id}
                  onClick={() => router.push(`/employees/${employee.id}`)}
                >
                  <DataTableBodyCell>{employee.id}</DataTableBodyCell>
                  <DataTableBodyCell>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {employee.fullName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Payroll profile ready
                      </p>
                    </div>
                  </DataTableBodyCell>
                  <DataTableBodyCell>{employee.department}</DataTableBodyCell>
                  <DataTableBodyCell>{employee.position}</DataTableBodyCell>
                  <DataTableBodyCell>{employee.employmentType}</DataTableBodyCell>
                  <DataTableBodyCell>{employee.payrollSchedule}</DataTableBodyCell>
                  <DataTableBodyCell>
                    <EmployeeStatusBadge status={employee.status} />
                  </DataTableBodyCell>
                  <DataTableBodyCell className="align-middle">
                    <Link
                      href={`/employees/${employee.id}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                  </DataTableBodyCell>
                </DataTableRow>
              ))}
            </tbody>
          </table>
        </div>
      </DataTableShell>

      <div className="grid gap-3 xl:hidden">
        {employees.map((employee) => (
          <article
            key={employee.id}
            className="panel-subtle rounded-[24px] p-4 shadow-sm transition hover:border-slate-300"
          >
            <Link href={`/employees/${employee.id}`} className="block">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {employee.id}
                  </p>
                  <h2 className="mt-2 text-base font-semibold text-slate-950">
                    {employee.fullName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">{employee.position}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <DetailItem label="Department" value={employee.department} />
                <DetailItem label="Employment Type" value={employee.employmentType} />
                <DetailItem
                  label="Payroll Schedule"
                  value={employee.payrollSchedule}
                />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Status
                  </span>
                  <div>
                    <EmployeeStatusBadge status={employee.status} />
                  </div>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}

function EmployeeEmptyState({
  canManageEmployees,
}: {
  canManageEmployees: boolean;
}) {
  return (
    <ResourceEmptyState
      title="No employees found"
      description="When employee records are available, the directory table will appear here with search, filters, payroll metadata, and detail actions."
      action={
        canManageEmployees ? (
          <Link
            href="/employees/new"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add Employee
          </Link>
        ) : null
      }
    />
  );
}
