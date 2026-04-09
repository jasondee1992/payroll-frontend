"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  CalendarDays,
  CalendarRange,
  Pencil,
  Plus,
  Power,
  RefreshCcw,
  RotateCcw,
  Save,
} from "lucide-react";
import {
  createHoliday,
  deactivateHoliday,
  getHolidays,
  updateHoliday,
  type HolidayPayload,
} from "@/lib/api/holidays";
import { formatDate, formatWeekday } from "@/lib/format";
import type { HolidayRecord } from "@/types/holidays";
import {
  ResourceEmptyState,
  ResourceErrorState,
  ResourceTableSkeleton,
} from "@/components/shared/resource-state";
import { SectionCard } from "@/components/ui/section-card";
import {
  DataTableBodyCell,
  DataTableHeaderCell,
  DataTableRow,
  DataTableShell,
} from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

type HolidayDraft = {
  holiday_date: string;
  holiday_name: string;
  holiday_type: string;
  applies_nationally: boolean;
  applies_to_location: string;
  is_paid: boolean;
  remarks: string;
  active: boolean;
};

type FilterStatus = "all" | "active" | "inactive";

const HOLIDAY_TYPE_OPTIONS = [
  "Regular Holiday",
  "Special Non-Working Holiday",
  "Company Holiday",
  "Local Holiday",
] as const;

const EMPTY_DRAFT: HolidayDraft = {
  holiday_date: "",
  holiday_name: "",
  holiday_type: "Regular Holiday",
  applies_nationally: true,
  applies_to_location: "",
  is_paid: true,
  remarks: "",
  active: true,
};

async function queryHolidayCollection(
  yearFilter: string,
  dateFromFilter: string,
  dateToFilter: string,
  holidayTypeFilter: string,
  locationFilter: string,
  statusFilter: FilterStatus,
) {
  const parsedYear = Number(yearFilter);

  return getHolidays({
    year: Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : undefined,
    dateFrom: dateFromFilter || undefined,
    dateTo: dateToFilter || undefined,
    holidayType: holidayTypeFilter === "all" ? null : holidayTypeFilter,
    appliesToLocation: locationFilter.trim() || null,
    active:
      statusFilter === "all"
        ? null
        : statusFilter === "active",
  });
}

