import { ArrowRight } from "lucide-react";
import { AuthInput } from "@/components/auth/auth-input";

export function LoginForm() {
  return (
    <form className="mt-8 space-y-5">
      <AuthInput
        id="email"
        name="email"
        type="email"
        label="Work email"
        placeholder="name@company.com"
        autoComplete="email"
      />

      <AuthInput
        id="password"
        name="password"
        type="password"
        label="Password"
        placeholder="Enter your password"
        autoComplete="current-password"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex items-center gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 rounded border-slate-300 text-slate-900 transition focus:ring-2 focus:ring-slate-900/15"
          />
          <span>Remember me</span>
        </label>

        <a
          href="#"
          className="text-sm font-medium text-slate-700 transition hover:text-slate-950"
        >
          Forgot password?
        </a>
      </div>

      <button
        type="button"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/15 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
      >
        Sign in
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
