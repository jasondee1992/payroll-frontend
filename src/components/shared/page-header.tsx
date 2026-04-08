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
    <section className="ui-page-header flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-3">
        <p className="ui-section-eyebrow">
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

      {actions ? (
        <div className="ui-action-bar shrink-0 self-start lg:min-w-[16rem] lg:self-auto">
          {actions}
        </div>
      ) : null}
    </section>
  );
}
