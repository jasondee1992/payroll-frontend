import { cn } from "@/lib/utils";

type DataTableShellProps = {
  children: React.ReactNode;
  className?: string;
};

type DataTableCellProps = {
  children: React.ReactNode;
  className?: string;
};

export function DataTableShell({
  children,
  className,
}: DataTableShellProps) {
  return <div className={cn("ui-table-shell", className)}>{children}</div>;
}

export function DataTableHeaderCell({
  children,
  className,
}: DataTableCellProps) {
  return <th className={cn("ui-table-head-cell", className)}>{children}</th>;
}

export function DataTableBodyCell({
  children,
  className,
}: DataTableCellProps) {
  return <td className={cn("ui-table-body-cell", className)}>{children}</td>;
}

type DataTableRowProps = {
  children: React.ReactNode;
  className?: string;
  selected?: boolean;
  expanded?: boolean;
  onClick?: () => void;
};

export function DataTableRow({
  children,
  className,
  selected = false,
  expanded = false,
  onClick,
}: DataTableRowProps) {
  return (
    <tr
      className={cn(
        "ui-table-row",
        selected && "ui-table-row-selected",
        expanded && "ui-table-row-expanded",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

