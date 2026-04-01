function getDateValue(value: string) {
  return value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
}

export function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    ...options,
  }).format(getDateValue(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(getDateValue(value));
}

export function formatTime(value?: string) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(`1970-01-01T${value}`));
}

export function formatCurrency(value: string | number, currency = "PHP") {
  const numericValue = typeof value === "number" ? value : Number(value);

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

export function formatCompactCurrency(value: string | number, currency = "PHP") {
  const numericValue = typeof value === "number" ? value : Number(value);

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}
