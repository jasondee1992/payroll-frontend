import { LoaderCircle } from "lucide-react";
import { ResourceTableSkeleton } from "@/components/shared/resource-state";

export default function DashboardSegmentLoading() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <LoaderCircle className="h-4 w-4 animate-spin text-blue-600" />
              Loading dashboard snapshot
            </div>
            <p className="max-w-2xl text-sm text-slate-600">
              Building the current operational view now. Summary cards, pending actions, and recent activity will populate as soon as the live snapshot is ready.
            </p>
          </div>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
            Live data
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="panel h-36 animate-pulse bg-slate-100"
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
        <section className="panel p-5 sm:p-6">
          <ResourceTableSkeleton filterCount={3} rowCount={4} />
        </section>
        <section className="panel p-5 sm:p-6">
          <ResourceTableSkeleton filterCount={2} rowCount={4} />
        </section>
      </section>
    </div>
  );
}
