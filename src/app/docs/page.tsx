import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, LogIn, ShieldCheck } from "lucide-react";
import { DocsTableOfContents } from "@/components/docs/docs-table-of-contents";
import {
  DocsCardGrid,
  DocsDataTable,
  DocsFaqList,
  DocsNote,
  DocsParagraphBlock,
  DocsProcessFlow,
  DocsQuickFlowStrip,
  DocsSectionShell,
} from "@/components/docs/docs-primitives";
import { PageHeader } from "@/components/shared/page-header";
import { APP_NAME } from "@/config/branding";
import { getServerAuthSession } from "@/lib/auth/server-session";
import {
  payrollDocsHighlights,
  payrollDocsSections,
} from "@/lib/docs/payroll-docs-content";

const systemProcessSummary = [
  {
    title: "Set up employees",
    description:
      "Create employee records, salary profiles, work arrangement types, and payroll policy assignments before payroll begins.",
  },
  {
    title: "Review attendance inputs",
    description:
      "Load attendance logs, resolve missing entries, and process attendance correction requests inside the active cutoff.",
  },
  {
    title: "Apply approved requests",
    description:
      "Map approved leave and approved overtime to the cutoff so payroll uses only valid, reviewable records.",
  },
  {
    title: "Compute and release payroll",
    description:
      "Run payroll with effective policy rules, compute statutory deductions, review flagged records, and post final payslips.",
  },
];

export const metadata: Metadata = {
  title: `${APP_NAME} Docs`,
  description:
    "Public payroll system documentation covering employee setup, attendance, payroll policy logic, payroll processing, deductions, payslips, and roles.",
};

export const dynamic = "force-dynamic";

export default async function DocsPage() {
  const session = await getServerAuthSession();
  const primaryHref = session.isAuthenticated ? "/dashboard" : "/login";
  const primaryLabel = session.isAuthenticated ? "Open Dashboard" : "Sign In";
  const PrimaryIcon = session.isAuthenticated ? ArrowRight : LogIn;

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-slate-900/[0.04] blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-blue-500/[0.05] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-500/[0.05] blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <section className="panel p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/10">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {APP_NAME}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Public system documentation
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href={primaryHref} className="ui-button-primary gap-2">
                  <PrimaryIcon className="h-4 w-4" />
                  {primaryLabel}
                </Link>
              </div>
            </div>

            <PageHeader
              title="Payroll System Documentation"
              description="This guide explains how the payroll platform works from employee setup to attendance review, policy-driven payroll computation, government deductions, payslips, and role-based operational use."
              eyebrow="Reference Guide"
            />

            <div className="grid gap-4 lg:grid-cols-3">
              {payrollDocsHighlights.map((item) => (
                <article
                  key={item.label}
                  className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {item.value}
                  </p>
                </article>
              ))}
            </div>

            <div className="rounded-[28px] border border-slate-200/80 bg-slate-50/75 p-5 sm:p-6">
              <div className="border-b border-slate-200/70 pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  System Process Summary
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                  Quick read for stakeholders and operators
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  The payroll system follows a controlled operational chain:
                  employee setup, attendance review, request approval, payroll
                  computation, deduction application, record review, and final
                  payslip release.
                </p>
              </div>

              <div className="mt-5">
                <DocsQuickFlowStrip steps={systemProcessSummary} />
              </div>
            </div>

            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/80 px-5 py-4 text-sm leading-6 text-emerald-950">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                <p>
                  This page is intentionally public. It lives outside the
                  protected dashboard route group so visitors can read system
                  documentation without signing in.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <DocsTableOfContents sections={payrollDocsSections} />

          <div className="space-y-6">
            {payrollDocsSections.map((section) => (
              <DocsSectionShell key={section.id} section={section}>
                {section.paragraphs ? (
                  <DocsParagraphBlock paragraphs={section.paragraphs} />
                ) : null}
                {section.cards ? <DocsCardGrid cards={section.cards} /> : null}
                {section.steps ? <DocsProcessFlow steps={section.steps} /> : null}
                {section.table ? <DocsDataTable table={section.table} /> : null}
                {section.faqs ? <DocsFaqList items={section.faqs} /> : null}
                {section.note ? <DocsNote note={section.note} /> : null}
              </DocsSectionShell>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
