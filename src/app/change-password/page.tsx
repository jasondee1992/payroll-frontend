import { Building2 } from "lucide-react";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { APP_NAME } from "@/config/branding";

export default function ChangePasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-slate-900/[0.04] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-blue-500/[0.06] blur-3xl" />
        <div className="absolute right-0 top-1/4 h-64 w-64 rounded-full bg-amber-500/[0.07] blur-3xl" />
      </div>

      <section className="relative z-10 w-full max-w-md">
        <div className="panel rounded-[28px] p-6 sm:p-8">
          <div className="flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/10">
              <Building2 className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {APP_NAME}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Change Your Password
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Finish this required step before opening the internal dashboard.
            </p>
          </div>

          <ChangePasswordForm />
        </div>
      </section>
    </main>
  );
}
