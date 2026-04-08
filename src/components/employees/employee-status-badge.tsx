import { cn } from "@/lib/utils";
import type { EmployeeStatus } from "@/types/employees";

const statusStyles: Record<EmployeeStatus, string> = {
  Active: "ui-badge-success",
  "On Leave": "ui-badge-warning",
  Pending: "ui-badge-info",
  Inactive: "ui-badge-neutral",
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