export function HolidayCalendarWorkspace({ canManage }: { canManage: boolean }) {
  const currentYear = new Date().getFullYear();
  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedHolidayId, setSelectedHolidayId] = useState<number | null>(null);
  const [draft, setDraft] = useState<HolidayDraft>(EMPTY_DRAFT);
  const [yearFilter, setYearFilter] = useState(String(currentYear));
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [holidayTypeFilter, setHolidayTypeFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const nextHolidays = await queryHolidayCollection(
          yearFilter,
          dateFromFilter,
          dateToFilter,
          holidayTypeFilter,
          locationFilter,
          statusFilter,
        );
        setHolidays(nextHolidays);
      } catch (nextError) {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Unable to load the holiday calendar.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [dateFromFilter, dateToFilter, yearFilter, holidayTypeFilter, locationFilter, statusFilter]);

  async function loadHolidays() {
    setLoading(true);
    setError(null);

    try {
      const nextHolidays = await queryHolidayCollection(
        yearFilter,
        dateFromFilter,
        dateToFilter,
        holidayTypeFilter,
        locationFilter,
        statusFilter,
      );
      setHolidays(nextHolidays);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to load the holiday calendar.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = buildPayload(draft);
      const savedHoliday = selectedHolidayId
        ? await updateHoliday(selectedHolidayId, payload)
        : await createHoliday(payload);

      setMessage(
        selectedHolidayId
          ? `${savedHoliday.holiday_name} was updated.`
          : `${savedHoliday.holiday_name} was added to the holiday calendar.`,
      );
      setSelectedHolidayId(savedHoliday.id);
      setDraft(buildDraftFromHoliday(savedHoliday));
      await loadHolidays();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to save the holiday record.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(holiday: HolidayRecord) {
    const confirmed = window.confirm(
      `Deactivate ${holiday.holiday_name} on ${formatDate(holiday.holiday_date)}?`,
    );
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const updatedHoliday = await deactivateHoliday(
        holiday.id,
        `Deactivated from the holiday calendar workspace on ${new Date().toISOString()}.`,
      );
      setMessage(`${updatedHoliday.holiday_name} was deactivated.`);
      if (selectedHolidayId === holiday.id) {
        setSelectedHolidayId(updatedHoliday.id);
        setDraft(buildDraftFromHoliday(updatedHoliday));
      }
      await loadHolidays();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to deactivate the holiday.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(holiday: HolidayRecord) {
    if (!canManage) {
      return;
    }
    setSelectedHolidayId(holiday.id);
    setDraft(buildDraftFromHoliday(holiday));
    setMessage(null);
    setError(null);
  }

  function resetDraft() {
    if (!canManage) {
      return;
    }
    setSelectedHolidayId(null);
    setDraft(EMPTY_DRAFT);
    setMessage(null);
    setError(null);
  }

  const activeHolidays = holidays.filter((holiday) => holiday.active);
  const paidHolidayCount = activeHolidays.filter((holiday) => holiday.is_paid).length;
  const nationalHolidayCount = activeHolidays.filter(
    (holiday) => holiday.applies_nationally,
  ).length;
  const locationHolidayCount = activeHolidays.filter(
    (holiday) => !holiday.applies_nationally,
  ).length;
  const groupedByMonth = groupHolidaysByMonth(activeHolidays);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Active holidays"
          value={String(activeHolidays.length)}
          description="Records currently active in this calendar year view."
          icon={CalendarRange}
        />
        <SummaryCard
          label="Paid holidays"
          value={String(paidHolidayCount)}
          description="Configured as paid non-working days for payroll use."
          icon={CalendarDays}
        />
        <SummaryCard
          label="National scope"
          value={String(nationalHolidayCount)}
          description="Applies nationally without extra location matching."
          icon={CalendarRange}
        />
        <SummaryCard
          label="Location scope"
          value={String(locationHolidayCount)}
          description="Stored for branch, local, or company-specific handling."
          icon={CalendarDays}
        />
      </section>

      <SectionCard
        title="Calendar Overview"
        description="Scan the active holiday calendar in date order before attendance uploads and payroll processing."
        action={
          <button
            type="button"
            onClick={() => void loadHolidays()}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        }
      >
        {loading ? (
          <ResourceTableSkeleton filterCount={2} rowCount={4} />
        ) : error && holidays.length === 0 ? (
          <ResourceErrorState
            title="Unable to load holiday overview"
            description={error}
          />
        ) : groupedByMonth.length === 0 ? (
          <ResourceEmptyState
            title="No holidays configured"
            description="Add regular, special non-working, company, or local holiday rules so attendance and payroll can reference them."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {groupedByMonth.map((group) => (
              <section key={group.label} className="panel-subtle rounded-[24px] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {group.label}
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-slate-950">
                      {group.items.length} configured day{group.items.length === 1 ? "" : "s"}
                    </h3>
                  </div>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    {group.items.filter((item) => item.is_paid).length} paid
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {group.items.map((holiday) => (
                    <article
                      key={holiday.id}
                      className="rounded-[20px] border border-slate-200 bg-white px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                            <span className="text-xs font-semibold uppercase text-slate-500">
                              {formatMonthOnly(holiday.holiday_date)}
                            </span>
                            <span className="text-sm font-semibold">
                              {formatDayNumber(holiday.holiday_date)}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-950">
                              {holiday.holiday_name}
                            </h4>
                            <p className="mt-1 text-sm text-slate-600">
                              {formatWeekday(holiday.holiday_date)} · {getScopeLabel(holiday)}
                            </p>
                          </div>
                        </div>
                        <HolidayTypeBadge holidayType={holiday.holiday_type} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.95fr)]">
        <SectionCard
          title="Configured Holidays"
          description="Filter the calendar, review holiday scope and paid status, and edit or deactivate individual entries."
        >
          <div className="grid gap-4 xl:grid-cols-[140px_170px_170px_200px_minmax(0,1fr)_180px]">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <span>Year</span>
              <input
                type="number"
                min={1900}
                max={3000}
                value={yearFilter}
                onChange={(event) => setYearFilter(event.target.value)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <span>Date from</span>
              <input
                type="date"
                value={dateFromFilter}
                onChange={(event) => setDateFromFilter(event.target.value)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <span>Date to</span>
              <input
                type="date"
                value={dateToFilter}
                onChange={(event) => setDateToFilter(event.target.value)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <span>Holiday Type</span>
              <select
                value={holidayTypeFilter}
                onChange={(event) => setHolidayTypeFilter(event.target.value)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value="all">All holiday types</option>
                {HOLIDAY_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <span>Location</span>
              <input
                type="text"
                value={locationFilter}
                onChange={(event) => setLocationFilter(event.target.value)}
                placeholder="HQ, Cebu Branch, Davao City"
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as FilterStatus)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value="all">All records</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </label>
          </div>

          {!canManage ? (
            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              Finance users can review the holiday calendar here, but add, edit, and deactivate
              actions remain restricted to Admin, Admin-Finance, and HR roles.
            </div>
          ) : null}

          {message ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6">
              <ResourceTableSkeleton filterCount={3} rowCount={5} />
            </div>
          ) : holidays.length === 0 ? (
            <div className="mt-6">
              <ResourceEmptyState
                title="No holiday records found"
                description="Adjust the filters above or add the first holiday for this payroll year."
              />
            </div>
          ) : (
            <div className="mt-6">
              <DataTableShell className="hidden xl:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead className="bg-slate-50/80">
                      <tr className="text-left">
                        <DataTableHeaderCell>Date</DataTableHeaderCell>
                        <DataTableHeaderCell>Holiday</DataTableHeaderCell>
                        <DataTableHeaderCell>Type</DataTableHeaderCell>
                        <DataTableHeaderCell>Scope</DataTableHeaderCell>
                        <DataTableHeaderCell>Paid</DataTableHeaderCell>
                        <DataTableHeaderCell>Status</DataTableHeaderCell>
                        {canManage ? <DataTableHeaderCell>Actions</DataTableHeaderCell> : null}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {holidays.map((holiday) => (
                        <DataTableRow
                          key={holiday.id}
                          selected={selectedHolidayId === holiday.id}
                          onClick={canManage ? () => handleEdit(holiday) : undefined}
                        >
                          <DataTableBodyCell>
                            <div>
                              <p className="font-semibold text-slate-950">
                                {formatDate(holiday.holiday_date)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {formatWeekday(holiday.holiday_date)}
                              </p>
                            </div>
                          </DataTableBodyCell>
                          <DataTableBodyCell>
                            <div>
                              <p className="font-semibold text-slate-950">
                                {holiday.holiday_name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {holiday.remarks || "No remarks recorded."}
                              </p>
                            </div>
                          </DataTableBodyCell>
                          <DataTableBodyCell>
                            <HolidayTypeBadge holidayType={holiday.holiday_type} />
                          </DataTableBodyCell>
                          <DataTableBodyCell>{getScopeLabel(holiday)}</DataTableBodyCell>
                          <DataTableBodyCell>
                            <StatusPill tone={holiday.is_paid ? "emerald" : "amber"}>
                              {holiday.is_paid ? "Paid" : "Unpaid"}
                            </StatusPill>
                          </DataTableBodyCell>
                          <DataTableBodyCell>
                            <StatusPill tone={holiday.active ? "slate" : "rose"}>
                              {holiday.active ? "Active" : "Inactive"}
                            </StatusPill>
                          </DataTableBodyCell>
                          {canManage ? (
                            <DataTableBodyCell>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleEdit(holiday);
                                  }}
                                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                >
                                  <Pencil className="h-4 w-4" />
                                  Edit
                                </button>
                                {holiday.active ? (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleDeactivate(holiday);
                                    }}
                                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                                  >
                                    <Power className="h-4 w-4" />
                                    Deactivate
                                  </button>
                                ) : null}
                              </div>
                            </DataTableBodyCell>
                          ) : null}
                        </DataTableRow>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DataTableShell>

              <div className="grid gap-3 xl:hidden">
                {holidays.map((holiday) => (
                  <article
                    key={holiday.id}
                    className={cn(
                      "panel-subtle rounded-[24px] p-4 shadow-sm transition",
                      selectedHolidayId === holiday.id && "border-slate-400",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {formatDate(holiday.holiday_date)}
                        </p>
                        <h3 className="mt-2 text-base font-semibold text-slate-950">
                          {holiday.holiday_name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {holiday.holiday_type} · {getScopeLabel(holiday)}
                        </p>
                      </div>
                      <StatusPill tone={holiday.active ? "slate" : "rose"}>
                        {holiday.active ? "Active" : "Inactive"}
                      </StatusPill>
                    </div>

                    <p className="mt-4 text-sm text-slate-600">
                      {holiday.remarks || "No remarks recorded."}
                    </p>

                    {canManage ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(holiday)}
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                        {holiday.active ? (
                          <button
                            type="button"
                            onClick={() => void handleDeactivate(holiday)}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                          >
                            <Power className="h-4 w-4" />
                            Deactivate
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {canManage ? (
          <SectionCard
            title={selectedHolidayId ? "Edit Holiday" : "Add Holiday"}
            description="Keep holiday rules explicit. Use paid status only when payroll should suppress absence deductions for the configured day."
            action={
              <button
                type="button"
                onClick={resetDraft}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            }
          >
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>Holiday date</span>
                  <input
                    type="date"
                    value={draft.holiday_date}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        holiday_date: event.target.value,
                      }))
                    }
                    required
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>Holiday name</span>
                  <input
                    type="text"
                    value={draft.holiday_name}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        holiday_name: event.target.value,
                      }))
                    }
                    required
                    placeholder="Example: Independence Day"
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>Holiday type</span>
                  <select
                    value={draft.holiday_type}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        holiday_type: event.target.value,
                      }))
                    }
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  >
                    {HOLIDAY_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={draft.applies_nationally}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        applies_nationally: event.target.checked,
                        applies_to_location: event.target.checked
                          ? ""
                          : current.applies_to_location,
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
                  />
                  <span className="text-sm text-slate-700">
                    This holiday applies nationally and does not require a location match.
                  </span>
                </label>

                {!draft.applies_nationally ? (
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                    <span>Location scope</span>
                    <input
                      type="text"
                      value={draft.applies_to_location}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          applies_to_location: event.target.value,
                        }))
                      }
                      placeholder="Example: HQ, Cebu Branch, Davao City"
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    />
                  </label>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={draft.is_paid}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          is_paid: event.target.checked,
                        }))
                      }
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
                    />
                    <span className="text-sm text-slate-700">
                      Paid day. Current payroll integration treats this as a non-deductible absence day.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={draft.active}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          active: event.target.checked,
                        }))
                      }
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
                    />
                    <span className="text-sm text-slate-700">
                      Keep this record active for attendance and payroll matching.
                    </span>
                  </label>
                </div>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>Remarks</span>
                  <textarea
                    value={draft.remarks}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        remarks: event.target.value,
                      }))
                    }
                    rows={4}
                    placeholder="Optional operational notes for HR, Finance, or payroll reviewers."
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {selectedHolidayId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {saving
                  ? "Saving..."
                  : selectedHolidayId
                    ? "Save Holiday Changes"
                    : "Add Holiday"}
              </button>
            </form>
          </SectionCard>
        ) : (
          <SectionCard
            title="Calendar Usage Notes"
            description="Holiday records already feed attendance summary and payroll absence handling. Finance can review the configured calendar here before payroll runs are calculated."
          >
            <div className="space-y-3 text-sm leading-6 text-slate-600">
              <p>
                Paid holidays currently prevent absence deductions during attendance review and payroll computation.
              </p>
              <p>
                Rest days remain schedule-driven through employee work days, so this screen stays focused on configured holiday records rather than duplicate schedule logic.
              </p>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: typeof CalendarRange;
}) {
  return (
    <article className="panel-strong p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

function HolidayTypeBadge({ holidayType }: { holidayType: HolidayRecord["holiday_type"] }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {holidayType}
    </span>
  );
}

function StatusPill({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "slate" | "emerald" | "amber" | "rose";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        tone === "slate" && "bg-slate-100 text-slate-700",
        tone === "emerald" && "bg-emerald-100 text-emerald-800",
        tone === "amber" && "bg-amber-100 text-amber-800",
        tone === "rose" && "bg-rose-100 text-rose-700",
      )}
    >
      {children}
    </span>
  );
}

