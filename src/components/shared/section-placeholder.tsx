import { ArrowRight } from "lucide-react";
import { PageIntro } from "@/components/shared/page-intro";

type SectionPlaceholderProps = {
  title: string;
  description: string;
  bullets: string[];
};

export function SectionPlaceholder({
  title,
  description,
  bullets,
}: SectionPlaceholderProps) {
  return (
    <>
      <PageIntro title={title} description={description} />

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="panel p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Module foundation
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Placeholder route ready for feature-specific UI composition.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Frontend only
            </span>
          </div>

          <div className="mt-6 grid gap-3">
            {bullets.map((bullet) => (
              <div
                key={bullet}
                className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4"
              >
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <p className="text-sm leading-6 text-slate-700">{bullet}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="panel-muted p-6 sm:p-7">
          <h2 className="text-lg font-semibold text-slate-950">Next steps</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Each section can now be expanded with forms, tables, filters, and
            workflow states without changing the shared application shell.
          </p>

          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4">
              Add reusable data table and filter patterns when the domain models
              are ready.
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4">
              Introduce form modules and validation flows after backend
              contracts are defined.
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}

