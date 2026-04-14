"use client";

import { type ChangeEvent, useRef, useState } from "react";
import { Download, FileSpreadsheet, LoaderCircle, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { importEmployeesCsv } from "@/lib/api/employees";
import type { EmployeeImportSummary } from "@/types/employees";

type EmployeeImportExportControlsProps = {
  canManageEmployees: boolean;
};

export function EmployeeImportExportControls({
  canManageEmployees,
}: EmployeeImportExportControlsProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<EmployeeImportSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!canManageEmployees) {
    return null;
  }

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setErrorMessage("Employee import accepts CSV files that use the exported template.");
      setImportSummary(null);
      return;
    }

    setIsImporting(true);
    setErrorMessage(null);
    setImportSummary(null);

    try {
      const summary = await importEmployeesCsv(selectedFile);
      setImportSummary(summary);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to import employee CSV.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  function downloadCsv(url: string) {
    window.location.assign(url);
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="ui-button-secondary gap-2"
          onClick={() => downloadCsv("/api/employees/export?template=true")}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Template
        </button>
        <button
          type="button"
          className="ui-button-secondary gap-2"
          onClick={() => downloadCsv("/api/employees/export")}
        >
          <Download className="h-4 w-4" />
          Export
        </button>
        <button
          type="button"
          className="ui-button-primary gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
        >
          {isImporting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isImporting ? "Importing" : "Import"}
        </button>
      </div>

      <p className="max-w-[34rem] text-[11px] leading-5 text-slate-500 sm:text-right">
        Exported employee CSV files and the blank template use the same import columns for bulk upload.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileSelection}
      />

      {errorMessage ? (
        <div className="ui-state-banner ui-state-banner-error w-full max-w-[30rem] text-left" aria-live="polite">
          {errorMessage}
        </div>
      ) : null}

      {importSummary ? (
        <div
          className={`ui-state-banner w-full max-w-[34rem] text-left ${
            importSummary.error_count > 0
              ? "ui-state-banner-warning"
              : "ui-state-banner-success"
          }`}
        >
          <p className="text-[12px] leading-5">
            Imported {importSummary.total_rows} row{importSummary.total_rows === 1 ? "" : "s"}.
            {" "}
            Created {importSummary.created_count}, updated {importSummary.updated_count}.
            {importSummary.error_count > 0
              ? ` ${importSummary.error_count} row${importSummary.error_count === 1 ? "" : "s"} need attention.`
              : ""}
          </p>
          {importSummary.errors.length > 0 ? (
            <div className="mt-3 space-y-1 text-xs leading-5">
              {importSummary.errors.slice(0, 5).map((item) => (
                <p key={`${item.row_number}-${item.employee_code ?? "row"}`}>
                  Row {item.row_number}
                  {item.employee_code ? ` (${item.employee_code})` : ""}: {item.message}
                </p>
              ))}
              {importSummary.errors.length > 5 ? (
                <p>
                  Showing 5 of {importSummary.errors.length} returned row errors.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
