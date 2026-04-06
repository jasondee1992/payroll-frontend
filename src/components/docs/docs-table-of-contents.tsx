import Link from "next/link";
import type { DocsSection } from "@/lib/docs/payroll-docs-content";

export function DocsTableOfContents({
  sections,
}: {
  sections: Pick<DocsSection, "id" | "title" | "eyebrow">[];
}) {
  return (
    <div className="space-y-4">
      <nav
        aria-label="Documentation quick links"
        className="panel overflow-x-auto px-4 py-4 lg:hidden"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Quick jump
          </p>
          <span className="text-xs font-medium text-slate-400">
            {sections.length} sections
          </span>
        </div>

        <div className="flex gap-2 pb-1">
          {sections.map((section, index) => (
            <Link
              key={section.id}
              href={`#${section.id}`}
              className="shrink-0 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
            >
              {String(index + 1).padStart(2, "0")} {section.title}
            </Link>
          ))}
        </div>
      </nav>

      <nav
        aria-label="Documentation sections"
        className="panel hidden p-5 sm:p-6 lg:sticky lg:top-6 lg:block"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Table of contents
          </p>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {sections.length} sections
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Jump to any part of the payroll system guide.
        </p>

        <div className="mt-5 space-y-2">
          {sections.map((section, index) => (
            <Link
              key={section.id}
              href={`#${section.id}`}
              className="group block rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 transition hover:border-slate-300 hover:bg-white"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-xs font-semibold text-slate-400">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {section.eyebrow}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900 group-hover:text-slate-950">
                    {section.title}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
