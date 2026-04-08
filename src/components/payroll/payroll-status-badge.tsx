import { cn } from "@/lib/utils";
import type { PayrollStatus } from "@/types/payroll";

const statusStyles: Record<PayrollStatus, string> = {
  Draft: "ui-badge-neutral",
  Open: "ui-badge-info",
  Processed: "ui-badge-success",
  Scheduled: "bg-violet-50 text-violet-700 ring-violet-200/80",
  Processing: "ui-badge-warning",
  Completed: "ui-badge-success",
  Closed: "ui-badge-neutral",
  Paid: "ui-badge-success",
  "Needs review": "ui-badge-warning",
  Calculated: "ui-badge-info",
  "Under Finance Review": "ui-badge-warning",
  Approved: "ui-badge-success",
  Posted: "bg-slate-900 text-white ring-slate-900/10",
  Locked: "ui-badge-neutral",
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
