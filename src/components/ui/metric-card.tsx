import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricCardTone = "default" | "primary" | "dark" | "success" | "warning";

type MetricCardProps = {
  eyebrow: string;
  value: string;
  description?: string;
  icon?: LucideIcon;
  tone?: MetricCardTone;
  className?: string;
  footer?: React.ReactNode;
};

const toneClassNames: Record<MetricCardTone, string> = {
  default: "ui-kpi-card",
  primary: "ui-kpi-card-primary",
  dark: "ui-kpi-card-dark",
  success: "ui-kpi-card-soft border-emerald-200/80 bg-linear-to-br from-white via-emerald-50/35 to-white",
  warning: "ui-kpi-card-soft border-amber-200/80 bg-linear-to-br from-white via-amber-50/35 to-white",
};

const iconToneClassNames: Record<MetricCardTone, string> = {
  default: "bg-white text-slate-700",
  primary: "bg-slate-900 text-white",
  dark: "border-white/10 bg-white/10 text-white",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
};

export function MetricCard({
  eyebrow,
  value,
  description,
  icon: Icon,
  tone = "default",
  className,
  footer,
}: MetricCardProps) {
  const dark = tone === "dark";

  return (
    <article className={cn(toneClassNames[tone], className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.18em]",
              dark ? "text-slate-300" : "text-slate-500",
            )}
          >
            {eyebrow}
          </p>
          <p
            className={cn(
              "mt-3 font-semibold tracking-tight",
              dark ? "text-white" : "text-slate-950",
              tone === "primary" || dark ? "text-[30px]" : "text-2xl",
            )}
          >
            {value}
          </p>
          {description ? (
            <p
              className={cn(
                "mt-2 text-sm leading-6",
                dark ? "text-slate-300" : "text-slate-600",
              )}
            >
              {description}
            </p>
          ) : null}
        </div>

        {Icon ? (
          <div className={cn("ui-kpi-icon shrink-0 p-3", iconToneClassNames[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </article>
  );
}
