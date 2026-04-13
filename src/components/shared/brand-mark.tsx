import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  companyName: string;
  logoUrl?: string | null;
  subtitle?: string | null;
  compact?: boolean;
  className?: string;
  textTone?: "light" | "dark";
};

export function BrandMark({
  companyName,
  logoUrl = null,
  subtitle = null,
  compact = false,
  className,
  textTone = "light",
}: BrandMarkProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
          textTone === "dark"
            ? "bg-slate-100 ring-1 ring-slate-200"
            : "bg-white/8 ring-1 ring-white/10",
        )}
      >
        {logoUrl ? (
          <div
            className="h-8 w-8 rounded-xl bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${logoUrl})` }}
            aria-hidden="true"
          />
        ) : (
          <Building2
            className={cn(
              "h-5 w-5",
              textTone === "dark" ? "text-slate-900" : "text-white",
            )}
          />
        )}
      </div>
      {!compact ? (
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-sm font-semibold",
              textTone === "dark" ? "text-slate-950" : "text-white",
            )}
          >
            {companyName}
          </p>
          {subtitle ? (
            <p
              className={cn(
                "truncate text-xs",
                textTone === "dark" ? "text-slate-500" : "text-slate-400",
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
