import { cn } from "@/lib/utils";

type DetailItemProps = {
  label: string;
  value: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
};

export function DetailItem({
  label,
  value,
  className,
  labelClassName,
  valueClassName,
}: DetailItemProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500",
          labelClassName,
        )}
      >
        {label}
      </span>
      <span className={cn("text-sm text-slate-700", valueClassName)}>{value}</span>
    </div>
  );
}

