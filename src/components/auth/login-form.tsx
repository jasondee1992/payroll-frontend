"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthInput } from "@/components/auth/auth-input";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usernameOrEmail,
          password,
          remember,
          redirectTo: searchParams.get("next"),
        }),
      });

      const responseBody = (await response.json()) as {
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        setErrorMessage(responseBody.error ?? "Unable to sign in.");
        return;
      }

      window.location.assign(responseBody.redirectTo ?? "/dashboard");
    } catch {
      setErrorMessage("Unable to reach the frontend auth bridge.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <AuthInput
        id="usernameOrEmail"
        name="usernameOrEmail"
        type="text"
        label="Username or email"
        placeholder="name@company.com or payroll.admin"
        autoComplete="username"
        value={usernameOrEmail}
        onChange={(event) => setUsernameOrEmail(event.target.value)}
        disabled={isSubmitting}
        required
      />

      <AuthInput
        id="password"
        name="password"
        type="password"
        label="Password"
        placeholder="Enter your password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        disabled={isSubmitting}
        required
      />

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-[22px] border border-slate-200/80 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex items-center gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            name="remember"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            disabled={isSubmitting}
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
        type="submit"
        disabled={
          isSubmitting ||
          usernameOrEmail.trim().length === 0 ||
          password.trim().length === 0
        }
        className="ui-button-primary inline-flex h-12 w-full items-center justify-center gap-2 px-4"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
        {isSubmitting ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4" />
        )}
      </button>
    </form>
  );
}
