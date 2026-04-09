"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  CircleSlash,
  PencilLine,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  approveManualPayrollAdjustment,
  createManualPayrollAdjustment,
  getManualPayrollAdjustments,
  rejectManualPayrollAdjustment,
  updateManualPayrollAdjustment,
} from "@/lib/api/payroll";
import { canManagePayrollAdjustments, type AppRole } from "@/lib/auth/session";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ResourceEmptyState,
  ResourceErrorState,
  ResourceTableSkeleton,
} from "@/components/shared/resource-state";
import type {
  EmployeePayrollCutoffStatusRecord,
  ManualPayrollAdjustmentRecord,
} from "@/types/payroll";

type Props = {
  role: AppRole | null;
  cutoffId: number | null;
  cutoffLabel: string | null;
  employees: EmployeePayrollCutoffStatusRecord[];
  hasExistingBatch: boolean;
  onAdjustmentsChanged: () => Promise<void>;
};

type ManualAdjustmentFormState = {
  employeeId: string;
  adjustmentType: string;
  category: string;
  amount: string;
  direction: "addition" | "deduction";
  taxable: "taxable" | "non_taxable";
  reason: string;
  remarks: string;
};

const CATEGORY_OPTIONS = [
  { value: "allowance", label: "Allowance" },
  { value: "bonus", label: "Bonus" },
  { value: "reimbursement", label: "Reimbursement" },
  { value: "manual_deduction", label: "Manual deduction" },
  { value: "penalty", label: "Penalty" },
  { value: "correction_entry", label: "Correction entry" },
  { value: "previous_payroll_adjustment", label: "Previous payroll adjustment" },
  {
    value: "special_one_time_adjustment",
    label: "Special one-time adjustment",
  },
] as const;

const EMPTY_FORM: ManualAdjustmentFormState = {
  employeeId: "",
  adjustmentType: "",
  category: "allowance",
  amount: "",
  direction: "addition",
  taxable: "taxable",
  reason: "",
  remarks: "",
};

