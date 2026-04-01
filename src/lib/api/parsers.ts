type UnknownRecord = Record<string, unknown>;

function getParserError(message: string) {
  return new Error(`Invalid API response: ${message}`);
}

export function parseCollection<T>(
  value: unknown,
  parseItem: (item: unknown, index: number) => T,
  label: string,
) {
  if (!Array.isArray(value)) {
    throw getParserError(`Expected ${label} to be an array.`);
  }

  return value.map((item, index) => parseItem(item, index));
}

export function parseRecord(value: unknown, label: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw getParserError(`Expected ${label} to be an object.`);
  }

  return value as UnknownRecord;
}

export function parseString(
  value: unknown,
  label: string,
): string;
export function parseString(
  value: unknown,
  label: string,
  options: { optional: true },
): string | undefined;
export function parseString(
  value: unknown,
  label: string,
  options?: { optional?: boolean },
): string | undefined {
  if (value == null || value === "") {
    if (options?.optional) {
      return undefined;
    }

    throw getParserError(`Expected ${label} to be a non-empty string.`);
  }

  if (typeof value !== "string") {
    throw getParserError(`Expected ${label} to be a string.`);
  }

  return value;
}

export function parseBoolean(value: unknown, label: string) {
  if (typeof value !== "boolean") {
    throw getParserError(`Expected ${label} to be a boolean.`);
  }

  return value;
}

export function parseNumber(value: unknown, label: string) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw getParserError(`Expected ${label} to be a number.`);
  }

  return value;
}

export function parseNumericString(value: unknown, label: string): string;
export function parseNumericString(
  value: unknown,
  label: string,
  options: { optional: true },
): string | undefined;
export function parseNumericString(
  value: unknown,
  label: string,
  options?: { optional?: boolean },
): string | undefined {
  if (value == null || value === "") {
    if (options?.optional) {
      return undefined;
    }

    throw getParserError(`Expected ${label} to be a numeric string or number.`);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  throw getParserError(`Expected ${label} to be a numeric string or number.`);
}
