import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type EmployeePaginationProps = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
};

export function EmployeePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
}: EmployeePaginationProps) {
  const pageNumbers = getVisiblePageNumbers(currentPage, totalPages);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm text-slate-600">
        Showing <span className="font-semibold text-slate-900">{startItem}</span> to{" "}
        <span className="font-semibold text-slate-900">{endItem}</span> of{" "}
        <span className="font-semibold text-slate-900">{totalItems}</span> employees
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <PaginationButton disabled>
          <ChevronLeft className="h-4 w-4" />
          Previous
        </PaginationButton>

        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            className={cn(
              "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-medium transition",
              pageNumber === currentPage
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            {pageNumber}
          </button>
        ))}

        <PaginationButton>
          Next
          <ChevronRight className="h-4 w-4" />
        </PaginationButton>
      </div>
    </div>
  );
}

function PaginationButton({
  children,
  disabled = false,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
    >
      {children}
    </button>
  );
}

function getVisiblePageNumbers(currentPage: number, totalPages: number) {
  const pages = new Set<number>([1, currentPage, totalPages]);

  if (currentPage > 1) {
    pages.add(currentPage - 1);
  }

  if (currentPage < totalPages) {
    pages.add(currentPage + 1);
  }

  return [...pages].sort((a, b) => a - b).slice(0, 5);
}
