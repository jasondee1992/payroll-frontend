import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  detail: string;
  trend: string;
  icon: LucideIcon;
  trendTone?: "neutral" | "positive" | "attention";
};

const trendToneStyles: Record<NonNullable<StatCardProps["trendTone"]>, string> = {
  neutral: "bg-slate-100 text-slate-700",
  positive: "bg-emerald-50 text-emerald-700",
  attention: "bg-amber-50 text-amber-700",
};

export function StatCard({
  title,
  value,
  detail,
  trend,
  icon: Icon,
  trendTone = "neutral",
}: StatCardProps) {
  return (
    <article className="panel p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm shadow-slate-900/10">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {value}
            </p>
          </div>
        </div>

        <span
          className={cn(
            "ui-badge shrink-0",
            trendToneStyles[trendTone],
          )}
        >
          {trend}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}
