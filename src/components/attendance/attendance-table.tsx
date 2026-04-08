import { DetailItem } from "@/components/ui/detail-item";
import {
  DataTableBodyCell,
  DataTableHeaderCell,
  DataTableRow,
  DataTableShell,
} from "@/components/ui/data-table";
import type { AttendanceLog } from "@/types/attendance";

type AttendanceTableProps = {
  records: AttendanceLog[];
};

export function AttendanceTable({ records }: AttendanceTableProps) {
  return (
    <>
      <DataTableShell className="hidden xl:block">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-slate-50/80">
              <tr className="text-left">
                <DataTableHeaderCell>Employee ID</DataTableHeaderCell>
                <DataTableHeaderCell>Employee Name</DataTableHeaderCell>
                <DataTableHeaderCell>Work Date</DataTableHeaderCell>
                <DataTableHeaderCell>Time In</DataTableHeaderCell>
                <DataTableHeaderCell>Time Out</DataTableHeaderCell>
                <DataTableHeaderCell>Late Minutes</DataTableHeaderCell>
                <DataTableHeaderCell>Undertime Minutes</DataTableHeaderCell>
                <DataTableHeaderCell>Overtime Minutes</DataTableHeaderCell>
                <DataTableHeaderCell>Remarks</DataTableHeaderCell>
              </tr>
            </thead>
            <tbody className="bg-white">
              {records.map((record) => (
                <DataTableRow key={`${record.employeeId}-${record.workDate}`} className="align-top">
                  <DataTableBodyCell>{record.employeeId}</DataTableBodyCell>
                  <DataTableBodyCell>
                    <span className="font-medium text-slate-900">
                      {record.employeeName}
                    </span>
                  </DataTableBodyCell>
                  <DataTableBodyCell>{record.workDate}</DataTableBodyCell>
                  <DataTableBodyCell>{record.timeIn}</DataTableBodyCell>
                  <DataTableBodyCell>{record.timeOut}</DataTableBodyCell>
                  <DataTableBodyCell>{record.lateMinutes}</DataTableBodyCell>
                  <DataTableBodyCell>{record.undertimeMinutes}</DataTableBodyCell>
                  <DataTableBodyCell>{record.overtimeMinutes}</DataTableBodyCell>
                  <DataTableBodyCell>{record.remarks}</DataTableBodyCell>
                </DataTableRow>
              ))}
            </tbody>
          </table>
        </div>
      </DataTableShell>

      <div className="grid gap-3 xl:hidden">
        {records.map((record) => (
          <article
            key={`${record.employeeId}-${record.workDate}-card`}
            className="panel-subtle p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {record.employeeId}
                </p>
                <h3 className="mt-2 text-base font-semibold text-slate-950">
                  {record.employeeName}
                </h3>
                <p className="mt-1 text-sm text-slate-600">{record.workDate}</p>
              </div>
              <div className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {record.remarks}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DetailItem label="Time In" value={record.timeIn} />
              <DetailItem label="Time Out" value={record.timeOut} />
              <DetailItem label="Late Minutes" value={String(record.lateMinutes)} />
              <DetailItem
                label="Undertime Minutes"
                value={String(record.undertimeMinutes)}
              />
              <DetailItem
                label="Overtime Minutes"
                value={String(record.overtimeMinutes)}
              />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
