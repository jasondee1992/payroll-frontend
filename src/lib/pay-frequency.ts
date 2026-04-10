import type { PayFrequency } from "@/types/employees";
import { formatCurrency } from "@/lib/format";

export const PAY_FREQUENCY_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "semi_monthly", label: "Semi-monthly" },
  { value: "bi_weekly", label: "Bi-weekly" },
  { value: "weekly", label: "Weekly" },
] as const;

export const PAY_FREQUENCY_LABELS: PayFrequency[] = PAY_FREQUENCY_OPTIONS.map(
  (option) => option.label,
);

export type PayFrequencyPreview = {
  payFrequency: PayFrequency;
  monthlyAmount: string;
  perPayrollAmount: string;
  formulaLabel: string;
  helperText: string;
};

export function normalizePayFrequency(value: string): PayFrequency {
  const normalizedValue = value.trim().toLowerCase().replace(/[_\s]+/g, "-");

  if (normalizedValue === "semi-monthly" || normalizedValue === "semimonthly") {
    return "Semi-monthly";
  }

  if (normalizedValue === "bi-weekly" || normalizedValue === "biweekly") {
    return "Bi-weekly";
  }

  if (normalizedValue === "weekly") {
    return "Weekly";
  }

  return "Monthly";
}

export function computePayFrequencyGrossPay(
  monthlySalaryValue: string | number,
  payFrequency: string,
) {
  const monthlySalary =
    typeof monthlySalaryValue === "number"
      ? monthlySalaryValue
      : Number(monthlySalaryValue);
  const normalizedFrequency = payFrequency.trim().toLowerCase().replace(/[-\s]+/g, "_");

  if (!Number.isFinite(monthlySalary) || monthlySalary <= 0) {
    return "";
  }

  let grossPay = monthlySalary;
  if (normalizedFrequency === "semi_monthly") {
    grossPay = monthlySalary / 2;
  } else if (normalizedFrequency === "bi_weekly") {
    grossPay = (monthlySalary * 12) / 26;
  } else if (normalizedFrequency === "weekly") {
    grossPay = (monthlySalary * 12) / 52;
  }

  return grossPay.toFixed(2);
}

export function describePayFrequencyFormula(payFrequency: string) {
  const normalizedFrequency = normalizePayFrequency(payFrequency);

  if (normalizedFrequency === "Semi-monthly") {
    return "Monthly amount / 2";
  }

  if (normalizedFrequency === "Bi-weekly") {
    return "(Monthly amount x 12) / 26";
  }

  if (normalizedFrequency === "Weekly") {
    return "(Monthly amount x 12) / 52";
  }

  return "Monthly amount";
}

export function buildPayFrequencyPreview(
  monthlyAmount: string | number,
  payFrequency: string,
): PayFrequencyPreview {
  const normalizedPayFrequency = normalizePayFrequency(payFrequency);
  const normalizedMonthlyAmount =
    typeof monthlyAmount === "number" ? monthlyAmount : Number(monthlyAmount);
  const perPayrollAmount = computePayFrequencyGrossPay(
    normalizedMonthlyAmount,
    normalizedPayFrequency,
  );
  const formattedMonthlyAmount =
    Number.isFinite(normalizedMonthlyAmount) && normalizedMonthlyAmount > 0
      ? formatCurrency(normalizedMonthlyAmount)
      : formatCurrency(0);
  const formattedPerPayrollAmount = perPayrollAmount
    ? formatCurrency(perPayrollAmount)
    : formatCurrency(0);
  const formulaLabel = describePayFrequencyFormula(normalizedPayFrequency);

  return {
    payFrequency: normalizedPayFrequency,
    monthlyAmount: formattedMonthlyAmount,
    perPayrollAmount: formattedPerPayrollAmount,
    formulaLabel,
    helperText: `${normalizedPayFrequency} uses ${formulaLabel}.`,
  };
}
