import { AlertTriangle, BellRing, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertItem = {
  title: string;
  description: string;
  tone: "warning" | "info" | "neutral";
};

type AlertsPanelProps = {
  items: AlertItem[];
};

const alertStyles = {
  warning: {
    icon: AlertTriangle,
    iconClass: "bg-amber-50 text-amber-700",
    borderClass: "border-amber-200/80 bg-amber-50/40",
  },
  info: {
    icon: BellRing,
    iconClass: "bg-blue-50 text-blue-700",
    borderClass: "border-blue-200/80 bg-blue-50/40",
  },
  neutral: {
    icon: CircleAlert,
    iconClass: "bg-slate-100 text-slate-700",
    borderClass: "border-slate-200/80 bg-slate-50/70",
  },
} satisfies Record<AlertItem["tone"], { icon: typeof AlertTriangle; iconClass: string; borderClass: string }>;

export function AlertsPanel({ items }: AlertsPanelProps) {
  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const tone = alertStyles[item.tone];
        const Icon = tone.icon;

        return (
          <div
            key={item.title}
            className={cn(
              "flex items-start gap-3 rounded-2xl border px-4 py-4",
              tone.borderClass,
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                tone.iconClass,
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

