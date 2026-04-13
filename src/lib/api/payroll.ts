import { apiClient, getApiErrorMessage } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import { parseAttendanceCutoffRecord } from "@/lib/api/attendance";
import {
  createCollectionParser,
  loadApiResource,
} from "@/lib/api/resources";
import { handleUnauthorizedClientResponse } from "@/lib/auth/client-auth";
import {
  parseBoolean,
  parseCollection,
  parseNumber,
  parseNumericString,
  parseRecord,
  parseString,
} from "@/lib/api/parsers";
import type {
  EmployeePayrollCutoffPreviewRecord,
  EmployeePayrollCutoffStatusRecord,
  EmployeeEffectivePayrollRulesRecord,
  GovernmentDeductionBracketRecord,
  GovernmentDeductionRuleSetDetailRecord,
  GovernmentDeductionRuleSetSummaryRecord,
  GovernmentDeductionTestCalculationRecord,
  GovernmentDeductionTestResultItemRecord,
  GovernmentDeductionTypeConfigRecord,
  GovernmentDeductionTypeRecord,
  ManualPayrollAdjustmentRecord,
  PayslipRecord,
  PayrollAdjustmentRecord,
  PayrollAttendanceLineItemRecord,
  PayrollBatchDetailRecord,
  PayrollReconciliationComparisonRecord,
  PayrollReconciliationRecord,
  PayrollReconciliationTotalsRecord,
  PayrollReconciliationWarningRecord,
  PayrollReconciliationWarningSampleRecord,
  PayrollReportingSnapshotRecord,
  PayrollBatchSummaryRecord,
  PayrollCutoffPreviewRecord,
  PayrollDeductionBreakdownRecord,
  PayrollReportCutoffDetailRecord,
  PayrollReportCutoffSummaryRecord,
  PayrollReportEmployerContributionSummaryRecord,
  PayrollReportGovernmentSummaryRecord,
  PayrollReportMonthlySummaryRecord,
  PayrollReportStatusOptionRecord,
  PayrollReportTrendPointRecord,
  PayrollReportYtdSummaryRecord,
  PayrollPeriod,
  PayrollPeriodApiRecord,
  PayrollPolicyProfileRecord,
  PayrollRecordRecord,
  PayrollRunApiRecord,
  PayrollStatus,
} from "@/types/payroll";
import { formatDate } from "@/lib/format";

const PAYROLL_STATUS_MAP: Record<string, PayrollStatus> = {
  draft: "Draft",
  open: "Open",
  processed: "Processed",
  processing: "Processing",
  completed: "Completed",
  closed: "Closed",
  paid: "Paid",
  scheduled: "Scheduled",
  calculated: "Calculated",
  "needs review": "Needs review",
  needs_review: "Needs review",
  review: "Needs review",
  reviewed: "Reviewed",
  approved: "Approved",
  finalized: "Finalized",
  payslip_released: "Payslip Released",
  posted: "Payslip Released",
  locked: "Locked",
};

function parseOptionalString(value: unknown, label: string) {
  return parseString(value, label, { optional: true }) ?? null;
}

function parseOptionalNumber(value: unknown, label: string) {
  if (value == null) {
    return null;
  }

  return parseNumber(value, label);
}

function parseOptionalRecord(value: unknown, label: string) {
  if (value == null) {
    return null;
  }

  return parseRecord(value, label);
}

function parseOptionalNumericString(value: unknown, label: string) {
  return parseNumericString(value, label, { optional: true }) ?? null;
}

export function normalizePayrollStatus(value: string): PayrollStatus {
  return PAYROLL_STATUS_MAP[value.trim().toLowerCase()] ?? "Open";
}

export function parsePayrollPeriodRecord(value: unknown): PayrollPeriodApiRecord {
  const record = parseRecord(value, "payroll period");

  return {
    id: parseNumber(record.id, "payrollPeriod.id"),
    period_name: parseString(record.period_name, "payrollPeriod.period_name"),
    period_start: parseString(record.period_start, "payrollPeriod.period_start"),
    period_end: parseString(record.period_end, "payrollPeriod.period_end"),
    payout_date: parseString(record.payout_date, "payrollPeriod.payout_date"),
    status: parseString(record.status, "payrollPeriod.status"),
    created_at: parseString(record.created_at, "payrollPeriod.created_at"),
    updated_at: parseString(record.updated_at, "payrollPeriod.updated_at"),
  };
}

export function parsePayrollRunRecord(value: unknown): PayrollRunApiRecord {
  const record = parseRecord(value, "payroll run");

  return {
    id: parseNumber(record.id, "payrollRun.id"),
    payroll_period_id: parseNumber(
      record.payroll_period_id,
      "payrollRun.payroll_period_id",
    ),
    employee_id: parseNumber(record.employee_id, "payrollRun.employee_id"),
    gross_pay: parseNumericString(record.gross_pay, "payrollRun.gross_pay"),
    total_deductions: parseNumericString(
      record.total_deductions,
      "payrollRun.total_deductions",
    ),
    taxable_income: parseNumericString(
      record.taxable_income,
      "payrollRun.taxable_income",
    ),
    withholding_tax: parseNumericString(
      record.withholding_tax,
      "payrollRun.withholding_tax",
    ),
    government_deductions: parseNumericString(
      record.government_deductions,
      "payrollRun.government_deductions",
    ),
    net_pay: parseNumericString(record.net_pay, "payrollRun.net_pay"),
    status: parseString(record.status, "payrollRun.status"),
    created_at: parseString(record.created_at, "payrollRun.created_at"),
    updated_at: parseString(record.updated_at, "payrollRun.updated_at"),
  };
}

export function parsePayrollAdjustmentRecord(value: unknown): PayrollAdjustmentRecord {
  const record = parseRecord(value, "payroll adjustment");

  return {
    id: parseNumber(record.id, "payrollAdjustment.id"),
    payroll_record_id: parseNumber(
      record.payroll_record_id,
      "payrollAdjustment.payroll_record_id",
    ),
    category: parseString(record.category, "payrollAdjustment.category"),
    adjustment_type: parseString(
      record.adjustment_type,
      "payrollAdjustment.adjustment_type",
    ),
    amount: parseNumericString(record.amount, "payrollAdjustment.amount"),
    description: parseString(record.description, "payrollAdjustment.description"),
    created_at: parseString(record.created_at, "payrollAdjustment.created_at"),
    updated_at: parseString(record.updated_at, "payrollAdjustment.updated_at"),
  };
}

export function parseManualPayrollAdjustmentRecord(
  value: unknown,
): ManualPayrollAdjustmentRecord {
  const record = parseRecord(value, "manual payroll adjustment");

  return {
    id: parseNumber(record.id, "manualPayrollAdjustment.id"),
    employee_id: parseNumber(record.employee_id, "manualPayrollAdjustment.employee_id"),
    cutoff_id: parseNumber(record.cutoff_id, "manualPayrollAdjustment.cutoff_id"),
    adjustment_type: parseString(
      record.adjustment_type,
      "manualPayrollAdjustment.adjustment_type",
    ),
    category: parseString(record.category, "manualPayrollAdjustment.category"),
    amount: parseNumericString(record.amount, "manualPayrollAdjustment.amount"),
    direction: parseString(record.direction, "manualPayrollAdjustment.direction"),
    taxable: parseBoolean(record.taxable, "manualPayrollAdjustment.taxable"),
    is_recurring: parseBoolean(
      record.is_recurring,
      "manualPayrollAdjustment.is_recurring",
    ),
    effective_date: parseOptionalString(
      record.effective_date,
      "manualPayrollAdjustment.effective_date",
    ),
    reason: parseString(record.reason, "manualPayrollAdjustment.reason"),
    remarks: parseOptionalString(record.remarks, "manualPayrollAdjustment.remarks"),
    status: parseString(record.status, "manualPayrollAdjustment.status"),
    created_by_user_id: parseNumber(
      record.created_by_user_id,
      "manualPayrollAdjustment.created_by_user_id",
    ),
    approved_by_user_id: parseOptionalNumber(
      record.approved_by_user_id,
      "manualPayrollAdjustment.approved_by_user_id",
    ),
    approved_at: parseOptionalString(
      record.approved_at,
      "manualPayrollAdjustment.approved_at",
    ),
    applied_payroll_record_id: parseOptionalNumber(
      record.applied_payroll_record_id,
      "manualPayrollAdjustment.applied_payroll_record_id",
    ),
    applied_at: parseOptionalString(
      record.applied_at,
      "manualPayrollAdjustment.applied_at",
    ),
    created_at: parseString(record.created_at, "manualPayrollAdjustment.created_at"),
    updated_at: parseString(record.updated_at, "manualPayrollAdjustment.updated_at"),
  };
}

export function parsePayrollDeductionBreakdownRecord(
  value: unknown,
): PayrollDeductionBreakdownRecord {
  const record = parseRecord(value, "payroll deduction breakdown");

  return {
    id: parseNumber(record.id, "payrollDeductionBreakdown.id"),
    payroll_record_id: parseNumber(
      record.payroll_record_id,
      "payrollDeductionBreakdown.payroll_record_id",
    ),
    deduction_code: parseString(
      record.deduction_code,
      "payrollDeductionBreakdown.deduction_code",
    ),
    deduction_name: parseString(
      record.deduction_name,
      "payrollDeductionBreakdown.deduction_name",
    ),
    basis_amount: parseNumericString(
      record.basis_amount,
      "payrollDeductionBreakdown.basis_amount",
    ),
    employee_share: parseNumericString(
      record.employee_share,
      "payrollDeductionBreakdown.employee_share",
    ),
    employer_share: parseNumericString(
      record.employer_share,
      "payrollDeductionBreakdown.employer_share",
    ),
    bracket_id_used: parseOptionalNumber(
      record.bracket_id_used,
      "payrollDeductionBreakdown.bracket_id_used",
    ),
    config_snapshot_json: parseOptionalString(
      record.config_snapshot_json,
      "payrollDeductionBreakdown.config_snapshot_json",
    ),
    created_at: parseString(
      record.created_at,
      "payrollDeductionBreakdown.created_at",
    ),
    updated_at: parseString(
      record.updated_at,
      "payrollDeductionBreakdown.updated_at",
    ),
  };
}

