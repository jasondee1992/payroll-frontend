import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

type PayrollModuleLinkCardProps = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  meta: string;
};

export function PayrollModuleLinkCard({
  title,
  description,
  href,
  icon: Icon,
  meta,
}: PayrollModuleLinkCardProps) {
  return (
    <Link
      href={href}
      className="panel group flex h-full flex-col justify-between p-6 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50/50"
    >
      <div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm shadow-slate-900/10">
          <Icon className="h-5 w-5" />
        </div>
        <p className="mt-5 text-lg font-semibold text-slate-950">{title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-500">{meta}</span>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
          Open
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

