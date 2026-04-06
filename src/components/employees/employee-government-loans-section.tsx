"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Ban,
  CheckCircle2,
  Loader2,
  PencilLine,
  Play,
  Plus,
} from "lucide-react";
import { DetailItem } from "@/components/ui/detail-item";
import {
  ResourceEmptyState,
  ResourceErrorState,
} from "@/components/shared/resource-state";
import { SectionCard } from "@/components/ui/section-card";
import {
  createEmployeeLoan,
  EMPLOYEE_LOAN_DEDUCTION_MODE_OPTIONS,
  EMPLOYEE_LOAN_DEDUCTION_SCHEDULE_OPTIONS,
  EMPLOYEE_LOAN_STATUS_OPTIONS,
  formatEmployeeLoanDeductionMode,
  formatEmployeeLoanDeductionSchedule,
  formatEmployeeLoanStatus,
  updateEmployeeLoan,
  updateEmployeeLoanStatus,
} from "@/lib/api/employee-loans";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  EmployeeLoanApiRecord,
  EmployeeLoanCreatePayload,
  EmployeeLoanDeductionMode,
  EmployeeLoanDeductionSchedule,
  EmployeeLoanStatus,
  LoanTypeApiRecord,
} from "@/types/employee-loans";

type EmployeeGovernmentLoansSectionProps = {
  employeeId: number;
  employeeCode: string;
  loanTypes: LoanTypeApiRecord[];
  initialLoans: EmployeeLoanApiRecord[];
  initialErrorMessage: string | null;
  canManage: boolean;
};

type LoanFormMode = "create" | "edit";
type LoanVisibilityFilter = "all" | "active" | "history";

type LoanFormValues = {
  loanTypeId: string;
  provider: string;
  loanName: string;
  startDate: string;
  monthlyDeduction: string;
  termMonths: string;
  deductionSchedule: EmployeeLoanDeductionSchedule;
  deductionMode: EmployeeLoanDeductionMode;
  perCutoffAmount: string;
  totalLoanAmount: string;
  remainingBalance: string;
  status: EmployeeLoanStatus;
  isAutoStopWhenFullyPaid: boolean;
  remarks: string;
};

type LoanFormErrors = Partial<Record<keyof LoanFormValues, string>> & {
  form?: string;
};

const ACTIVE_LOAN_STATUSES = new Set<EmployeeLoanStatus>([
  "draft",
  "scheduled",
  "active",
]);

