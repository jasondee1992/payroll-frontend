import { cn } from "@/lib/utils";

type FieldBaseProps = {
  id: string;
  label: string;
  required?: boolean;
  helperText?: string;
  disabled?: boolean;
};

type EmployeeInputFieldProps = FieldBaseProps & {
  type?: "text" | "date" | "email" | "number";
  placeholder?: string;
  defaultValue?: string;
  prefix?: string;
};

type EmployeeSelectFieldProps = FieldBaseProps & {
  options: string[];
  defaultValue?: string;
};

export function EmployeeInputField({
  id,
  label,
  required = false,
  helperText,
  type = "text",
  placeholder,
  defaultValue,
  disabled = false,
  prefix,
}: EmployeeInputFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <FieldLabel label={label} required={required} />
      <div
        className={cn(
          "flex h-12 items-center rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300 focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-900/10",
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
          type={type}
          placeholder={placeholder}
          defaultValue={defaultValue}
          disabled={disabled}
          className={cn(
            "h-full w-full rounded-2xl bg-transparent px-4 text-sm text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400",
            prefix && "rounded-l-none",
          )}
        />
      </div>
      {helperText ? (
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
  disabled = false,
}: EmployeeSelectFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <FieldLabel label={label} required={required} />
      <select
        id={id}
        defaultValue={defaultValue ?? options[0]}
        disabled={disabled}
        className="ui-select"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {helperText ? (
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
