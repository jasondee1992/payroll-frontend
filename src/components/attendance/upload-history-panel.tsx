import { CheckCircle2, Clock3, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

type UploadHistoryItem = {
  fileName: string;
  period: string;
  uploadedBy: string;
  uploadedAt: string;
  records: string;
  status: "Imported" | "Validated" | "Needs review";
};

type UploadHistoryPanelProps = {
  items: UploadHistoryItem[];
};

const statusStyles: Record<UploadHistoryItem["status"], string> = {
  Imported: "bg-emerald-50 text-emerald-700",
  Validated: "bg-blue-50 text-blue-700",
  "Needs review": "bg-amber-50 text-amber-700",
};

const statusIcons = {
  Imported: CheckCircle2,
  Validated: Clock3,
  "Needs review": FileSpreadsheet,
} satisfies Record<UploadHistoryItem["status"], typeof CheckCircle2>;

export function UploadHistoryPanel({ items }: UploadHistoryPanelProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const StatusIcon = statusIcons[item.status];

        return (
          <div
            key={`${item.fileName}-${item.uploadedAt}`}
            className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">
                  {item.fileName}
                </p>
                <p className="mt-1 text-sm text-slate-500">{item.period}</p>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                  statusStyles[item.status],
                )}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {item.status}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <HistoryMeta label="Uploaded By" value={item.uploadedBy} />
              <HistoryMeta label="Uploaded At" value={item.uploadedAt} />
              <HistoryMeta label="Records" value={item.records} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HistoryMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-700">{value}</p>
    </div>
  );
}
