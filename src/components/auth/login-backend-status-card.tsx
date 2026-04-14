"use client";

import { LoaderCircle, ShieldCheck } from "lucide-react";
import { useBackendStatus } from "@/lib/api/use-backend-status";

export function LoginBackendStatusCard() {
  const backendStatus = useBackendStatus();

  const heading = !backendStatus
    ? "Checking FastAPI backend"
    : backendStatus.available
      ? "FastAPI auth is connected"
      : "FastAPI backend is offline";

  const description = !backendStatus ? (
    "Checking whether the FastAPI backend is reachable."
  ) : backendStatus.available ? (
    <>
      This form now signs in through the local FastAPI backend. If you still
      need an account, create one from the backend Swagger UI at{" "}
      <code className="font-mono text-[13px]">/docs</code> using
      <code className="ml-1 font-mono text-[13px]">POST /api/v1/users</code>.
    </>
  ) : (
    backendStatus.message
  );

  return (
    <div className="mt-8 rounded-[24px] border border-slate-200/80 bg-linear-to-r from-slate-50/95 to-white px-4 py-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {!backendStatus ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : (
            <ShieldCheck className="h-5 w-5" />
          )}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-950">{heading}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}
