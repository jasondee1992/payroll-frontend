import { cn } from "@/lib/utils";
import type { PayrollStatus } from "@/types/payroll";

const statusStyles: Record<PayrollStatus, string> = {
  Draft: "bg-slate-100 text-slate-700",
  Open: "bg-blue-50 text-blue-700",
  Scheduled: "bg-violet-50 text-violet-700",
  Processing: "bg-amber-50 text-amber-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Closed: "bg-slate-200 text-slate-700",
  Paid: "bg-emerald-50 text-emerald-700",
  "Needs review": "bg-amber-50 text-amber-700",
};

type PayrollStatusBadgeProps = {
  status: PayrollStatus;
};

export function PayrollStatusBadge({ status }: PayrollStatusBadgeProps) {
  return (
    <span
      className={cn(
        "ui-badge",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}
