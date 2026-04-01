"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type PayrollRunFormProps = {
  periodOptions: string[];
  defaultPeriod?: string;
  disabled?: boolean;
};

export function PayrollRunForm({
  periodOptions,
  defaultPeriod,
  disabled = false,
}: PayrollRunFormProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const selectedPeriod = defaultPeriod ?? periodOptions[0] ?? "";

  return (
    <form className="space-y-5">
      <FormSelect
        label="Payroll Period"
        defaultValue={selectedPeriod}
        options={periodOptions}
        disabled={periodOptions.length === 0}
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
          This run setup is based on live payroll-period data. Batch payroll
          execution still needs a backend contract beyond the current
          single-employee process endpoint.
        </span>
      </label>

      <button
        type="button"
        className={cn(
          "inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/15",
          acknowledged && !disabled && periodOptions.length > 0
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
  disabled = false,
}: {
  label: string;
  options: string[];
  defaultValue: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="ui-label">{label}</span>
      <select
        defaultValue={defaultValue}
        disabled={disabled}
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
