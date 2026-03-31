import type { LucideIcon } from "lucide-react";

type ReportTypeCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  meta: string;
};

export function ReportTypeCard({
  title,
  description,
  icon: Icon,
  meta,
}: ReportTypeCardProps) {
  return (
    <button
      type="button"
      className="panel flex h-full flex-col items-start p-6 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50/50"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm shadow-slate-900/10">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <span className="mt-5 text-sm font-medium text-slate-500">{meta}</span>
    </button>
  );
}