export function parsePayrollAttendanceLineItemRecord(
  value: unknown,
): PayrollAttendanceLineItemRecord {
  const record = parseRecord(value, "payroll attendance line item");

  return {
    category: parseString(record.category, "payrollAttendanceLineItem.category"),
    attendance_record_id: parseOptionalNumber(
      record.attendance_record_id,
      "payrollAttendanceLineItem.attendance_record_id",
    ),
    attendance_date: parseString(
      record.attendance_date,
      "payrollAttendanceLineItem.attendance_date",
    ),
    time_in: parseOptionalString(record.time_in, "payrollAttendanceLineItem.time_in"),
    time_out: parseOptionalString(record.time_out, "payrollAttendanceLineItem.time_out"),
    time_out_day_offset: parseNumber(
      record.time_out_day_offset ?? 0,
      "payrollAttendanceLineItem.time_out_day_offset",
    ),
    shift_start: parseOptionalString(
      record.shift_start,
      "payrollAttendanceLineItem.shift_start",
    ),
    shift_end: parseOptionalString(
      record.shift_end,
      "payrollAttendanceLineItem.shift_end",
    ),
    late_minutes: parseNumber(
      record.late_minutes ?? 0,
      "payrollAttendanceLineItem.late_minutes",
    ),
    undertime_minutes: parseNumber(
      record.undertime_minutes ?? 0,
      "payrollAttendanceLineItem.undertime_minutes",
    ),
    overtime_minutes: parseNumber(
      record.overtime_minutes ?? 0,
      "payrollAttendanceLineItem.overtime_minutes",
    ),
    night_differential_minutes: parseNumber(
      record.night_differential_minutes ?? 0,
      "payrollAttendanceLineItem.night_differential_minutes",
    ),
    rendered_minutes: parseNumber(
      record.rendered_minutes ?? 0,
      "payrollAttendanceLineItem.rendered_minutes",
    ),
    payroll_minutes: parseNumber(
      record.payroll_minutes ?? 0,
      "payrollAttendanceLineItem.payroll_minutes",
    ),
    amount: parseNumericString(record.amount, "payrollAttendanceLineItem.amount"),
    day_type: parseString(record.day_type, "payrollAttendanceLineItem.day_type"),
    is_rest_day: parseBoolean(
      record.is_rest_day,
      "payrollAttendanceLineItem.is_rest_day",
    ),
    approval_basis: parseOptionalString(
      record.approval_basis,
      "payrollAttendanceLineItem.approval_basis",
    ),
    source_reference: parseOptionalString(
      record.source_reference,
      "payrollAttendanceLineItem.source_reference",
    ),
  };
}

export function parsePayrollRecordRecord(value: unknown): PayrollRecordRecord {
  const record = parseRecord(value, "payroll record");

  return {
    id: parseNumber(record.id, "payrollRecord.id"),
    payroll_batch_id: parseNumber(
      record.payroll_batch_id,
      "payrollRecord.payroll_batch_id",
    ),
    employee_id: parseNumber(record.employee_id, "payrollRecord.employee_id"),
    employee_code_snapshot: parseString(
      record.employee_code_snapshot,
      "payrollRecord.employee_code_snapshot",
    ),
    employee_name_snapshot: parseString(
      record.employee_name_snapshot,
      "payrollRecord.employee_name_snapshot",
    ),
    basic_pay: parseNumericString(record.basic_pay, "payrollRecord.basic_pay"),
    leave_pay: parseNumericString(record.leave_pay, "payrollRecord.leave_pay"),
    overtime_pay: parseNumericString(record.overtime_pay, "payrollRecord.overtime_pay"),
    night_differential_pay: parseNumericString(
      record.night_differential_pay,
      "payrollRecord.night_differential_pay",
    ),
    other_earnings: parseNumericString(
      record.other_earnings,
      "payrollRecord.other_earnings",
    ),
    late_deduction: parseNumericString(
      record.late_deduction,
      "payrollRecord.late_deduction",
    ),
    undertime_deduction: parseNumericString(
      record.undertime_deduction,
      "payrollRecord.undertime_deduction",
    ),
    absence_deduction: parseNumericString(
      record.absence_deduction,
      "payrollRecord.absence_deduction",
    ),
    other_deductions: parseNumericString(
      record.other_deductions,
      "payrollRecord.other_deductions",
    ),
    gross_pay: parseNumericString(record.gross_pay, "payrollRecord.gross_pay"),
    taxable_income: parseNumericString(
      record.taxable_income,
      "payrollRecord.taxable_income",
    ),
    rule_set_id_used: parseOptionalNumber(
      record.rule_set_id_used,
      "payrollRecord.rule_set_id_used",
    ),
    sss_employee: parseNumericString(record.sss_employee, "payrollRecord.sss_employee"),
    sss_employer: parseNumericString(record.sss_employer, "payrollRecord.sss_employer"),
    philhealth_employee: parseNumericString(
      record.philhealth_employee,
      "payrollRecord.philhealth_employee",
    ),
    philhealth_employer: parseNumericString(
      record.philhealth_employer,
      "payrollRecord.philhealth_employer",
    ),
    pagibig_employee: parseNumericString(
      record.pagibig_employee,
      "payrollRecord.pagibig_employee",
    ),
    pagibig_employer: parseNumericString(
      record.pagibig_employer,
      "payrollRecord.pagibig_employer",
    ),
    withholding_tax: parseNumericString(
      record.withholding_tax,
      "payrollRecord.withholding_tax",
    ),
    government_deductions_total: parseNumericString(
      record.government_deductions_total,
      "payrollRecord.government_deductions_total",
    ),
    total_employer_contributions: parseNumericString(
      record.total_employer_contributions,
      "payrollRecord.total_employer_contributions",
    ),
    total_deductions: parseNumericString(
      record.total_deductions,
      "payrollRecord.total_deductions",
    ),
    net_pay: parseNumericString(record.net_pay, "payrollRecord.net_pay"),
    total_work_days: parseNumber(record.total_work_days, "payrollRecord.total_work_days"),
    total_absences: parseNumber(record.total_absences, "payrollRecord.total_absences"),
    total_late_minutes: parseNumber(
      record.total_late_minutes,
      "payrollRecord.total_late_minutes",
    ),
    total_undertime_minutes: parseNumber(
      record.total_undertime_minutes,
      "payrollRecord.total_undertime_minutes",
    ),
    total_overtime_minutes: parseNumber(
      record.total_overtime_minutes,
      "payrollRecord.total_overtime_minutes",
    ),
    total_night_differential_minutes: parseNumber(
      record.total_night_differential_minutes,
      "payrollRecord.total_night_differential_minutes",
    ),
    attendance_review_status: parseString(
      record.attendance_review_status,
      "payrollRecord.attendance_review_status",
    ),
    attendance_acknowledged_at: parseOptionalString(
      record.attendance_acknowledged_at,
      "payrollRecord.attendance_acknowledged_at",
    ),
    calculation_source_status: parseString(
      record.calculation_source_status,
      "payrollRecord.calculation_source_status",
    ),
    has_unacknowledged_attendance: parseBoolean(
      record.has_unacknowledged_attendance,
      "payrollRecord.has_unacknowledged_attendance",
    ),
    used_system_computed_attendance: parseBoolean(
      record.used_system_computed_attendance,
      "payrollRecord.used_system_computed_attendance",
    ),
    has_missing_attendance_issues: parseBoolean(
      record.has_missing_attendance_issues,
      "payrollRecord.has_missing_attendance_issues",
    ),
    has_unresolved_requests: parseBoolean(
      record.has_unresolved_requests,
      "payrollRecord.has_unresolved_requests",
    ),
    has_unusual_adjustments: parseBoolean(
      record.has_unusual_adjustments,
      "payrollRecord.has_unusual_adjustments",
    ),
    unresolved_request_count: parseNumber(
      record.unresolved_request_count,
      "payrollRecord.unresolved_request_count",
    ),
    approved_request_count: parseNumber(
      record.approved_request_count,
      "payrollRecord.approved_request_count",
    ),
    no_employee_response: parseBoolean(
      record.no_employee_response,
      "payrollRecord.no_employee_response",
    ),
    review_remarks: parseOptionalString(
      record.review_remarks,
      "payrollRecord.review_remarks",
    ),
    deduction_snapshot_json: parseOptionalString(
      record.deduction_snapshot_json,
      "payrollRecord.deduction_snapshot_json",
    ),
    attendance_line_items: parseCollection(
      record.attendance_line_items ?? [],
      (item) => parsePayrollAttendanceLineItemRecord(item),
      "payroll attendance line items",
    ),
    adjustments: parseCollection(
      record.adjustments ?? [],
      (item) => parsePayrollAdjustmentRecord(item),
      "payroll record adjustments",
    ),
    deduction_breakdowns: parseCollection(
      record.deduction_breakdowns ?? [],
      (item) => parsePayrollDeductionBreakdownRecord(item),
      "payroll deduction breakdowns",
    ),
    created_at: parseString(record.created_at, "payrollRecord.created_at"),
    updated_at: parseString(record.updated_at, "payrollRecord.updated_at"),
  };
}

export function parsePayrollBatchSummaryRecord(value: unknown): PayrollBatchSummaryRecord {
  const record = parseRecord(value, "payroll batch");

  return {
    id: parseNumber(record.id, "payrollBatch.id"),
    cutoff_id: parseNumber(record.cutoff_id, "payrollBatch.cutoff_id"),
    status: parseString(record.status, "payrollBatch.status"),
    calculated_by_user_id: parseOptionalNumber(
      record.calculated_by_user_id,
      "payrollBatch.calculated_by_user_id",
    ),
    calculated_at: parseOptionalString(
      record.calculated_at,
      "payrollBatch.calculated_at",
    ),
    reviewed_by_user_id: parseOptionalNumber(
      record.reviewed_by_user_id,
      "payrollBatch.reviewed_by_user_id",
    ),
    reviewed_at: parseOptionalString(record.reviewed_at, "payrollBatch.reviewed_at"),
    approved_by_user_id: parseOptionalNumber(
      record.approved_by_user_id,
      "payrollBatch.approved_by_user_id",
    ),
    approved_at: parseOptionalString(record.approved_at, "payrollBatch.approved_at"),
    finalized_by_user_id: parseOptionalNumber(
      record.finalized_by_user_id,
      "payrollBatch.finalized_by_user_id",
    ),
    finalized_at: parseOptionalString(record.finalized_at, "payrollBatch.finalized_at"),
    posted_by_user_id: parseOptionalNumber(
      record.posted_by_user_id,
      "payrollBatch.posted_by_user_id",
    ),
    posted_at: parseOptionalString(record.posted_at, "payrollBatch.posted_at"),
    remarks: parseOptionalString(record.remarks, "payrollBatch.remarks"),
    created_at: parseString(record.created_at, "payrollBatch.created_at"),
    updated_at: parseString(record.updated_at, "payrollBatch.updated_at"),
    cutoff: parseAttendanceCutoffRecord(record.cutoff),
    record_count: parseNumber(record.record_count, "payrollBatch.record_count"),
    total_gross_pay: parseNumericString(
      record.total_gross_pay,
      "payrollBatch.total_gross_pay",
    ),
    total_deductions: parseNumericString(
      record.total_deductions,
      "payrollBatch.total_deductions",
    ),
    total_net_pay: parseNumericString(
      record.total_net_pay,
      "payrollBatch.total_net_pay",
    ),
    records_with_flags: parseNumber(
      record.records_with_flags,
      "payrollBatch.records_with_flags",
    ),
    records_using_system_defaults: parseNumber(
      record.records_using_system_defaults,
      "payrollBatch.records_using_system_defaults",
    ),
  };
}

export function parsePayrollBatchDetailRecord(value: unknown): PayrollBatchDetailRecord {
  const record = parseRecord(value, "payroll batch detail");
  const summary = parsePayrollBatchSummaryRecord(record);

  return {
    ...summary,
    records: parseCollection(
      record.records ?? [],
      (item) => parsePayrollRecordRecord(item),
      "payroll batch records",
    ),
  };
}

export function parsePayrollReconciliationTotalsRecord(
  value: unknown,
): PayrollReconciliationTotalsRecord {
  const record = parseRecord(value, "payroll reconciliation totals");

  return {
    employee_count: parseNumber(
      record.employee_count,
      "payrollReconciliationTotals.employee_count",
    ),
    gross_total: parseNumericString(
      record.gross_total,
      "payrollReconciliationTotals.gross_total",
    ),
    deductions_total: parseNumericString(
      record.deductions_total,
      "payrollReconciliationTotals.deductions_total",
    ),
    employer_contributions_total: parseNumericString(
      record.employer_contributions_total,
      "payrollReconciliationTotals.employer_contributions_total",
    ),
    net_total: parseNumericString(
      record.net_total,
      "payrollReconciliationTotals.net_total",
    ),
    government_deductions_total: parseNumericString(
      record.government_deductions_total,
      "payrollReconciliationTotals.government_deductions_total",
    ),
    flagged_record_count: parseNumber(
      record.flagged_record_count,
      "payrollReconciliationTotals.flagged_record_count",
    ),
  };
}

