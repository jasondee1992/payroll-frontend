"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { runPayrollBatch } from "@/lib/api/payroll";
import { cn } from "@/lib/utils";

type PayrollRunPeriodOption = {
  id: number;
  label: string;
};

type PayrollRunFormProps = {
  periodOptions: PayrollRunPeriodOption[];
  defaultPeriodId?: number;
  employeeIds: number[];
  disabled?: boolean;
};

export function PayrollRunForm({
  periodOptions,
  defaultPeriodId,
  employeeIds,
  disabled = false,
}: PayrollRunFormProps) {
  const router = useRouter();
  const [acknowledged, setAcknowledged] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState(
    String(defaultPeriodId ?? periodOptions[0]?.id ?? ""),
  );
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!acknowledged || disabled || periodOptions.length === 0 || !selectedPeriodId) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await runPayrollBatch({
        payrollPeriodId: Number(selectedPeriodId),
        employeeIds,
      });

      const summary = [
        `${result.createdCount} created`,
        `${result.skippedCount} skipped`,
        `${result.failedCount} failed`,
      ].join(", ");
      const failureMessages = result.results
        .filter((item) => item.status === "failed")
        .slice(0, 3)
        .map((item) => `Employee #${item.employeeId}: ${item.message}`);

      setSuccessMessage(
        `Payroll run finished: ${summary}.${notes.trim().length > 0 ? " Notes were captured locally for this action, but the backend does not store run notes yet." : ""}`,
      );

      if (failureMessages.length > 0) {
        setErrorMessage(failureMessages.join(" "));
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to process payroll.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5">
      <FormSelect
        label="Payroll Period"
        value={selectedPeriodId}
        options={periodOptions}
        onChange={setSelectedPeriodId}
        disabled={periodOptions.length === 0}
      />

      <label className="flex flex-col gap-2">
        <span className="ui-label">Notes</span>
        <textarea
          rows={5}
          placeholder="Add optional run notes for reviewers and approvers."
          className="ui-textarea"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={isSubmitting}
        />
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={() => setAcknowledged((current) => !current)}
          disabled={isSubmitting}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900/15"
        />
        <span className="text-sm leading-6 text-slate-600">
          This run setup is based on live payroll-period data. The frontend now
          batches the existing single-employee backend process endpoint across
          the included employee list.
        </span>
      </label>

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={
          isSubmitting ||
          !acknowledged ||
          disabled ||
          periodOptions.length === 0 ||
          employeeIds.length === 0 ||
          !selectedPeriodId
        }
        className={cn(
          "inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/15",
          acknowledged &&
            !disabled &&
            !isSubmitting &&
            periodOptions.length > 0 &&
            employeeIds.length > 0 &&
            selectedPeriodId
            ? "bg-slate-900 text-white hover:bg-slate-800"
            : "cursor-not-allowed bg-slate-300 text-slate-500",
        )}
      >
        {isSubmitting ? "Running Payroll..." : "Run Payroll"}
      </button>
    </form>
  );
}

function FormSelect({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  options: PayrollRunPeriodOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="ui-label">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="ui-select"
      >
        {options.map((option) => (
          <option key={option.id} value={String(option.id)}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
