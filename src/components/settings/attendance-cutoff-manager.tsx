"use client";

import { useEffect, useState } from "react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { RefreshCcw, Trash2 } from "lucide-react";
import {
  deleteAttendanceCutoff,
  getAttendanceCutoffs,
} from "@/lib/api/attendance";
import { formatDate } from "@/lib/format";
import { formatPhilippineDateTime } from "@/lib/format/philippine-time";
import type { AttendanceCutoffRecord } from "@/types/attendance";
import {
  ResourceEmptyState,
  ResourceErrorState,
  ResourceTableSkeleton,
} from "@/components/shared/resource-state";
import { SectionCard } from "@/components/ui/section-card";
import { cn } from "@/lib/utils";

ModuleRegistry.registerModules([AllCommunityModule]);

type AttendanceCutoffGridRow = AttendanceCutoffRecord & {
  cutoff_range: string;
  uploaded_summary: string;
  created_summary: string;
};

type AttendanceCutoffGridContext = {
  deletingCutoffId: number | null;
  onDeleteCutoff: (row: AttendanceCutoffGridRow) => void;
};

const STATUS_BADGE_CLASS_NAMES: Record<AttendanceCutoffRecord["status"], string> = {
  draft: "bg-slate-100 text-slate-700",
  under_review: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  locked: "bg-rose-100 text-rose-800",
};

const COLUMN_DEFS: ColDef<AttendanceCutoffGridRow>[] = [
  {
    headerName: "Cutoff Range",
    field: "cutoff_range",
    flex: 1.4,
    minWidth: 240,
  },
  {
    headerName: "Status",
    field: "status",
    width: 160,
    cellRenderer: (params: ICellRendererParams<AttendanceCutoffGridRow>) => {
      const status = params.data?.status;
      if (!status) {
        return null;
      }

      return (
        <span
          className={cn(
            "ui-badge capitalize",
            STATUS_BADGE_CLASS_NAMES[status],
          )}
        >
          {status.replace("_", " ")}
        </span>
      );
    },
  },
  {
    headerName: "Last Upload",
    field: "uploaded_summary",
    flex: 1.1,
    minWidth: 220,
  },
  {
    headerName: "Created",
    field: "created_summary",
    flex: 1.1,
    minWidth: 220,
  },
  {
    headerName: "Action",
    colId: "actions",
    width: 150,
    sortable: false,
    filter: false,
    suppressHeaderMenuButton: true,
    cellRenderer: (
      params: ICellRendererParams<
        AttendanceCutoffGridRow,
        unknown,
        AttendanceCutoffGridContext
      >,
    ) => {
      const row = params.data;
      const context = params.context;
      if (!row || !context) {
        return null;
      }

      const isDeleting = context.deletingCutoffId === row.id;
      const isLocked = row.status === "locked";

      return (
        <button
          type="button"
          className="ui-button-secondary h-9 px-3 text-xs"
          disabled={isDeleting || isLocked}
          onClick={() => context.onDeleteCutoff(row)}
        >
          {isDeleting ? "Deleting..." : isLocked ? "Locked" : "Delete"}
        </button>
      );
    },
  },
];

function toGridRows(cutoffs: AttendanceCutoffRecord[]): AttendanceCutoffGridRow[] {
  return cutoffs.map((cutoff) => ({
    ...cutoff,
    cutoff_range: `${formatDate(cutoff.cutoff_start)} to ${formatDate(cutoff.cutoff_end)}`,
    uploaded_summary: cutoff.uploaded_at
      ? formatPhilippineDateTime(cutoff.uploaded_at)
      : "No file uploaded yet",
    created_summary: formatPhilippineDateTime(cutoff.created_at),
  }));
}