const STATUS_STYLES: Record<EmployeeLoanStatus, string> = {
  draft: "border-slate-200 bg-slate-100 text-slate-700",
  scheduled: "border-sky-200 bg-sky-50 text-sky-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  stopped: "border-amber-200 bg-amber-50 text-amber-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

function getDefaultLoanType(loanTypes: LoanTypeApiRecord[]) {
  return loanTypes.find((loanType) => loanType.active) ?? loanTypes[0] ?? null;
}

function buildCreateFormValues(loanTypes: LoanTypeApiRecord[]): LoanFormValues {
  const defaultLoanType = getDefaultLoanType(loanTypes);

  return {
    loanTypeId: defaultLoanType ? String(defaultLoanType.id) : "",
    provider: defaultLoanType?.provider ?? "",
    loanName: defaultLoanType?.name ?? "",
    startDate: "",
    monthlyDeduction: "",
    termMonths: "",
    deductionSchedule: "first_cutoff",
    deductionMode: "fixed_amount",
    perCutoffAmount: "",
    totalLoanAmount: "",
    remainingBalance: "",
    status: "draft",
    isAutoStopWhenFullyPaid: true,
    remarks: "",
  };
}

function buildEditFormValues(loan: EmployeeLoanApiRecord): LoanFormValues {
  return {
    loanTypeId: String(loan.loan_type_id),
    provider: loan.provider,
    loanName: loan.loan_name,
    startDate: loan.start_date,
    monthlyDeduction: loan.monthly_deduction,
    termMonths: String(loan.term_months),
    deductionSchedule: loan.deduction_schedule,
    deductionMode: loan.deduction_mode,
    perCutoffAmount: loan.per_cutoff_amount ?? "",
    totalLoanAmount: loan.total_loan_amount ?? "",
    remainingBalance: loan.remaining_balance ?? "",
    status: loan.status,
    isAutoStopWhenFullyPaid: loan.is_auto_stop_when_fully_paid,
    remarks: loan.remarks ?? "",
  };
}

function sortLoans(loans: EmployeeLoanApiRecord[]) {
  return [...loans].sort((left, right) => {
    const updatedComparison = right.updated_at.localeCompare(left.updated_at);
    if (updatedComparison !== 0) {
      return updatedComparison;
    }

    return right.id - left.id;
  });
}

function parseOptionalNumber(value: string) {
  if (value.trim().length === 0) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeCurrencyValue(value: string) {
  const normalizedValue = value.trim();
  if (normalizedValue.length === 0) {
    return "";
  }

  const numericValue = Number(normalizedValue);
  if (!Number.isFinite(numericValue)) {
    return value;
  }

  return numericValue.toFixed(2);
}

function isPositiveNumber(value: string) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0;
}

function isWholePositiveNumber(value: string) {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0;
}

function getValidationErrors(values: LoanFormValues): LoanFormErrors {
  const errors: LoanFormErrors = {};

  if (!values.loanTypeId) {
    errors.loanTypeId = "Select a loan type.";
  }

  if (values.provider.trim().length === 0) {
    errors.provider = "Provider is required.";
  }

  if (!values.startDate) {
    errors.startDate = "Start date is required.";
  }

  if (!isPositiveNumber(values.monthlyDeduction)) {
    errors.monthlyDeduction = "Monthly deduction must be greater than zero.";
  }

  if (!isWholePositiveNumber(values.termMonths)) {
    errors.termMonths = "Term months must be a whole number greater than zero.";
  }

  if (
    values.deductionMode === "split_amount" &&
    values.deductionSchedule !== "every_cutoff"
  ) {
    errors.deductionSchedule =
      "Split amount deductions require the every cutoff schedule.";
  }

  if (values.perCutoffAmount.trim().length > 0 && !isPositiveNumber(values.perCutoffAmount)) {
    errors.perCutoffAmount = "Per cutoff amount must be greater than zero.";
  }

  if (
    values.deductionMode === "split_amount" &&
    isPositiveNumber(values.monthlyDeduction) &&
    isPositiveNumber(values.perCutoffAmount) &&
    (Number(values.perCutoffAmount) * 2) > Number(values.monthlyDeduction)
  ) {
    errors.perCutoffAmount =
      "Per cutoff amount cannot exceed half of the monthly deduction for split amount mode.";
  }

  if (
    values.totalLoanAmount.trim().length > 0 &&
    Number(values.totalLoanAmount) < 0
  ) {
    errors.totalLoanAmount = "Total loan amount cannot be negative.";
  }

  if (
    values.remainingBalance.trim().length > 0 &&
    Number(values.remainingBalance) < 0
  ) {
    errors.remainingBalance = "Remaining balance cannot be negative.";
  }

  if (
    isPositiveNumber(values.totalLoanAmount) &&
    values.remainingBalance.trim().length > 0 &&
    Number(values.remainingBalance) > Number(values.totalLoanAmount)
  ) {
    errors.remainingBalance =
      "Remaining balance cannot be greater than the total loan amount.";
  }

  if (
    (values.status === "active" || values.status === "scheduled") &&
    values.remainingBalance.trim().length > 0 &&
    Number(values.remainingBalance) <= 0
  ) {
    errors.remainingBalance =
      "Active or scheduled loans must have a remaining balance greater than zero when tracked.";
  }

  return errors;
}

function getInstallmentProgressPercentage(loan: EmployeeLoanApiRecord) {
  if (loan.term_months <= 0) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round((loan.payments_made_count / loan.term_months) * 100)),
  );
}

function getBalanceProgressPercentage(loan: EmployeeLoanApiRecord) {
  if (!loan.total_loan_amount) {
    return null;
  }

  const totalLoanAmount = Number(loan.total_loan_amount);
  if (!Number.isFinite(totalLoanAmount) || totalLoanAmount <= 0) {
    return null;
  }

  return Math.max(
    0,
    Math.min(100, Math.round((Number(loan.total_deducted_amount) / totalLoanAmount) * 100)),
  );
}

