import { cn } from "@/lib/utils";

type ResourceStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

type ResourceTableSkeletonProps = {
  filterCount?: number;
  rowCount?: number;
  className?: string;
};

export function ResourceEmptyState({
  title,
  description,
  action,
  className,
}: ResourceStateProps) {
  return (
    <div className={cn("ui-empty-state", className)}>
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ResourceErrorState({
  title,
  description,
  action,
  className,
}: ResourceStateProps) {
  return (
    <div className={cn("ui-empty-state", className)}>
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ResourceTableSkeleton({
  filterCount = 4,
  rowCount = 6,
  className,
}: ResourceTableSkeletonProps) {
  return (
    <div className={cn(className)}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]">
        {Array.from({ length: filterCount }).map((_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {Array.from({ length: rowCount }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>
    </div>
  );
}