export function parsePayrollReconciliationWarningSampleRecord(
  value: unknown,
): PayrollReconciliationWarningSampleRecord {
  const record = parseRecord(value, "payroll reconciliation warning sample");

  return {
    employee_id: parseNumber(record.employee_id, "payrollReconciliationSample.employee_id"),
    payroll_record_id: parseNumber(
      record.payroll_record_id,
      "payrollReconciliationSample.payroll_record_id",
    ),
    employee_code: parseString(
      record.employee_code,
      "payrollReconciliationSample.employee_code",
    ),
    employee_name: parseString(
      record.employee_name,
      "payrollReconciliationSample.employee_name",
    ),
  };
}

export function parsePayrollReconciliationWarningRecord(
  value: unknown,
): PayrollReconciliationWarningRecord {
  const record = parseRecord(value, "payroll reconciliation warning");

  return {
    key: parseString(record.key, "payrollReconciliationWarning.key"),
    title: parseString(record.title, "payrollReconciliationWarning.title"),
    description: parseString(
      record.description,
      "payrollReconciliationWarning.description",
    ),
    severity: parseString(
      record.severity,
      "payrollReconciliationWarning.severity",
    ) as PayrollReconciliationWarningRecord["severity"],
    affected_count: parseNumber(
      record.affected_count,
      "payrollReconciliationWarning.affected_count",
    ),
    samples: parseCollection(
      record.samples ?? [],
      (item) => parsePayrollReconciliationWarningSampleRecord(item),
      "payrollReconciliationWarning.samples",
    ),
  };
}

export function parsePayrollReconciliationComparisonRecord(
  value: unknown,
): PayrollReconciliationComparisonRecord {
  const record = parseRecord(value, "payroll reconciliation comparison");

  return {
    batch_id: parseNumber(record.batch_id, "payrollReconciliationComparison.batch_id"),
    batch_status: parseString(
      record.batch_status,
      "payrollReconciliationComparison.batch_status",
    ),
    cutoff: parseAttendanceCutoffRecord(record.cutoff),
    totals: parsePayrollReconciliationTotalsRecord(record.totals),
    employee_count_delta: parseNumber(
      record.employee_count_delta,
      "payrollReconciliationComparison.employee_count_delta",
    ),
    gross_total_delta: parseNumericString(
      record.gross_total_delta,
      "payrollReconciliationComparison.gross_total_delta",
    ),
    deductions_total_delta: parseNumericString(
      record.deductions_total_delta,
      "payrollReconciliationComparison.deductions_total_delta",
    ),
    employer_contributions_total_delta: parseNumericString(
      record.employer_contributions_total_delta,
      "payrollReconciliationComparison.employer_contributions_total_delta",
    ),
    net_total_delta: parseNumericString(
      record.net_total_delta,
      "payrollReconciliationComparison.net_total_delta",
    ),
  };
}

export function parsePayrollReconciliationRecord(
  value: unknown,
): PayrollReconciliationRecord {
  const record = parseRecord(value, "payroll reconciliation");

  return {
    batch_id: parseNumber(record.batch_id, "payrollReconciliation.batch_id"),
    batch_status: parseString(record.batch_status, "payrollReconciliation.batch_status"),
    generated_at: parseString(record.generated_at, "payrollReconciliation.generated_at"),
    cutoff: parseAttendanceCutoffRecord(record.cutoff),
    totals: parsePayrollReconciliationTotalsRecord(record.totals),
    comparison:
      record.comparison == null
        ? null
        : parsePayrollReconciliationComparisonRecord(record.comparison),
    warnings: parseCollection(
      record.warnings ?? [],
      (item) => parsePayrollReconciliationWarningRecord(item),
      "payrollReconciliation.warnings",
    ),
  };
}

export function parsePayrollReportStatusOptionRecord(
  value: unknown,
): PayrollReportStatusOptionRecord {
  const record = parseRecord(value, "payroll report status option");

  return {
    value: parseString(record.value, "payrollReportStatusOption.value"),
    label: parseString(record.label, "payrollReportStatusOption.label"),
    count: parseNumber(record.count, "payrollReportStatusOption.count"),
  };
}

export function parsePayrollReportYtdSummaryRecord(
  value: unknown,
): PayrollReportYtdSummaryRecord {
  const record = parseRecord(value, "payroll year to date summary");

  return {
    year: parseNumber(record.year, "payrollReportYtd.year"),
    total_basic_pay: parseNumericString(
      record.total_basic_pay,
      "payrollReportYtd.total_basic_pay",
    ),
    total_gross_pay: parseNumericString(
      record.total_gross_pay,
      "payrollReportYtd.total_gross_pay",
    ),
    total_net_pay: parseNumericString(
      record.total_net_pay,
      "payrollReportYtd.total_net_pay",
    ),
    total_employee_deductions: parseNumericString(
      record.total_employee_deductions,
      "payrollReportYtd.total_employee_deductions",
    ),
    total_government_deductions: parseNumericString(
      record.total_government_deductions,
      "payrollReportYtd.total_government_deductions",
    ),
    total_government_remittances: parseNumericString(
      record.total_government_remittances,
      "payrollReportYtd.total_government_remittances",
    ),
    total_employer_contributions: parseNumericString(
      record.total_employer_contributions,
      "payrollReportYtd.total_employer_contributions",
    ),
    total_cutoff_runs: parseNumber(
      record.total_cutoff_runs,
      "payrollReportYtd.total_cutoff_runs",
    ),
    total_employees_processed: parseNumber(
      record.total_employees_processed,
      "payrollReportYtd.total_employees_processed",
    ),
    total_records_processed: parseNumber(
      record.total_records_processed,
      "payrollReportYtd.total_records_processed",
    ),
  };
}

export function parsePayrollReportMonthlySummaryRecord(
  value: unknown,
): PayrollReportMonthlySummaryRecord {
  const record = parseRecord(value, "payroll monthly summary");

  return {
    month: parseNumber(record.month, "payrollReportMonthly.month"),
    label: parseString(record.label, "payrollReportMonthly.label"),
    total_basic_pay: parseNumericString(
      record.total_basic_pay,
      "payrollReportMonthly.total_basic_pay",
    ),
    total_gross_pay: parseNumericString(
      record.total_gross_pay,
      "payrollReportMonthly.total_gross_pay",
    ),
    total_net_pay: parseNumericString(
      record.total_net_pay,
      "payrollReportMonthly.total_net_pay",
    ),
    total_employee_deductions: parseNumericString(
      record.total_employee_deductions,
      "payrollReportMonthly.total_employee_deductions",
    ),
    total_government_deductions: parseNumericString(
      record.total_government_deductions,
      "payrollReportMonthly.total_government_deductions",
    ),
    total_government_remittances: parseNumericString(
      record.total_government_remittances,
      "payrollReportMonthly.total_government_remittances",
    ),
    total_employer_contributions: parseNumericString(
      record.total_employer_contributions,
      "payrollReportMonthly.total_employer_contributions",
    ),
    cutoff_count: parseNumber(record.cutoff_count, "payrollReportMonthly.cutoff_count"),
    processed_cutoff_count: parseNumber(
      record.processed_cutoff_count,
      "payrollReportMonthly.processed_cutoff_count",
    ),
    employee_count: parseNumber(record.employee_count, "payrollReportMonthly.employee_count"),
  };
}

export function parsePayrollReportTrendPointRecord(
  value: unknown,
): PayrollReportTrendPointRecord {
  const record = parseRecord(value, "payroll trend point");

  return {
    month: parseNumber(record.month, "payrollReportTrend.month"),
    label: parseString(record.label, "payrollReportTrend.label"),
    total_gross_pay: parseNumericString(
      record.total_gross_pay,
      "payrollReportTrend.total_gross_pay",
    ),
    total_employer_contributions: parseNumericString(
      record.total_employer_contributions,
      "payrollReportTrend.total_employer_contributions",
    ),
    total_deductions: parseNumericString(
      record.total_deductions,
      "payrollReportTrend.total_deductions",
    ),
    gross_pay_delta: parseNumericString(
      record.gross_pay_delta,
      "payrollReportTrend.gross_pay_delta",
    ),
    employer_contributions_delta: parseNumericString(
      record.employer_contributions_delta,
      "payrollReportTrend.employer_contributions_delta",
    ),
    deductions_delta: parseNumericString(
      record.deductions_delta,
      "payrollReportTrend.deductions_delta",
    ),
  };
}

export function parsePayrollReportGovernmentSummaryRecord(
  value: unknown,
): PayrollReportGovernmentSummaryRecord {
  const record = parseRecord(value, "payroll government summary");

  return {
    sss_employee: parseNumericString(
      record.sss_employee,
      "payrollReportGovernment.sss_employee",
    ),
    sss_employer: parseNumericString(
      record.sss_employer,
      "payrollReportGovernment.sss_employer",
    ),
    philhealth_employee: parseNumericString(
      record.philhealth_employee,
      "payrollReportGovernment.philhealth_employee",
    ),
    philhealth_employer: parseNumericString(
      record.philhealth_employer,
      "payrollReportGovernment.philhealth_employer",
    ),
    pagibig_employee: parseNumericString(
      record.pagibig_employee,
      "payrollReportGovernment.pagibig_employee",
    ),
    pagibig_employer: parseNumericString(
      record.pagibig_employer,
      "payrollReportGovernment.pagibig_employer",
    ),
    withholding_tax: parseNumericString(
      record.withholding_tax,
      "payrollReportGovernment.withholding_tax",
    ),
    total_employee_contributions: parseNumericString(
      record.total_employee_contributions,
      "payrollReportGovernment.total_employee_contributions",
    ),
    total_employer_shares: parseNumericString(
      record.total_employer_shares,
      "payrollReportGovernment.total_employer_shares",
    ),
    total_government_remittances: parseNumericString(
      record.total_government_remittances,
      "payrollReportGovernment.total_government_remittances",
    ),
  };
}

export function parsePayrollReportEmployerContributionSummaryRecord(
  value: unknown,
): PayrollReportEmployerContributionSummaryRecord {
  const record = parseRecord(value, "payroll employer contribution summary");

  return {
    sss_employer: parseNumericString(
      record.sss_employer,
      "payrollReportEmployerContribution.sss_employer",
    ),
    philhealth_employer: parseNumericString(
      record.philhealth_employer,
      "payrollReportEmployerContribution.philhealth_employer",
    ),
    pagibig_employer: parseNumericString(
      record.pagibig_employer,
      "payrollReportEmployerContribution.pagibig_employer",
    ),
    total_employer_shares: parseNumericString(
      record.total_employer_shares,
      "payrollReportEmployerContribution.total_employer_shares",
    ),
    total_employer_contribution_cost: parseNumericString(
      record.total_employer_contribution_cost,
      "payrollReportEmployerContribution.total_employer_contribution_cost",
    ),
  };
}

