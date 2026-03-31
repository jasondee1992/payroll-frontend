import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function AuthInput({
  className,
  label,
  id,
  type = "text",
  ...props
}: AuthInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        className={cn("ui-input", className)}
        {...props}
      />
    </div>
  );
}
