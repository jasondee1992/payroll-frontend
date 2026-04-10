import { cn } from "@/lib/utils";

type DetailItemProps = {
  label: string;
  value: React.ReactNode;
  helperText?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
};

export function DetailItem({
  label,
  value,
  helperText,
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
      {helperText ? (
        <span className="text-xs leading-5 text-slate-500">{helperText}</span>
      ) : null}
    </div>
  );
}