function buildPayload(values: LoanFormValues): EmployeeLoanCreatePayload {
  return {
    loan_type_id: Number(values.loanTypeId),
    provider: values.provider.trim(),
    loan_name: values.loanName.trim() || null,
    start_date: values.startDate,
    monthly_deduction: Number(values.monthlyDeduction),
    term_months: Number(values.termMonths),
    deduction_schedule: values.deductionSchedule,
    deduction_mode: values.deductionMode,
    per_cutoff_amount: parseOptionalNumber(values.perCutoffAmount),
    total_loan_amount: parseOptionalNumber(values.totalLoanAmount),
    remaining_balance: parseOptionalNumber(values.remainingBalance),
    status: values.status,
    is_auto_stop_when_fully_paid: values.isAutoStopWhenFullyPaid,
    remarks: values.remarks.trim() || null,
  };
}

function getLoanTypeById(loanTypes: LoanTypeApiRecord[], loanTypeId: string) {
  return loanTypes.find((loanType) => String(loanType.id) === loanTypeId) ?? null;
}

function replaceLoan(loans: EmployeeLoanApiRecord[], nextLoan: EmployeeLoanApiRecord) {
  const existingIndex = loans.findIndex((loan) => loan.id === nextLoan.id);

  if (existingIndex === -1) {
    return sortLoans([nextLoan, ...loans]);
  }

  const nextLoans = [...loans];
  nextLoans[existingIndex] = nextLoan;
  return sortLoans(nextLoans);
}

