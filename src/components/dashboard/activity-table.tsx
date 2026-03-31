import { CheckCircle2, Clock3, FileSpreadsheet, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ActivityItem = {
  id: string;
  period: string;
  runType: string;
  processedOn: string;
  employees: string;
  amount: string;
  status: "Completed" | "In review" | "Scheduled";
};

type ActivityTableProps = {
  items: ActivityItem[];
};

const statusStyles: Record<ActivityItem["status"], string> = {
  Completed: "bg-emerald-50 text-emerald-700",
  "In review": "bg-amber-50 text-amber-700",
  Scheduled: "bg-blue-50 text-blue-700",
};

const statusIcons = {
  Completed: CheckCircle2,
  "In review": Clock3,
  Scheduled: PlayCircle,
} satisfies Record<ActivityItem["status"], typeof CheckCircle2>;

export function ActivityTable({ items }: ActivityTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <tr className="text-left">
            <th className="border-b border-slate-200/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Payroll run
            </th>
            <th className="border-b border-slate-200/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Processed
            </th>
            <th className="border-b border-slate-200/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Employees
            </th>
            <th className="border-b border-slate-200/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Gross pay
            </th>
            <th className="border-b border-slate-200/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const StatusIcon = statusIcons[item.status];

            return (
              <tr key={item.id} className="align-top">
                <td className="border-b border-slate-200/70 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.period}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{item.runType}</p>
                    </div>
                  </div>
                </td>
                <td className="border-b border-slate-200/70 px-4 py-4 text-sm text-slate-600">
                  {item.processedOn}
                </td>
                <td className="border-b border-slate-200/70 px-4 py-4 text-sm text-slate-600">
                  {item.employees}
                </td>
                <td className="border-b border-slate-200/70 px-4 py-4 text-sm font-medium text-slate-900">
                  {item.amount}
                </td>
                <td className="border-b border-slate-200/70 px-4 py-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                      statusStyles[item.status],
                    )}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {item.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

