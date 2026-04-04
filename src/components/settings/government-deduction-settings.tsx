"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import {
  Calculator,
  Clock3,
  Copy,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  activateGovernmentDeductionRuleSet,
  archiveGovernmentDeductionRuleSet,
  cloneGovernmentDeductionRuleSet,
  createGovernmentDeductionRuleSet,
  deleteGovernmentDeductionRuleSet,
  getGovernmentDeductionRuleSetDetail,
  getGovernmentDeductionRuleSets,
  getGovernmentDeductionTypes,
  testGovernmentDeductionCalculation,
  updateGovernmentDeductionRuleSet,
  type GovernmentDeductionBracketInputPayload,
  type GovernmentDeductionRuleSetPayload,
  type GovernmentDeductionTypeConfigInputPayload,
} from "@/lib/api/payroll";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type {
  GovernmentDeductionBracketRecord,
  GovernmentDeductionRuleSetDetailRecord,
  GovernmentDeductionRuleSetSummaryRecord,
  GovernmentDeductionTestCalculationRecord,
  GovernmentDeductionTypeConfigRecord,
  GovernmentDeductionTypeRecord,
} from "@/types/payroll";
import {
  ResourceEmptyState,
  ResourceErrorState,
  ResourceTableSkeleton,
} from "@/components/shared/resource-state";
import { SectionCard } from "@/components/ui/section-card";
import { cn } from "@/lib/utils";

type ConfigDraft = {
  deduction_type_code: string;
  based_on: string;
  frequency: string;
  rounding_method: string;
  income_floor: string;
  income_ceiling: string;
  employee_share_ratio: string;
  employer_share_ratio: string;
  cap_amount: string;
  threshold_amount: string;
  rate: string;
  rate_employee: string;
  rate_employer: string;
  fixed_employee_amount: string;
  fixed_employer_amount: string;
  formula_expression: string;
  priority_order: string;
};

type BracketDraft = {
  id: string;
  deduction_type_code: string;
  min_salary: string;
  max_salary: string;
  base_amount_employee: string;
  base_amount_employer: string;
  fixed_employee_amount: string;
  fixed_employer_amount: string;
  rate_employee: string;
  rate_employer: string;
  min_contribution: string;
  max_contribution: string;
  base_tax: string;
  excess_over: string;
  percent_over_excess: string;
  reference_value: string;
  sequence: string;
};

type RuleSetDraft = {
  id?: number;
  name: string;
  effective_from: string;
  effective_to: string;
  notes: string;
  status: string;
  configs: ConfigDraft[];
  brackets: BracketDraft[];
};

type TestInputs = {
  monthly_salary: string;
  gross_pay: string;
  pay_frequency: string;
};

const CONFIG_SEED_ORDER = ["SSS", "PHILHEALTH", "PAGIBIG", "WITHHOLDING_TAX"];