export function ManualAdjustmentsPanel({
  role,
  cutoffId,
  cutoffLabel,
  employees,
  hasExistingBatch,
  onAdjustmentsChanged,
}: Props) {
  const canManage = canManagePayrollAdjustments(role);
  const employeeOptions = useMemo(
    () =>
      employees
        .map((item) => ({
          value: String(item.employee_id),
          label: `${item.employee_name} (${item.employee_code})`,
        }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [employees],
  );
  const [adjustments, setAdjustments] = useState<ManualPayrollAdjustmentRecord[]>([]);
  const [form, setForm] = useState<ManualAdjustmentFormState>(EMPTY_FORM);
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingAdjustmentId, setEditingAdjustmentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const defaultEmployeeId = employeeOptions[0]?.value ?? "";
    setForm((currentValue) => ({
      ...currentValue,
      employeeId:
        currentValue.employeeId && employeeOptions.some((item) => item.value === currentValue.employeeId)
          ? currentValue.employeeId
          : defaultEmployeeId,
    }));
  }, [employeeOptions]);

  const loadAdjustments = useCallback(async (options?: { background?: boolean }) => {
    if (cutoffId == null) {
      setAdjustments([]);
      setLoading(false);
      return;
    }

    if (!options?.background) {
      setLoading(true);
    }
    setError(null);
    try {
      const nextAdjustments = await getManualPayrollAdjustments({ cutoffId });
      setAdjustments(nextAdjustments);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to load manual payroll adjustments.",
      );
    } finally {
      if (!options?.background) {
        setLoading(false);
      }
    }
  }, [cutoffId]);

  useEffect(() => {
    void loadAdjustments();
  }, [loadAdjustments]);

  const filteredAdjustments = useMemo(
    () =>
      adjustments.filter((item) => {
        if (employeeFilter !== "all" && String(item.employee_id) !== employeeFilter) {
          return false;
        }
        if (statusFilter !== "all" && item.status !== statusFilter) {
          return false;
        }
        return true;
      }),
    [adjustments, employeeFilter, statusFilter],
  );
  const summary = useMemo(
    () => ({
      draft: adjustments.filter((item) => item.status === "draft").length,
      approved: adjustments.filter((item) => item.status === "approved").length,
      applied: adjustments.filter((item) => item.status === "applied").length,
      rejected: adjustments.filter((item) => item.status === "rejected").length,
    }),
    [adjustments],
  );

  function resetForm() {
    setEditingAdjustmentId(null);
    setForm({
      ...EMPTY_FORM,
      employeeId: employeeOptions[0]?.value ?? "",
    });
  }

  async function handleSubmit() {
    if (cutoffId == null || !canManage) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      if (editingAdjustmentId == null) {
        await createManualPayrollAdjustment({
          employeeId: Number(form.employeeId),
          cutoffId,
          adjustmentType: form.adjustmentType,
          category: form.category,
          amount: Number(form.amount),
          direction: form.direction,
          taxable: form.taxable === "taxable",
          reason: form.reason,
          remarks: form.remarks,
        });
        setMessage("Manual adjustment created as draft.");
      } else {
        await updateManualPayrollAdjustment(editingAdjustmentId, {
          adjustmentType: form.adjustmentType,
          category: form.category,
          amount: Number(form.amount),
          direction: form.direction,
          taxable: form.taxable === "taxable",
          reason: form.reason,
          remarks: form.remarks,
        });
        setMessage("Manual adjustment updated and returned to draft.");
      }
      await loadAdjustments({ background: true });
      await onAdjustmentsChanged();
      resetForm();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to save the manual adjustment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecision(
    action: "approve" | "reject",
    adjustment: ManualPayrollAdjustmentRecord,
  ) {
    if (!canManage) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      if (action === "approve") {
        await approveManualPayrollAdjustment(adjustment.id, {
          remarks: adjustment.remarks ?? undefined,
        });
        setMessage(`${adjustment.adjustment_type} was approved.`);
      } else {
        await rejectManualPayrollAdjustment(adjustment.id, {
          remarks: adjustment.remarks ?? undefined,
        });
        setMessage(`${adjustment.adjustment_type} was rejected.`);
      }
      await loadAdjustments({ background: true });
      await onAdjustmentsChanged();
      if (editingAdjustmentId === adjustment.id) {
        resetForm();
      }
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to update the manual adjustment status.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(adjustment: ManualPayrollAdjustmentRecord) {
    setEditingAdjustmentId(adjustment.id);
    setForm({
      employeeId: String(adjustment.employee_id),
      adjustmentType: adjustment.adjustment_type,
      category: adjustment.category,
      amount: adjustment.amount,
      direction:
        adjustment.direction === "deduction" ? "deduction" : "addition",
      taxable: adjustment.taxable ? "taxable" : "non_taxable",
      reason: adjustment.reason,
      remarks: adjustment.remarks ?? "",
    });
  }

  if (cutoffId == null || cutoffLabel == null) {
    return (
      <section className="panel-strong p-5 sm:p-6">
        <ResourceEmptyState
          title="Select a cutoff to manage manual adjustments"
          description="Choose an attendance cutoff first. Approved manual adjustments are attached to a specific employee and cutoff before payroll is calculated."
        />
      </section>
    );
  }

  return (
    <section className="panel-strong p-5 sm:p-6">
      <div className="ui-section-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Manual adjustments</h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage one-time additions and deductions for {cutoffLabel}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAdjustments()}
          className="ui-button-secondary h-10 px-4"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Draft" value={summary.draft} tone="warning" />
        <SummaryCard label="Approved" value={summary.approved} tone="info" />
        <SummaryCard label="Applied" value={summary.applied} tone="success" />
        <SummaryCard label="Rejected" value={summary.rejected} tone="neutral" />
      </div>

      {hasExistingBatch ? (
        <div className="ui-state-banner ui-state-banner-warning mt-4">
          Approved manual adjustments will appear in the next employee or batch recalculation.
          Existing computed payroll records do not update automatically.
        </div>
      ) : null}

      {error ? (
        <div className="mt-4">
          <ResourceErrorState title="Manual adjustments are unavailable" description={error} />
        </div>
      ) : null}
      {message ? (
        <div className="ui-state-banner ui-state-banner-success mt-4">{message}</div>
      ) : null}

      {canManage ? (
        <div className="mt-5 rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {editingAdjustmentId == null ? "Add manual adjustment" : "Edit manual adjustment"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Draft adjustments do not affect payroll until they are approved.
              </p>
            </div>
            {editingAdjustmentId != null ? (
              <button
                type="button"
                onClick={resetForm}
                className="ui-button-secondary h-10 px-4"
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <Field label="Employee">
              <select
                value={form.employeeId}
                onChange={(event) =>
                  setForm((currentValue) => ({
                    ...currentValue,
                    employeeId: event.target.value,
                  }))
                }
                disabled={submitting || employeeOptions.length === 0}
                className="ui-input"
              >
                {employeeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Adjustment type">
              <input
                value={form.adjustmentType}
                onChange={(event) =>
                  setForm((currentValue) => ({
                    ...currentValue,
                    adjustmentType: event.target.value,
                  }))
                }
                disabled={submitting}
                placeholder="Example: Performance bonus"
                className="ui-input"
              />
            </Field>
            <Field label="Category">
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((currentValue) => ({
                    ...currentValue,
                    category: event.target.value,
                  }))
                }
                disabled={submitting}
                className="ui-input"
              >
                {CATEGORY_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Amount">
              <input
                value={form.amount}
                onChange={(event) =>
                  setForm((currentValue) => ({
                    ...currentValue,
                    amount: event.target.value,
                  }))
                }
                disabled={submitting}
                inputMode="decimal"
                placeholder="0.00"
                className="ui-input"
              />
            </Field>
            <Field label="Direction">
              <select
                value={form.direction}
                onChange={(event) =>
                  setForm((currentValue) => ({
                    ...currentValue,
                    direction: event.target.value as "addition" | "deduction",
                  }))
                }
                disabled={submitting}
                className="ui-input"
              >
                <option value="addition">Addition</option>
                <option value="deduction">Deduction</option>
              </select>
            </Field>
            <Field label="Tax treatment">
              <select
                value={form.taxable}
                onChange={(event) =>
                  setForm((currentValue) => ({
                    ...currentValue,
                    taxable: event.target.value as "taxable" | "non_taxable",
                  }))
                }
                disabled={submitting}
                className="ui-input"
              >
                <option value="taxable">Taxable</option>
                <option value="non_taxable">Non-taxable</option>
              </select>
            </Field>
            <Field label="Reason">
              <input
                value={form.reason}
                onChange={(event) =>
                  setForm((currentValue) => ({
                    ...currentValue,
                    reason: event.target.value,
                  }))
                }
                disabled={submitting}
                placeholder="Operational reason for the entry"
                className="ui-input"
              />
            </Field>
            <Field label="Remarks">
              <input
                value={form.remarks}
                onChange={(event) =>
                  setForm((currentValue) => ({
                    ...currentValue,
                    remarks: event.target.value,
                  }))
                }
                disabled={submitting}
                placeholder="Optional approver or payroll note"
                className="ui-input"
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={
                submitting
                || !form.employeeId
                || !form.adjustmentType.trim()
                || !form.reason.trim()
                || Number(form.amount) <= 0
              }
              onClick={() => void handleSubmit()}
              className="ui-button-primary px-5"
            >
              {editingAdjustmentId == null ? <Plus className="h-4 w-4" /> : <PencilLine className="h-4 w-4" />}
              {editingAdjustmentId == null ? "Save draft" : "Update draft"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <label className="flex min-w-[14rem] flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Employee
          </span>
          <select
            value={employeeFilter}
            onChange={(event) => setEmployeeFilter(event.target.value)}
            className="ui-input"
          >
            <option value="all">All employees</option>
            {employeeOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[12rem] flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Status
          </span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="ui-input"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="applied">Applied</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </div>

      <div className="ui-table-shell mt-5">
        {loading ? (
          <ResourceTableSkeleton rowCount={5} />
        ) : filteredAdjustments.length === 0 ? (
          <div className="p-6">
            <ResourceEmptyState
              title="No manual adjustments for this cutoff"
              description={
                canManage
                  ? "Add draft entries here when payroll needs one-time additions or deductions outside the standard attendance and loan flow."
                  : "No manual entries were created for the selected cutoff."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="bg-slate-50/80">
                <tr className="text-left">
                  <th className="ui-table-head-cell">Employee</th>
                  <th className="ui-table-head-cell">Adjustment</th>
                  <th className="ui-table-head-cell">Direction</th>
                  <th className="ui-table-head-cell">Amount</th>
                  <th className="ui-table-head-cell">Status</th>
                  <th className="ui-table-head-cell">Effective</th>
                  <th className="ui-table-head-cell">Reason</th>
                  <th className="ui-table-head-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredAdjustments.map((item) => {
                  const employeeLabel =
                    employeeOptions.find((option) => option.value === String(item.employee_id))
                      ?.label ?? `Employee #${item.employee_id}`;
                  const editable = item.status !== "applied";

                  return (
                    <tr key={item.id} className="ui-table-row">
                      <td className="ui-table-body-cell">
                        <div>
                          <p className="font-medium text-slate-900">{employeeLabel}</p>
                          <p className="mt-1 text-xs text-slate-500">#{item.id}</p>
                        </div>
                      </td>
                      <td className="ui-table-body-cell">
                        <div>
                          <p className="font-medium text-slate-900">{item.adjustment_type}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {pretty(item.category)} • {item.taxable ? "Taxable" : "Non-taxable"}
                          </p>
                        </div>
                      </td>
                      <td className="ui-table-body-cell">{pretty(item.direction)}</td>
                      <td className="ui-table-body-cell">
                        <span
                          className={cn(
                            "font-semibold",
                            item.direction === "deduction"
                              ? "text-rose-700"
                              : "text-emerald-700",
                          )}
                        >
                          {formatCurrency(item.amount)}
                        </span>
                      </td>
                      <td className="ui-table-body-cell">
                        <StatusMark status={item.status} />
                      </td>
                      <td className="ui-table-body-cell">
                        {item.effective_date ? formatDate(item.effective_date) : "Not set"}
                        {item.applied_at ? (
                          <p className="mt-1 text-xs text-slate-500">
                            Applied {formatDateTime(item.applied_at)}
                          </p>
                        ) : null}
                      </td>
                      <td className="ui-table-body-cell">
                        <div className="max-w-[26rem]">
                          <p className="text-sm text-slate-700">{item.reason}</p>
                          {item.remarks ? (
                            <p className="mt-1 text-xs text-slate-500">{item.remarks}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="ui-table-body-cell">
                        <div className="flex flex-wrap gap-2">
                          {canManage && editable ? (
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              disabled={submitting}
                              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                            >
                              <PencilLine className="h-3.5 w-3.5" />
                              Edit
                            </button>
                          ) : null}
                          {canManage && item.status !== "approved" && item.status !== "applied" ? (
                            <button
                              type="button"
                              onClick={() => void handleDecision("approve", item)}
                              disabled={submitting}
                              className="inline-flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approve
                            </button>
                          ) : null}
                          {canManage && item.status !== "rejected" && item.status !== "applied" ? (
                            <button
                              type="button"
                              onClick={() => void handleDecision("reject", item)}
                              disabled={submitting}
                              className="inline-flex h-9 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-800 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                            >
                              <CircleSlash className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "warning" | "info" | "success" | "neutral";
}) {
  return (
    <div
      className={cn(
        "rounded-[22px] border px-4 py-4",
        tone === "warning"
          ? "border-amber-200 bg-amber-50/80"
          : tone === "info"
            ? "border-sky-200 bg-sky-50/80"
            : tone === "success"
              ? "border-emerald-200 bg-emerald-50/80"
              : "border-slate-200 bg-slate-50/80",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatusMark({ status }: { status: string }) {
  const normalized = status.trim().toLowerCase();
  const tone =
    normalized === "approved"
      ? "info"
      : normalized === "applied"
        ? "success"
        : normalized === "rejected"
          ? "neutral"
          : "warning";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ring-1 ring-inset",
        tone === "success"
          ? "bg-emerald-100 text-emerald-800 ring-emerald-200/80"
          : tone === "info"
            ? "bg-sky-100 text-sky-800 ring-sky-200/80"
            : tone === "warning"
              ? "bg-amber-100 text-amber-800 ring-amber-200/80"
              : "bg-slate-100 text-slate-700 ring-slate-200/90",
      )}
    >
      {pretty(status)}
    </span>
  );
}

function pretty(value: string) {
  return value
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
