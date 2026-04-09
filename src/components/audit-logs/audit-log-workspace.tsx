"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { History, RefreshCw, ShieldAlert, Users } from "lucide-react";
import { ResourceEmptyState, ResourceErrorState, ResourceTableSkeleton } from "@/components/shared/resource-state";
import { SectionCard } from "@/components/ui/section-card";
import { getAuditLogs } from "@/lib/api/audit-logs";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/auth/session";
import type { AuditLogRecord } from "@/types/audit-log";

type AuditLogFilters = {
  dateFrom: string;
  dateTo: string;
  module: string;
  actionType: string;
  actor: string;
  entityType: string;
};

const MODULE_OPTIONS = [
  "",
  "employees",
  "users",
  "attendance",
  "leave",
  "overtime",
  "payroll",
  "loans",
  "adjustments",
  "settings",
  "auth",
];

const ACTION_OPTIONS = [
  "",
  "submit",
  "create",
  "update",
  "deactivate",
  "role_change",
  "password_change",
  "approve",
  "reject",
  "cancel",
  "lock",
  "unlock",
  "calculate",
  "recalculate",
  "review",
  "finalize",
  "release",
  "apply",
  "activate",
  "archive",
  "clone",
  "delete",
  "status_update",
  "complete",
];

const ENTITY_OPTIONS = [
  "",
  "employee",
  "user",
  "attendance_request",
  "attendance_cutoff",
  "time_request",
  "payroll_batch",
  "employee_payroll_cutoff_status",
  "employee_loan",
  "manual_payroll_adjustment",
  "government_deduction_rule_set",
  "payroll_policy_profile",
];

const BADGE_STYLES: Record<string, string> = {
  payroll: "ui-badge-warning",
  settings: "ui-badge-info",
  employees: "ui-badge-info",
  users: "ui-badge-neutral",
  attendance: "ui-badge-warning",
  leave: "ui-badge-info",
  overtime: "ui-badge-info",
  loans: "ui-badge-neutral",
  adjustments: "ui-badge-warning",
  auth: "ui-badge-neutral",
  approve: "ui-badge-success",
  finalize: "ui-badge-success",
  release: "ui-badge-success",
  reject: "ui-badge-warning",
  deactivate: "ui-badge-warning",
  delete: "ui-badge-warning",
  password_change: "ui-badge-neutral",
};

const EMPTY_FILTERS: AuditLogFilters = {
  dateFrom: "",
  dateTo: "",
  module: "",
  actionType: "",
  actor: "",
  entityType: "",
};

