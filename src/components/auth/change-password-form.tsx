"use client";

import { ArrowRight, KeyRound, LoaderCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { AuthInput } from "@/components/auth/auth-input";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirmation do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const responseBody = (await response.json()) as {
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        setErrorMessage(responseBody.error ?? "Unable to update the password.");
        return;
      }

      setSuccessMessage("Password updated. Redirecting to the dashboard...");
      window.location.assign(responseBody.redirectTo ?? "/dashboard");
    } catch {
      setErrorMessage("Unable to reach the frontend auth bridge.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
        Your account is using a temporary password. Change it now before you can
        access the dashboard.
      </div>

      <AuthInput
        id="currentPassword"
        name="currentPassword"
        type="password"
        label="Current Password"
        placeholder="Enter the temporary password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
        disabled={isSubmitting}
        required
      />

      <AuthInput
        id="newPassword"
        name="newPassword"
        type="password"
        label="New Password"
        placeholder="Create a new password"
        autoComplete="new-password"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        disabled={isSubmitting}
        required
      />

      <AuthInput
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        label="Confirm New Password"
        placeholder="Repeat the new password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        disabled={isSubmitting}
        required
      />

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={
          isSubmitting ||
          currentPassword.trim().length === 0 ||
          newPassword.trim().length === 0 ||
          confirmPassword.trim().length === 0
        }
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/15 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
      >
        {isSubmitting ? "Updating Password..." : "Save New Password"}
        {isSubmitting ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4" />
        )}
      </button>

      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-4 text-sm leading-6 text-slate-600">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <KeyRound className="h-4 w-4" />
          </div>
          <p>
            Use a password that only you know. After this step, the temporary
            password will stop working.
          </p>
        </div>
      </div>
    </form>
  );
}
