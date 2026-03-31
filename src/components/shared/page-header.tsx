type PageHeaderProps = {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  eyebrow = "Payroll management",
  actions,
}: PageHeaderProps) {
  return (
    <section className="flex flex-col gap-4 border-b border-slate-200/70 pb-5 sm:pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          {eyebrow}
        </p>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[32px]">
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            {description}
          </p>
        </div>
      </div>

      {actions ? <div className="shrink-0 self-start lg:self-auto">{actions}</div> : null}
    </section>
  );
}