export function AuditLogWorkspace({ role }: { role: AppRole | null }) {
  const [filters, setFilters] = useState<AuditLogFilters>(EMPTY_FILTERS);
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(
    async (nextFilters: AuditLogFilters, options?: { isRefresh?: boolean }) => {
      if (options?.isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const nextLogs = await getAuditLogs({
          dateFrom: nextFilters.dateFrom || null,
          dateTo: nextFilters.dateTo || null,
          module: nextFilters.module || null,
          actionType: nextFilters.actionType || null,
          actor: nextFilters.actor || null,
          entityType: nextFilters.entityType || null,
        });
        setLogs(nextLogs);
        setSelectedLogId((currentSelectedLogId) => {
          if (currentSelectedLogId != null && nextLogs.some((item) => item.id === currentSelectedLogId)) {
            return currentSelectedLogId;
          }

          return nextLogs[0]?.id ?? null;
        });
      } catch (nextError) {
        setError(
          nextError instanceof Error ? nextError.message : "Unable to load audit logs.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadLogs(EMPTY_FILTERS);
  }, [loadLogs]);

  const selectedLog = useMemo(
    () => logs.find((item) => item.id === selectedLogId) ?? logs[0] ?? null,
    [logs, selectedLogId],
  );

  const uniqueActors = useMemo(
    () => new Set(logs.map((item) => item.actor_user?.username ?? item.actor_role ?? "system")).size,
    [logs],
  );

  const uniqueModules = useMemo(() => new Set(logs.map((item) => item.module)).size, [logs]);

  const dateRangeLabel =
    filters.dateFrom || filters.dateTo
      ? `${filters.dateFrom || "Start"} to ${filters.dateTo || "Now"}`
      : "Current filtered activity";

  if (loading) {
    return <AuditLogWorkspaceSkeleton />;
  }

  if (error && logs.length === 0) {
    return (
      <section className="panel p-6 sm:p-7">
        <ResourceErrorState
          title="Audit logs are unavailable"
          description={error}
          action={
            <button
              type="button"
              className="ui-button-primary"
              onClick={() => {
                void loadLogs(filters, { isRefresh: true });
              }}
            >
              Retry audit log load
            </button>
          }
        />
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {role !== "admin-finance" && role !== "admin" ? (
        <div className="ui-state-banner ui-state-banner-info">
          This activity view focuses on operational traceability. Use reporting for totals and trends; use audit logs for change accountability.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Log entries"
          value={String(logs.length)}
          note="Current filtered activity"
          icon={History}
        />
        <MetricCard
          title="Actors"
          value={String(uniqueActors)}
          note="Users represented in this result"
          icon={Users}
        />
        <MetricCard
          title="Modules"
          value={String(uniqueModules)}
          note="Operational domains covered"
          icon={ShieldAlert}
        />
        <MetricCard
          title="Time range"
          value={dateRangeLabel}
          note="Date filter currently applied"
          icon={History}
        />
      </section>

      <SectionCard
        title="Audit log filters"
        description="Filter operational activity by date range, module, action, actor, and entity type."
        action={
          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => {
              void loadLogs(filters, { isRefresh: true });
            }}
            disabled={refreshing}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
            Refresh logs
          </button>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[repeat(2,minmax(0,1fr))_repeat(3,minmax(0,0.85fr))]">
          <label className="space-y-2">
            <span className="ui-label">Date from</span>
            <input
              type="date"
              className="ui-input"
              value={filters.dateFrom}
              onChange={(event) => {
                setFilters((currentValue) => ({
                  ...currentValue,
                  dateFrom: event.target.value,
                }));
              }}
            />
          </label>
          <label className="space-y-2">
            <span className="ui-label">Date to</span>
            <input
              type="date"
              className="ui-input"
              value={filters.dateTo}
              onChange={(event) => {
                setFilters((currentValue) => ({
                  ...currentValue,
                  dateTo: event.target.value,
                }));
              }}
            />
          </label>
          <SelectFilter
            label="Module"
            value={filters.module}
            options={MODULE_OPTIONS}
            onChange={(value) => {
              setFilters((currentValue) => ({ ...currentValue, module: value }));
            }}
          />
          <SelectFilter
            label="Action"
            value={filters.actionType}
            options={ACTION_OPTIONS}
            onChange={(value) => {
              setFilters((currentValue) => ({ ...currentValue, actionType: value }));
            }}
          />
          <SelectFilter
            label="Entity"
            value={filters.entityType}
            options={ENTITY_OPTIONS}
            onChange={(value) => {
              setFilters((currentValue) => ({ ...currentValue, entityType: value }));
            }}
          />
          <label className="space-y-2">
            <span className="ui-label">Actor</span>
            <input
              type="text"
              className="ui-input"
              value={filters.actor}
              placeholder="Username, email, or name"
              onChange={(event) => {
                setFilters((currentValue) => ({
                  ...currentValue,
                  actor: event.target.value,
                }));
              }}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="ui-button-primary"
            onClick={() => {
              void loadLogs(filters);
            }}
          >
            Apply filters
          </button>
          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              void loadLogs(EMPTY_FILTERS);
            }}
          >
            Reset filters
          </button>
        </div>

        {error ? <div className="ui-state-banner ui-state-banner-warning mt-4">{error}</div> : null}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.8fr)]">
        <SectionCard
          title="Activity log"
          description="Chronological operational changes across sensitive payroll and HR workflows."
          contentClassName="space-y-4"
        >
          {logs.length === 0 ? (
            <ResourceEmptyState
              title="No audit activity matches the current filter"
              description="Widen the date range or clear the current module/action filters to bring audit entries back into scope."
            />
          ) : (
            <div className="ui-report-table overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50/90 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">When</th>
                    <th className="px-4 py-3">Module</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Entity</th>
                    <th className="px-4 py-3">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => {
                    const isSelected = selectedLog?.id === log.id;

                    return (
                      <tr
                        key={log.id}
                        className={cn(
                          "ui-report-table-row cursor-pointer",
                          isSelected && "ui-report-table-row-active",
                        )}
                        onClick={() => {
                          setSelectedLogId(log.id);
                        }}
                      >
                        <td className="px-4 py-4">
                          <div>
                            <p className={cn("font-medium", isSelected ? "text-white" : "text-slate-900")}>
                              {formatDateTime(log.created_at)}
                            </p>
                            <p className={cn("mt-1 text-xs", isSelected ? "text-slate-200" : "text-slate-500")}>
                              Log #{log.id}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge value={log.module} />
                        </td>
                        <td className="px-4 py-4">
                          <Badge value={log.action_type} />
                        </td>
                        <td className={cn("px-4 py-4", isSelected ? "text-white" : "text-slate-700")}>
                          <div className="space-y-1">
                            <p className="font-medium">
                              {getActorLabel(log)}
                            </p>
                            <p className={cn("text-xs", isSelected ? "text-slate-200" : "text-slate-500")}>
                              {log.actor_user?.email ?? log.actor_role ?? "System"}
                            </p>
                          </div>
                        </td>
                        <td className={cn("px-4 py-4", isSelected ? "text-white" : "text-slate-700")}>
                          {formatEntityLabel(log)}
                        </td>
                        <td className={cn("px-4 py-4 text-sm leading-6", isSelected ? "text-white" : "text-slate-700")}>
                          {log.summary}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Selected activity detail"
          description="Review the actor, target entity, and concise before/after payload for the selected entry."
          contentClassName="space-y-4"
        >
          {selectedLog == null ? (
            <ResourceEmptyState
              title="No activity selected"
              description="Choose an audit entry from the table to inspect its actor and before/after detail."
            />
          ) : (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge value={selectedLog.module} />
                  <Badge value={selectedLog.action_type} />
                </div>
                <p className="mt-3 text-base font-semibold text-slate-950">{selectedLog.summary}</p>
                <div className="mt-3 grid gap-3 text-sm text-slate-600">
                  <DetailRow label="Actor" value={getActorLabel(selectedLog)} />
                  <DetailRow label="Role" value={selectedLog.actor_user?.role ?? selectedLog.actor_role ?? "System"} />
                  <DetailRow label="Entity" value={formatEntityLabel(selectedLog)} />
                  <DetailRow label="Captured at" value={formatDateTime(selectedLog.created_at)} />
                </div>
              </div>

              <ValueBlock title="Previous value" value={selectedLog.previous_value} emptyLabel="No previous value captured." />
              <ValueBlock title="New value" value={selectedLog.new_value} emptyLabel="No new value captured." />
              <ValueBlock title="Metadata" value={selectedLog.metadata} emptyLabel="No extra metadata captured." />
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="ui-label">{label}</span>
      <select
        className="ui-select"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      >
        <option value="">All {label.toLowerCase()}s</option>
        {options
          .filter((option) => option.length > 0)
          .map((option) => (
            <option key={option} value={option}>
              {formatCodeLabel(option)}
            </option>
          ))}
      </select>
    </label>
  );
}

function MetricCard({
  title,
  value,
  note,
  icon: Icon,
}: {
  title: string;
  value: string;
  note: string;
  icon: typeof History;
}) {
  return (
    <article className="ui-report-card-secondary">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="ui-report-kicker">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
          <p className="mt-1 text-sm text-slate-600">{note}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 text-slate-700 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

function Badge({ value }: { value: string }) {
  return (
    <span className={cn("ui-badge", BADGE_STYLES[value] ?? "ui-badge-neutral")}>
      {formatCodeLabel(value)}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="text-right text-slate-600">{value}</span>
    </div>
  );
}

function ValueBlock({
  title,
  value,
  emptyLabel,
}: {
  title: string;
  value: unknown;
  emptyLabel: string;
}) {
  return (
    <div className="space-y-2 rounded-[24px] border border-slate-200/80 bg-white/90 p-4">
      <p className="ui-report-kicker">{title}</p>
      {value == null ? (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <pre className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-xs leading-6 text-slate-700">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}

function getActorLabel(log: AuditLogRecord) {
  if (log.actor_user) {
    const fullName = [log.actor_user.first_name, log.actor_user.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    return fullName || log.actor_user.username;
  }

  return log.actor_role ? formatCodeLabel(log.actor_role) : "System";
}

function formatEntityLabel(log: AuditLogRecord) {
  return `${formatCodeLabel(log.entity_type)}${log.entity_id != null ? ` #${log.entity_id}` : ""}`;
}

function formatCodeLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function AuditLogWorkspaceSkeleton() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-[24px] border border-slate-200/80 bg-white/85"
          />
        ))}
      </section>
      <section className="panel-strong p-6 sm:p-7">
        <ResourceTableSkeleton filterCount={6} rowCount={1} />
      </section>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.8fr)]">
        <div className="panel-strong p-6 sm:p-7">
          <ResourceTableSkeleton filterCount={1} rowCount={6} />
        </div>
        <div className="panel-strong p-6 sm:p-7">
          <ResourceTableSkeleton filterCount={1} rowCount={5} />
        </div>
      </section>
    </div>
  );
}
