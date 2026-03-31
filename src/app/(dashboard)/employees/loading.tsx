import { PageHeader } from "@/components/shared/page-header";

export default function EmployeesLoadingPage() {
  return (
    <>
      <PageHeader
        title="Employees"
        description="Manage employee records, payroll assignments, and workforce status from a central directory."
      />

      <section className="panel p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      </section>
    </>
  );
}