export function AttendanceCutoffManager() {
  const [cutoffs, setCutoffs] = useState<AttendanceCutoffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingCutoffId, setDeletingCutoffId] = useState<number | null>(null);

  async function loadCutoffs() {
    setLoading(true);
    setLoadingError(null);

    try {
      const cutoffRecords = await getAttendanceCutoffs();
      setCutoffs(cutoffRecords);
    } catch (error) {
      setLoadingError(
        error instanceof Error
          ? error.message
          : "Unable to load attendance cutoff uploads.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCutoffs();
  }, []);

  async function handleDeleteCutoff(row: AttendanceCutoffGridRow) {
    if (row.status === "locked") {
      setActionError("Locked attendance cutoffs cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Delete the attendance cutoff for ${row.cutoff_range}? This removes the uploaded attendance, summaries, and review requests for that period.`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingCutoffId(row.id);
    setActionError(null);
    setSuccessMessage(null);

    try {
      await deleteAttendanceCutoff(row.id);
      setSuccessMessage(`Deleted attendance cutoff for ${row.cutoff_range}.`);
      await loadCutoffs();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to delete the attendance cutoff.",
      );
    } finally {
      setDeletingCutoffId(null);
    }
  }

  const gridRows = toGridRows(cutoffs);
  const uploadedCount = cutoffs.filter((cutoff) => cutoff.uploaded_at != null).length;
  const lockedCount = cutoffs.filter((cutoff) => cutoff.status === "locked").length;
  const draftCount = cutoffs.filter((cutoff) => cutoff.status === "draft").length;

  return (
    <div className="space-y-6">
      <nav className="panel-muted p-2">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-11 items-center rounded-2xl bg-white px-4 text-sm font-semibold text-slate-950 shadow-sm">
            Attendance Uploads
          </span>
        </div>
      </nav>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Total Cutoffs
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{cutoffs.length}</p>
          <p className="mt-2 text-sm text-slate-600">
            Every attendance cutoff currently saved for upload management.
          </p>
        </div>

        <div className="panel p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Uploaded Periods
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{uploadedCount}</p>
          <p className="mt-2 text-sm text-slate-600">
            Cutoffs that already have an attendance file attached.
          </p>
        </div>

        <div className="panel p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Locked Or Draft
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {lockedCount} / {draftCount}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Locked cutoffs stay protected. Draft cutoffs can still be cleaned up here.
          </p>
        </div>
      </section>

      <SectionCard
        title="Attendance cutoff uploads"
        description="Review uploaded cutoff ranges here and delete incorrect attendance periods before re-uploading a corrected file."
        action={(
          <button
            type="button"
            className="ui-button-secondary gap-2"
            onClick={() => {
              setActionError(null);
              setSuccessMessage(null);
              void loadCutoffs();
            }}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        )}
      >
        <div className="space-y-4">
          {successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {successMessage}
            </div>
          ) : null}

          {actionError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {actionError}
            </div>
          ) : null}

          <div className="rounded-[28px] border border-slate-200/80 bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-950">Uploaded cutoff ranges</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Delete is limited to the `admin-finance` role and locked cutoffs stay read-only.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                <Trash2 className="h-4 w-4" />
                Wrong cutoff upload can be deleted here.
              </div>
            </div>

            {loading ? <ResourceTableSkeleton filterCount={1} rowCount={5} /> : null}

            {!loading && loadingError ? (
              <ResourceErrorState
                title="Unable to load attendance uploads"
                description={loadingError}
                action={(
                  <button
                    type="button"
                    className="ui-button-secondary"
                    onClick={() => void loadCutoffs()}
                  >
                    Try again
                  </button>
                )}
              />
            ) : null}

            {!loading && !loadingError && gridRows.length === 0 ? (
              <ResourceEmptyState
                title="No attendance cutoffs yet"
                description="Create and upload an attendance cutoff first, then manage it here if the saved period needs correction."
              />
            ) : null}

            {!loading && !loadingError && gridRows.length > 0 ? (
              <div className="attendance-cutoff-grid ag-theme-quartz overflow-hidden rounded-[20px]">
                <AgGridReact<AttendanceCutoffGridRow>
                  rowData={gridRows}
                  columnDefs={COLUMN_DEFS}
                  context={{ deletingCutoffId, onDeleteCutoff: handleDeleteCutoff }}
                  domLayout="autoHeight"
                  pagination
                  paginationPageSize={10}
                  rowHeight={68}
                  defaultColDef={{
                    sortable: true,
                    filter: true,
                    resizable: true,
                    suppressMovable: true,
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
