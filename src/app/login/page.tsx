import Link from "next/link";
import { Suspense } from "react";
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
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={
          loginBackgroundUrl
            ? {
                backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.86), rgba(15,23,42,0.52)), url(${loginBackgroundUrl})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }
            : undefined
        }
      >
        {!loginBackgroundUrl ? (
          <>
            <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-slate-900/[0.04] blur-3xl" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-blue-500/[0.06] blur-3xl" />
            <div className="absolute right-0 top-1/4 h-64 w-64 rounded-full bg-emerald-500/[0.05] blur-3xl" />
          </>
        ) : null}
      </div>

      <section className="relative z-10 w-full max-w-md">
        <div className="panel rounded-[28px] p-6 sm:p-8">
          <div className="flex items-center justify-center">
            <BrandMark
              companyName={brandingResult.data.companyName}
              logoUrl={companyLogoUrl}
              compact
              className="justify-center"
              textTone="dark"
            />
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {brandingResult.data.companyName}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Sign in to your workspace
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Secure access for {APP_SUBTITLE.toLowerCase()}, HR operations, and
              internal finance teams.
            </p>
          </div>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>

          <LoginBackendStatusCard />

          <div className="mt-6 border-t border-slate-200/70 pt-5 text-center">
            <Link
              href="/docs"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              View public payroll system documentation
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