export function GovernmentDeductionSettings() {
  const [types, setTypes] = useState<GovernmentDeductionTypeRecord[]>([]);
  const [ruleSets, setRuleSets] = useState<GovernmentDeductionRuleSetSummaryRecord[]>([]);
  const [selectedRuleSetId, setSelectedRuleSetId] = useState<number | null>(null);
  const [draft, setDraft] = useState<RuleSetDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [testInputs, setTestInputs] = useState<TestInputs>({
    monthly_salary: "28000",
    gross_pay: "14600",
    pay_frequency: "Bi-weekly",
  });
  const [testResult, setTestResult] =
    useState<GovernmentDeductionTestCalculationRecord | null>(null);
  const selectedRuleSetIdRef = useRef<number | null>(null);
  const detailRequestIdRef = useRef(0);

  useEffect(() => {
    selectedRuleSetIdRef.current = selectedRuleSetId;
  }, [selectedRuleSetId]);

  const loadOverview = useCallback(async (preferredRuleSetId?: number | null) => {
    setLoading(true);
    setError(null);

    try {
      const [nextTypes, nextRuleSets] = await Promise.all([
        getGovernmentDeductionTypes(),
        getGovernmentDeductionRuleSets(),
      ]);
      setTypes(nextTypes);
      setRuleSets(nextRuleSets);

      const nextSelectedRuleSetId =
        preferredRuleSetId && nextRuleSets.some((item) => item.id === preferredRuleSetId)
          ? preferredRuleSetId
          : selectedRuleSetIdRef.current &&
              nextRuleSets.some((item) => item.id === selectedRuleSetIdRef.current)
            ? selectedRuleSetIdRef.current
            : nextRuleSets[0]?.id ?? null;
      setSelectedRuleSetId(nextSelectedRuleSetId);

      if (nextSelectedRuleSetId == null) {
        setDraft(buildEmptyRuleSetDraft(nextTypes));
      }
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to load government deduction settings.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (selectedRuleSetId == null) {
      setDetailLoading(false);
      return;
    }

    let cancelled = false;
    const requestId = ++detailRequestIdRef.current;
    setDetailLoading(true);
    setError(null);

    void getGovernmentDeductionRuleSetDetail(selectedRuleSetId)
      .then((detail) => {
        if (!cancelled && detailRequestIdRef.current === requestId) {
          setDraft(buildDraftFromDetail(detail, types));
        }
      })
      .catch((nextError) => {
        if (!cancelled && detailRequestIdRef.current === requestId) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "Unable to load deduction rule set detail.",
          );
        }
      })
      .finally(() => {
        if (!cancelled && detailRequestIdRef.current === requestId) {
          setDetailLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRuleSetId, types]);

  const selectedRuleSetSummary =
    ruleSets.find((item) => item.id === selectedRuleSetId) ?? null;
  const canEditRuleSet = draft != null && draft.status !== "archived";
  const activeRuleSetCount = ruleSets.filter((item) => item.status === "active").length;

  const sortedTypes = useMemo(() => {
    return [...types].sort(
      (left, right) =>
        CONFIG_SEED_ORDER.indexOf(left.code) - CONFIG_SEED_ORDER.indexOf(right.code),
    );
  }, [types]);

  function startDraft(nextDraft: RuleSetDraft, nextMessage: string) {
    detailRequestIdRef.current += 1;
    selectedRuleSetIdRef.current = null;
    setSelectedRuleSetId(null);
    setDetailLoading(false);
    setDraft(nextDraft);
    setTestResult(null);
    setMessage(nextMessage);
    setError(null);
  }

  async function handleSaveDraft() {
    if (!draft) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = buildRuleSetPayload(draft);
      const detail = draft.id
        ? await updateGovernmentDeductionRuleSet(draft.id, payload)
        : await createGovernmentDeductionRuleSet(payload);

      setDraft(buildDraftFromDetail(detail, types));
      setSelectedRuleSetId(detail.id);
      setMessage(`${detail.name} was saved.`);
      await loadOverview(detail.id);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to save the deduction rule set.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleActivateRuleSet() {
    if (!draft?.id) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const detail = await activateGovernmentDeductionRuleSet(draft.id);
      setDraft(buildDraftFromDetail(detail, types));
      setMessage(`${detail.name} is now the active government deduction rule set.`);
      await loadOverview(detail.id);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to activate the deduction rule set.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCloneRuleSet(
    targetRuleSet?: Pick<GovernmentDeductionRuleSetSummaryRecord, "id" | "name">,
  ) {
    const sourceRuleSet =
      targetRuleSet ?? (draft?.id ? { id: draft.id, name: draft.name } : null);

    if (!sourceRuleSet) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const detail = await cloneGovernmentDeductionRuleSet(sourceRuleSet.id, {
        name: `${sourceRuleSet.name} Copy`,
      });
      setDraft(buildDraftFromDetail(detail, types));
      setSelectedRuleSetId(detail.id);
      setMessage(`${detail.name} was cloned as a new draft.`);
      await loadOverview(detail.id);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to clone the deduction rule set.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleEditRuleSet(
    targetRuleSet?: Pick<
      GovernmentDeductionRuleSetSummaryRecord,
      "id" | "name" | "status"
    >,
  ) {
    const sourceRuleSet =
      targetRuleSet ??
      (draft?.id ? { id: draft.id, name: draft.name, status: draft.status } : null);

    if (!sourceRuleSet) {
      return;
    }

    if (sourceRuleSet.status !== "archived") {
      setSelectedRuleSetId(sourceRuleSet.id);
      setMessage(`${sourceRuleSet.name} is ready to edit.`);
      setError(null);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const detail = await cloneGovernmentDeductionRuleSet(sourceRuleSet.id, {
        name: `${sourceRuleSet.name} Draft`,
      });
      setDraft(buildDraftFromDetail(detail, types));
      setSelectedRuleSetId(detail.id);
      setMessage(`${sourceRuleSet.name} is now open as an editable draft.`);
      await loadOverview(detail.id);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to open the deduction rule set for editing.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleArchiveRuleSet(
    targetRuleSet?: Pick<GovernmentDeductionRuleSetSummaryRecord, "id" | "name">,
  ) {
    const sourceRuleSet =
      targetRuleSet ?? (draft?.id ? { id: draft.id, name: draft.name } : null);

    if (!sourceRuleSet) {
      return;
    }

    const confirmed = window.confirm(`Archive ${sourceRuleSet.name}?`);
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const detail = await archiveGovernmentDeductionRuleSet(sourceRuleSet.id);
      setDraft(buildDraftFromDetail(detail, types));
      setSelectedRuleSetId(detail.id);
      setMessage(`${detail.name} was archived.`);
      await loadOverview(detail.id);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to archive the deduction rule set.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRuleSet(
    targetRuleSet?: Pick<
      GovernmentDeductionRuleSetSummaryRecord,
      "id" | "name" | "status"
    >,
  ) {
    const sourceRuleSet =
      targetRuleSet ??
      (draft?.id ? { id: draft.id, name: draft.name, status: draft.status } : null);

    if (!sourceRuleSet || sourceRuleSet.status !== "archived") {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${sourceRuleSet.name} permanently? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await deleteGovernmentDeductionRuleSet(sourceRuleSet.id);
      detailRequestIdRef.current += 1;
      selectedRuleSetIdRef.current = null;
      setSelectedRuleSetId(null);
      setDraft(null);
      setTestResult(null);
      setMessage(`${sourceRuleSet.name} was deleted.`);
      await loadOverview();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to delete the deduction rule set.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRunTestCalculation() {
    if (!draft?.id) {
      setError("Save the rule set first before running a test calculation.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const result = await testGovernmentDeductionCalculation({
        rule_set_id: draft.id,
        monthly_salary: Number(testInputs.monthly_salary || 0),
        gross_pay: Number(testInputs.gross_pay || 0),
        pay_frequency: testInputs.pay_frequency,
      });
      setTestResult(result);
      setMessage("Test calculation completed.");
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to test the deduction calculation.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <ResourceTableSkeleton rowCount={6} />;
  }

  if (error && ruleSets.length === 0 && !draft) {
    return (
      <ResourceErrorState
        title="Unable to load government deduction settings"
        description={error}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        <MetricCard
          label="Rule sets"
          value={String(ruleSets.length)}
          detail="Draft, active, and archived government deduction setups."
        />
        <MetricCard
          label="Active sets"
          value={String(activeRuleSetCount)}
          detail="Only one active effective range should cover a payroll cutoff."
        />
        <MetricCard
          label="Supported types"
          value={String(types.length)}
          detail="SSS, PhilHealth, Pag-IBIG, and Withholding Tax."
        />
      </section>
      <SectionCard
        title="Government deduction rule sets"
        description="Manage the active deduction tables and formula-based configs used by payroll calculation."
        action={(
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="ui-button-secondary gap-2"
              onClick={() => {
                setMessage(null);
                setError(null);
                void loadOverview(selectedRuleSetId);
              }}
              disabled={saving}
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              className="ui-button-primary gap-2"
              onClick={() => {
                startDraft(
                  buildEmptyRuleSetDraft(types),
                  "Started a new draft rule set.",
                );
              }}
            >
              <Plus className="h-4 w-4" />
              New rule set
            </button>
            <button
              type="button"
              className="ui-button-secondary gap-2"
              onClick={() => {
                startDraft(
                  buildLatestPhilippineRuleSetDraft(types),
                  "Loaded the latest Philippine government deduction defaults into a new draft.",
                );
              }}
            >
              <ShieldCheck className="h-4 w-4" />
              Load PH defaults
            </button>
          </div>
        )}
      >
        <div className="space-y-4">
          {message ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
            <div className="min-w-0 rounded-[28px] border border-slate-200/80 bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">Available rule sets</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Select an existing rule set or start a new draft.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                  <ShieldCheck className="h-4 w-4" />
                  Admin-Finance only
                </span>
              </div>

              <div className="space-y-3">
                {ruleSets.length > 0 ? (
                  ruleSets.map((ruleSet) => {
                    const active = ruleSet.id === selectedRuleSetSummary?.id;
                    const actionTone = active
                      ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950";
                    const modifiedLabel = `Modified: ${formatDateTime(ruleSet.updated_at)}`;

                    return (
                      <div
                        key={ruleSet.id}
                        className={cn(
                          "rounded-2xl border p-4 transition",
                          active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200/80 bg-slate-50/80 hover:border-slate-300 hover:bg-white",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRuleSetId(ruleSet.id);
                            setMessage(null);
                            setError(null);
                          }}
                          className="min-w-0 w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{ruleSet.name}</p>
                              <p className={cn("mt-1 text-xs", active ? "text-slate-300" : "text-slate-500")}>
                                {formatDate(ruleSet.effective_from)} to{" "}
                                {ruleSet.effective_to ? formatDate(ruleSet.effective_to) : "Open-ended"}
                              </p>
                            </div>
                            <span className={cn("ui-badge shrink-0 uppercase", statusTone(ruleSet.status, active))}>
                              {pretty(ruleSet.status)}
                            </span>
                          </div>
                          <p className={cn("mt-3 text-xs", active ? "text-slate-300" : "text-slate-500")}>
                            {ruleSet.config_count} configs • {ruleSet.bracket_count} brackets
                          </p>
                        </button>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <span
                            className={cn(
                              "inline-flex min-w-0 max-w-full items-center gap-2 rounded-xl border px-3 py-2 text-xs sm:max-w-[240px]",
                              active
                                ? "border-white/15 bg-white/10 text-slate-200"
                                : "border-slate-200 bg-white text-slate-500",
                            )}
                          >
                            <Clock3 className="h-3.5 w-3.5" />
                            <span className="truncate">{modifiedLabel}</span>
                          </span>
                          <div className="flex shrink-0 items-center gap-1">
                            <RuleSetActionIcon
                              label="Edit"
                              icon={Pencil}
                              toneClassName={actionTone}
                              onClick={() => void handleEditRuleSet(ruleSet)}
                              disabled={saving}
                            />
                            <RuleSetActionIcon
                              label="Duplicate"
                              icon={Copy}
                              toneClassName={actionTone}
                              onClick={() => void handleCloneRuleSet(ruleSet)}
                              disabled={saving}
                            />
                            <RuleSetActionIcon
                              label={ruleSet.status === "archived" ? "Delete permanently" : "Archive"}
                              icon={Trash2}
                              toneClassName={actionTone}
                              onClick={() =>
                                void (ruleSet.status === "archived"
                                  ? handleDeleteRuleSet(ruleSet)
                                  : handleArchiveRuleSet(ruleSet))
                              }
                              disabled={saving}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <ResourceEmptyState
                    title="No government deduction rule sets yet"
                    description="Create a draft rule set before calculating payroll with government deductions."
                  />
                )}
              </div>
            </div>

            <div className="min-w-0 rounded-[28px] border border-slate-200/80 bg-white p-4 sm:p-5">
              {detailLoading || !draft ? (
                <ResourceTableSkeleton rowCount={4} />
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">
                        {draft.id ? draft.name : "New deduction rule set"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Use configs for rate-based deductions and bracket rows for range-based rules like withholding tax and capped Pag-IBIG contributions.
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        `Load PH defaults` fills this draft with a ready-to-review template so you do not have to add every bracket manually.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {draft.id ? (
                        <button
                          type="button"
                          className="ui-button-secondary gap-2"
                          onClick={() =>
                            void (draft.status === "archived"
                              ? handleEditRuleSet()
                              : draft.status === "draft"
                                ? handleCloneRuleSet()
                                : handleEditRuleSet())
                          }
                          disabled={saving}
                        >
                          <Copy className="h-4 w-4" />
                          {draft.status === "draft"
                            ? "Clone"
                            : draft.status === "archived"
                              ? "Edit as draft"
                              : "Edit active set"}
                        </button>
                      ) : null}
                      {draft.id && draft.status !== "archived" ? (
                        <button
                          type="button"
                          className="ui-button-secondary gap-2"
                          onClick={() => void handleArchiveRuleSet()}
                          disabled={saving}
                        >
                          Archive
                        </button>
                      ) : null}
                      {draft.id && draft.status === "archived" ? (
                        <button
                          type="button"
                          className="ui-button-secondary gap-2"
                          onClick={() => void handleDeleteRuleSet()}
                          disabled={saving}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete permanently
                        </button>
                      ) : null}
                      {canEditRuleSet ? (
                        <button
                          type="button"
                          className="ui-button-secondary gap-2"
                          onClick={() => void handleSaveDraft()}
                          disabled={saving}
                        >
                          <Save className="h-4 w-4" />
                          {draft.status === "active" ? "Save changes" : "Save draft"}
                        </button>
                      ) : null}
                      {draft.id && draft.status === "draft" ? (
                        <button
                          type="button"
                          className="ui-button-primary gap-2"
                          onClick={() => void handleActivateRuleSet()}
                          disabled={saving}
                        >
                          <Send className="h-4 w-4" />
                          Activate
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <LabeledInput
                      label="Rule set name"
                      value={draft.name}
                      disabled={!canEditRuleSet}
                      onChange={(value) => setDraft((current) => current ? { ...current, name: value } : current)}
                    />
                    <LabeledInput label="Status" value={pretty(draft.status)} disabled onChange={() => undefined} />
                    <LabeledInput
                      label="Effective from"
                      value={draft.effective_from}
                      type="date"
                      disabled={!canEditRuleSet}
                      onChange={(value) => setDraft((current) => current ? { ...current, effective_from: value } : current)}
                    />
                    <LabeledInput
                      label="Effective to"
                      value={draft.effective_to}
                      type="date"
                      disabled={!canEditRuleSet}
                      onChange={(value) => setDraft((current) => current ? { ...current, effective_to: value } : current)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Notes
                    </label>
                    <textarea
                      value={draft.notes}
                      onChange={(event) =>
                        setDraft((current) => current ? { ...current, notes: event.target.value } : current)
                      }
                      disabled={!canEditRuleSet}
                      rows={3}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
                    />
                  </div>
                  <div className="space-y-4">
                    {sortedTypes.map((type) => {
                      const config = getConfigDraft(draft, type.code);
                      const brackets = draft.brackets.filter((item) => item.deduction_type_code === type.code);

                      return (
                        <div key={type.code} className="rounded-[24px] border border-slate-200/80 bg-slate-50/60 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-950">{type.name}</h4>
                              <p className="mt-1 text-xs text-slate-500">
                                {pretty(type.calculation_method)} based deduction setup.
                              </p>
                            </div>
                            <button
                              type="button"
                              className="ui-button-secondary h-9 px-3 text-xs"
                              disabled={!canEditRuleSet}
                              onClick={() =>
                                setDraft((current) =>
                                  current
                                    ? {
                                        ...current,
                                        brackets: [
                                          ...current.brackets,
                                          buildEmptyBracketDraft(type.code, brackets.length + 1),
                                        ],
                                      }
                                    : current,
                                )
                              }
                            >
                              Add bracket
                            </button>
                          </div>

                          <div className="mt-4 grid gap-3 lg:grid-cols-3">
                            <ConfigInput label="Based on" value={config.based_on} disabled={!canEditRuleSet} onChange={(value) => updateConfigDraft(setDraft, type.code, "based_on", value)} />
                            <ConfigInput label="Frequency" value={config.frequency} disabled={!canEditRuleSet} onChange={(value) => updateConfigDraft(setDraft, type.code, "frequency", value)} />
                            <ConfigInput label="Rounding" value={config.rounding_method} disabled={!canEditRuleSet} onChange={(value) => updateConfigDraft(setDraft, type.code, "rounding_method", value)} />
                            <ConfigInput label="Rate" value={config.rate} disabled={!canEditRuleSet} onChange={(value) => updateConfigDraft(setDraft, type.code, "rate", value)} />
                            <ConfigInput label="Employee rate" value={config.rate_employee} disabled={!canEditRuleSet} onChange={(value) => updateConfigDraft(setDraft, type.code, "rate_employee", value)} />
                            <ConfigInput label="Employer rate" value={config.rate_employer} disabled={!canEditRuleSet} onChange={(value) => updateConfigDraft(setDraft, type.code, "rate_employer", value)} />
                            <ConfigInput label="Income floor" value={config.income_floor} disabled={!canEditRuleSet} onChange={(value) => updateConfigDraft(setDraft, type.code, "income_floor", value)} />
                            <ConfigInput label="Income ceiling" value={config.income_ceiling} disabled={!canEditRuleSet} onChange={(value) => updateConfigDraft(setDraft, type.code, "income_ceiling", value)} />
                            <ConfigInput label="Cap amount" value={config.cap_amount} disabled={!canEditRuleSet} onChange={(value) => updateConfigDraft(setDraft, type.code, "cap_amount", value)} />
                            <ConfigInput label="Threshold amount" value={config.threshold_amount} disabled={!canEditRuleSet} onChange={(value) => updateConfigDraft(setDraft, type.code, "threshold_amount", value)} />
                            <ConfigInput label="Employee ratio" value={config.employee_share_ratio} disabled={!canEditRuleSet} onChange={(value) => updateConfigDraft(setDraft, type.code, "employee_share_ratio", value)} />
                            <ConfigInput label="Employer ratio" value={config.employer_share_ratio} disabled={!canEditRuleSet} onChange={(value) => updateConfigDraft(setDraft, type.code, "employer_share_ratio", value)} />
                            <ConfigInput label="Fixed employee" value={config.fixed_employee_amount} disabled={!canEditRuleSet} onChange={(value) => updateConfigDraft(setDraft, type.code, "fixed_employee_amount", value)} />
                            <ConfigInput label="Fixed employer" value={config.fixed_employer_amount} disabled={!canEditRuleSet} onChange={(value) => updateConfigDraft(setDraft, type.code, "fixed_employer_amount", value)} />
                            <ConfigInput label="Priority" value={config.priority_order} disabled={!canEditRuleSet} onChange={(value) => updateConfigDraft(setDraft, type.code, "priority_order", value)} />
                          </div>

                          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                            <table className="min-w-full text-sm">
                              <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                  <TableHead>Min</TableHead>
                                  <TableHead>Max</TableHead>
                                  <TableHead>Fixed Emp</TableHead>
                                  <TableHead>Fixed Er</TableHead>
                                  <TableHead>Base Tax</TableHead>
                                  <TableHead>Excess Over</TableHead>
                                  <TableHead>% Excess</TableHead>
                                  <TableHead>Rate Emp</TableHead>
                                  <TableHead>Rate Er</TableHead>
                                  <TableHead>Seq</TableHead>
                                  <TableHead>Action</TableHead>
                                </tr>
                              </thead>
                              <tbody>
                                {brackets.length > 0 ? (
                                  brackets.map((bracket) => (
                                    <tr key={bracket.id} className="border-t border-slate-200/80">
                                      <TableCell><InlineInput value={bracket.min_salary} disabled={!canEditRuleSet} onChange={(value) => updateBracketDraft(setDraft, bracket.id, "min_salary", value)} /></TableCell>
                                      <TableCell><InlineInput value={bracket.max_salary} disabled={!canEditRuleSet} onChange={(value) => updateBracketDraft(setDraft, bracket.id, "max_salary", value)} /></TableCell>
                                      <TableCell><InlineInput value={bracket.fixed_employee_amount} disabled={!canEditRuleSet} onChange={(value) => updateBracketDraft(setDraft, bracket.id, "fixed_employee_amount", value)} /></TableCell>
                                      <TableCell><InlineInput value={bracket.fixed_employer_amount} disabled={!canEditRuleSet} onChange={(value) => updateBracketDraft(setDraft, bracket.id, "fixed_employer_amount", value)} /></TableCell>
                                      <TableCell><InlineInput value={bracket.base_tax} disabled={!canEditRuleSet} onChange={(value) => updateBracketDraft(setDraft, bracket.id, "base_tax", value)} /></TableCell>
                                      <TableCell><InlineInput value={bracket.excess_over} disabled={!canEditRuleSet} onChange={(value) => updateBracketDraft(setDraft, bracket.id, "excess_over", value)} /></TableCell>
                                      <TableCell><InlineInput value={bracket.percent_over_excess} disabled={!canEditRuleSet} onChange={(value) => updateBracketDraft(setDraft, bracket.id, "percent_over_excess", value)} /></TableCell>
                                      <TableCell><InlineInput value={bracket.rate_employee} disabled={!canEditRuleSet} onChange={(value) => updateBracketDraft(setDraft, bracket.id, "rate_employee", value)} /></TableCell>
                                      <TableCell><InlineInput value={bracket.rate_employer} disabled={!canEditRuleSet} onChange={(value) => updateBracketDraft(setDraft, bracket.id, "rate_employer", value)} /></TableCell>
                                      <TableCell><InlineInput value={bracket.sequence} disabled={!canEditRuleSet} onChange={(value) => updateBracketDraft(setDraft, bracket.id, "sequence", value)} /></TableCell>
                                      <TableCell>
                                        <button
                                          type="button"
                                          className="ui-button-secondary h-9 px-3 text-xs"
                                          disabled={!canEditRuleSet}
                                          onClick={() =>
                                            setDraft((current) =>
                                              current
                                                ? {
                                                    ...current,
                                                    brackets: current.brackets.filter((item) => item.id !== bracket.id),
                                                  }
                                                : current,
                                            )
                                          }
                                        >
                                          Remove
                                        </button>
                                      </TableCell>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={11} className="px-4 py-4">
                                      <ResourceEmptyState
                                        title={`No ${type.name} brackets yet`}
                                        description="Add bracket rows here when this deduction uses salary ranges or tax brackets."
                                      />
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-950">Test calculation</h4>
                        <p className="mt-1 text-xs text-slate-500">
                          Preview how the selected rule set computes mandatory deductions.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="ui-button-primary gap-2"
                        onClick={() => void handleRunTestCalculation()}
                        disabled={saving}
                      >
                        <Calculator className="h-4 w-4" />
                        Test calculate
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <LabeledInput label="Monthly salary" value={testInputs.monthly_salary} onChange={(value) => setTestInputs((current) => ({ ...current, monthly_salary: value }))} />
                      <LabeledInput label="Gross pay" value={testInputs.gross_pay} onChange={(value) => setTestInputs((current) => ({ ...current, gross_pay: value }))} />
                      <LabeledInput label="Pay frequency" value={testInputs.pay_frequency} onChange={(value) => setTestInputs((current) => ({ ...current, pay_frequency: value }))} />
                    </div>

                    {testResult ? (
                      <div className="mt-4 space-y-3">
                        <div className="grid gap-3 md:grid-cols-3">
                          <MetricInline label="Taxable income" value={formatCurrency(testResult.taxable_income)} />
                          <MetricInline label="Employee deductions" value={formatCurrency(testResult.total_employee_deductions)} />
                          <MetricInline label="Employer share" value={formatCurrency(testResult.total_employer_contributions)} />
                        </div>
                        <div className="space-y-2">
                          {testResult.items.map((item) => (
                            <div key={item.deduction_code} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-950">{item.deduction_name}</p>
                                <p className="mt-1 text-xs text-slate-500">Basis {formatCurrency(item.basis_amount)}</p>
                              </div>
                              <div className="text-right text-sm">
                                <p className="font-semibold text-slate-950">Emp {formatCurrency(item.employee_share)}</p>
                                <p className="mt-1 text-slate-500">Er {formatCurrency(item.employer_share)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function buildEmptyRuleSetDraft(types: GovernmentDeductionTypeRecord[]): RuleSetDraft {
  const typeCodes = types.length > 0 ? types.map((item) => item.code) : CONFIG_SEED_ORDER;

  return {
    name: "",
    effective_from: "",
    effective_to: "",
    notes: "",
    status: "draft",
    configs: typeCodes.map((code, index) => buildEmptyConfigDraft(code, index)),
    brackets: [],
  };
}

function buildLatestPhilippineRuleSetDraft(
  types: GovernmentDeductionTypeRecord[],
): RuleSetDraft {
  const typeCodes = types.length > 0 ? types.map((item) => item.code) : CONFIG_SEED_ORDER;
  const baseDraft = buildEmptyRuleSetDraft(types);

  const configs = typeCodes.map((code, index) => {
    if (code === "SSS") {
      return {
        deduction_type_code: "SSS",
        based_on: "monthly_salary",
        frequency: "monthly",
        rounding_method: "half_up",
        income_floor: "5000",
        income_ceiling: "35000",
        employee_share_ratio: "",
        employer_share_ratio: "",
        cap_amount: "35000",
        threshold_amount: "",
        rate: "",
        rate_employee: "0.05",
        rate_employer: "0.10",
        fixed_employee_amount: "",
        fixed_employer_amount: "",
        formula_expression: "",
        priority_order: String(index + 1),
      } satisfies ConfigDraft;
    }

    if (code === "PHILHEALTH") {
      return {
        deduction_type_code: "PHILHEALTH",
        based_on: "monthly_salary",
        frequency: "monthly",
        rounding_method: "half_up",
        income_floor: "10000",
        income_ceiling: "100000",
        employee_share_ratio: "0.5",
        employer_share_ratio: "0.5",
        cap_amount: "100000",
        threshold_amount: "",
        rate: "0.05",
        rate_employee: "",
        rate_employer: "",
        fixed_employee_amount: "",
        fixed_employer_amount: "",
        formula_expression: "",
        priority_order: String(index + 1),
      } satisfies ConfigDraft;
    }

    if (code === "PAGIBIG") {
      return {
        deduction_type_code: "PAGIBIG",
        based_on: "monthly_salary",
        frequency: "monthly",
        rounding_method: "half_up",
        income_floor: "",
        income_ceiling: "",
        employee_share_ratio: "",
        employer_share_ratio: "",
        cap_amount: "",
        threshold_amount: "",
        rate: "",
        rate_employee: "",
        rate_employer: "",
        fixed_employee_amount: "",
        fixed_employer_amount: "",
        formula_expression: "",
        priority_order: String(index + 1),
      } satisfies ConfigDraft;
    }

    if (code === "WITHHOLDING_TAX") {
      return {
        deduction_type_code: "WITHHOLDING_TAX",
        based_on: "taxable_income",
        frequency: "monthly",
        rounding_method: "half_up",
        income_floor: "",
        income_ceiling: "",
        employee_share_ratio: "",
        employer_share_ratio: "",
        cap_amount: "",
        threshold_amount: "",
        rate: "",
        rate_employee: "",
        rate_employer: "",
        fixed_employee_amount: "",
        fixed_employer_amount: "",
        formula_expression: "",
        priority_order: String(index + 1),
      } satisfies ConfigDraft;
    }

    return buildEmptyConfigDraft(code, index);
  });

  return {
    ...baseDraft,
    name: "Philippines Government Deductions 2025",
    effective_from: "2025-01-01",
    effective_to: "",
    notes:
      "Preset based on the latest official Philippine SSS, PhilHealth, Pag-IBIG, and withholding tax rules verified on April 4, 2026. Review before activation.",
    configs,
    brackets: [
      {
        id: "pagibig-1",
        deduction_type_code: "PAGIBIG",
        min_salary: "0",
        max_salary: "1500",
        base_amount_employee: "",
        base_amount_employer: "",
        fixed_employee_amount: "",
        fixed_employer_amount: "",
        rate_employee: "0.01",
        rate_employer: "0.02",
        min_contribution: "",
        max_contribution: "",
        base_tax: "",
        excess_over: "",
        percent_over_excess: "",
        reference_value: "",
        sequence: "1",
      },
      {
        id: "pagibig-2",
        deduction_type_code: "PAGIBIG",
        min_salary: "1500.01",
        max_salary: "5000",
        base_amount_employee: "",
        base_amount_employer: "",
        fixed_employee_amount: "",
        fixed_employer_amount: "",
        rate_employee: "0.02",
        rate_employer: "0.02",
        min_contribution: "",
        max_contribution: "",
        base_tax: "",
        excess_over: "",
        percent_over_excess: "",
        reference_value: "",
        sequence: "2",
      },
      {
        id: "pagibig-3",
        deduction_type_code: "PAGIBIG",
        min_salary: "5000.01",
        max_salary: "",
        base_amount_employee: "",
        base_amount_employer: "",
        fixed_employee_amount: "100",
        fixed_employer_amount: "100",
        rate_employee: "",
        rate_employer: "",
        min_contribution: "",
        max_contribution: "",
        base_tax: "",
        excess_over: "",
        percent_over_excess: "",
        reference_value: "",
        sequence: "3",
      },
      {
        id: "tax-1",
        deduction_type_code: "WITHHOLDING_TAX",
        min_salary: "0",
        max_salary: "20833",
        base_amount_employee: "",
        base_amount_employer: "",
        fixed_employee_amount: "",
        fixed_employer_amount: "",
        rate_employee: "",
        rate_employer: "",
        min_contribution: "",
        max_contribution: "",
        base_tax: "0",
        excess_over: "0",
        percent_over_excess: "0",
        reference_value: "",
        sequence: "1",
      },
      {
        id: "tax-2",
        deduction_type_code: "WITHHOLDING_TAX",
        min_salary: "20833.01",
        max_salary: "33333",
        base_amount_employee: "",
        base_amount_employer: "",
        fixed_employee_amount: "",
        fixed_employer_amount: "",
        rate_employee: "",
        rate_employer: "",
        min_contribution: "",
        max_contribution: "",
        base_tax: "0",
        excess_over: "20833",
        percent_over_excess: "0.15",
        reference_value: "",
        sequence: "2",
      },
      {
        id: "tax-3",
        deduction_type_code: "WITHHOLDING_TAX",
        min_salary: "33333.01",
        max_salary: "66667",
        base_amount_employee: "",
        base_amount_employer: "",
        fixed_employee_amount: "",
        fixed_employer_amount: "",
        rate_employee: "",
        rate_employer: "",
        min_contribution: "",
        max_contribution: "",
        base_tax: "1875",
        excess_over: "33333",
        percent_over_excess: "0.20",
        reference_value: "",
        sequence: "3",
      },
      {
        id: "tax-4",
        deduction_type_code: "WITHHOLDING_TAX",
        min_salary: "66667.01",
        max_salary: "166667",
        base_amount_employee: "",
        base_amount_employer: "",
        fixed_employee_amount: "",
        fixed_employer_amount: "",
        rate_employee: "",
        rate_employer: "",
        min_contribution: "",
        max_contribution: "",
        base_tax: "8541.80",
        excess_over: "66667",
        percent_over_excess: "0.25",
        reference_value: "",
        sequence: "4",
      },
      {
        id: "tax-5",
        deduction_type_code: "WITHHOLDING_TAX",
        min_salary: "166667.01",
        max_salary: "666667",
        base_amount_employee: "",
        base_amount_employer: "",
        fixed_employee_amount: "",
        fixed_employer_amount: "",
        rate_employee: "",
        rate_employer: "",
        min_contribution: "",
        max_contribution: "",
        base_tax: "33541.80",
        excess_over: "166667",
        percent_over_excess: "0.30",
        reference_value: "",
        sequence: "5",
      },
      {
        id: "tax-6",
        deduction_type_code: "WITHHOLDING_TAX",
        min_salary: "666667.01",
        max_salary: "",
        base_amount_employee: "",
        base_amount_employer: "",
        fixed_employee_amount: "",
        fixed_employer_amount: "",
        rate_employee: "",
        rate_employer: "",
        min_contribution: "",
        max_contribution: "",
        base_tax: "183541.80",
        excess_over: "666667",
        percent_over_excess: "0.35",
        reference_value: "",
        sequence: "6",
      },
    ],
  };
}

function buildEmptyConfigDraft(deductionTypeCode: string, index: number): ConfigDraft {
  return {
    deduction_type_code: deductionTypeCode,
    based_on: deductionTypeCode === "WITHHOLDING_TAX" ? "taxable_income" : "monthly_salary",
    frequency: "monthly",
    rounding_method: "half_up",
    income_floor: "",
    income_ceiling: "",
    employee_share_ratio: deductionTypeCode === "PHILHEALTH" ? "0.5" : "",
    employer_share_ratio: deductionTypeCode === "PHILHEALTH" ? "0.5" : "",
    cap_amount: "",
    threshold_amount: "",
    rate: "",
    rate_employee: "",
    rate_employer: "",
    fixed_employee_amount: "",
    fixed_employer_amount: "",
    formula_expression: "",
    priority_order: String(index + 1),
  };
}

function buildEmptyBracketDraft(deductionTypeCode: string, sequence: number): BracketDraft {
  return {
    id: `${deductionTypeCode}-${Date.now()}-${Math.random()}`,
    deduction_type_code: deductionTypeCode,
    min_salary: "0",
    max_salary: "",
    base_amount_employee: "",
    base_amount_employer: "",
    fixed_employee_amount: "",
    fixed_employer_amount: "",
    rate_employee: "",
    rate_employer: "",
    min_contribution: "",
    max_contribution: "",
    base_tax: "",
    excess_over: "",
    percent_over_excess: "",
    reference_value: "",
    sequence: String(sequence),
  };
}

function buildDraftFromDetail(
  detail: GovernmentDeductionRuleSetDetailRecord,
  types: GovernmentDeductionTypeRecord[],
): RuleSetDraft {
  const baseDraft = buildEmptyRuleSetDraft(types);
  const configsByCode = new Map(detail.configs.map((item) => [item.deduction_type_code, item]));

  return {
    id: detail.id,
    name: detail.name,
    effective_from: detail.effective_from,
    effective_to: detail.effective_to ?? "",
    notes: detail.notes ?? "",
    status: detail.status,
    configs: baseDraft.configs.map((seedConfig) =>
      buildConfigDraftFromRecord(configsByCode.get(seedConfig.deduction_type_code) ?? null, seedConfig),
    ),
    brackets: detail.brackets.map(buildBracketDraftFromRecord),
  };
}

function buildConfigDraftFromRecord(
  record: GovernmentDeductionTypeConfigRecord | null,
  fallback: ConfigDraft,
): ConfigDraft {
  if (!record) {
    return fallback;
  }

  return {
    deduction_type_code: record.deduction_type_code,
    based_on: record.based_on,
    frequency: record.frequency,
    rounding_method: record.rounding_method,
    income_floor: record.income_floor ?? "",
    income_ceiling: record.income_ceiling ?? "",
    employee_share_ratio: record.employee_share_ratio ?? "",
    employer_share_ratio: record.employer_share_ratio ?? "",
    cap_amount: record.cap_amount ?? "",
    threshold_amount: record.threshold_amount ?? "",
    rate: record.rate ?? "",
    rate_employee: record.rate_employee ?? "",
    rate_employer: record.rate_employer ?? "",
    fixed_employee_amount: record.fixed_employee_amount ?? "",
    fixed_employer_amount: record.fixed_employer_amount ?? "",
    formula_expression: record.formula_expression ?? "",
    priority_order: String(record.priority_order),
  };
}

function buildBracketDraftFromRecord(record: GovernmentDeductionBracketRecord): BracketDraft {
  return {
    id: String(record.id),
    deduction_type_code: record.deduction_type_code,
    min_salary: record.min_salary,
    max_salary: record.max_salary ?? "",
    base_amount_employee: record.base_amount_employee ?? "",
    base_amount_employer: record.base_amount_employer ?? "",
    fixed_employee_amount: record.fixed_employee_amount ?? "",
    fixed_employer_amount: record.fixed_employer_amount ?? "",
    rate_employee: record.rate_employee ?? "",
    rate_employer: record.rate_employer ?? "",
    min_contribution: record.min_contribution ?? "",
    max_contribution: record.max_contribution ?? "",
    base_tax: record.base_tax ?? "",
    excess_over: record.excess_over ?? "",
    percent_over_excess: record.percent_over_excess ?? "",
    reference_value: record.reference_value ?? "",
    sequence: String(record.sequence),
  };
}

function buildRuleSetPayload(draft: RuleSetDraft): GovernmentDeductionRuleSetPayload {
  return {
    name: draft.name.trim(),
    effective_from: draft.effective_from,
    effective_to: draft.effective_to || null,
    notes: draft.notes.trim() || null,
    status: draft.status,
    configs: draft.configs.map(buildConfigPayload),
    brackets: draft.brackets.map(buildBracketPayload),
  };
}

function buildConfigPayload(config: ConfigDraft): GovernmentDeductionTypeConfigInputPayload {
  return {
    deduction_type_code: config.deduction_type_code,
    based_on: config.based_on,
    frequency: config.frequency,
    rounding_method: config.rounding_method,
    income_floor: parseOptionalNumber(config.income_floor),
    income_ceiling: parseOptionalNumber(config.income_ceiling),
    employee_share_ratio: parseOptionalNumber(config.employee_share_ratio),
    employer_share_ratio: parseOptionalNumber(config.employer_share_ratio),
    cap_amount: parseOptionalNumber(config.cap_amount),
    threshold_amount: parseOptionalNumber(config.threshold_amount),
    rate: parseOptionalNumber(config.rate),
    rate_employee: parseOptionalNumber(config.rate_employee),
    rate_employer: parseOptionalNumber(config.rate_employer),
    fixed_employee_amount: parseOptionalNumber(config.fixed_employee_amount),
    fixed_employer_amount: parseOptionalNumber(config.fixed_employer_amount),
    formula_expression: config.formula_expression.trim() || null,
    priority_order: Number(config.priority_order || 0),
  };
}

function buildBracketPayload(bracket: BracketDraft): GovernmentDeductionBracketInputPayload {
  return {
    deduction_type_code: bracket.deduction_type_code,
    min_salary: Number(bracket.min_salary || 0),
    max_salary: parseOptionalNumber(bracket.max_salary),
    base_amount_employee: parseOptionalNumber(bracket.base_amount_employee),
    base_amount_employer: parseOptionalNumber(bracket.base_amount_employer),
    fixed_employee_amount: parseOptionalNumber(bracket.fixed_employee_amount),
    fixed_employer_amount: parseOptionalNumber(bracket.fixed_employer_amount),
    rate_employee: parseOptionalNumber(bracket.rate_employee),
    rate_employer: parseOptionalNumber(bracket.rate_employer),
    min_contribution: parseOptionalNumber(bracket.min_contribution),
    max_contribution: parseOptionalNumber(bracket.max_contribution),
    base_tax: parseOptionalNumber(bracket.base_tax),
    excess_over: parseOptionalNumber(bracket.excess_over),
    percent_over_excess: parseOptionalNumber(bracket.percent_over_excess),
    reference_value: parseOptionalNumber(bracket.reference_value),
    sequence: Number(bracket.sequence || 1),
  };
}

function getConfigDraft(draft: RuleSetDraft, deductionTypeCode: string) {
  return (
    draft.configs.find((item) => item.deduction_type_code === deductionTypeCode) ??
    buildEmptyConfigDraft(deductionTypeCode, CONFIG_SEED_ORDER.indexOf(deductionTypeCode))
  );
}

function updateConfigDraft(
  setDraft: React.Dispatch<React.SetStateAction<RuleSetDraft | null>>,
  deductionTypeCode: string,
  field: keyof ConfigDraft,
  value: string,
) {
  setDraft((current) =>
    current
      ? {
          ...current,
          configs: current.configs.map((item) =>
            item.deduction_type_code === deductionTypeCode ? { ...item, [field]: value } : item,
          ),
        }
      : current,
  );
}

function updateBracketDraft(
  setDraft: React.Dispatch<React.SetStateAction<RuleSetDraft | null>>,
  bracketId: string,
  field: keyof BracketDraft,
  value: string,
) {
  setDraft((current) =>
    current
      ? {
          ...current,
          brackets: current.brackets.map((item) =>
            item.id === bracketId ? { ...item, [field]: value } : item,
          ),
        }
      : current,
  );
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pretty(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusTone(status: string, active: boolean) {
  if (active) {
    return "bg-white/10 text-white";
  }
  if (status === "active") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "archived") {
    return "bg-slate-200 text-slate-700";
  }
  return "bg-amber-100 text-amber-700";
}

function RuleSetActionIcon({
  label,
  icon: Icon,
  toneClassName,
  onClick,
  disabled = false,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  toneClassName: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-disabled={disabled}
      onClick={() => {
        if (disabled || !onClick) {
          return;
        }

        onClick();
      }}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition",
        toneClassName,
        disabled && "cursor-not-allowed opacity-45",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="panel p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{detail}</p>
    </div>
  );
}

function MetricInline({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  disabled = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
      />
    </div>
  );
}

function ConfigInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
      />
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em]">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-3">{children}</td>;
}

function InlineInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
    />
  );
}