export function parsePayrollReportCutoffSummaryRecord(
  value: unknown,
): PayrollReportCutoffSummaryRecord {
  const record = parseRecord(value, "payroll cutoff summary");

  return {
    cutoff_id: parseNumber(record.cutoff_id, "payrollReportCutoffSummary.cutoff_id"),
    batch_id: parseOptionalNumber(record.batch_id, "payrollReportCutoffSummary.batch_id"),
    label: parseString(record.label, "payrollReportCutoffSummary.label"),
    cutoff_start: parseString(
      record.cutoff_start,
      "payrollReportCutoffSummary.cutoff_start",
    ),
    cutoff_end: parseString(record.cutoff_end, "payrollReportCutoffSummary.cutoff_end"),
    cutoff_status: parseString(
      record.cutoff_status,
      "payrollReportCutoffSummary.cutoff_status",
    ),
    batch_status: parseOptionalString(
      record.batch_status,
      "payrollReportCutoffSummary.batch_status",
    ),
    status: parseString(record.status, "payrollReportCutoffSummary.status"),
    status_label: parseString(
      record.status_label,
      "payrollReportCutoffSummary.status_label",
    ),
    status_tone: parseString(
      record.status_tone,
      "payrollReportCutoffSummary.status_tone",
    ),
    is_live: parseBoolean(record.is_live, "payrollReportCutoffSummary.is_live"),
    is_finalized: parseBoolean(
      record.is_finalized,
      "payrollReportCutoffSummary.is_finalized",
    ),
    has_payroll_data: parseBoolean(
      record.has_payroll_data,
      "payrollReportCutoffSummary.has_payroll_data",
    ),
    record_count: parseNumber(
      record.record_count,
      "payrollReportCutoffSummary.record_count",
    ),
    employee_count: parseNumber(
      record.employee_count,
      "payrollReportCutoffSummary.employee_count",
    ),
    total_gross_pay: parseNumericString(
      record.total_gross_pay,
      "payrollReportCutoffSummary.total_gross_pay",
    ),
    total_net_pay: parseNumericString(
      record.total_net_pay,
      "payrollReportCutoffSummary.total_net_pay",
    ),
    total_deductions: parseNumericString(
      record.total_deductions,
      "payrollReportCutoffSummary.total_deductions",
    ),
    total_employee_contributions: parseNumericString(
      record.total_employee_contributions,
      "payrollReportCutoffSummary.total_employee_contributions",
    ),
    total_government_deductions: parseNumericString(
      record.total_government_deductions,
      "payrollReportCutoffSummary.total_government_deductions",
    ),
    total_employer_contributions: parseNumericString(
      record.total_employer_contributions,
      "payrollReportCutoffSummary.total_employer_contributions",
    ),
    last_updated_at: parseString(
      record.last_updated_at,
      "payrollReportCutoffSummary.last_updated_at",
    ),
  };
}

export function parsePayrollReportCutoffDetailRecord(
  value: unknown,
): PayrollReportCutoffDetailRecord {
  const record = parseRecord(value, "payroll cutoff detail");

  return {
    cutoff_id: parseNumber(record.cutoff_id, "payrollReportCutoffDetail.cutoff_id"),
    batch_id: parseOptionalNumber(record.batch_id, "payrollReportCutoffDetail.batch_id"),
    label: parseString(record.label, "payrollReportCutoffDetail.label"),
    cutoff_start: parseString(record.cutoff_start, "payrollReportCutoffDetail.cutoff_start"),
    cutoff_end: parseString(record.cutoff_end, "payrollReportCutoffDetail.cutoff_end"),
    cutoff_status: parseString(
      record.cutoff_status,
      "payrollReportCutoffDetail.cutoff_status",
    ),
    batch_status: parseOptionalString(
      record.batch_status,
      "payrollReportCutoffDetail.batch_status",
    ),
    status: parseString(record.status, "payrollReportCutoffDetail.status"),
    status_label: parseString(record.status_label, "payrollReportCutoffDetail.status_label"),
    status_tone: parseString(record.status_tone, "payrollReportCutoffDetail.status_tone"),
    is_live: parseBoolean(record.is_live, "payrollReportCutoffDetail.is_live"),
    is_finalized: parseBoolean(
      record.is_finalized,
      "payrollReportCutoffDetail.is_finalized",
    ),
    has_payroll_data: parseBoolean(
      record.has_payroll_data,
      "payrollReportCutoffDetail.has_payroll_data",
    ),
    record_count: parseNumber(record.record_count, "payrollReportCutoffDetail.record_count"),
    employee_count: parseNumber(
      record.employee_count,
      "payrollReportCutoffDetail.employee_count",
    ),
    remarks: parseOptionalString(record.remarks, "payrollReportCutoffDetail.remarks"),
    last_updated_at: parseString(
      record.last_updated_at,
      "payrollReportCutoffDetail.last_updated_at",
    ),
    total_basic_pay: parseNumericString(
      record.total_basic_pay,
      "payrollReportCutoffDetail.total_basic_pay",
    ),
    total_leave_pay: parseNumericString(
      record.total_leave_pay,
      "payrollReportCutoffDetail.total_leave_pay",
    ),
    total_allowances: parseNumericString(
      record.total_allowances,
      "payrollReportCutoffDetail.total_allowances",
    ),
    total_overtime_pay: parseNumericString(
      record.total_overtime_pay,
      "payrollReportCutoffDetail.total_overtime_pay",
    ),
    total_night_differential_pay: parseNumericString(
      record.total_night_differential_pay,
      "payrollReportCutoffDetail.total_night_differential_pay",
    ),
    total_gross_pay: parseNumericString(
      record.total_gross_pay,
      "payrollReportCutoffDetail.total_gross_pay",
    ),
    total_net_pay: parseNumericString(
      record.total_net_pay,
      "payrollReportCutoffDetail.total_net_pay",
    ),
    total_deductions: parseNumericString(
      record.total_deductions,
      "payrollReportCutoffDetail.total_deductions",
    ),
    total_late_deductions: parseNumericString(
      record.total_late_deductions,
      "payrollReportCutoffDetail.total_late_deductions",
    ),
    total_undertime_deductions: parseNumericString(
      record.total_undertime_deductions,
      "payrollReportCutoffDetail.total_undertime_deductions",
    ),
    total_absence_deductions: parseNumericString(
      record.total_absence_deductions,
      "payrollReportCutoffDetail.total_absence_deductions",
    ),
    total_loan_deductions: parseNumericString(
      record.total_loan_deductions,
      "payrollReportCutoffDetail.total_loan_deductions",
    ),
    total_employee_contributions: parseNumericString(
      record.total_employee_contributions,
      "payrollReportCutoffDetail.total_employee_contributions",
    ),
    total_government_deductions: parseNumericString(
      record.total_government_deductions,
      "payrollReportCutoffDetail.total_government_deductions",
    ),
    total_government_remittances: parseNumericString(
      record.total_government_remittances,
      "payrollReportCutoffDetail.total_government_remittances",
    ),
    total_employer_contributions: parseNumericString(
      record.total_employer_contributions,
      "payrollReportCutoffDetail.total_employer_contributions",
    ),
    government_summary: parsePayrollReportGovernmentSummaryRecord(
      record.government_summary,
    ),
    employer_contribution_summary: parsePayrollReportEmployerContributionSummaryRecord(
      record.employer_contribution_summary,
    ),
  };
}

export function parsePayrollReportingSnapshotRecord(
  value: unknown,
): PayrollReportingSnapshotRecord {
  const record = parseRecord(value, "payroll reporting snapshot");

  return {
    available_years: parseCollection(
      record.available_years ?? [],
      (item) => parseNumber(item, "payrollReporting.available_years"),
      "payroll reporting available years",
    ),
    available_statuses: parseCollection(
      record.available_statuses ?? [],
      (item) => parsePayrollReportStatusOptionRecord(item),
      "payroll reporting available statuses",
    ),
    selected_year: parseNumber(record.selected_year, "payrollReporting.selected_year"),
    selected_status: parseOptionalString(
      record.selected_status,
      "payrollReporting.selected_status",
    ),
    selected_cutoff_id: parseOptionalNumber(
      record.selected_cutoff_id,
      "payrollReporting.selected_cutoff_id",
    ),
    year_to_date: parsePayrollReportYtdSummaryRecord(record.year_to_date),
    monthly_summaries: parseCollection(
      record.monthly_summaries ?? [],
      (item) => parsePayrollReportMonthlySummaryRecord(item),
      "payroll reporting monthly summaries",
    ),
    cutoff_summaries: parseCollection(
      record.cutoff_summaries ?? [],
      (item) => parsePayrollReportCutoffSummaryRecord(item),
      "payroll reporting cutoff summaries",
    ),
    selected_cutoff:
      record.selected_cutoff == null
        ? null
        : parsePayrollReportCutoffDetailRecord(record.selected_cutoff),
    government_summary: parsePayrollReportGovernmentSummaryRecord(
      record.government_summary,
    ),
    employer_contribution_summary: parsePayrollReportEmployerContributionSummaryRecord(
      record.employer_contribution_summary,
    ),
    monthly_trends: parseCollection(
      record.monthly_trends ?? [],
      (item) => parsePayrollReportTrendPointRecord(item),
      "payroll reporting monthly trends",
    ),
  };
}

export function parsePayrollCutoffPreviewRecord(value: unknown): PayrollCutoffPreviewRecord {
  const record = parseRecord(value, "payroll cutoff preview");

  return {
    cutoff: parseAttendanceCutoffRecord(record.cutoff),
    review_deadline_at: parseOptionalString(
      record.review_deadline_at,
      "payrollCutoffPreview.review_deadline_at",
    ),
    review_window_closed: parseBoolean(
      record.review_window_closed,
      "payrollCutoffPreview.review_window_closed",
    ),
    existing_batch_id: parseOptionalNumber(
      record.existing_batch_id,
      "payrollCutoffPreview.existing_batch_id",
    ),
    existing_batch_status: parseOptionalString(
      record.existing_batch_status,
      "payrollCutoffPreview.existing_batch_status",
    ),
    can_calculate: parseBoolean(
      record.can_calculate,
      "payrollCutoffPreview.can_calculate",
    ),
    blocked_reason: parseOptionalString(
      record.blocked_reason,
      "payrollCutoffPreview.blocked_reason",
    ),
  };
}

