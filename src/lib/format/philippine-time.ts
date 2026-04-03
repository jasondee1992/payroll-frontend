export const PHILIPPINE_TIME_ZONE = "Asia/Manila";
export const PHILIPPINE_TIME_LABEL = "PH Time";

export function formatPhilippineDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }

  const formattedValue = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: PHILIPPINE_TIME_ZONE,
  }).format(date);

  return `${formattedValue} ${PHILIPPINE_TIME_LABEL}`;
}
