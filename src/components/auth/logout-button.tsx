"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { performClientLogout } from "@/lib/auth/client-auth";

export function LogoutButton() {
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);

    try {
      await performClientLogout("/login");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">{isPending ? "Signing out..." : "Sign out"}</span>
    </button>
  );
}
