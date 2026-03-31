import { cn } from "@/lib/utils";
import type { EmployeeStatus } from "@/types/employees";

const statusStyles: Record<EmployeeStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700",
  "On Leave": "bg-amber-50 text-amber-700",
  Pending: "bg-blue-50 text-blue-700",
  Inactive: "bg-slate-100 text-slate-700",
};

type EmployeeStatusBadgeProps = {
  status: EmployeeStatus;
};

export function EmployeeStatusBadge({
  status,
}: EmployeeStatusBadgeProps) {
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
