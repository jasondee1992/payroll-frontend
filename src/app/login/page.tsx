import { Suspense } from "react";
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

      <section className="relative z-10 w-full max-w-xl">
        <div className="ui-auth-card relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-blue-50/90 to-transparent" />
            <div className="relative z-10">
              <div className="flex items-center justify-center">
                <BrandMark
                  companyName={brandingResult.data.companyName}
                  logoUrl={companyLogoUrl}
                  compact
                  className="justify-center"
                  textTone="dark"
                />
              </div>

              <div className="mt-8 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                  {brandingResult.data.companyName}
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[34px]">
                  Sign in to the payroll workspace
                </h1>
              </div>

              <Suspense fallback={null}>
                <LoginForm />
              </Suspense>

              <LoginBackendStatusCard />
            </div>
        </div>
      </section>
    </main>
  );
}