export function parseEmployeePayrollCutoffStatusRecord(
  value: unknown,
): EmployeePayrollCutoffStatusRecord {
  const record = parseRecord(value, "employee payroll cutoff status");

  return {
    id: parseNumber(record.id, "employeePayrollCutoffStatus.id"),
    cutoff_id: parseNumber(record.cutoff_id, "employeePayrollCutoffStatus.cutoff_id"),
    employee_id: parseNumber(record.employee_id, "employeePayrollCutoffStatus.employee_id"),
    attendance_uploaded: parseBoolean(
      record.attendance_uploaded,
      "employeePayrollCutoffStatus.attendance_uploaded",
    ),
    attendance_validated: parseBoolean(
      record.attendance_validated,
      "employeePayrollCutoffStatus.attendance_validated",
    ),
    leave_status: parseString(record.leave_status, "employeePayrollCutoffStatus.leave_status"),
    overtime_status: parseString(
      record.overtime_status,
      "employeePayrollCutoffStatus.overtime_status",
    ),
    adjustment_status: parseString(
      record.adjustment_status,
      "employeePayrollCutoffStatus.adjustment_status",
    ),
    loan_check_status: parseString(
      record.loan_check_status,
      "employeePayrollCutoffStatus.loan_check_status",
    ),
    readiness_status: parseString(
      record.readiness_status,
      "employeePayrollCutoffStatus.readiness_status",
    ),
    is_locked: parseBoolean(record.is_locked, "employeePayrollCutoffStatus.is_locked"),
    locked_at: parseOptionalString(record.locked_at, "employeePayrollCutoffStatus.locked_at"),
    locked_by_user_id: parseOptionalNumber(
      record.locked_by_user_id,
      "employeePayrollCutoffStatus.locked_by_user_id",
    ),
    is_calculated: parseBoolean(
      record.is_calculated,
      "employeePayrollCutoffStatus.is_calculated",
    ),
    calculated_at: parseOptionalString(
      record.calculated_at,
      "employeePayrollCutoffStatus.calculated_at",
    ),
    calculated_by_user_id: parseOptionalNumber(
      record.calculated_by_user_id,
      "employeePayrollCutoffStatus.calculated_by_user_id",
    ),
    is_finalized: parseBoolean(
      record.is_finalized,
      "employeePayrollCutoffStatus.is_finalized",
    ),
    finalized_at: parseOptionalString(
      record.finalized_at,
      "employeePayrollCutoffStatus.finalized_at",
    ),
    finalized_by_user_id: parseOptionalNumber(
      record.finalized_by_user_id,
      "employeePayrollCutoffStatus.finalized_by_user_id",
    ),
    notes: parseOptionalString(record.notes, "employeePayrollCutoffStatus.notes"),
    employee_code: parseString(
      record.employee_code,
      "employeePayrollCutoffStatus.employee_code",
    ),
    employee_name: parseString(
      record.employee_name,
      "employeePayrollCutoffStatus.employee_name",
    ),
    blocking_issues: parseCollection(
      record.blocking_issues ?? [],
      (item, index) =>
        parseString(item, `employeePayrollCutoffStatus.blocking_issues[${index}]`),
      "employeePayrollCutoffStatus.blocking_issues",
    ),
    warnings: parseCollection(
      record.warnings ?? [],
      (item, index) => parseString(item, `employeePayrollCutoffStatus.warnings[${index}]`),
      "employeePayrollCutoffStatus.warnings",
    ),
    payroll_batch_id: parseOptionalNumber(
      record.payroll_batch_id,
      "employeePayrollCutoffStatus.payroll_batch_id",
    ),
    payroll_record_id: parseOptionalNumber(
      record.payroll_record_id,
      "employeePayrollCutoffStatus.payroll_record_id",
    ),
    preview_available: parseBoolean(
      record.preview_available,
      "employeePayrollCutoffStatus.preview_available",
    ),
    created_at: parseString(record.created_at, "employeePayrollCutoffStatus.created_at"),
    updated_at: parseString(record.updated_at, "employeePayrollCutoffStatus.updated_at"),
  };
}

export function parseEmployeePayrollCutoffPreviewRecord(
  value: unknown,
): EmployeePayrollCutoffPreviewRecord {
  const record = parseRecord(value, "employee payroll cutoff preview");

  return {
    cutoff_id: parseNumber(record.cutoff_id, "employeePayrollCutoffPreview.cutoff_id"),
    employee_id: parseNumber(record.employee_id, "employeePayrollCutoffPreview.employee_id"),
    readiness_status: parseString(
      record.readiness_status,
      "employeePayrollCutoffPreview.readiness_status",
    ),
    is_persisted: parseBoolean(
      record.is_persisted,
      "employeePayrollCutoffPreview.is_persisted",
    ),
    payroll_batch_id: parseOptionalNumber(
      record.payroll_batch_id,
      "employeePayrollCutoffPreview.payroll_batch_id",
    ),
    payroll_record_id: parseOptionalNumber(
      record.payroll_record_id,
      "employeePayrollCutoffPreview.payroll_record_id",
    ),
    record: parsePayrollRecordRecord(record.record),
  };
}

export function parsePayslipRecord(value: unknown): PayslipRecord {
  const record = parseRecord(value, "payslip");

  return {
    id: parseNumber(record.id, "payslip.id"),
    payroll_batch_id: parseNumber(record.payroll_batch_id, "payslip.payroll_batch_id"),
    payroll_record_id: parseNumber(
      record.payroll_record_id,
      "payslip.payroll_record_id",
    ),
    employee_id: parseNumber(record.employee_id, "payslip.employee_id"),
    cutoff_start: parseString(record.cutoff_start, "payslip.cutoff_start"),
    cutoff_end: parseString(record.cutoff_end, "payslip.cutoff_end"),
    posted_at: parseOptionalString(record.posted_at, "payslip.posted_at"),
    status: parseString(record.status, "payslip.status"),
    generated_reference: parseString(
      record.generated_reference,
      "payslip.generated_reference",
    ),
    payroll_record: parsePayrollRecordRecord(record.payroll_record),
    created_at: parseString(record.created_at, "payslip.created_at"),
    updated_at: parseString(record.updated_at, "payslip.updated_at"),
  };
}

export function parseGovernmentDeductionTypeRecord(
  value: unknown,
): GovernmentDeductionTypeRecord {
  const record = parseRecord(value, "government deduction type");

  return {
    id: parseNumber(record.id, "governmentDeductionType.id"),
    code: parseString(record.code, "governmentDeductionType.code"),
    name: parseString(record.name, "governmentDeductionType.name"),
    calculation_method: parseString(
      record.calculation_method,
      "governmentDeductionType.calculation_method",
    ),
    employee_share_enabled: parseBoolean(
      record.employee_share_enabled,
      "governmentDeductionType.employee_share_enabled",
    ),
    employer_share_enabled: parseBoolean(
      record.employer_share_enabled,
      "governmentDeductionType.employer_share_enabled",
    ),
    is_mandatory: parseBoolean(
      record.is_mandatory,
      "governmentDeductionType.is_mandatory",
    ),
    created_at: parseString(record.created_at, "governmentDeductionType.created_at"),
    updated_at: parseString(record.updated_at, "governmentDeductionType.updated_at"),
  };
}

export function parseGovernmentDeductionTypeConfigRecord(
  value: unknown,
): GovernmentDeductionTypeConfigRecord {
  const record = parseRecord(value, "government deduction config");

  return {
    id: parseNumber(record.id, "governmentDeductionConfig.id"),
    rule_set_id: parseNumber(record.rule_set_id, "governmentDeductionConfig.rule_set_id"),
    deduction_type_id: parseNumber(
      record.deduction_type_id,
      "governmentDeductionConfig.deduction_type_id",
    ),
    deduction_type_code: parseString(
      record.deduction_type_code,
      "governmentDeductionConfig.deduction_type_code",
    ),
    deduction_type_name: parseString(
      record.deduction_type_name,
      "governmentDeductionConfig.deduction_type_name",
    ),
    based_on: parseString(record.based_on, "governmentDeductionConfig.based_on"),
    frequency: parseString(record.frequency, "governmentDeductionConfig.frequency"),
    rounding_method: parseString(
      record.rounding_method,
      "governmentDeductionConfig.rounding_method",
    ),
    income_floor: parseOptionalNumericString(
      record.income_floor,
      "governmentDeductionConfig.income_floor",
    ),
    income_ceiling: parseOptionalNumericString(
      record.income_ceiling,
      "governmentDeductionConfig.income_ceiling",
    ),
    employee_share_ratio: parseOptionalNumericString(
      record.employee_share_ratio,
      "governmentDeductionConfig.employee_share_ratio",
    ),
    employer_share_ratio: parseOptionalNumericString(
      record.employer_share_ratio,
      "governmentDeductionConfig.employer_share_ratio",
    ),
    cap_amount: parseOptionalNumericString(
      record.cap_amount,
      "governmentDeductionConfig.cap_amount",
    ),
    threshold_amount: parseOptionalNumericString(
      record.threshold_amount,
      "governmentDeductionConfig.threshold_amount",
    ),
    rate: parseOptionalNumericString(record.rate, "governmentDeductionConfig.rate"),
    rate_employee: parseOptionalNumericString(
      record.rate_employee,
      "governmentDeductionConfig.rate_employee",
    ),
    rate_employer: parseOptionalNumericString(
      record.rate_employer,
      "governmentDeductionConfig.rate_employer",
    ),
    fixed_employee_amount: parseOptionalNumericString(
      record.fixed_employee_amount,
      "governmentDeductionConfig.fixed_employee_amount",
    ),
    fixed_employer_amount: parseOptionalNumericString(
      record.fixed_employer_amount,
      "governmentDeductionConfig.fixed_employer_amount",
    ),
    formula_expression: parseOptionalString(
      record.formula_expression,
      "governmentDeductionConfig.formula_expression",
    ),
    priority_order: parseNumber(
      record.priority_order,
      "governmentDeductionConfig.priority_order",
    ),
    created_at: parseString(record.created_at, "governmentDeductionConfig.created_at"),
    updated_at: parseString(record.updated_at, "governmentDeductionConfig.updated_at"),
  };
}

export function parseGovernmentDeductionBracketRecord(
  value: unknown,
): GovernmentDeductionBracketRecord {
  const record = parseRecord(value, "government deduction bracket");

  return {
    id: parseNumber(record.id, "governmentDeductionBracket.id"),
    rule_set_id: parseNumber(record.rule_set_id, "governmentDeductionBracket.rule_set_id"),
    deduction_type_id: parseNumber(
      record.deduction_type_id,
      "governmentDeductionBracket.deduction_type_id",
    ),
    deduction_type_code: parseString(
      record.deduction_type_code,
      "governmentDeductionBracket.deduction_type_code",
    ),
    deduction_type_name: parseString(
      record.deduction_type_name,
      "governmentDeductionBracket.deduction_type_name",
    ),
    min_salary: parseNumericString(
      record.min_salary,
      "governmentDeductionBracket.min_salary",
    ),
    max_salary: parseOptionalNumericString(
      record.max_salary,
      "governmentDeductionBracket.max_salary",
    ),
    base_amount_employee: parseOptionalNumericString(
      record.base_amount_employee,
      "governmentDeductionBracket.base_amount_employee",
    ),
    base_amount_employer: parseOptionalNumericString(
      record.base_amount_employer,
      "governmentDeductionBracket.base_amount_employer",
    ),
    fixed_employee_amount: parseOptionalNumericString(
      record.fixed_employee_amount,
      "governmentDeductionBracket.fixed_employee_amount",
    ),
    fixed_employer_amount: parseOptionalNumericString(
      record.fixed_employer_amount,
      "governmentDeductionBracket.fixed_employer_amount",
    ),
    rate_employee: parseOptionalNumericString(
      record.rate_employee,
      "governmentDeductionBracket.rate_employee",
    ),
    rate_employer: parseOptionalNumericString(
      record.rate_employer,
      "governmentDeductionBracket.rate_employer",
    ),
    min_contribution: parseOptionalNumericString(
      record.min_contribution,
      "governmentDeductionBracket.min_contribution",
    ),
    max_contribution: parseOptionalNumericString(
      record.max_contribution,
      "governmentDeductionBracket.max_contribution",
    ),
    base_tax: parseOptionalNumericString(
      record.base_tax,
      "governmentDeductionBracket.base_tax",
    ),
    excess_over: parseOptionalNumericString(
      record.excess_over,
      "governmentDeductionBracket.excess_over",
    ),
    percent_over_excess: parseOptionalNumericString(
      record.percent_over_excess,
      "governmentDeductionBracket.percent_over_excess",
    ),
    reference_value: parseOptionalNumericString(
      record.reference_value,
      "governmentDeductionBracket.reference_value",
    ),
    sequence: parseNumber(record.sequence, "governmentDeductionBracket.sequence"),
    created_at: parseString(record.created_at, "governmentDeductionBracket.created_at"),
    updated_at: parseString(record.updated_at, "governmentDeductionBracket.updated_at"),
  };
}