export function EmployeeGovernmentLoansSection({
  employeeId,
  employeeCode,
  loanTypes,
  initialLoans,
  initialErrorMessage,
  canManage,
}: EmployeeGovernmentLoansSectionProps) {
  const [loans, setLoans] = useState(() => sortLoans(initialLoans));
  const [errorMessage, setErrorMessage] = useState(initialErrorMessage);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<LoanFormErrors>({});
  const [formMode, setFormMode] = useState<LoanFormMode | null>(null);
  const [editingLoanId, setEditingLoanId] = useState<number | null>(null);
  const [expandedLoanId, setExpandedLoanId] = useState<number | null>(null);
  const [visibilityFilter, setVisibilityFilter] =
    useState<LoanVisibilityFilter>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [loanTypeFilter, setLoanTypeFilter] = useState<string>("all");
  const [formValues, setFormValues] = useState<LoanFormValues>(() =>
    buildCreateFormValues(loanTypes),
  );
  const [isPending, startTransition] = useTransition();

  const {
    activeLoans,
    archivedLoans,
    activeMonthlyDeduction,
    remainingBalanceTracked,
    remainingInstallmentsTotal,
  } =
    useMemo(() => {
      const nextActiveLoans = loans.filter((loan) => ACTIVE_LOAN_STATUSES.has(loan.status));
      const nextArchivedLoans = loans.filter(
        (loan) => !ACTIVE_LOAN_STATUSES.has(loan.status),
      );

      return {
        activeLoans: nextActiveLoans,
        archivedLoans: nextArchivedLoans,
        activeMonthlyDeduction: nextActiveLoans.reduce(
          (total, loan) => total + Number(loan.monthly_deduction),
          0,
        ),
        remainingBalanceTracked: loans.filter(
          (loan) => loan.remaining_balance != null,
        ).length,
        remainingInstallmentsTotal: nextActiveLoans.reduce(
          (total, loan) => total + loan.remaining_terms,
          0,
        ),
      };
    }, [loans]);

  const providerOptions = useMemo(
    () =>
      Array.from(new Set(loans.map((loan) => loan.provider)))
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [loans],
  );

  const loanTypeOptions = useMemo(
    () =>
      Array.from(new Set(loans.map((loan) => loan.loan_type_name)))
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [loans],
  );

  const filteredActiveLoans = useMemo(
    () =>
      activeLoans.filter((loan) => {
        if (providerFilter !== "all" && loan.provider !== providerFilter) {
          return false;
        }

        if (loanTypeFilter !== "all" && loan.loan_type_name !== loanTypeFilter) {
          return false;
        }

        return visibilityFilter !== "history";
      }),
    [activeLoans, loanTypeFilter, providerFilter, visibilityFilter],
  );

  const filteredArchivedLoans = useMemo(
    () =>
      archivedLoans.filter((loan) => {
        if (providerFilter !== "all" && loan.provider !== providerFilter) {
          return false;
        }

        if (loanTypeFilter !== "all" && loan.loan_type_name !== loanTypeFilter) {
          return false;
        }

        return visibilityFilter !== "active";
      }),
    [archivedLoans, loanTypeFilter, providerFilter, visibilityFilter],
  );

  function openCreateForm() {
    setSuccessMessage(null);
    setErrorMessage(null);
    setFormErrors({});
    setEditingLoanId(null);
    setFormMode("create");
    setFormValues(buildCreateFormValues(loanTypes));
  }

  function openEditForm(loan: EmployeeLoanApiRecord) {
    if (loanTypes.length === 0) {
      setErrorMessage(
        "Loan types are unavailable from the backend, so this record cannot be edited right now.",
      );
      return;
    }

    setSuccessMessage(null);
    setErrorMessage(null);
    setFormErrors({});
    setEditingLoanId(loan.id);
    setFormMode("edit");
    setFormValues(buildEditFormValues(loan));
  }

  function closeForm() {
    setFormMode(null);
    setEditingLoanId(null);
    setFormErrors({});
    setFormValues(buildCreateFormValues(loanTypes));
  }

  function updateFormValue<K extends keyof LoanFormValues>(
    key: K,
    value: LoanFormValues[K],
  ) {
    setFormValues((current) => {
      const nextValues = {
        ...current,
        [key]: value,
      };

      if (key === "loanTypeId") {
        const selectedLoanType = getLoanTypeById(loanTypes, String(value));
        if (selectedLoanType) {
          nextValues.provider = selectedLoanType.provider;
          nextValues.loanName = selectedLoanType.name;
        }
      }

      if (key === "deductionMode" && value === "split_amount") {
        nextValues.deductionSchedule = "every_cutoff";
      }

      return nextValues;
    });
    setFormErrors((current) => {
      if (!current[key] && !current.form) {
        return current;
      }

      return {
        ...current,
        [key]: undefined,
        form: undefined,
      };
    });
  }

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    const nextFormErrors = getValidationErrors(formValues);

    if (Object.keys(nextFormErrors).length > 0) {
      setFormErrors({
        ...nextFormErrors,
        form: "Review the highlighted fields before saving the employee loan record.",
      });
      return;
    }

    setFormErrors({});

    startTransition(async () => {
      try {
        const payload = buildPayload(formValues);
        const nextLoan =
          formMode === "edit" && editingLoanId != null
            ? await updateEmployeeLoan(employeeId, editingLoanId, payload)
            : await createEmployeeLoan(employeeId, payload);

        setLoans((currentLoans) => replaceLoan(currentLoans, nextLoan));
        setSuccessMessage(
          formMode === "edit"
            ? "Employee loan record updated."
            : "Employee loan record added.",
        );
        closeForm();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to save the employee loan record.",
        );
      }
    });
  }

  function handleStatusChange(loanId: number, status: EmployeeLoanStatus) {
    setSuccessMessage(null);
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const nextLoan = await updateEmployeeLoanStatus(employeeId, loanId, { status });
        setLoans((currentLoans) => replaceLoan(currentLoans, nextLoan));
        setSuccessMessage(
          `Loan status updated to ${formatEmployeeLoanStatus(status).toLowerCase()}.`,
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to update the employee loan status.",
        );
      }
    });
  }

  const formTitle =
    formMode === "edit" ? "Update loan deduction settings" : "Add government loan";
  const formDescription =
    formMode === "edit"
      ? "Maintain the HR-encoded deduction values that payroll will apply and track."
      : "Encode the employer deduction values maintained by HR. Payroll will only apply what is configured here.";

  return (
    <div className="space-y-5">
      <SectionCard
        title="Government Loans"
        description={`Track HR-maintained government loan deductions for employee ${employeeCode}. Payroll uses these records during cutoff processing without recomputing external amortization formulas.`}
        action={
          canManage ? (
            <button
              type="button"
              onClick={openCreateForm}
              disabled={isPending || loanTypes.length === 0}
              className="ui-button-primary gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Add Loan
            </button>
          ) : null
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Active or scheduled" value={String(activeLoans.length)} />
          <SummaryCard label="Loan history records" value={String(archivedLoans.length)} />
          <SummaryCard
            label="Monthly deduction exposure"
            value={formatCurrency(activeMonthlyDeduction)}
          />
          <SummaryCard
            label="Remaining installments"
            value={`${remainingInstallmentsTotal} total`}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SummaryCard
            label="Tracked balances"
            value={`${remainingBalanceTracked} loan(s)`}
          />
          <SummaryCard
            label="Visible records"
            value={String(filteredActiveLoans.length + filteredArchivedLoans.length)}
          />
        </div>

        {!canManage ? (
          <MessageBanner
            tone="warning"
            message="This section is read-only for your role. Only HR can add, edit, activate, stop, cancel, or complete employee loan records."
          />
        ) : null}

        {successMessage ? (
          <MessageBanner tone="success" message={successMessage} />
        ) : null}

        {errorMessage ? <MessageBanner tone="error" message={errorMessage} /> : null}

        {canManage && loanTypes.length === 0 && !errorMessage ? (
          <MessageBanner
            tone="warning"
            message="Loan types are unavailable from the backend, so new loan records cannot be added yet."
          />
        ) : null}

        <div className="mt-6 rounded-[26px] border border-slate-200/80 bg-slate-50/80 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-950">Loan Progress Filters</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Narrow the active loan list and loan history by lifecycle, provider, or loan type.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "All loans" },
                { value: "active", label: "Active only" },
                { value: "history", label: "History only" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVisibilityFilter(option.value as LoanVisibilityFilter)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-medium transition",
                    visibilityFilter === option.value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Provider">
              <select
                value={providerFilter}
                onChange={(event) => setProviderFilter(event.target.value)}
                className="ui-input"
              >
                <option value="all">All providers</option>
                {providerOptions.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Loan Type">
              <select
                value={loanTypeFilter}
                onChange={(event) => setLoanTypeFilter(event.target.value)}
                className="ui-input"
              >
                <option value="all">All loan types</option>
                {loanTypeOptions.map((loanTypeName) => (
                  <option key={loanTypeName} value={loanTypeName}>
                    {loanTypeName}
                  </option>
                ))}
              </select>
            </Field>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setVisibilityFilter("all");
                  setProviderFilter("all");
                  setLoanTypeFilter("all");
                }}
                className="ui-button-secondary"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {formMode ? (
          <div className="mt-6 rounded-[26px] border border-slate-200/80 bg-slate-50/80 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-950">{formTitle}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {formDescription}
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="ui-button-secondary"
                disabled={isPending}
              >
                Close
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={submitForm}>
              {formErrors.form ? (
                <MessageBanner tone="error" message={formErrors.form} />
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Loan Type" error={formErrors.loanTypeId}>
                  <select
                    value={formValues.loanTypeId}
                    onChange={(event) => updateFormValue("loanTypeId", event.target.value)}
                    className={getFieldClassName(formErrors.loanTypeId)}
                    required
                    disabled={isPending}
                  >
                    {loanTypes.map((loanType) => (
                      <option key={loanType.id} value={loanType.id}>
                        {loanType.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Provider" error={formErrors.provider}>
                  <input
                    type="text"
                    value={formValues.provider}
                    onChange={(event) => updateFormValue("provider", event.target.value)}
                    className={getFieldClassName(formErrors.provider)}
                    required
                    disabled={isPending}
                  />
                </Field>

                <Field label="Loan Name">
                  <input
                    type="text"
                    value={formValues.loanName}
                    onChange={(event) => updateFormValue("loanName", event.target.value)}
                    className="ui-input"
                    placeholder="Use the selected loan type name or override it"
                    disabled={isPending}
                  />
                </Field>

                <Field label="Start Date" error={formErrors.startDate}>
                  <input
                    type="date"
                    value={formValues.startDate}
                    onChange={(event) => updateFormValue("startDate", event.target.value)}
                    className={getFieldClassName(formErrors.startDate)}
                    required
                    disabled={isPending}
                  />
                </Field>

                <Field label="Monthly Deduction Amount" error={formErrors.monthlyDeduction}>
                  <div className="space-y-2">
                    <div
                      className={cn(
                        "flex h-12 items-center rounded-2xl border bg-white transition",
                        formErrors.monthlyDeduction
                          ? "border-rose-300 bg-rose-50/60 focus-within:ring-4 focus-within:ring-rose-200"
                          : "border-slate-200 hover:border-slate-300 focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-900/10",
                      )}
                    >
                      <span className="inline-flex h-full shrink-0 items-center border-r border-slate-200 px-4 text-sm font-semibold text-slate-500">
                        PHP
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={formValues.monthlyDeduction}
                        onChange={(event) =>
                          updateFormValue("monthlyDeduction", event.target.value)
                        }
                        onBlur={(event) =>
                          updateFormValue(
                            "monthlyDeduction",
                            normalizeCurrencyValue(event.target.value),
                          )
                        }
                        className="h-full w-full rounded-r-2xl border-0 bg-transparent px-4 text-sm text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
                        required
                        disabled={isPending}
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-sm text-slate-500">
                      {isPositiveNumber(formValues.monthlyDeduction)
                        ? `Preview: ${formatCurrency(formValues.monthlyDeduction)}`
                        : "Enter the monthly loan deduction amount in Philippine pesos."}
                    </p>
                  </div>
                </Field>

                <Field label="Term Months" error={formErrors.termMonths}>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={formValues.termMonths}
                    onChange={(event) => updateFormValue("termMonths", event.target.value)}
                    className={getFieldClassName(formErrors.termMonths)}
                    required
                    disabled={isPending}
                  />
                </Field>

                <Field label="Deduction Schedule" error={formErrors.deductionSchedule}>
                  <select
                    value={formValues.deductionSchedule}
                    onChange={(event) =>
                      updateFormValue(
                        "deductionSchedule",
                        event.target.value as EmployeeLoanDeductionSchedule,
                      )
                    }
                    className={getFieldClassName(formErrors.deductionSchedule)}
                    required
                    disabled={isPending}
                  >
                    {EMPLOYEE_LOAN_DEDUCTION_SCHEDULE_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={
                          formValues.deductionMode === "split_amount" &&
                          option.value !== "every_cutoff"
                        }
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Deduction Mode">
                  <select
                    value={formValues.deductionMode}
                    onChange={(event) =>
                      updateFormValue(
                        "deductionMode",
                        event.target.value as EmployeeLoanDeductionMode,
                      )
                    }
                    className="ui-input"
                    required
                    disabled={isPending}
                  >
                    {EMPLOYEE_LOAN_DEDUCTION_MODE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Per Cutoff Amount" error={formErrors.perCutoffAmount}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={formValues.perCutoffAmount}
                    onChange={(event) =>
                      updateFormValue("perCutoffAmount", event.target.value)
                    }
                    className={getFieldClassName(formErrors.perCutoffAmount)}
                    placeholder="Optional override per cutoff"
                    disabled={isPending}
                  />
                </Field>

                <Field label="Total Loan Amount" error={formErrors.totalLoanAmount}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={formValues.totalLoanAmount}
                    onChange={(event) =>
                      updateFormValue("totalLoanAmount", event.target.value)
                    }
                    className={getFieldClassName(formErrors.totalLoanAmount)}
                    placeholder="Optional"
                    disabled={isPending}
                  />
                </Field>

                <Field label="Remaining Balance" error={formErrors.remainingBalance}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={formValues.remainingBalance}
                    onChange={(event) =>
                      updateFormValue("remainingBalance", event.target.value)
                    }
                    className={getFieldClassName(formErrors.remainingBalance)}
                    placeholder="Optional tracked balance"
                    disabled={isPending}
                  />
                </Field>

                <Field label="Status">
                  <select
                    value={formValues.status}
                    onChange={(event) =>
                      updateFormValue("status", event.target.value as EmployeeLoanStatus)
                    }
                    className="ui-input"
                    required
                    disabled={isPending}
                  >
                    {EMPLOYEE_LOAN_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-4">
                <input
                  type="checkbox"
                  checked={formValues.isAutoStopWhenFullyPaid}
                  onChange={(event) =>
                    updateFormValue("isAutoStopWhenFullyPaid", event.target.checked)
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  disabled={isPending}
                />
                <span className="text-sm leading-6 text-slate-600">
                  Automatically mark the loan as completed once no remaining terms or
                  tracked balance remain.
                </span>
              </label>

              <Field label="Remarks">
                <textarea
                  value={formValues.remarks}
                  onChange={(event) => updateFormValue("remarks", event.target.value)}
                  className="ui-input min-h-28"
                  placeholder="Optional operational notes for HR and payroll review"
                  disabled={isPending}
                />
              </Field>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="ui-button-primary gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {formMode === "edit" ? "Save Loan Changes" : "Create Loan"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isPending}
                  className="ui-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <div className="mt-6 space-y-6">
          {errorMessage && loans.length === 0 ? (
            <ResourceErrorState
              title="Unable to load employee loans"
              description={errorMessage}
            />
          ) : null}

          {!errorMessage && loans.length === 0 ? (
            <ResourceEmptyState
              title="No government loans recorded"
              description="No employee loan records have been encoded yet. HR can add SSS or PAG-IBIG loan deductions once the official employer deduction details are available."
              action={
                canManage && loanTypes.length > 0 ? (
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="ui-button-primary gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Loan
                  </button>
                ) : null
              }
            />
          ) : null}

          {filteredActiveLoans.length > 0 ? (
            <LoanGroup
              title="Active and scheduled loans"
              description="These records can still affect upcoming payroll cutoffs based on their configured schedule, remaining terms, and start date."
              loans={filteredActiveLoans}
              expandedLoanId={expandedLoanId}
              onToggleExpanded={setExpandedLoanId}
              onEdit={openEditForm}
              onStatusChange={handleStatusChange}
              canManage={canManage}
              isPending={isPending}
            />
          ) : null}

          {filteredArchivedLoans.length > 0 ? (
            <LoanGroup
              title="Loan history"
              description="Completed, stopped, and cancelled records remain available for audit, deduction history review, and payroll reconciliation."
              loans={filteredArchivedLoans}
              expandedLoanId={expandedLoanId}
              onToggleExpanded={setExpandedLoanId}
              onEdit={openEditForm}
              onStatusChange={handleStatusChange}
              canManage={canManage}
              isPending={isPending}
            />
          ) : null}

          {!errorMessage &&
          filteredActiveLoans.length === 0 &&
          filteredArchivedLoans.length === 0 &&
          loans.length > 0 ? (
            <ResourceEmptyState
              title="No loan records match the current filters"
              description="Adjust the visibility, provider, or loan type filters to review the loan records available for this employee."
            />
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}

function LoanGroup({
  title,
  description,
  loans,
  expandedLoanId,
  onToggleExpanded,
  onEdit,
  onStatusChange,
  canManage,
  isPending,
}: {
  title: string;
  description: string;
  loans: EmployeeLoanApiRecord[];
  expandedLoanId: number | null;
  onToggleExpanded: (loanId: number | null) => void;
  onEdit: (loan: EmployeeLoanApiRecord) => void;
  onStatusChange: (loanId: number, status: EmployeeLoanStatus) => void;
  canManage: boolean;
  isPending: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <div className="space-y-4">
        {loans.map((loan) => {
          const isExpanded = expandedLoanId === loan.id;

          return (
            <article
              key={loan.id}
              className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="text-lg font-semibold text-slate-950">
                      {loan.loan_type_name}
                    </h4>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${STATUS_STYLES[loan.status]}`}
                    >
                      {formatEmployeeLoanStatus(loan.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {loan.loan_name} · {loan.provider}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleExpanded(isExpanded ? null : loan.id)}
                    className="ui-button-secondary"
                  >
                    {isExpanded ? "Hide History" : "View History"}
                  </button>

                  {canManage ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit(loan)}
                        disabled={isPending}
                        className="ui-button-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <PencilLine className="h-4 w-4" />
                        Edit
                      </button>
                      <LoanStatusActions
                        loan={loan}
                        isPending={isPending}
                        onStatusChange={onStatusChange}
                      />
                    </>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <LoanMetric label="Monthly Deduction" value={formatCurrency(loan.monthly_deduction)} />
                <LoanMetric label="Start Date" value={formatDate(loan.start_date)} />
                <LoanMetric
                  label="Paid Installments"
                  value={`${loan.payments_made_count} / ${loan.term_months}`}
                />
                <LoanMetric
                  label="Remaining Installments"
                  value={String(loan.remaining_terms)}
                />
                <LoanMetric
                  label="Schedule"
                  value={formatEmployeeLoanDeductionSchedule(loan.deduction_schedule)}
                />
                <LoanMetric
                  label="Deduction Mode"
                  value={formatEmployeeLoanDeductionMode(loan.deduction_mode)}
                />
                <LoanMetric
                  label="Remaining Balance"
                  value={
                    loan.remaining_balance != null
                      ? formatCurrency(loan.remaining_balance)
                      : "Not tracked"
                  }
                />
                <LoanMetric
                  label="Estimated Completion"
                  value={loan.estimated_completion_label ?? "Not available"}
                />
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <ProgressPanel
                  label="Installment Progress"
                  value={`${loan.payments_made_count} of ${loan.term_months} installments`}
                  progress={getInstallmentProgressPercentage(loan)}
                  caption={`${loan.remaining_terms} installment(s) remaining`}
                />
                <ProgressPanel
                  label="Balance Progress"
                  value={
                    loan.total_loan_amount
                      ? `${formatCurrency(loan.total_deducted_amount)} of ${formatCurrency(loan.total_loan_amount)}`
                      : "Total loan amount not tracked"
                  }
                  progress={getBalanceProgressPercentage(loan)}
                  caption={
                    loan.remaining_balance != null
                      ? `${formatCurrency(loan.remaining_balance)} remaining balance`
                      : "Remaining balance is not tracked for this loan"
                  }
                />
              </div>

              {loan.remarks ? (
                <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
                  <DetailItem
                    label="Remarks"
                    value={loan.remarks}
                    valueClassName="leading-6 text-slate-700"
                  />
                </div>
              ) : null}

              {isExpanded ? (
                <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                  <div className="flex flex-col gap-1">
                    <h5 className="text-sm font-semibold text-slate-950">
                      Deduction History
                    </h5>
                    <p className="text-sm leading-6 text-slate-600">
                      Posted payroll deductions already recorded for this loan.
                    </p>
                  </div>

                  {loan.deductions.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {loan.deductions.map((deduction) => (
                        <div
                          key={deduction.id}
                          className="grid gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 md:grid-cols-4"
                        >
                          <DetailItem
                            label="Deduction Date"
                            value={formatDate(deduction.deduction_date)}
                          />
                          <DetailItem
                            label="Amount"
                            value={formatCurrency(deduction.deducted_amount)}
                          />
                          <DetailItem
                            label="Installment"
                            value={`#${deduction.installment_number}`}
                          />
                          <DetailItem
                            label="Payroll Batch"
                            value={`Batch ${deduction.payroll_batch_id}`}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-500">
                      No posted payroll deductions have been recorded for this loan yet.
                    </div>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function LoanStatusActions({
  loan,
  isPending,
  onStatusChange,
}: {
  loan: EmployeeLoanApiRecord;
  isPending: boolean;
  onStatusChange: (loanId: number, status: EmployeeLoanStatus) => void;
}) {
  return (
    <>
      {loan.status !== "active" && loan.status !== "completed" && loan.status !== "cancelled" ? (
        <button
          type="button"
          onClick={() => onStatusChange(loan.id, "active")}
          disabled={isPending}
          className="ui-button-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Play className="h-4 w-4" />
          Activate
        </button>
      ) : null}

      {(loan.status === "scheduled" || loan.status === "active") ? (
        <button
          type="button"
          onClick={() => onStatusChange(loan.id, "stopped")}
          disabled={isPending}
          className="ui-button-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Ban className="h-4 w-4" />
          Stop
        </button>
      ) : null}

      {loan.status !== "completed" && loan.status !== "cancelled" ? (
        <button
          type="button"
          onClick={() => onStatusChange(loan.id, "cancelled")}
          disabled={isPending}
          className="ui-button-secondary gap-2 text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Ban className="h-4 w-4" />
          Cancel
        </button>
      ) : null}

      {loan.status !== "completed" && loan.status !== "cancelled" ? (
        <button
          type="button"
          onClick={() => onStatusChange(loan.id, "completed")}
          disabled={isPending}
          className="ui-button-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircle2 className="h-4 w-4" />
          Complete
        </button>
      ) : null}
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
      <DetailItem
        label={label}
        value={value}
        valueClassName="text-base font-semibold text-slate-950"
      />
    </div>
  );
}

function LoanMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
      <DetailItem
        label={label}
        value={value}
        valueClassName="font-medium text-slate-900"
      />
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      {children}
      {error ? <span className="text-sm text-rose-700">{error}</span> : null}
    </label>
  );
}

function ProgressPanel({
  label,
  value,
  progress,
  caption,
}: {
  label: string;
  value: string;
  progress: number | null;
  caption: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <DetailItem
          label={label}
          value={value}
          valueClassName="font-medium text-slate-900"
        />
        <span className="text-sm font-semibold text-slate-700">
          {progress == null ? "--" : `${progress}%`}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-slate-900 transition-[width]"
          style={{ width: `${progress ?? 0}%` }}
        />
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{caption}</p>
    </div>
  );
}

function getFieldClassName(error?: string) {
  return cn(
    "ui-input",
    error && "border-rose-300 bg-rose-50/60 focus-visible:ring-rose-200",
  );
}

function MessageBanner({
  tone,
  message,
}: {
  tone: "success" | "error" | "warning";
  message: string;
}) {
  const toneClassName =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-rose-200 bg-rose-50 text-rose-900";

  return (
    <div className={`mt-5 rounded-2xl border px-4 py-4 text-sm leading-6 ${toneClassName}`}>
      {message}
    </div>
  );
}
