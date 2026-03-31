"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function PayrollRunForm() {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <form className="space-y-5">
      <FormSelect
        label="Payroll Period"
        defaultValue="April 2026 Monthly Payroll"
        options={[
          "April 2026 Monthly Payroll",
          "March 2026 Contractor Payout",
          "March 2026 Off-cycle Adjustments",
        ]}
      />

      <FormSelect
        label="Payroll Group"
        defaultValue="All Active Employees"
        options={[
          "All Active Employees",
          "Head Office Employees",
          "Contractors",
          "Operations Team",
        ]}
      />

      <label className="flex flex-col gap-2">
        <span className="ui-label">Notes</span>
        <textarea
          rows={5}
          placeholder="Add optional run notes for reviewers and approvers."
          className="ui-textarea"
        />
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={() => setAcknowledged((current) => !current)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900/15"
        />
        <span className="text-sm leading-6 text-slate-600">
          This run setup is ready for confirmation. Actual payroll execution is
          not wired in this frontend foundation.
        </span>
      </label>

      <button
        type="button"
        className={cn(
          "inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/15",
          acknowledged
            ? "bg-slate-900 text-white hover:bg-slate-800"
            : "cursor-not-allowed bg-slate-300 text-slate-500",
        )}
      >
        Run Payroll
      </button>
    </form>
  );
}

function FormSelect({
  label,
  options,
  defaultValue,
}: {
  label: string;
  options: string[];
  defaultValue: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="ui-label">{label}</span>
      <select
        defaultValue={defaultValue}
        className="ui-select"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
