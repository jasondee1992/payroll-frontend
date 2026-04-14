import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardValueRecord } from "@/types/dashboard";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";

type DashboardValueGridProps = {
  items: DashboardValueRecord[];
  compact?: boolean;
  variant?: "summary" | "section";
};

export function DashboardValueGrid({
  items,
  compact = false,
  variant = "section",
}: DashboardValueGridProps) {
  return (
    <div
      className={cn(
        "grid gap-3",
        variant === "summary"
          ? "md:grid-cols-2 xl:grid-cols-4"
          : compact
            ? "md:grid-cols-2 xl:grid-cols-3"
            : "md:grid-cols-2 xl:grid-cols-3",
      )}
    >
      {items.map((item, index) => {
        const isSummaryHero = variant === "summary" && index === 0;

        return (
          <article
            key={item.key}
            data-tone={item.tone}
            className={cn(
              "rounded-[24px] border border-slate-200/80",
              variant === "summary"
                ? "bg-white px-5 py-5 shadow-sm"
                : "bg-slate-50/70",
              compact ? "px-4 py-4" : "px-5 py-5",
              isSummaryHero && "ui-hero-card border-0 px-6 py-6 md:col-span-2 xl:col-span-2",
              variant === "summary" &&
                !isSummaryHero &&
                item.tone !== "neutral" &&
                summaryAccentClassNames[item.tone],
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-[0.18em]",
                  isSummaryHero || (variant === "summary" && item.tone === "strong")
                    ? "text-slate-300"
                    : "text-slate-500",
                )}
              >
                {item.label}
              </p>
              {item.tone !== "neutral" ? (
                <DashboardStatusBadge
                  label={toneLabelMap[item.tone]}
                  tone={item.tone}
                />
              ) : null}
            </div>

            <p
              className={cn(
                "mt-3 font-semibold tracking-tight",
                isSummaryHero || (variant === "summary" && item.tone === "strong")
                  ? "text-white"
                  : "text-slate-950",
                variant === "summary"
                  ? isSummaryHero
                    ? "text-[34px] sm:text-[40px]"
                    : "text-[28px] sm:text-[30px]"
                  : compact
                    ? "text-xl"
                    : "text-2xl",
              )}
            >
              {formatDashboardValue(item)}
            </p>

            {item.context ? (
              <p
                className={cn(
                  "mt-2 text-sm leading-6",
                  isSummaryHero || (variant === "summary" && item.tone === "strong")
                    ? "text-slate-300"
                    : "text-slate-500",
                  variant === "summary" && "max-w-[24rem]",
                )}
              >
                {item.context}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

const toneLabelMap = {
  info: "Info",
  success: "On track",
  warning: "Attention",
  danger: "Blocked",
  strong: "Current",
} as const;

const summaryAccentClassNames = {
  info: "border-blue-200/80 bg-linear-to-br from-white via-blue-50/40 to-white",
  success:
    "border-emerald-200/80 bg-linear-to-br from-white via-emerald-50/35 to-white",
  warning:
    "border-amber-200/80 bg-linear-to-br from-white via-amber-50/40 to-white",
  danger: "border-rose-200/80 bg-linear-to-br from-white via-rose-50/35 to-white",
  strong: "border-slate-900/10 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white",
} as const;

export function formatDashboardValue(item: DashboardValueRecord) {
  if (!item.value) {
    return "Unavailable";
  }

  if (item.value_type === "currency") {
    return formatCurrency(item.value);
  }

  if (item.value_type === "count") {
    return new Intl.NumberFormat("en-US").format(Number(item.value));
  }

  if (item.value_type === "date") {
    return formatDate(item.value);
  }

  if (item.value_type === "datetime") {
    return formatDateTime(item.value);
  }

  return item.value;
}