export function parseGovernmentDeductionRuleSetSummaryRecord(
  value: unknown,
): GovernmentDeductionRuleSetSummaryRecord {
  const record = parseRecord(value, "government deduction rule set summary");

  return {
    id: parseNumber(record.id, "governmentDeductionRuleSetSummary.id"),
    name: parseString(record.name, "governmentDeductionRuleSetSummary.name"),
    effective_from: parseString(
      record.effective_from,
      "governmentDeductionRuleSetSummary.effective_from",
    ),
    effective_to: parseOptionalString(
      record.effective_to,
      "governmentDeductionRuleSetSummary.effective_to",
    ),
    status: parseString(record.status, "governmentDeductionRuleSetSummary.status"),
    is_current_version: parseBoolean(
      record.is_current_version,
      "governmentDeductionRuleSetSummary.is_current_version",
    ),
    version_timeline_status: parseString(
      record.version_timeline_status,
      "governmentDeductionRuleSetSummary.version_timeline_status",
    ),
    notes: parseOptionalString(record.notes, "governmentDeductionRuleSetSummary.notes"),
    created_by_user_id: parseOptionalNumber(
      record.created_by_user_id,
      "governmentDeductionRuleSetSummary.created_by_user_id",
    ),
    approved_by_user_id: parseOptionalNumber(
      record.approved_by_user_id,
      "governmentDeductionRuleSetSummary.approved_by_user_id",
    ),
    created_at: parseString(
      record.created_at,
      "governmentDeductionRuleSetSummary.created_at",
    ),
    updated_at: parseString(
      record.updated_at,
      "governmentDeductionRuleSetSummary.updated_at",
    ),
    config_count: parseNumber(
      record.config_count,
      "governmentDeductionRuleSetSummary.config_count",
    ),
    bracket_count: parseNumber(
      record.bracket_count,
      "governmentDeductionRuleSetSummary.bracket_count",
    ),
  };
}

export function parseGovernmentDeductionRuleSetDetailRecord(
  value: unknown,
): GovernmentDeductionRuleSetDetailRecord {
  const record = parseRecord(value, "government deduction rule set detail");
  const summary = parseGovernmentDeductionRuleSetSummaryRecord(record);

  return {
    ...summary,
    configs: parseCollection(
      record.configs ?? [],
      (item) => parseGovernmentDeductionTypeConfigRecord(item),
      "government deduction rule set configs",
    ),
    brackets: parseCollection(
      record.brackets ?? [],
      (item) => parseGovernmentDeductionBracketRecord(item),
      "government deduction rule set brackets",
    ),
  };
}

export function parseGovernmentDeductionTestResultItemRecord(
  value: unknown,
): GovernmentDeductionTestResultItemRecord {
  const record = parseRecord(value, "government deduction test result item");

  return {
    deduction_code: parseString(record.deduction_code, "governmentDeductionTestItem.deduction_code"),
    deduction_name: parseString(record.deduction_name, "governmentDeductionTestItem.deduction_name"),
    basis_amount: parseNumericString(record.basis_amount, "governmentDeductionTestItem.basis_amount"),
    employee_share: parseNumericString(record.employee_share, "governmentDeductionTestItem.employee_share"),
    employer_share: parseNumericString(record.employer_share, "governmentDeductionTestItem.employer_share"),
    employer_ec: parseNumericString(record.employer_ec ?? "0", "governmentDeductionTestItem.employer_ec"),
    total_employer_obligation: parseNumericString(
      record.total_employer_obligation ?? record.employer_share ?? "0",
      "governmentDeductionTestItem.total_employer_obligation",
    ),
    total_remittance: parseNumericString(
      record.total_remittance ?? "0",
      "governmentDeductionTestItem.total_remittance",
    ),
    monthly_salary_credit: parseOptionalNumericString(
      record.monthly_salary_credit,
      "governmentDeductionTestItem.monthly_salary_credit",
    ),
    bracket_id_used: parseOptionalNumber(record.bracket_id_used, "governmentDeductionTestItem.bracket_id_used"),
    config_snapshot: parseOptionalRecord(
      record.config_snapshot,
      "governmentDeductionTestItem.config_snapshot",
    ) ?? {},
  };
}

export function parseGovernmentDeductionTestCalculationRecord(
  value: unknown,
): GovernmentDeductionTestCalculationRecord {
  const record = parseRecord(value, "government deduction test calculation");

  return {
    rule_set_id: parseOptionalNumber(record.rule_set_id, "governmentDeductionTest.rule_set_id"),
    rule_set_name: parseOptionalString(record.rule_set_name, "governmentDeductionTest.rule_set_name"),
    taxable_income: parseNumericString(record.taxable_income, "governmentDeductionTest.taxable_income"),
    total_employee_deductions: parseNumericString(
      record.total_employee_deductions,
      "governmentDeductionTest.total_employee_deductions",
    ),
    total_employer_contributions: parseNumericString(
      record.total_employer_contributions,
      "governmentDeductionTest.total_employer_contributions",
    ),
    items: parseCollection(
      record.items ?? [],
      (item) => parseGovernmentDeductionTestResultItemRecord(item),
      "government deduction test items",
    ),
  };
}

export function parsePayrollPolicyProfileRecord(
  value: unknown,
): PayrollPolicyProfileRecord {
  const record = parseRecord(value, "payroll policy profile");

  return {
    id: parseNumber(record.id, "payrollPolicyProfile.id"),
    code: parseString(record.code, "payrollPolicyProfile.code"),
    name: parseString(record.name, "payrollPolicyProfile.name"),
    description: parseOptionalString(
      record.description,
      "payrollPolicyProfile.description",
    ),
    requires_attendance: parseBoolean(
      record.requires_attendance,
      "payrollPolicyProfile.requires_attendance",
    ),
    deduct_late: parseBoolean(record.deduct_late, "payrollPolicyProfile.deduct_late"),
    deduct_undertime: parseBoolean(
      record.deduct_undertime,
      "payrollPolicyProfile.deduct_undertime",
    ),
    deduct_absence: parseBoolean(
      record.deduct_absence,
      "payrollPolicyProfile.deduct_absence",
    ),
    allow_overtime: parseBoolean(
      record.allow_overtime,
      "payrollPolicyProfile.allow_overtime",
    ),
    require_approved_overtime: parseBoolean(
      record.require_approved_overtime,
      "payrollPolicyProfile.require_approved_overtime",
    ),
    check_leave_records: parseBoolean(
      record.check_leave_records,
      "payrollPolicyProfile.check_leave_records",
    ),
    check_sick_leave_records: parseBoolean(
      record.check_sick_leave_records,
      "payrollPolicyProfile.check_sick_leave_records",
    ),
    auto_absent_if_no_log: parseBoolean(
      record.auto_absent_if_no_log,
      "payrollPolicyProfile.auto_absent_if_no_log",
    ),
    use_shift_schedule: parseBoolean(
      record.use_shift_schedule,
      "payrollPolicyProfile.use_shift_schedule",
    ),
    use_daily_hour_requirement: parseBoolean(
      record.use_daily_hour_requirement,
      "payrollPolicyProfile.use_daily_hour_requirement",
    ),
    is_active: parseBoolean(record.is_active, "payrollPolicyProfile.is_active"),
    default_work_arrangement_types: parseCollection(
      record.default_work_arrangement_types ?? [],
      (item, index) =>
        parseString(
          item,
          `payrollPolicyProfile.default_work_arrangement_types[${index}]`,
        ),
      "payrollPolicyProfile.default_work_arrangement_types",
    ),
    created_at: parseString(record.created_at, "payrollPolicyProfile.created_at"),
    updated_at: parseString(record.updated_at, "payrollPolicyProfile.updated_at"),
  };
}

export function parseEmployeeEffectivePayrollRulesRecord(
  value: unknown,
): EmployeeEffectivePayrollRulesRecord {
  const record = parseRecord(value, "employee effective payroll rules");

  return {
    employee_id: parseNumber(record.employee_id, "employeeEffectiveRules.employee_id"),
    work_arrangement_type: parseOptionalString(
      record.work_arrangement_type,
      "employeeEffectiveRules.work_arrangement_type",
    ),
    payroll_policy_id: parseOptionalNumber(
      record.payroll_policy_id,
      "employeeEffectiveRules.payroll_policy_id",
    ),
    payroll_policy_code: parseString(
      record.payroll_policy_code,
      "employeeEffectiveRules.payroll_policy_code",
    ),
    payroll_policy_name: parseString(
      record.payroll_policy_name,
      "employeeEffectiveRules.payroll_policy_name",
    ),
    rule_source: parseString(record.rule_source, "employeeEffectiveRules.rule_source"),
    requires_attendance: parseBoolean(
      record.requires_attendance,
      "employeeEffectiveRules.requires_attendance",
    ),
    deduct_late: parseBoolean(record.deduct_late, "employeeEffectiveRules.deduct_late"),
    deduct_undertime: parseBoolean(
      record.deduct_undertime,
      "employeeEffectiveRules.deduct_undertime",
    ),
    deduct_absence: parseBoolean(
      record.deduct_absence,
      "employeeEffectiveRules.deduct_absence",
    ),
    allow_overtime: parseBoolean(
      record.allow_overtime,
      "employeeEffectiveRules.allow_overtime",
    ),
    require_approved_overtime: parseBoolean(
      record.require_approved_overtime,
      "employeeEffectiveRules.require_approved_overtime",
    ),
    check_leave_records: parseBoolean(
      record.check_leave_records,
      "employeeEffectiveRules.check_leave_records",
    ),
    check_sick_leave_records: parseBoolean(
      record.check_sick_leave_records,
      "employeeEffectiveRules.check_sick_leave_records",
    ),
    auto_absent_if_no_log: parseBoolean(
      record.auto_absent_if_no_log,
      "employeeEffectiveRules.auto_absent_if_no_log",
    ),
    use_shift_schedule: parseBoolean(
      record.use_shift_schedule,
      "employeeEffectiveRules.use_shift_schedule",
    ),
    use_daily_hour_requirement: parseBoolean(
      record.use_daily_hour_requirement,
      "employeeEffectiveRules.use_daily_hour_requirement",
    ),
  };
}

const parsePayrollPeriodsResponse = createCollectionParser({
  label: "payroll periods",
  parseItem: (record: unknown) => parsePayrollPeriodRecord(record),
});

const parsePayrollRunsResponse = createCollectionParser({
  label: "payroll runs",
  parseItem: (record: unknown) => parsePayrollRunRecord(record),
});

const parsePayrollPolicyProfilesResponse = createCollectionParser({
  label: "payroll policy profiles",
  parseItem: (record: unknown) => parsePayrollPolicyProfileRecord(record),
});

export function mapPayrollPeriod(record: PayrollPeriodApiRecord): PayrollPeriod {
  return {
    id: String(record.id),
    periodName: record.period_name,
    startDate: formatDate(record.period_start),
    endDate: formatDate(record.period_end),
    payoutDate: formatDate(record.payout_date),
    status: normalizePayrollStatus(record.status),
  };
}

export type CreatePayrollPeriodPayload = {
  periodName: string;
  periodStart: string;
  periodEnd: string;
  payoutDate: string;
  status: "draft" | "open" | "processed" | "closed";
};

