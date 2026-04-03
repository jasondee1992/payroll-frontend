"use client";

type ExportPayrollResultsButtonProps = {
  rows: Array<{
    employeeId: string;
    name: string;
    grossPay: string;
    deductions: string;
    tax: string;
    netPay: string;
    status: string;
  }>;
  fileName?: string;
};

export function ExportPayrollResultsButton({
  rows,
  fileName = "payroll-results.csv",
}: ExportPayrollResultsButtonProps) {
  function handleExport() {
    const headers = [
      "Employee ID",
      "Name",
      "Gross Pay",
      "Deductions",
      "Tax",
      "Net Pay",
      "Status",
    ];
    const csvLines = [
      headers.join(","),
      ...rows.map((row) =>
        [
          row.employeeId,
          row.name,
          row.grossPay,
          row.deductions,
          row.tax,
          row.netPay,
          row.status,
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];

    const blob = new Blob([csvLines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(objectUrl);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={rows.length === 0}
      className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/10 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
    >
      Export Results
    </button>
  );
}
