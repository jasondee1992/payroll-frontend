"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EmployeeManagerOption } from "@/types/employees";
import { cn } from "@/lib/utils";

type EmployeeSearchSelectFieldProps = {
  id: string;
  label: string;
  options: EmployeeManagerOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
};

export function EmployeeSearchSelectField({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = "Search active employee...",
  helperText,
  disabled = false,
}: EmployeeSearchSelectFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value) ?? null;
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(selectedOption?.label ?? "");

  useEffect(() => {
    setQuery(selectedOption?.label ?? "");
  }, [selectedOption?.label]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => {
      return (
        option.label.toLowerCase().includes(normalizedQuery) ||
        option.description.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [options, query]);

  function handleQueryChange(nextValue: string) {
    setQuery(nextValue);
    setIsOpen(true);

    if (selectedOption && nextValue.trim() !== selectedOption.label) {
      onChange("");
    }
  }

  function handleSelect(option: EmployeeManagerOption) {
    onChange(option.value);
    setQuery(option.label);
    setIsOpen(false);
  }

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>

      <div ref={containerRef} className="relative">
        <input
          id={`${id}-search`}
          type="search"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={cn(
            "ui-input pr-24",
            disabled && "cursor-not-allowed bg-slate-100 text-slate-400",
          )}
        />
        <input id={id} name={id} type="hidden" value={value} />

        <div className="pointer-events-none absolute inset-y-0 right-12 flex items-center text-slate-400">
          <Search className="h-4 w-4" />
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          disabled={disabled}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300"
          aria-label={isOpen ? "Close employee list" : "Open employee list"}
        >
          <ChevronDown
            className={cn("h-4 w-4 transition", isOpen && "rotate-180")}
          />
        </button>

        {isOpen ? (
          <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-[24px] border border-slate-200/80 bg-white p-2 shadow-xl shadow-slate-950/10">
            {filteredOptions.length > 0 ? (
              <div className="space-y-1">
                {filteredOptions.map((option) => {
                  const isSelected = option.value === value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option)}
                      className={cn(
                        "flex w-full items-start justify-between gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50",
                        isSelected && "bg-slate-900 text-white hover:bg-slate-900",
                      )}
                    >
                      <div>
                        <p className="text-sm font-semibold">{option.label}</p>
                        <p
                          className={cn(
                            "mt-1 text-xs leading-5 text-slate-500",
                            isSelected && "text-slate-200",
                          )}
                        >
                          {option.description}
                        </p>
                      </div>
                      {isSelected ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-sm leading-6 text-slate-500">
                No active employee matched your search.
              </div>
            )}
          </div>
        ) : null}
      </div>

      {selectedOption ? (
        <span className="text-xs leading-5 text-slate-500">
          Selected: {selectedOption.description}
        </span>
      ) : helperText ? (
        <span className="text-xs leading-5 text-slate-500">{helperText}</span>
      ) : null}
    </label>
  );
}