export type RunPayrollBatchPayload = {
  payrollPeriodId: number;
  employeeIds: number[];
};

export type RunPayrollBatchResult = {
  ok: boolean;
  createdCount: number;
  skippedCount: number;
  failedCount: number;
  results: Array<{
    employeeId: number;
    status: "created" | "skipped" | "failed";
    message: string;
    payrollRunId?: number;
  }>;
};

export type PayrollBatchRemarksPayload = {
  remarks?: string;
};

export type PayrollRecordRecalculatePayload = PayrollBatchRemarksPayload & {
  reviewRemarks?: string;
};

export type ManualPayrollAdjustmentPayload = {
  employeeId: number;
  cutoffId: number;
  adjustmentType: string;
  category: string;
  amount: number;
  direction: "addition" | "deduction";
  taxable: boolean;
  isRecurring?: boolean;
  effectiveDate?: string | null;
  reason: string;
  remarks?: string;
};

export type ManualPayrollAdjustmentUpdatePayload = {
  adjustmentType?: string;
  category?: string;
  amount?: number;
  direction?: "addition" | "deduction";
  taxable?: boolean;
  isRecurring?: boolean;
  effectiveDate?: string | null;
  reason?: string;
  remarks?: string;
};

export type GovernmentDeductionTypeConfigInputPayload = {
  deduction_type_code: string;
  based_on: string;
  frequency: string;
  rounding_method: string;
  income_floor?: number | null;
  income_ceiling?: number | null;
  employee_share_ratio?: number | null;
  employer_share_ratio?: number | null;
  cap_amount?: number | null;
  threshold_amount?: number | null;
  rate?: number | null;
  rate_employee?: number | null;
  rate_employer?: number | null;
  fixed_employee_amount?: number | null;
  fixed_employer_amount?: number | null;
  formula_expression?: string | null;
  priority_order: number;
};

export type GovernmentDeductionBracketInputPayload = {
  deduction_type_code: string;
  min_salary: number;
  max_salary?: number | null;
  base_amount_employee?: number | null;
  base_amount_employer?: number | null;
  fixed_employee_amount?: number | null;
  fixed_employer_amount?: number | null;
  rate_employee?: number | null;
  rate_employer?: number | null;
  min_contribution?: number | null;
  max_contribution?: number | null;
  base_tax?: number | null;
  excess_over?: number | null;
  percent_over_excess?: number | null;
  reference_value?: number | null;
  sequence: number;
};

export type GovernmentDeductionRuleSetPayload = {
  name: string;
  effective_from: string;
  effective_to?: string | null;
  notes?: string | null;
  status?: string | null;
  configs: GovernmentDeductionTypeConfigInputPayload[];
  brackets: GovernmentDeductionBracketInputPayload[];
};

export async function getPayrollPeriodRecords() {
  return apiClient.get<PayrollPeriodApiRecord[], PayrollPeriodApiRecord[]>(
    apiEndpoints.payroll.periods,
    {
      parser: parsePayrollPeriodsResponse,
    },
  );
}

export async function getPayrollPeriods() {
  const records = await getPayrollPeriodRecords();
  return records.map((record) => mapPayrollPeriod(record));
}

export async function getPayrollRunRecords() {
  return apiClient.get<PayrollRunApiRecord[], PayrollRunApiRecord[]>(
    apiEndpoints.payroll.runs,
    {
      parser: parsePayrollRunsResponse,
    },
  );
}

function getPayrollActionErrorMessage(responseBody: unknown) {
  return getApiErrorMessage(
    responseBody,
    "Unable to complete the payroll action.",
  );
}

