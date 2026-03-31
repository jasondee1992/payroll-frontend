import { Building2, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-slate-900/[0.04] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-blue-500/[0.06] blur-3xl" />
        <div className="absolute right-0 top-1/4 h-64 w-64 rounded-full bg-emerald-500/[0.05] blur-3xl" />
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
              Northstar Payroll
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Sign in to your workspace
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Secure access for payroll administrators, HR operations, and
              internal finance teams.
            </p>
          </div>

          <LoginForm />

          <div className="mt-8 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-950">
                  FastAPI auth is connected
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  This form now signs in through the local FastAPI backend. If
                  you still need an account, create one from the backend
                  Swagger UI at{" "}
                  <code className="font-mono text-[13px]">/docs</code> using
                  <code className="ml-1 font-mono text-[13px]">
                    POST /api/v1/users
                  </code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
