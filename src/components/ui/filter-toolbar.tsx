import { cn } from "@/lib/utils";

type FilterToolbarProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function FilterToolbar({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: FilterToolbarProps) {
  return (
    <section className={cn("ui-filter-toolbar", className)}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {eyebrow}
          </p>
          <p className="mt-2 text-[14px] font-semibold tracking-tight text-slate-950">
            {title}
          </p>
          <p className="mt-1 text-[12px] leading-5 text-slate-500">{description}</p>
        </div>

        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      {children}
    </section>
  );
}
