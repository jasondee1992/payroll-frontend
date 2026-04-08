import { cn } from "@/lib/utils";

type SectionCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  descriptionClassName?: string;
  contentClassName?: string;
};

export function SectionCard({
  title,
  description,
  children,
  action,
  className,
  headerClassName,
  descriptionClassName,
  contentClassName,
}: SectionCardProps) {
  return (
    <section className={cn("panel-strong p-6 sm:p-7", className)}>
      <div
        className={cn(
          "ui-section-header flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
          headerClassName,
        )}
      >
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
          <p
            className={cn(
              "mt-1 max-w-3xl text-sm leading-6 text-slate-600",
              descriptionClassName,
            )}
          >
            {description}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className={cn("mt-6", contentClassName)}>{children}</div>
    </section>
  );
}
