import type { LucideIcon } from "lucide-react";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  badge?: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
  tone?: "warning" | "danger" | "info";
};

const iconToneClassNames = {
  warning: "bg-amber-50 text-amber-700 ring-amber-200/80",
  danger: "bg-rose-50 text-rose-700 ring-rose-200/80",
  info: "bg-sky-50 text-sky-700 ring-sky-200/80",
} as const;

export function AlertCard({
  eyebrow,
  title,
  description,
  badge,
  className,
  icon: Icon = TriangleAlert,
  tone = "warning",
}: AlertCardProps) {
  return (
    <article className={cn("ui-alert-card", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {eyebrow}
          </p>
          <div className="mt-2 flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1",
                iconToneClassNames[tone],
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-950">{title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          </div>
        </div>

        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>
    </article>
  );
}
