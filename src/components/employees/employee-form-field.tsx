import type { ChangeEventHandler } from "react";
import { cn } from "@/lib/utils";

type FieldBaseProps = {
  id: string;
  label: string;
  required?: boolean;
  helperText?: string;
  disabled?: boolean;
  invalid?: boolean;
  errorText?: string;
};

type EmployeeInputFieldProps = FieldBaseProps & {
  type?: "text" | "date" | "email" | "number" | "time";
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  prefix?: string;
  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search";
  maxLength?: number;
};

type EmployeeSelectFieldProps = FieldBaseProps & {
  options: string[];
  defaultValue?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
};

export function EmployeeInputField({
  id,
  label,
  required = false,
  helperText,
  type = "text",
  placeholder,
  defaultValue,
  value,
  onChange,
  disabled = false,
  prefix,
  inputMode,
  maxLength,
  invalid = false,
  errorText,
}: EmployeeInputFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <FieldLabel label={label} required={required} />
      <div
        className={cn(
          "flex h-12 items-center rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300 focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-900/10",
          invalid &&
            "border-rose-300 bg-rose-50/40 hover:border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-500/10",
          disabled &&
            "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 hover:border-slate-200",
        )}
      >
        {prefix ? (
          <span className="border-r border-slate-200 px-4 text-sm font-medium text-slate-500">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          defaultValue={defaultValue}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          inputMode={inputMode}
          maxLength={maxLength}
          className={cn(
            "h-full w-full rounded-2xl bg-transparent px-4 text-sm text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400",
            prefix && "rounded-l-none",
          )}
        />
      </div>
      {errorText ? (
        <span className="text-xs leading-5 text-rose-600">{errorText}</span>
      ) : helperText ? (
        <span className="text-xs leading-5 text-slate-500">{helperText}</span>
      ) : null}
    </label>
  );
}

export function EmployeeSelectField({
  id,
  label,
  required = false,
  helperText,
  options,
  defaultValue,
  value,
  onChange,
  disabled = false,
  invalid = false,
  errorText,
}: EmployeeSelectFieldProps) {
  const selectProps =
    value !== undefined
      ? { value }
      : { defaultValue: defaultValue ?? options[0] };

  return (
    <label className="flex flex-col gap-2">
      <FieldLabel label={label} required={required} />
      <select
        id={id}
        name={id}
        {...selectProps}
        onChange={onChange}
        required={required}
        disabled={disabled}
        aria-invalid={invalid}
        className={cn(
          "ui-select",
          invalid &&
            "border-rose-300 bg-rose-50/40 text-slate-900 hover:border-rose-400 focus:border-rose-500 focus:ring-rose-500/10",
        )}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {errorText ? (
        <span className="text-xs leading-5 text-rose-600">{errorText}</span>
      ) : helperText ? (
        <span className="text-xs leading-5 text-slate-500">{helperText}</span>
      ) : null}
    </label>
  );
}

function FieldLabel({
  label,
  required,
}: {
  label: string;
  required: boolean;
}) {
  return (
    <span className="text-sm font-medium text-slate-700">
      {label}
      {required ? <span className="ml-1 text-rose-500">*</span> : null}
    </span>
  );
}
