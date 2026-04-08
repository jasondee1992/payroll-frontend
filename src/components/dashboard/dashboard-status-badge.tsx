import { cn } from "@/lib/utils";
import type { DashboardTone } from "@/types/dashboard";

const toneClassNames: Record<DashboardTone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  info: "bg-blue-50 text-blue-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-rose-50 text-rose-700",
  strong: "bg-slate-900 text-white",
};

type DashboardStatusBadgeProps = {
  label: string;
  tone: DashboardTone;
  className?: string;
};

export function DashboardStatusBadge({
  label,
  tone,
  className,
}: DashboardStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
        toneClassNames[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
