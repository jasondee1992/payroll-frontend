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
              Loading page data
            </div>
            <p className="max-w-2xl text-sm text-slate-600">
              The page opened successfully. Cards and tables are still loading.
            </p>
          </div>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
            Please wait
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="panel h-36 animate-pulse bg-slate-100"
          />
        ))}
      </section>

      <section className="panel p-5 sm:p-6">
        <ResourceTableSkeleton filterCount={3} rowCount={5} />
      </section>
    </div>
  );
}
