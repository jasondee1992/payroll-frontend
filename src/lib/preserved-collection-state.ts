type PreservableValue = number | string;

type PreserveCurrentValueOptions<T extends PreservableValue> = {
  fallbackValue?: T | null;
  preferFirst?: boolean;
};

export function preserveCurrentValue<T extends PreservableValue>(
  availableValues: readonly T[],
  currentValue: T | null | undefined,
  options?: PreserveCurrentValueOptions<T>,
) {
  if (currentValue != null && availableValues.includes(currentValue)) {
    return currentValue;
  }

  if (
    options?.fallbackValue != null &&
    availableValues.includes(options.fallbackValue)
  ) {
    return options.fallbackValue;
  }

  if (options?.preferFirst === false) {
    return null;
  }

  return availableValues[0] ?? null;
}

export function preserveCurrentValues<T extends PreservableValue>(
  availableValues: readonly T[],
  currentValues: readonly T[],
) {
  const availableValueSet = new Set(availableValues);
  return currentValues.filter((value) => availableValueSet.has(value));
}