function buildDraftFromHoliday(holiday: HolidayRecord): HolidayDraft {
  return {
    holiday_date: holiday.holiday_date,
    holiday_name: holiday.holiday_name,
    holiday_type: holiday.holiday_type,
    applies_nationally: holiday.applies_nationally,
    applies_to_location: holiday.applies_to_location ?? "",
    is_paid: holiday.is_paid,
    remarks: holiday.remarks ?? "",
    active: holiday.active,
  };
}

function buildPayload(draft: HolidayDraft): HolidayPayload {
  return {
    holiday_date: draft.holiday_date,
    holiday_name: draft.holiday_name.trim(),
    holiday_type: draft.holiday_type,
    applies_nationally: draft.applies_nationally,
    applies_to_location: draft.applies_nationally
      ? null
      : draft.applies_to_location.trim() || null,
    is_paid: draft.is_paid,
    remarks: draft.remarks.trim() || null,
    active: draft.active,
  };
}

function getScopeLabel(holiday: HolidayRecord) {
  if (holiday.applies_nationally) {
    return "National";
  }

  if (holiday.applies_to_location) {
    return holiday.applies_to_location;
  }

  return "Company-wide";
}

function groupHolidaysByMonth(holidays: HolidayRecord[]) {
  const groups = new Map<string, HolidayRecord[]>();

  for (const holiday of holidays) {
    const label = formatMonthYear(holiday.holiday_date);
    const existing = groups.get(label) ?? [];
    existing.push(holiday);
    groups.set(label, existing);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items,
  }));
}

function formatMonthOnly(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDayNumber(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
  }).format(new Date(`${value}T00:00:00`));
}

function formatMonthYear(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
