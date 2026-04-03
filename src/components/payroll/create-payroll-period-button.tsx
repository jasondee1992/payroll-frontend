"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createPayrollPeriod } from "@/lib/api/payroll";

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "processed", label: "Processed" },
  { value: "closed", label: "Closed" },
] as const;

export function CreatePayrollPeriodButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function closeModal() {
    if (isSubmitting) {
      return;
    }

    setOpen(false);
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const periodName = getStringValue(formData.get("period-name"));
    const periodStart = getStringValue(formData.get("period-start"));
    const periodEnd = getStringValue(formData.get("period-end"));
    const payoutDate = getStringValue(formData.get("payout-date"));
    const status = getStringValue(formData.get("status"));

    if (!periodName || !periodStart || !periodEnd || !payoutDate || !status) {
      setErrorMessage("Complete all payroll period fields before saving.");
      return;
    }

    if (periodEnd < periodStart) {
      setErrorMessage("Period end must be on or after the period start date.");
      return;
    }

    if (payoutDate < periodEnd) {
      setErrorMessage("Payout date must be on or after the period end date.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createPayrollPeriod({
        periodName,
        periodStart,
        periodEnd,
        payoutDate,
        status: status as "draft" | "open" | "processed" | "closed",
      });

      setOpen(false);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create payroll period.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/15"
      >
        Create Period
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-payroll-period-title"
            className="w-full max-w-2xl rounded-[28px] border border-slate-200/80 bg-white shadow-2xl shadow-slate-950/20"
          >
            <div className="border-b border-slate-200/80 px-6 py-5">
              <h2
                id="create-payroll-period-title"
                className="text-lg font-semibold text-slate-950"
              >
                Create Payroll Period
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Save a new payroll cycle to the backend before running payroll.
              </p>
            </div>

            <form className="space-y-5 px-6 py-5" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2">
                <span className="ui-label">Period Name</span>
                <input
                  name="period-name"
                  type="text"
                  placeholder="Apr 1 - Apr 30"
                  className="ui-input"
                  disabled={isSubmitting}
                  required
                />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="ui-label">Period Start</span>
                  <input
                    name="period-start"
                    type="date"
                    className="ui-input"
                    disabled={isSubmitting}
                    required
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="ui-label">Period End</span>
                  <input
                    name="period-end"
                    type="date"
                    className="ui-input"
                    disabled={isSubmitting}
                    required
                  />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="ui-label">Payout Date</span>
                  <input
                    name="payout-date"
                    type="date"
                    className="ui-input"
                    disabled={isSubmitting}
                    required
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="ui-label">Status</span>
                  <select
                    name="status"
                    defaultValue="open"
                    className="ui-select"
                    disabled={isSubmitting}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700">
                  {errorMessage}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200/80 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="ui-button-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ui-button-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Save Period"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}
