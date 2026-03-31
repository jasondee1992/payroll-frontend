import { CalendarDays } from "lucide-react";

type DateItem = {
  label: string;
  date: string;
  note: string;
};

type DateListProps = {
  items: DateItem[];
};

export function DateList({ items }: DateListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.date}`}
          className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">{item.label}</p>
            <p className="mt-1 text-sm text-slate-600">{item.date}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{item.note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

