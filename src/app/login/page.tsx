import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { APP_SUBTITLE } from "@/config/branding";
import { LoginBackendStatusCard } from "@/components/auth/login-backend-status-card";
import { LoginForm } from "@/components/auth/login-form";
import { BrandMark } from "@/components/shared/brand-mark";
import { getBrandingResource, resolveBrandingAssetUrl } from "@/lib/api/branding";

export default async function LoginPage() {
  const brandingResult = await getBrandingResource();
  const companyLogoUrl = resolveBrandingAssetUrl(brandingResult.data.companyLogoPath);
  const loginBackgroundUrl = resolveBrandingAssetUrl(
    brandingResult.data.loginBackgroundPath,
  );

  return (
    <main className="ui-auth-shell relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div
        className={`pointer-events-none absolute inset-0 z-0 ${loginBackgroundUrl ? "ui-auth-pattern opacity-70" : "opacity-100"}`}
        style={
          loginBackgroundUrl
            ? {
                backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.86), rgba(15,23,42,0.52)), url(${loginBackgroundUrl})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }
            : {
                background:
                  "linear-gradient(135deg, rgba(17,43,78,0.96) 0%, rgba(11,31,58,1) 54%, rgba(8,26,50,1) 100%)",
              }
        }
      >
        {!loginBackgroundUrl ? (
          <>
            <div className="absolute inset-x-0 top-0 h-px bg-white/8" />
            <div className="absolute left-16 top-16 h-56 w-56 rounded-full bg-blue-500/[0.08] blur-3xl" />
            <div className="absolute bottom-16 right-16 h-56 w-56 rounded-full bg-slate-100/[0.04] blur-3xl" />
          </>
        ) : null}
      </div>

      <section className="relative z-10 w-full max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_minmax(24rem,0.8fr)]">
          <div className="hidden rounded-[36px] border border-white/12 bg-white/[0.06] p-8 text-white shadow-[0_30px_70px_-34px_rgba(8,26,50,0.7)] backdrop-blur-md lg:flex lg:flex-col">
            <div className="flex items-center justify-between">
              <BrandMark
                companyName={brandingResult.data.companyName}
                logoUrl={companyLogoUrl}
                subtitle={APP_SUBTITLE}
              />
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200">
                <Sparkles className="h-3.5 w-3.5" />
                Secure workspace
              </span>
            </div>

            <div className="mt-16 max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-200">
                Enterprise payroll platform
              </p>
              <h1 className="mt-4 text-5xl font-semibold tracking-tight">
                Secure payroll operations for HR, finance, and leadership teams.
              </h1>
              <p className="mt-5 text-base leading-8 text-slate-300">
                Access payroll, workforce records, approvals, and reporting from a workspace built for controlled internal operations.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <TrustCard
                icon={ShieldCheck}
                title="Protected access"
                description="Cookie-based session flow with guarded workspace routes."
              />
              <TrustCard
                icon={LockKeyhole}
                title="Controlled actions"
                description="Designed for payroll admins, HR teams, and finance operations."
              />
              <TrustCard
                icon={CheckCircle2}
                title="Operational clarity"
                description="Structured views for payroll cycle monitoring and workforce management."
              />
            </div>

            <div className="mt-auto rounded-[28px] border border-white/10 bg-black/10 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Workspace scope
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-white">Payroll and cutoff control</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Built for high-readability review, approval, and payroll publishing workflows.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Company-specific branding</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Identity, logo, and login presentation can be tuned without changing payroll logic.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="ui-auth-card relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-blue-50/90 to-transparent" />
            <div className="relative z-10">
              <div className="flex items-center justify-center lg:justify-start">
                <BrandMark
                  companyName={brandingResult.data.companyName}
                  logoUrl={companyLogoUrl}
                  compact
                  className="justify-center lg:justify-start"
                  textTone="dark"
                />
              </div>

              <div className="mt-8 text-center lg:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                  {brandingResult.data.companyName}
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[34px]">
                  Sign in to the payroll workspace
                </h1>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Secure access for {APP_SUBTITLE.toLowerCase()}, workforce administration, and finance review.
                </p>
              </div>

              <Suspense fallback={null}>
                <LoginForm />
              </Suspense>

              <LoginBackendStatusCard />

              <div className="mt-6 border-t border-slate-200/70 pt-5 text-center lg:text-left">
                <Link
                  href="/docs"
                  className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
                >
                  View public payroll system documentation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function TrustCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-blue-100">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  );
}
