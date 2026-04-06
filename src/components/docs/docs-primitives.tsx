import Link from "next/link";
import type {
  DocsCard,
  DocsFaqItem,
  DocsSection,
  DocsStep,
  DocsTable,
} from "@/lib/docs/payroll-docs-content";

export function DocsSectionShell({
  section,
  children,
}: {
  section: DocsSection;
  children: React.ReactNode;
}) {
  return (
    <section
      id={section.id}
      className="panel scroll-mt-6 p-6 sm:p-8"
      aria-labelledby={`${section.id}-title`}
    >
      <div className="flex flex-col gap-4 border-b border-slate-200/70 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {section.eyebrow}
          </p>
          <h2
            id={`${section.id}-title`}
            className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[28px]"
          >
            {section.title}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            {section.summary}
          </p>
        </div>

        <Link
          href={`#${section.id}`}
          className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
        >
          #{section.id}
        </Link>
      </div>

      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

export function DocsParagraphBlock({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-sm leading-7 text-slate-600 sm:text-base">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export function DocsCardGrid({ cards }: { cards: DocsCard[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.title}
          className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-5 shadow-sm"
        >
          <h3 className="text-base font-semibold text-slate-950">{card.title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>

          {card.bullets && card.bullets.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
              {card.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export function DocsProcessFlow({ steps }: { steps: DocsStep[] }) {
  return (
    <div className="relative space-y-4">
      {steps.map((step, index) => (
        <div
          key={step.title}
          className="relative rounded-[24px] border border-slate-200/80 bg-white px-5 py-5 shadow-sm"
        >
          {index < steps.length - 1 ? (
            <div className="absolute left-10 top-14 hidden h-[calc(100%-1rem)] w-px bg-slate-200 sm:block" />
          ) : null}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
              {index + 1}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Step {index + 1}
              </p>
              <h3 className="text-base font-semibold text-slate-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DocsQuickFlowStrip({ steps }: { steps: DocsStep[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {steps.map((step, index) => (
        <article
          key={step.title}
          className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xs font-semibold text-white">
              {index + 1}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Quick view
              </p>
              <h3 className="text-sm font-semibold text-slate-950">{step.title}</h3>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
        </article>
      ))}
    </div>
  );
}

export function DocsDataTable({ table }: { table: DocsTable }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white">
      <div className="grid border-b border-slate-200/70 bg-slate-50/80 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 md:grid-cols-[240px_minmax(0,1fr)]">
        <div className="px-4 py-4">{table.columns[0]}</div>
        <div className="px-4 py-4">{table.columns[1]}</div>
      </div>

      {table.rows.map((row) => (
        <div
          key={row.label}
          className="grid border-b border-slate-200/60 last:border-b-0 md:grid-cols-[240px_minmax(0,1fr)]"
        >
          <div className="px-4 py-4 text-sm font-semibold text-slate-900">
            {row.label}
          </div>
          <div className="space-y-2 px-4 py-4 text-sm leading-6 text-slate-600">
            {row.values.map((value) => (
              <p key={value}>{value}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DocsFaqList({ items }: { items: DocsFaqItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article
          key={item.question}
          className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-5"
        >
          <h3 className="text-base font-semibold text-slate-950">{item.question}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
        </article>
      ))}
    </div>
  );
}

export function DocsNote({ note }: { note: string }) {
  return (
    <div className="rounded-[24px] border border-blue-200 bg-blue-50/70 px-5 py-4 text-sm leading-6 text-blue-950">
      <span className="font-semibold text-blue-900">Important:</span> {note}
    </div>
  );
}