async function requestPayrollProxy<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    parser: (value: unknown) => T;
  },
) {
  const response = await fetch(`/api/payroll${path}`, {
    method: options.method ?? "GET",
    headers:
      options.body === undefined
        ? {
            Accept: "application/json",
          }
        : {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const responseBody = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (await handleUnauthorizedClientResponse(response)) {
    throw new Error("Your session has expired. Redirecting to login.");
  }

  if (!response.ok) {
    throw new Error(getPayrollActionErrorMessage(responseBody));
  }

  return options.parser(responseBody);
}

async function requestPayrollCollection<T>(
  path: string,
  parseItem: (value: unknown) => T,
) {
  return requestPayrollProxy(path, {
    parser: (value) => parseCollection(value, (item) => parseItem(item), path),
  });
}

export async function getPayrollCutoffPreviews() {
  return requestPayrollCollection("/cutoffs", parsePayrollCutoffPreviewRecord);
}

export async function getManualPayrollAdjustments(filters: {
  cutoffId?: number | null;
  employeeId?: number | null;
  status?: string | null;
} = {}) {
  const query = new URLSearchParams();

  if (filters.cutoffId != null) {
    query.set("cutoff_id", String(filters.cutoffId));
  }

  if (filters.employeeId != null) {
    query.set("employee_id", String(filters.employeeId));
  }

  if (filters.status) {
    query.set("status", filters.status);
  }

  const suffix = query.toString();

  return requestPayrollProxy(`/adjustments${suffix ? `?${suffix}` : ""}`, {
    parser: (value) =>
      parseCollection(
        value,
        (item) => parseManualPayrollAdjustmentRecord(item),
        "manual payroll adjustments",
      ),
  });
}

export async function createManualPayrollAdjustment(
  payload: ManualPayrollAdjustmentPayload,
) {
  return requestPayrollProxy("/adjustments", {
    method: "POST",
    body: {
      employee_id: payload.employeeId,
      cutoff_id: payload.cutoffId,
      adjustment_type: payload.adjustmentType.trim(),
      category: payload.category,
      amount: payload.amount,
      direction: payload.direction,
      taxable: payload.taxable,
      is_recurring: payload.isRecurring ?? false,
      effective_date: payload.effectiveDate ?? undefined,
      reason: payload.reason.trim(),
      remarks: payload.remarks?.trim() || undefined,
    },
    parser: parseManualPayrollAdjustmentRecord,
  });
}

export async function updateManualPayrollAdjustment(
  adjustmentId: number,
  payload: ManualPayrollAdjustmentUpdatePayload,
) {
  return requestPayrollProxy(`/adjustments/${adjustmentId}`, {
    method: "PUT",
    body: {
      adjustment_type: payload.adjustmentType?.trim() || undefined,
      category: payload.category,
      amount: payload.amount,
      direction: payload.direction,
      taxable: payload.taxable,
      is_recurring: payload.isRecurring,
      effective_date: payload.effectiveDate ?? undefined,
      reason: payload.reason?.trim() || undefined,
      remarks:
        payload.remarks === undefined ? undefined : payload.remarks.trim() || null,
    },
    parser: parseManualPayrollAdjustmentRecord,
  });
}

export async function approveManualPayrollAdjustment(
  adjustmentId: number,
  payload: { remarks?: string } = {},
) {
  return requestPayrollProxy(`/adjustments/${adjustmentId}/approve`, {
    method: "POST",
    body: {
      remarks: payload.remarks?.trim() || undefined,
    },
    parser: parseManualPayrollAdjustmentRecord,
  });
}

export async function rejectManualPayrollAdjustment(
  adjustmentId: number,
  payload: { remarks?: string } = {},
) {
  return requestPayrollProxy(`/adjustments/${adjustmentId}/reject`, {
    method: "POST",
    body: {
      remarks: payload.remarks?.trim() || undefined,
    },
    parser: parseManualPayrollAdjustmentRecord,
  });
}

export async function getPayrollReportingSnapshot(filters: {
  year?: number;
  status?: string | null;
  cutoffId?: number | null;
} = {}) {
  const query = new URLSearchParams();

  if (filters.year != null) {
    query.set("year", String(filters.year));
  }

  if (filters.status) {
    query.set("status", filters.status);
  }

  if (filters.cutoffId != null) {
    query.set("cutoff_id", String(filters.cutoffId));
  }

  const suffix = query.toString();

  return requestPayrollProxy(`/reports/summary${suffix ? `?${suffix}` : ""}`, {
    parser: parsePayrollReportingSnapshotRecord,
  });
}

export async function getEmployeePayrollCutoffStatuses(cutoffId: number) {
  return requestPayrollCollection(
    `/cutoffs/${cutoffId}/employees`,
    parseEmployeePayrollCutoffStatusRecord,
  );
}

export async function evaluateEmployeePayrollCutoffStatuses(cutoffId: number) {
  return requestPayrollProxy(`/cutoffs/${cutoffId}/employees/evaluate`, {
    method: "POST",
    body: {},
    parser: (value) =>
      parseCollection(
        value,
        (item) => parseEmployeePayrollCutoffStatusRecord(item),
        "employee payroll cutoff statuses",
      ),
  });
}

export async function lockEmployeePayrollCutoff(
  cutoffId: number,
  employeeId: number,
  payload: { notes?: string } = {},
) {
  return requestPayrollProxy(`/cutoffs/${cutoffId}/employees/${employeeId}/lock`, {
    method: "POST",
    body: {
      notes: payload.notes?.trim() || undefined,
    },
    parser: parseEmployeePayrollCutoffStatusRecord,
  });
}

export async function unlockEmployeePayrollCutoff(
  cutoffId: number,
  employeeId: number,
  payload: { notes?: string } = {},
) {
  return requestPayrollProxy(`/cutoffs/${cutoffId}/employees/${employeeId}/unlock`, {
    method: "POST",
    body: {
      notes: payload.notes?.trim() || undefined,
    },
    parser: parseEmployeePayrollCutoffStatusRecord,
  });
}

export async function getEmployeePayrollCutoffPreview(
  cutoffId: number,
  employeeId: number,
) {
  return requestPayrollProxy(`/cutoffs/${cutoffId}/employees/${employeeId}/preview`, {
    parser: parseEmployeePayrollCutoffPreviewRecord,
  });
}

export async function calculateEmployeePayrollCutoff(
  cutoffId: number,
  employeeId: number,
  payload: PayrollRecordRecalculatePayload = {},
) {
  return requestPayrollProxy(`/cutoffs/${cutoffId}/employees/${employeeId}/calculate`, {
    method: "POST",
    body: {
      remarks: payload.remarks?.trim() || undefined,
      review_remarks: payload.reviewRemarks?.trim() || undefined,
    },
    parser: parsePayrollBatchDetailRecord,
  });
}

export async function recalculateEmployeePayrollCutoff(
  cutoffId: number,
  employeeId: number,
  payload: PayrollRecordRecalculatePayload = {},
) {
  return requestPayrollProxy(`/cutoffs/${cutoffId}/employees/${employeeId}/recalculate`, {
    method: "POST",
    body: {
      remarks: payload.remarks?.trim() || undefined,
      review_remarks: payload.reviewRemarks?.trim() || undefined,
    },
    parser: parsePayrollBatchDetailRecord,
  });
}

export async function getPayrollBatches() {
  return requestPayrollCollection("/batches", parsePayrollBatchSummaryRecord);
}

export async function getPayrollBatchDetail(batchId: number) {
  return requestPayrollProxy(`/batches/${batchId}`, {
    parser: parsePayrollBatchDetailRecord,
  });
}

export async function getPayrollReconciliation(batchId: number | string) {
  return apiClient.get<PayrollReconciliationRecord, PayrollReconciliationRecord>(
    apiEndpoints.payroll.workflowBatchReconciliation(String(batchId)),
    {
      parser: parsePayrollReconciliationRecord,
    },
  );
}

export async function getPayrollReconciliationResource(batchId: number | string) {
  return loadApiResource(() => getPayrollReconciliation(batchId), {
    fallbackData: null,
    errorMessage: "Unable to load payroll reconciliation data from the backend.",
  });
}

export async function calculatePayrollBatch(payload: {
  cutoffId: number;
  remarks?: string;
}) {
  return requestPayrollProxy("/batches/calculate", {
    method: "POST",
    body: {
      cutoff_id: payload.cutoffId,
      remarks: payload.remarks?.trim() || undefined,
    },
    parser: parsePayrollBatchDetailRecord,
  });
}

export async function recalculatePayrollBatch(
  batchId: number,
  payload: PayrollBatchRemarksPayload = {},
) {
  return requestPayrollProxy(`/batches/${batchId}/recalculate`, {
    method: "POST",
    body: {
      remarks: payload.remarks?.trim() || undefined,
    },
    parser: parsePayrollBatchDetailRecord,
  });
}

export async function discardPayrollBatch(batchId: number) {
  return requestPayrollProxy(`/batches/${batchId}`, {
    method: "DELETE",
    parser: () => undefined,
  });
}

export async function approvePayrollBatch(
  batchId: number,
  payload: PayrollBatchRemarksPayload = {},
) {
  return requestPayrollProxy(`/batches/${batchId}/approve`, {
    method: "POST",
    body: {
      remarks: payload.remarks?.trim() || undefined,
    },
    parser: parsePayrollBatchDetailRecord,
  });
}

export async function reviewPayrollBatch(
  batchId: number,
  payload: PayrollBatchRemarksPayload = {},
) {
  return requestPayrollProxy(`/batches/${batchId}/review`, {
    method: "POST",
    body: {
      remarks: payload.remarks?.trim() || undefined,
    },
    parser: parsePayrollBatchDetailRecord,
  });
}

export async function finalizePayrollBatch(
  batchId: number,
  payload: PayrollBatchRemarksPayload = {},
) {
  return requestPayrollProxy(`/batches/${batchId}/finalize`, {
    method: "POST",
    body: {
      remarks: payload.remarks?.trim() || undefined,
    },
    parser: parsePayrollBatchDetailRecord,
  });
}

export async function releasePayrollBatchPayslips(
  batchId: number,
  payload: PayrollBatchRemarksPayload = {},
) {
  return requestPayrollProxy(`/batches/${batchId}/release-payslips`, {
    method: "POST",
    body: {
      remarks: payload.remarks?.trim() || undefined,
    },
    parser: parsePayrollBatchDetailRecord,
  });
}

export async function getPayrollRecordDetail(recordId: number) {
  return requestPayrollProxy(`/records/${recordId}`, {
    parser: parsePayrollRecordRecord,
  });
}

export async function recalculatePayrollRecord(
  recordId: number,
  payload: PayrollRecordRecalculatePayload = {},
) {
  return requestPayrollProxy(`/records/${recordId}/recalculate`, {
    method: "POST",
    body: {
      remarks: payload.remarks?.trim() || undefined,
      review_remarks: payload.reviewRemarks?.trim() || undefined,
    },
    parser: parsePayrollBatchDetailRecord,
  });
}

export async function getPayslips() {
  return requestPayrollCollection("/payslips", parsePayslipRecord);
}

export async function getPayslipDetail(payslipId: number) {
  return requestPayrollProxy(`/payslips/${payslipId}`, {
    parser: parsePayslipRecord,
  });
}

export async function getMyPayslips() {
  return requestPayrollCollection("/me/payslips", parsePayslipRecord);
}

export async function getMyPayslipDetail(payslipId: number) {
  return requestPayrollProxy(`/me/payslips/${payslipId}`, {
    parser: parsePayslipRecord,
  });
}

export async function getGovernmentDeductionTypes() {
  return requestPayrollCollection(
    "/settings/deduction-types",
    parseGovernmentDeductionTypeRecord,
  );
}

export async function getGovernmentDeductionRuleSets(filters?: {
  status?: string | null;
  effectiveOn?: string | null;
}) {
  const searchParams = new URLSearchParams();
  if (filters?.status) {
    searchParams.set("status", filters.status);
  }
  if (filters?.effectiveOn) {
    searchParams.set("effective_on", filters.effectiveOn);
  }

  return requestPayrollCollection(
    `/settings/deduction-rule-sets${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
    parseGovernmentDeductionRuleSetSummaryRecord,
  );
}

export async function getCurrentGovernmentDeductionRuleSet(effectiveOn?: string | null) {
  const searchParams = new URLSearchParams();
  if (effectiveOn) {
    searchParams.set("effective_on", effectiveOn);
  }

  return requestPayrollProxy(
    `/settings/deduction-rule-sets/current${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
    {
      parser: parseGovernmentDeductionRuleSetDetailRecord,
    },
  );
}

export async function getGovernmentDeductionRuleSetDetail(ruleSetId: number) {
  return requestPayrollProxy(`/settings/deduction-rule-sets/${ruleSetId}`, {
    parser: parseGovernmentDeductionRuleSetDetailRecord,
  });
}

export async function createGovernmentDeductionRuleSet(
  payload: GovernmentDeductionRuleSetPayload,
) {
  return requestPayrollProxy("/settings/deduction-rule-sets", {
    method: "POST",
    body: payload,
    parser: parseGovernmentDeductionRuleSetDetailRecord,
  });
}

export async function updateGovernmentDeductionRuleSet(
  ruleSetId: number,
  payload: GovernmentDeductionRuleSetPayload,
) {
  return requestPayrollProxy(`/settings/deduction-rule-sets/${ruleSetId}`, {
    method: "PUT",
    body: payload,
    parser: parseGovernmentDeductionRuleSetDetailRecord,
  });
}

export async function activateGovernmentDeductionRuleSet(ruleSetId: number) {
  return requestPayrollProxy(`/settings/deduction-rule-sets/${ruleSetId}/activate`, {
    method: "POST",
    parser: parseGovernmentDeductionRuleSetDetailRecord,
  });
}

export async function archiveAndActivateGovernmentDeductionRuleSet(ruleSetId: number) {
  return requestPayrollProxy(`/settings/deduction-rule-sets/${ruleSetId}/archive-and-activate`, {
    method: "POST",
    parser: parseGovernmentDeductionRuleSetDetailRecord,
  });
}

export async function cloneGovernmentDeductionRuleSet(
  ruleSetId: number,
  payload: { name?: string; effective_from?: string; effective_to?: string | null },
) {
  return requestPayrollProxy(`/settings/deduction-rule-sets/${ruleSetId}/clone`, {
    method: "POST",
    body: payload,
    parser: parseGovernmentDeductionRuleSetDetailRecord,
  });
}

export async function archiveGovernmentDeductionRuleSet(ruleSetId: number) {
  return requestPayrollProxy(`/settings/deduction-rule-sets/${ruleSetId}/archive`, {
    method: "POST",
    parser: parseGovernmentDeductionRuleSetDetailRecord,
  });
}

export async function deleteGovernmentDeductionRuleSet(ruleSetId: number) {
  await requestPayrollProxy(`/settings/deduction-rule-sets/${ruleSetId}`, {
    method: "DELETE",
    parser: () => undefined,
  });
}

export async function testGovernmentDeductionCalculation(payload: {
  rule_set_id?: number | null;
  rule_set_name?: string | null;
  monthly_salary: number;
  gross_pay: number;
  pay_frequency: string;
  taxable_income?: number;
  configs?: GovernmentDeductionTypeConfigInputPayload[];
  brackets?: GovernmentDeductionBracketInputPayload[];
}) {
  return requestPayrollProxy("/settings/test-calculate", {
    method: "POST",
    body: payload,
    parser: parseGovernmentDeductionTestCalculationRecord,
  });
}

export async function createPayrollPeriod(payload: CreatePayrollPeriodPayload) {
  const response = await fetch("/api/payroll/periods", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      period_name: payload.periodName,
      period_start: payload.periodStart,
      period_end: payload.periodEnd,
      payout_date: payload.payoutDate,
      status: payload.status,
    }),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const responseBody = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (await handleUnauthorizedClientResponse(response)) {
    throw new Error("Your session has expired. Redirecting to login.");
  }

  if (!response.ok) {
    throw new Error(getPayrollActionErrorMessage(responseBody));
  }

  return parsePayrollPeriodRecord(responseBody);
}

export async function runPayrollBatch(payload: RunPayrollBatchPayload) {
  const response = await fetch("/api/payroll/runs/process", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const responseBody = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (await handleUnauthorizedClientResponse(response)) {
    throw new Error("Your session has expired. Redirecting to login.");
  }

  if (!response.ok) {
    throw new Error(getPayrollActionErrorMessage(responseBody));
  }

  const record = parseRecord(responseBody, "payroll batch run response");

  return {
    ok: Boolean(record.ok),
    createdCount: parseNumber(record.createdCount, "payrollBatch.createdCount"),
    skippedCount: parseNumber(record.skippedCount, "payrollBatch.skippedCount"),
    failedCount: parseNumber(record.failedCount, "payrollBatch.failedCount"),
    results: Array.isArray(record.results)
      ? record.results.map((item, index) => {
          const resultRecord = parseRecord(
            item,
            `payrollBatch.results[${index}]`,
          );

          return {
            employeeId: parseNumber(
              resultRecord.employeeId,
              `payrollBatch.results[${index}].employeeId`,
            ),
            status: parseString(
              resultRecord.status,
              `payrollBatch.results[${index}].status`,
            ) as "created" | "skipped" | "failed",
            message: parseString(
              resultRecord.message,
              `payrollBatch.results[${index}].message`,
            ),
            payrollRunId:
              resultRecord.payrollRunId == null
                ? undefined
                : parseNumber(
                    resultRecord.payrollRunId,
                    `payrollBatch.results[${index}].payrollRunId`,
                  ),
          };
        })
      : [],
  } satisfies RunPayrollBatchResult;
}

export async function getPayrollPeriodsResource() {
  return loadApiResource(() => getPayrollPeriods(), {
    fallbackData: [],
    errorMessage: "Unable to load payroll periods from the backend.",
  });
}

export async function getPayrollPeriodRecordsResource() {
  return loadApiResource(() => getPayrollPeriodRecords(), {
    fallbackData: [],
    errorMessage: "Unable to load payroll periods from the backend.",
  });
}

export async function getPayrollRunRecordsResource() {
  return loadApiResource(() => getPayrollRunRecords(), {
    fallbackData: [],
    errorMessage: "Unable to load payroll runs from the backend.",
  });
}

export async function getPayrollPolicyProfiles() {
  return apiClient.get<PayrollPolicyProfileRecord[], PayrollPolicyProfileRecord[]>(
    apiEndpoints.payroll.policyProfiles,
    {
      parser: parsePayrollPolicyProfilesResponse,
    },
  );
}

export async function getPayrollPolicyProfilesResource() {
  return loadApiResource(() => getPayrollPolicyProfiles(), {
    fallbackData: [],
    errorMessage: "Unable to load payroll policy profiles from the backend.",
  });
}

export async function getEmployeeEffectivePayrollRules(employeeId: string) {
  return apiClient.get<
    EmployeeEffectivePayrollRulesRecord,
    EmployeeEffectivePayrollRulesRecord
  >(apiEndpoints.payroll.employeeEffectiveRules(employeeId), {
    parser: (value) => parseEmployeeEffectivePayrollRulesRecord(value),
  });
}
