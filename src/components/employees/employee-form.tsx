"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import type { EditableEmployeeData } from "@/lib/api/employee-editor";
import {
  onboardEmployee,
  type EmployeeUpdatePayload,
  updateEmployeeProfile,
} from "@/lib/api/employees";
import { updateUserAccount } from "@/lib/api/users";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  EmployeeInputField,
  EmployeeSelectField,
} from "@/components/employees/employee-form-field";
import { EmployeeSearchSelectField } from "@/components/employees/employee-search-select-field";
import { EmployeeFormSection } from "@/components/employees/employee-form-section";
import type { EmployeeManagerOption } from "@/types/employees";
import type { PayrollPolicyProfileRecord } from "@/types/payroll";

const departmentOptions = [
  "Select department",
  "Finance",
  "Human Resources",
  "Operations",
  "Engineering",
  "Customer Support",
  "Compliance",
];

const employmentTypeOptions = [
  "Select employment type",
  "Full-time",
  "Part-time",
  "Contract",
  "Probationary",
];

const employmentStatusOptions = [
  "Select status",
  "Active",
  "Pending",
  "On Leave",
  "Inactive",
];

const payrollScheduleOptions = [
  "Select payroll schedule",
  "Monthly",
  "Bi-weekly",
  "Weekly",
];

const workArrangementTypeOptions = [
  "Select work arrangement type",
  "Fixed Schedule",
  "Flexible Schedule",
  "Output-Based Schedule",
  "Shift-Based Schedule",
  "Rotational Shift",
  "Compressed Workweek",
  "Field Work Arrangement",
  "No Time Tracking",
];

const accountRoleOptions = [
  "Select account role",
  "Employee",
  "HR",
  "Finance",
  "Admin-Finance",
  "Admin",
];

const taxStatusOptions = [
  "Select tax status",
  "Single",
  "Married",
  "Head of Family",
];

const rateTypeOptions = [
  "Select rate type",
  "Monthly",
  "Daily",
  "Hourly",
];

const suffixOptions = ["None", "Jr.", "Sr.", "II", "III", "IV"];
const workDayOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const allowanceOptions = [
  "Rice subsidy / Rice allowance",
  "Meal allowance",
  "Transportation allowance",
  "Communication allowance / Mobile allowance",
  "Internet allowance",
  "Clothing / Uniform allowance",
  "Laundry allowance",
  "Medical allowance",
  "Gas / Fuel allowance",
  "Housing allowance",
  "Relocation allowance",
  "Representation allowance",
  "Travel allowance / Field allowance",
  "Per diem",
  "Hardship allowance",
  "Hazard allowance / Hazard pay",
  "Shift allowance",
  "Night shift differential",
  "Overtime meal allowance",
  "Project allowance",
  "On-call allowance",
  "Standby allowance",
  "Tool / Equipment allowance",
  "Work-from-home allowance",
  "Education / Training allowance",
  "Childcare allowance",
  "Health / Wellness allowance",
  "Grocery allowance",
  "Inflation / Cost-of-living allowance",
  "Retention allowance",
  "Signing allowance",
  "Attendance allowance",
  "Productivity allowance",
  "Language allowance",
  "Remote area / Site allowance",
  "Vehicle allowance",
  "Driver allowance",
  "Entertainment allowance",
];

const allowanceOptionByNormalizedName = new Map(
  allowanceOptions.map((allowance) => [normalizeAllowanceName(allowance), allowance]),
);

type EmployeeFormMode = "create" | "edit";

type EmployeeFormProps = {
  mode?: EmployeeFormMode;
  initialData?: EditableEmployeeData;
  activeEmployeeOptions?: EmployeeManagerOption[];
  managerOptionsErrorMessage?: string | null;
  payrollPolicyProfiles?: PayrollPolicyProfileRecord[];
  payrollPolicyProfilesErrorMessage?: string | null;
};

type EditChangeItem = {
  label: string;
  previous: string;
  current: string;
};

type EditConfirmationState = {
  changes: EditChangeItem[];
  payload: EmployeeUpdatePayload;
};

type LinkedAccountNotice =
  | {
      type: "password-reset";
      temporaryPassword: string;
    }
  | {
      type: "role-updated";
      role: string;
    };

type SelectValidationError = {
  id: string;
  label: string;
};

type AllowanceComparisonInput =
  | {
      allowanceName: string;
      amount: string | number;
    }
  | {
      allowance_name: string;
      amount: number;
    };

const defaultEmployeeData: EditableEmployeeData = {
  employeeId: 0,
  employeeCode: "",
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "None",
  birthDate: "",
  hireDate: "",
  endDate: "",
  department: "Select department",
  position: "",
  reportingManagerId: "",
  reportingManagerName: "",
  workArrangementType: "Select work arrangement type",
  payrollPolicyId: "",
  payrollPolicyName: "",
  shiftStartTime: "",
  shiftEndTime: "",
  workDays: [],
  employmentType: "Select employment type",
  employmentStatus: "Select status",
  payrollSchedule: "Select payroll schedule",
  contactNumber: "",
  tin: "",
  sssNumber: "",
  philHealthNumber: "",
  pagIbigNumber: "",
  taxStatus: "Select tax status",
  basicSalary: "",
  rateType: "Select rate type",
  allowances: [],
  accountAccess: {
    userId: null,
    linked: false,
    email: "",
    username: "",
    role: "",
  },
};

export function EmployeeForm({
  mode = "create",
  initialData,
  activeEmployeeOptions = [],
  managerOptionsErrorMessage = null,
  payrollPolicyProfiles = [],
  payrollPolicyProfilesErrorMessage = null,
}: EmployeeFormProps) {
  const router = useRouter();
  const isEditMode = mode === "edit";
  const formDataDefaults = initialData ?? defaultEmployeeData;
  const initialAllowanceNames = dedupeAllowanceNames(
    formDataDefaults.allowances.map((allowance) => allowance.allowanceName),
  );
  const allowanceFieldOptions = mergeAllowanceOptions(
    initialAllowanceNames,
  );
  const linkedAccountRoleOptions = mergeSelectOptions(
    accountRoleOptions,
    formDataDefaults.accountAccess.role,
  );
  const workArrangementTypeFieldOptions = mergeSelectOptions(
    workArrangementTypeOptions,
    formDataDefaults.workArrangementType,
  );
  const initialSuggestedPayrollPolicyName = getSuggestedPayrollPolicyName(
    formDataDefaults.workArrangementType,
    payrollPolicyProfiles,
  );
  const initialPayrollPolicySelection = resolvePayrollPolicyProfileName(
    formDataDefaults.payrollPolicyId,
    formDataDefaults.payrollPolicyName,
    payrollPolicyProfiles,
  );
  const initialPayrollPolicyId =
    initialPayrollPolicySelection !== "Not set"
      ? initialPayrollPolicySelection
      : initialSuggestedPayrollPolicyName;
  const payrollPolicyFieldOptions = buildPayrollPolicyFieldOptions(
    payrollPolicyProfiles,
    initialPayrollPolicyId,
    formDataDefaults.payrollPolicyName,
  );
  const [createAccount, setCreateAccount] = useState(!isEditMode);
  const [allowanceModalOpen, setAllowanceModalOpen] = useState(false);
  const [selectedAllowances, setSelectedAllowances] = useState<string[]>(
    initialAllowanceNames,
  );
  const [draftAllowances, setDraftAllowances] = useState<string[]>(
    initialAllowanceNames,
  );
  const [employmentStatus, setEmploymentStatus] = useState(
    formDataDefaults.employmentStatus,
  );
  const [endDate, setEndDate] = useState(formDataDefaults.endDate);
  const [contactNumber, setContactNumber] = useState(
    formatContactNumberValue(formDataDefaults.contactNumber),
  );
  const [tin, setTin] = useState(formatTinValue(formDataDefaults.tin));
  const [sssNumber, setSssNumber] = useState(
    formatSssNumberValue(formDataDefaults.sssNumber),
  );
  const [philHealthNumber, setPhilHealthNumber] = useState(
    formatPhilHealthNumberValue(formDataDefaults.philHealthNumber),
  );
  const [pagIbigNumber, setPagIbigNumber] = useState(
    formatPagIbigNumberValue(formDataDefaults.pagIbigNumber),
  );
  const [basicSalary, setBasicSalary] = useState(formDataDefaults.basicSalary);
  const [linkedAccountRole, setLinkedAccountRole] = useState(
    formDataDefaults.accountAccess.role || "Select account role",
  );
  const [reportingManagerId, setReportingManagerId] = useState(
    formDataDefaults.reportingManagerId,
  );
  const [workArrangementType, setWorkArrangementType] = useState(
    formDataDefaults.workArrangementType,
  );
  const [payrollPolicyId, setPayrollPolicyId] = useState(initialPayrollPolicyId);
  const [hasManualPayrollPolicyOverride, setHasManualPayrollPolicyOverride] = useState(
    Boolean(
      formDataDefaults.payrollPolicyName &&
        initialSuggestedPayrollPolicyName &&
        formDataDefaults.payrollPolicyName !== initialSuggestedPayrollPolicyName,
    ),
  );
  const [shiftStartTime, setShiftStartTime] = useState(
    formDataDefaults.shiftStartTime,
  );
  const [shiftEndTime, setShiftEndTime] = useState(
    formDataDefaults.shiftEndTime,
  );
  const [workDays, setWorkDays] = useState<string[]>(formDataDefaults.workDays);
  const [allowanceValues, setAllowanceValues] = useState<Record<string, string>>(
    buildAllowanceValueMap(formDataDefaults.allowances),
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<{
    employeeCode: string;
    employeeFullName: string;
    linkedUsername?: string;
    salarySubtotal: string;
    totalAllowance: string;
    temporaryPassword?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editConfirmation, setEditConfirmation] =
    useState<EditConfirmationState | null>(null);
  const [linkedAccountNotice, setLinkedAccountNotice] =
    useState<LinkedAccountNotice | null>(null);
  const [linkedAccountError, setLinkedAccountError] = useState<string | null>(null);
  const [isUpdatingLinkedAccount, setIsUpdatingLinkedAccount] = useState(false);
  const [selectValidationErrors, setSelectValidationErrors] = useState<
    SelectValidationError[]
  >([]);

  const selectedAllowanceOptions = dedupeAllowanceNames(selectedAllowances);
  const isInactiveStatus = employmentStatus === "Inactive";
  const hasLinkedAccount = formDataDefaults.accountAccess.linked;
  const isLinkedAccountRoleChanged =
    hasLinkedAccount &&
    normalizeRoleValue(linkedAccountRole) !==
      normalizeRoleValue(formDataDefaults.accountAccess.role);
  const basicSalaryAmount = parseCurrencyInput(basicSalary);
  const suggestedPayrollPolicyId = getSuggestedPayrollPolicyName(
    workArrangementType,
    payrollPolicyProfiles,
  );
  const selectedPayrollPolicyProfile = payrollPolicyProfiles.find(
    (profile) => profile.name === payrollPolicyId,
  );
  const allowanceSubtotal = selectedAllowanceOptions.reduce((total, allowance) => {
    return total + parseCurrencyInput(allowanceValues[allowance]);
  }, 0);
  const salarySubtotal = basicSalaryAmount + allowanceSubtotal;

  function openAllowanceModal() {
    setDraftAllowances(dedupeAllowanceNames(selectedAllowances));
    setAllowanceModalOpen(true);
  }

  function closeAllowanceModal() {
    setAllowanceModalOpen(false);
  }

  function toggleDraftAllowance(allowance: string) {
    const resolvedAllowance = resolveAllowanceDisplayName(allowance);
    setDraftAllowances((current) =>
      current.some(
        (item) => normalizeAllowanceName(item) === normalizeAllowanceName(resolvedAllowance),
      )
        ? current.filter(
            (item) =>
              normalizeAllowanceName(item) !== normalizeAllowanceName(resolvedAllowance),
          )
        : dedupeAllowanceNames([...current, resolvedAllowance]),
    );
  }

  function applyAllowanceSelection() {
    setSelectedAllowances(dedupeAllowanceNames(draftAllowances));
    setAllowanceModalOpen(false);
  }

  function updateAllowanceValue(allowance: string, value: string) {
    const resolvedAllowance = resolveAllowanceDisplayName(allowance);
    setAllowanceValues((current) => ({
      ...current,
      [resolvedAllowance]: value,
    }));
  }

  function handleEmploymentStatusChange(value: string) {
    clearSelectValidationError("employment-status");
    setEmploymentStatus(value);

    if (value !== "Inactive") {
      setEndDate("");
    }
  }

  function handleWorkArrangementTypeChange(value: string) {
    clearSelectValidationError("work-arrangement-type");
    setWorkArrangementType(value);

    if (!hasManualPayrollPolicyOverride) {
      const nextSuggestedPayrollPolicyId = getSuggestedPayrollPolicyName(
        value,
        payrollPolicyProfiles,
      );
      setPayrollPolicyId(nextSuggestedPayrollPolicyId);
    }
  }

  function handlePayrollPolicyChange(value: string) {
    clearSelectValidationError("payroll-policy");
    setPayrollPolicyId(value);

    const nextSuggestedPayrollPolicyId = getSuggestedPayrollPolicyName(
      workArrangementType,
      payrollPolicyProfiles,
    );
    setHasManualPayrollPolicyOverride(
      value.length > 0 && value !== nextSuggestedPayrollPolicyId,
    );
  }

  function toggleWorkDay(day: string) {
    setWorkDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const department = getRequiredFormValue(formData, "department");
    const employmentType = getRequiredFormValue(formData, "employment-type");
    const payrollSchedule = getRequiredFormValue(formData, "payroll-schedule");
    const taxStatus = getRequiredFormValue(formData, "tax-status");
    const rateType = getRequiredFormValue(formData, "rate-type");
    const missingSelectFields = [
      { id: "department", label: "Department", value: department },
      {
        id: "employment-type",
        label: "Employment Type",
        value: employmentType,
      },
      {
        id: "employment-status",
        label: "Employment Status",
        value: employmentStatus,
      },
      {
        id: "payroll-schedule",
        label: "Payroll Schedule",
        value: payrollSchedule,
      },
      {
        id: "work-arrangement-type",
        label: "Work Arrangement Type",
        value: workArrangementType,
      },
      {
        id: "payroll-policy",
        label: "Payroll Policy Profile",
        value: payrollPolicyId,
      },
      { id: "tax-status", label: "Tax Status", value: taxStatus },
      { id: "rate-type", label: "Rate Type", value: rateType },
    ].filter((field) => isPlaceholderSelection(field.value));

    if (missingSelectFields.length > 0) {
      setSelectValidationErrors(
        missingSelectFields.map(({ id, label }) => ({ id, label })),
      );
      setSubmitSuccess(null);
      setSubmitError(
        `Complete the required dropdown fields before saving: ${missingSelectFields
          .map((field) => field.label)
          .join(", ")}.`,
      );
      focusFieldById(missingSelectFields[0].id);
      return;
    }

    if (!isEditMode && createAccount) {
      const accountRole = getRequiredFormValue(formData, "account-role");

      if (isPlaceholderSelection(accountRole)) {
        setSelectValidationErrors([{ id: "account-role", label: "Role" }]);
        setSubmitSuccess(null);
        setSubmitError("Choose an account role before creating login access.");
        focusFieldById("account-role");
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    setSelectValidationErrors([]);

    try {
      const hireDate = getOptionalFormValue(formData, "hire-date");
      const employeePayload = {
        employee_code: getRequiredFormValue(formData, "employee-id"),
        first_name: getRequiredFormValue(formData, "first-name"),
        middle_name: getOptionalFormValue(formData, "middle-name"),
        last_name: getRequiredFormValue(formData, "last-name"),
        suffix: normalizeOptionalSelection(getOptionalFormValue(formData, "suffix")),
        birth_date: getOptionalFormValue(formData, "birth-date"),
        hire_date: hireDate,
        end_date: isInactiveStatus ? getOptionalFormValue(formData, "end-date") : null,
        employment_status: employmentStatus,
        employment_type: employmentType,
        contact_number: getOptionalFormValue(formData, "contact-number"),
        department,
        position: getRequiredFormValue(formData, "position"),
        payroll_schedule: payrollSchedule,
        work_arrangement_type: normalizeOptionalSelection(workArrangementType),
        payroll_policy_id: resolvePayrollPolicyProfileId(
          payrollPolicyId,
          payrollPolicyProfiles,
        ),
        shift_start_time: shiftStartTime || null,
        shift_end_time: shiftEndTime || null,
        work_days: workDays,
        reporting_manager_id: reportingManagerId ? Number(reportingManagerId) : null,
        is_active: employmentStatus !== "Inactive",
      };
      const governmentInfoPayload = {
        tin: getRequiredFormValue(formData, "tin"),
        sss_number: getRequiredFormValue(formData, "sss"),
        philhealth_number: getRequiredFormValue(formData, "philhealth"),
        pagibig_number: getRequiredFormValue(formData, "pagibig"),
        tax_status: taxStatus,
      };
      const nextAllowancePayload = buildAllowancePayload(
        selectedAllowanceOptions,
        allowanceValues,
      );
      const allowancesChanged = !areAllowanceInputsEqual(
        initialData?.allowances ?? [],
        nextAllowancePayload,
      );
      const salaryProfileFields = {
        basic_salary: basicSalaryAmount,
        rate_type: rateType,
        pay_frequency: payrollSchedule,
      };

      if (isEditMode) {
        if (!initialData) {
          throw new Error("Employee edit data is unavailable.");
        }

        const salaryProfilePayload: EmployeeUpdatePayload["salary_profile"] = {
          ...salaryProfileFields,
          ...(allowancesChanged
            ? {
                allowances: nextAllowancePayload,
              }
            : {}),
        };
        const payload = {
          employee: employeePayload,
          government_info: governmentInfoPayload,
          salary_profile: salaryProfilePayload,
        };
          const changes = buildEditChangeSummary(
            initialData,
            payload,
            linkedAccountRole,
            activeEmployeeOptions,
            payrollPolicyProfiles,
          );

        if (changes.length === 0) {
          setSubmitError("No changes detected to save.");
          return;
        }

        setEditConfirmation({
          changes,
          payload,
        });
        return;
      }

      const result = await onboardEmployee({
        employee: employeePayload,
        government_info: governmentInfoPayload,
        salary_profile: {
          ...salaryProfileFields,
          effective_date: hireDate,
          allowances: nextAllowancePayload,
        },
        account_access: createAccount
          ? {
              enabled: true,
              email: getRequiredFormValue(formData, "account-email"),
              username: getRequiredFormValue(formData, "username"),
              role: getRequiredFormValue(formData, "account-role"),
            }
          : {
              enabled: false,
            },
      });

      setSubmitSuccess(result);
      form.reset();
      setCreateAccount(true);
      setSelectedAllowances([]);
        setDraftAllowances([]);
        setEmploymentStatus("Select status");
        setEndDate("");
        setContactNumber("");
        setTin("");
        setSssNumber("");
        setPhilHealthNumber("");
        setPagIbigNumber("");
      setBasicSalary("");
      setAllowanceValues({});
      setReportingManagerId("");
      setWorkArrangementType("Select work arrangement type");
      setPayrollPolicyId("");
      setHasManualPayrollPolicyOverride(false);
      setShiftStartTime("");
      setShiftEndTime("");
      setWorkDays([]);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : isEditMode
            ? "Unable to update the employee record."
            : "Unable to save the employee record.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmEditChanges() {
    if (!initialData || !editConfirmation) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await updateEmployeeProfile(
        initialData.employeeId,
        editConfirmation.payload,
      );

      if (initialData.accountAccess.userId && isLinkedAccountRoleChanged) {
        await updateUserAccount(initialData.accountAccess.userId, {
          role: linkedAccountRole,
        });

        setLinkedAccountNotice({
          type: "role-updated",
          role: linkedAccountRole,
        });
      }

      setEditConfirmation(null);
      router.replace(`/employees/${result.employeeCode}`);
      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to update the employee record.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGenerateTemporaryPassword() {
    if (!formDataDefaults.accountAccess.userId) {
      setLinkedAccountNotice(null);
      setLinkedAccountError("No linked user account is available for password reset.");
      return;
    }

    const temporaryPassword = generateTemporaryPassword();

    setIsUpdatingLinkedAccount(true);
    setLinkedAccountError(null);
    setLinkedAccountNotice(null);

    try {
      await updateUserAccount(formDataDefaults.accountAccess.userId, {
        password: temporaryPassword,
        must_change_password: true,
      });

      setLinkedAccountNotice({
        type: "password-reset",
        temporaryPassword,
      });
    } catch (error) {
      setLinkedAccountError(
        error instanceof Error
          ? error.message
          : "Unable to generate a new temporary password.",
      );
    } finally {
      setIsUpdatingLinkedAccount(false);
    }
  }

  function clearSelectValidationError(fieldId: string) {
    setSelectValidationErrors((current) =>
      current.filter((field) => field.id !== fieldId),
    );
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <EmployeeFormSection
            title="Basic Information"
            description="Capture the core employee identity and employment dates used throughout payroll processing."
          >
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <EmployeeInputField
                id="employee-id"
                label="Employee ID"
                placeholder="EMP-1082"
                defaultValue={formDataDefaults.employeeCode}
                required
              />
              <EmployeeInputField
                id="first-name"
                label="First Name"
                placeholder="First name"
                defaultValue={formDataDefaults.firstName}
                required
              />
              <EmployeeInputField
                id="middle-name"
                label="Middle Name"
                placeholder="Middle name"
                defaultValue={formDataDefaults.middleName}
              />
              <EmployeeInputField
                id="last-name"
                label="Last Name"
                placeholder="Last name"
                defaultValue={formDataDefaults.lastName}
                required
              />
              <EmployeeInputField
                id="contact-number"
                label="Contact Number"
                placeholder="0912-345-6789"
                value={contactNumber}
                onChange={(event) =>
                  setContactNumber(formatContactNumberValue(event.target.value))
                }
                inputMode="tel"
                maxLength={13}
                helperText="Enter digits only. Hyphens are added automatically."
              />
              <EmployeeSelectField
                id="suffix"
                label="Suffix"
                options={suffixOptions}
                defaultValue={formDataDefaults.suffix || "None"}
              />
              <EmployeeInputField
                id="birth-date"
                label="Birth Date"
                type="date"
                defaultValue={formDataDefaults.birthDate}
                required
              />
              <EmployeeInputField
                id="hire-date"
                label="Hire Date"
                type="date"
                defaultValue={formDataDefaults.hireDate}
                required
              />
              <EmployeeInputField
                id="end-date"
                label="End Date / Resign Date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                disabled={!isInactiveStatus}
                helperText={
                  isInactiveStatus
                    ? "Set the employee's last working date before saving."
                    : "This field becomes available when Employment Status is set to Inactive."
                }
              />
            </div>
          </EmployeeFormSection>

          <EmployeeFormSection
            title="Work Information"
            description="Define the employee's organizational assignment and payroll operating setup."
          >
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <EmployeeSelectField
                id="department"
                label="Department"
                options={departmentOptions}
                defaultValue={formDataDefaults.department || "Select department"}
                onChange={() => clearSelectValidationError("department")}
                invalid={hasSelectValidationError(selectValidationErrors, "department")}
                errorText={getSelectValidationMessage(selectValidationErrors, "department")}
                required
              />
              <EmployeeInputField
                id="position"
                label="Position"
                placeholder="Payroll Analyst"
                defaultValue={formDataDefaults.position}
                required
              />
              <EmployeeSearchSelectField
                id="reporting-manager"
                label="Reporting Manager"
                value={reportingManagerId}
                onChange={setReportingManagerId}
                options={activeEmployeeOptions}
                disabled={activeEmployeeOptions.length === 0}
                helperText={
                  managerOptionsErrorMessage
                    ? `${managerOptionsErrorMessage} You can retry once the employee list is available again.`
                    : activeEmployeeOptions.length > 0
                      ? "Search active employees to assign a reporting manager."
                      : "No active employees are currently available to select as reporting manager."
                }
              />
              <EmployeeSelectField
                id="work-arrangement-type"
                label="Work Arrangement Type"
                options={workArrangementTypeFieldOptions}
                defaultValue={
                  formDataDefaults.workArrangementType || "Select work arrangement type"
                }
                value={workArrangementType}
                onChange={(event) =>
                  handleWorkArrangementTypeChange(event.target.value)
                }
                invalid={hasSelectValidationError(
                  selectValidationErrors,
                  "work-arrangement-type",
                )}
                errorText={getSelectValidationMessage(
                  selectValidationErrors,
                  "work-arrangement-type",
                )}
                helperText="Classify the employee's schedule setup. This suggests, but does not force, the payroll policy."
                required
              />
              <EmployeeSelectField
                id="payroll-policy"
                label="Payroll Policy Profile"
                options={payrollPolicyFieldOptions}
                defaultValue={initialPayrollPolicyId || "Select payroll policy profile"}
                value={payrollPolicyId}
                onChange={(event) => handlePayrollPolicyChange(event.target.value)}
                invalid={hasSelectValidationError(selectValidationErrors, "payroll-policy")}
                errorText={getSelectValidationMessage(
                  selectValidationErrors,
                  "payroll-policy",
                )}
                disabled={payrollPolicyProfiles.length === 0}
                helperText={getPayrollPolicyHelperText({
                  payrollPolicyProfiles,
                  payrollPolicyProfilesErrorMessage,
                  payrollPolicyId,
                  selectedPayrollPolicyName: selectedPayrollPolicyProfile?.name,
                  suggestedPayrollPolicyId,
                  hasManualPayrollPolicyOverride,
                })}
                required
              />
              <EmployeeInputField
                id="shift-start-time"
                label="Shift Start"
                type="time"
                value={shiftStartTime}
                onChange={(event) => setShiftStartTime(event.target.value)}
                helperText="Set the regular clock-in time for this employee."
              />
              <EmployeeInputField
                id="shift-end-time"
                label="Shift End"
                type="time"
                value={shiftEndTime}
                onChange={(event) => setShiftEndTime(event.target.value)}
                helperText="Set the regular clock-out time for this employee."
              />
              <EmployeeSelectField
                id="employment-type"
                label="Employment Type"
                options={employmentTypeOptions}
                defaultValue={formDataDefaults.employmentType || "Select employment type"}
                onChange={() => clearSelectValidationError("employment-type")}
                invalid={hasSelectValidationError(selectValidationErrors, "employment-type")}
                errorText={getSelectValidationMessage(
                  selectValidationErrors,
                  "employment-type",
                )}
                required
              />
              <EmployeeSelectField
                id="employment-status"
                label="Employment Status"
                options={employmentStatusOptions}
                defaultValue={employmentStatus}
                value={employmentStatus}
                onChange={(event) =>
                  handleEmploymentStatusChange(event.target.value)
                }
                invalid={hasSelectValidationError(selectValidationErrors, "employment-status")}
                errorText={getSelectValidationMessage(
                  selectValidationErrors,
                  "employment-status",
                )}
                required
              />
              <EmployeeSelectField
                id="payroll-schedule"
                label="Payroll Schedule"
                options={payrollScheduleOptions}
                defaultValue={formDataDefaults.payrollSchedule || "Select payroll schedule"}
                onChange={() => clearSelectValidationError("payroll-schedule")}
                invalid={hasSelectValidationError(selectValidationErrors, "payroll-schedule")}
                errorText={getSelectValidationMessage(
                  selectValidationErrors,
                  "payroll-schedule",
                )}
                required
              />
            </div>
            <div className="mt-5 rounded-[26px] border border-slate-200/80 bg-slate-50/80 p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    Work Days
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Choose the regular office days for this employee, such as
                    Monday to Saturday.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  {workDays.length} day{workDays.length === 1 ? "" : "s"} selected
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {workDayOptions.map((day) => {
                  const checked = workDays.includes(day);

                  return (
                    <label
                      key={day}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                        checked
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleWorkDay(day)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span>{day}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </EmployeeFormSection>

          <EmployeeFormSection
            title="Government Information"
            description="Record statutory identification numbers and tax details used for payroll compliance."
          >
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <EmployeeInputField
                id="tin"
                label="TIN"
                placeholder="000-000-000-000"
                value={tin}
                onChange={(event) => setTin(formatTinValue(event.target.value))}
                inputMode="numeric"
                maxLength={15}
                helperText="Enter digits only. Hyphens are added automatically."
                required
              />
              <EmployeeInputField
                id="sss"
                label="SSS Number"
                placeholder="00-0000000-0"
                value={sssNumber}
                onChange={(event) =>
                  setSssNumber(formatSssNumberValue(event.target.value))
                }
                inputMode="numeric"
                maxLength={12}
                helperText="Enter digits only. Hyphens are added automatically."
                required
              />
              <EmployeeInputField
                id="philhealth"
                label="PhilHealth Number"
                placeholder="00-000000000-0"
                value={philHealthNumber}
                onChange={(event) =>
                  setPhilHealthNumber(
                    formatPhilHealthNumberValue(event.target.value),
                  )
                }
                inputMode="numeric"
                maxLength={14}
                helperText="Enter digits only. Hyphens are added automatically."
                required
              />
              <EmployeeInputField
                id="pagibig"
                label="Pag-IBIG Number"
                placeholder="0000-0000-0000"
                value={pagIbigNumber}
                onChange={(event) =>
                  setPagIbigNumber(formatPagIbigNumberValue(event.target.value))
                }
                inputMode="numeric"
                maxLength={14}
                helperText="Enter digits only. Hyphens are added automatically."
                required
              />
              <EmployeeSelectField
                id="tax-status"
                label="Tax Status"
                options={taxStatusOptions}
                defaultValue={formDataDefaults.taxStatus || "Select tax status"}
                onChange={() => clearSelectValidationError("tax-status")}
                invalid={hasSelectValidationError(selectValidationErrors, "tax-status")}
                errorText={getSelectValidationMessage(selectValidationErrors, "tax-status")}
                required
              />
            </div>
          </EmployeeFormSection>

          <EmployeeFormSection
            title="Salary Information"
            description="Set the employee's compensation base and recurring allowance values for payroll preparation."
          >
            <div className="space-y-5">
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Allowance setup
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Select the recurring allowances that apply to this employee,
                    then enter the corresponding amount below.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAllowanceModal}
                  className="ui-button-secondary"
                >
                  {selectedAllowanceOptions.length > 0
                    ? `Manage Allowances (${selectedAllowanceOptions.length})`
                    : "Select Allowances"}
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <EmployeeInputField
                  id="basic-salary"
                  label="Basic Salary"
                  type="number"
                  placeholder="35000"
                  prefix="PHP"
                  value={basicSalary}
                  onChange={(event) => setBasicSalary(event.target.value)}
                  required
                />
                <EmployeeSelectField
                  id="rate-type"
                  label="Rate Type"
                  options={rateTypeOptions}
                  defaultValue={formDataDefaults.rateType || "Select rate type"}
                  onChange={() => clearSelectValidationError("rate-type")}
                  invalid={hasSelectValidationError(selectValidationErrors, "rate-type")}
                  errorText={getSelectValidationMessage(selectValidationErrors, "rate-type")}
                  required
                />
              </div>

              {selectedAllowanceOptions.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {selectedAllowanceOptions.map((allowance) => (
                    <EmployeeInputField
                      key={allowance}
                      id={getAllowanceFieldId(allowance)}
                      label={allowance}
                      type="number"
                      placeholder="0.00"
                      prefix="PHP"
                      value={allowanceValues[allowance] ?? ""}
                      onChange={(event) =>
                        updateAllowanceValue(allowance, event.target.value)
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-500">
                  No allowances selected yet. Use the button above to choose the
                  employee&apos;s applicable allowances.
                </div>
              )}

              <div className="rounded-3xl border border-slate-200/80 bg-slate-900 px-5 py-5 text-white">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                      Salary subtotal
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                      {formatCurrency(salarySubtotal)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Live preview of the recurring salary amounts currently
                      entered before the employee record is saved.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:min-w-64">
                    <div className="rounded-2xl bg-white/8 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                        Basic salary
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {formatCurrency(basicSalaryAmount)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/8 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                        Allowances subtotal
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {formatCurrency(allowanceSubtotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </EmployeeFormSection>

          {isEditMode ? (
            <EmployeeFormSection
              title="Linked Account"
              description="Manage the linked login account role and reset a temporary password when the employee needs new access credentials."
            >
              <div className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <ReadOnlyCard
                    label="Account Status"
                    value={
                      formDataDefaults.accountAccess.linked
                        ? "Linked user account"
                        : "No linked user account"
                    }
                  />
                  <ReadOnlyCard
                    label="Email"
                    value={formDataDefaults.accountAccess.email || "Not available"}
                  />
                  <ReadOnlyCard
                    label="Username"
                    value={formDataDefaults.accountAccess.username || "Not available"}
                  />
                  {formDataDefaults.accountAccess.linked ? (
                    <EmployeeSelectField
                      id="linked-account-role"
                      label="Role"
                      options={linkedAccountRoleOptions}
                      value={linkedAccountRole}
                      onChange={(event) => setLinkedAccountRole(event.target.value)}
                      helperText="Role changes are saved together with the employee update."
                    />
                  ) : (
                    <ReadOnlyCard
                      label="Role"
                      value={formDataDefaults.accountAccess.role || "Not available"}
                    />
                  )}
                </div>

                {formDataDefaults.accountAccess.linked ? (
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          Temporary password reset
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Generate a new temporary password for this linked user if
                          they forgot the current password.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateTemporaryPassword}
                        disabled={isUpdatingLinkedAccount || isSubmitting}
                        className="ui-button-secondary"
                      >
                        {isUpdatingLinkedAccount
                          ? "Generating Password..."
                          : "Generate New Temporary Password"}
                      </button>
                    </div>

                    {linkedAccountNotice?.type === "password-reset" ? (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-800">
                        <p className="font-semibold text-emerald-900">
                          New temporary password generated.
                        </p>
                        <p className="mt-1">
                          Temporary password:{" "}
                          <span className="font-medium">
                            {linkedAccountNotice.temporaryPassword}
                          </span>
                        </p>
                        <p className="mt-1 text-emerald-700">
                          Share this securely. It will not be shown again after the page is refreshed.
                        </p>
                      </div>
                    ) : null}

                    {linkedAccountNotice?.type === "role-updated" ? (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-800">
                        <p className="font-semibold text-emerald-900">
                          Linked account role updated.
                        </p>
                        <p className="mt-1">
                          Current role:{" "}
                          <span className="font-medium">
                            {linkedAccountNotice.role}
                          </span>
                        </p>
                      </div>
                    ) : null}

                    {linkedAccountError ? (
                      <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700">
                        {linkedAccountError}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </EmployeeFormSection>
          ) : (
            <EmployeeFormSection
              title="Account Access"
              description="Prepare optional employee login credentials for self-service access."
            >
              <div className="space-y-5">
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Create login account
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Enable employee portal credentials during profile creation.
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-pressed={createAccount}
                    onClick={() => setCreateAccount((current) => !current)}
                    className={cn(
                      "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition",
                      createAccount ? "bg-slate-900" : "bg-slate-300",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-6 w-6 rounded-full bg-white shadow-sm transition",
                        createAccount ? "translate-x-7" : "translate-x-1",
                      )}
                    />
                    <span className="sr-only">Toggle account access</span>
                  </button>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <EmployeeInputField
                    id="account-email"
                    label="Email"
                    type="email"
                    placeholder="employee@northstarpayroll.com"
                    required={createAccount}
                    disabled={!createAccount}
                    helperText={
                      createAccount
                        ? "This email will be used as the primary access contact."
                        : "Enable account creation to capture login credentials."
                    }
                  />
                  <EmployeeInputField
                    id="username"
                    label="Username"
                    placeholder="olivia.bennett"
                    required={createAccount}
                    disabled={!createAccount}
                  />
                  <EmployeeSelectField
                    id="account-role"
                    label="Role"
                    options={accountRoleOptions}
                    defaultValue="Select account role"
                    onChange={() => clearSelectValidationError("account-role")}
                    required={createAccount}
                    disabled={!createAccount}
                    invalid={hasSelectValidationError(selectValidationErrors, "account-role")}
                    errorText={getSelectValidationMessage(
                      selectValidationErrors,
                      "account-role",
                    )}
                    helperText={
                      createAccount
                        ? "Choose the access level to assign once account creation is wired."
                        : "Enable account creation to assign a dashboard role."
                    }
                  />
                </div>
              </div>
            </EmployeeFormSection>
          )}

          <div className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <p className="text-sm leading-6 text-slate-600">
              {isEditMode
                ? "Review the updated employee, government, and salary details before saving changes."
                : "Required fields are marked with an asterisk. Employee onboarding now submits to the backend transaction flow from this form."}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href={isEditMode ? `/employees/${formDataDefaults.employeeCode}` : "/employees"}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/15 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                {isSubmitting
                  ? isEditMode
                    ? "Saving Changes..."
                    : "Saving Employee..."
                  : isEditMode
                    ? "Save Changes"
                    : "Save Employee"}
              </button>
            </div>
          </div>

          {submitError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700">
              {submitError}
              {selectValidationErrors.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectValidationErrors.map((field) => (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => focusFieldById(field.id)}
                      className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                    >
                      {field.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {!isEditMode && submitSuccess ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-800">
              <p className="font-semibold text-emerald-900">
                Employee saved successfully.
              </p>
              <p className="mt-1">
                {submitSuccess.employeeFullName} was onboarded as{" "}
                {submitSuccess.employeeCode}. Salary subtotal:{" "}
                {formatCurrency(submitSuccess.salarySubtotal)}. Total allowances:{" "}
                {formatCurrency(submitSuccess.totalAllowance)}.
              </p>
              {submitSuccess.linkedUsername ? (
                <p className="mt-2">
                  Linked username:{" "}
                  <span className="font-medium">{submitSuccess.linkedUsername}</span>
                </p>
              ) : null}
              {submitSuccess.temporaryPassword ? (
                <p className="mt-2">
                  Temporary password:{" "}
                  <span className="font-medium">{submitSuccess.temporaryPassword}</span>
                </p>
              ) : null}
            </div>
          ) : null}
        </form>

        <aside className="space-y-6">
          <section className="panel-muted p-6">
            <h2 className="text-lg font-semibold text-slate-950">Form guidance</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Keep statutory and payroll fields complete before moving this form
              into real submission flows.
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 text-sm leading-6 text-slate-600">
                Employee ID and work assignment fields should remain consistent
                with payroll reporting conventions.
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 text-sm leading-6 text-slate-600">
                Government identifiers are placed in their own section so later
                validation rules can be added cleanly.
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 text-sm leading-6 text-slate-600">
                {isEditMode
                  ? "Account access stays read-only in edit mode until the backend exposes a user update flow."
                  : "Account access can be made conditional without changing the rest of the form structure."}
              </div>
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="text-lg font-semibold text-slate-950">
              Completion checklist
            </h2>
            <div className="mt-5 space-y-3">
              <ChecklistItem label="Identity and employment dates" />
              <ChecklistItem label="Department and payroll setup" />
              <ChecklistItem label="Reporting manager assignment" />
              <ChecklistItem label="Government and tax information" />
              <ChecklistItem label="Salary and allowance values" />
              <ChecklistItem
                label={
                  isEditMode ? "Linked account review" : "Optional account access"
                }
              />
            </div>
          </section>
        </aside>
      </div>

      {allowanceModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="allowance-modal-title"
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-2xl shadow-slate-950/20"
          >
            <div className="border-b border-slate-200/80 px-6 py-5">
              <h2
                id="allowance-modal-title"
                className="text-lg font-semibold text-slate-950"
              >
                Select Allowances
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Choose all recurring allowances that should appear in the salary
                information section for this employee.
              </p>
            </div>

            <div className="grid gap-3 overflow-y-auto px-6 py-5 md:grid-cols-2">
              {allowanceFieldOptions.map((allowance) => (
                <label
                  key={allowance}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={draftAllowances.includes(allowance)}
                    onChange={() => toggleDraftAllowance(allowance)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="leading-6">{allowance}</span>
                </label>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200/80 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {draftAllowances.length} allowance
                {draftAllowances.length === 1 ? "" : "s"} selected
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={closeAllowanceModal}
                  className="ui-button-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyAllowanceSelection}
                  className="ui-button-primary"
                >
                  Apply Allowances
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isEditMode && editConfirmation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-confirmation-title"
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-2xl shadow-slate-950/20"
          >
            <div className="border-b border-slate-200/80 px-6 py-5">
              <h2
                id="edit-confirmation-title"
                className="text-lg font-semibold text-slate-950"
              >
                Confirm Employee Changes
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Review the previous and current values before saving this employee update.
              </p>
            </div>

            <div className="space-y-3 overflow-y-auto px-6 py-5">
              {editConfirmation.changes.map((change) => (
                <div
                  key={`${change.label}-${change.previous}-${change.current}`}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4"
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {change.label}
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Previous
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {change.previous}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        Current
                      </p>
                      <p className="mt-2 text-sm text-emerald-900">
                        {change.current}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200/80 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {editConfirmation.changes.length} change
                {editConfirmation.changes.length === 1 ? "" : "s"} ready to save
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setEditConfirmation(null)}
                  className="ui-button-secondary"
                  disabled={isSubmitting}
                >
                  Review Again
                </button>
                <button
                  type="button"
                  onClick={confirmEditChanges}
                  className="ui-button-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving Changes..." : "Confirm Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ReadOnlyCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function ChecklistItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold text-white">
        •
      </span>
      <span className="text-sm text-slate-700">{label}</span>
    </div>
  );
}

function getAllowanceFieldId(allowance: string) {
  return `allowance-${allowance
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

function getRequiredFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getOptionalFormValue(formData: FormData, key: string) {
  const value = getRequiredFormValue(formData, key);

  return value.length > 0 ? value : null;
}

function isPlaceholderSelection(value: string) {
  return value.trim().toLowerCase().startsWith("select ");
}

function focusFieldById(fieldId: string) {
  if (typeof document === "undefined") {
    return;
  }

  const field = document.getElementById(fieldId);

  if (!field) {
    return;
  }

  field.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
  field.focus();
}

function hasSelectValidationError(
  errors: SelectValidationError[],
  fieldId: string,
) {
  return errors.some((field) => field.id === fieldId);
}

function getSelectValidationMessage(
  errors: SelectValidationError[],
  fieldId: string,
) {
  if (!hasSelectValidationError(errors, fieldId)) {
    return undefined;
  }

  return "Please choose a value before saving.";
}

function normalizeOptionalSelection(value: string | null) {
  if (!value || value === "None") {
    return null;
  }

  return value;
}

function parseCurrencyInput(value?: string) {
  const normalizedValue = typeof value === "string" ? Number(value) : 0;

  return Number.isFinite(normalizedValue) ? normalizedValue : 0;
}

function buildEditChangeSummary(
  initialData: EditableEmployeeData,
  payload: EmployeeUpdatePayload,
  linkedAccountRole: string,
  activeEmployeeOptions: EmployeeManagerOption[],
  payrollPolicyProfiles: PayrollPolicyProfileRecord[],
): EditChangeItem[] {
  const changes: EditChangeItem[] = [];

  pushFieldChange(changes, "Employee ID", initialData.employeeCode, payload.employee.employee_code);
  pushFieldChange(changes, "First Name", initialData.firstName, payload.employee.first_name);
  pushFieldChange(changes, "Middle Name", initialData.middleName, payload.employee.middle_name);
  pushFieldChange(changes, "Last Name", initialData.lastName, payload.employee.last_name);
  pushFieldChange(
    changes,
    "Suffix",
    normalizeDisplayValue(initialData.suffix === "None" ? null : initialData.suffix),
    normalizeDisplayValue(payload.employee.suffix),
  );
  pushFieldChange(changes, "Birth Date", initialData.birthDate, payload.employee.birth_date);
  pushFieldChange(changes, "Hire Date", initialData.hireDate, payload.employee.hire_date);
  pushFieldChange(changes, "End Date / Resign Date", initialData.endDate, payload.employee.end_date);
  pushFieldChange(
    changes,
    "Contact Number",
    initialData.contactNumber,
    payload.employee.contact_number,
  );
  pushFieldChange(changes, "Department", initialData.department, payload.employee.department);
  pushFieldChange(changes, "Position", initialData.position, payload.employee.position);
  pushFieldChange(
    changes,
    "Work Arrangement Type",
    normalizeDisplayValue(initialData.workArrangementType),
    normalizeDisplayValue(payload.employee.work_arrangement_type),
  );
  pushFieldChange(
    changes,
    "Payroll Policy Profile",
    resolvePayrollPolicyProfileName(initialData.payrollPolicyId, initialData.payrollPolicyName, payrollPolicyProfiles),
    resolvePayrollPolicyProfileName(
      payload.employee.payroll_policy_id != null
        ? String(payload.employee.payroll_policy_id)
        : "",
      "",
      payrollPolicyProfiles,
    ),
  );
  pushFieldChange(
    changes,
    "Shift Start",
    initialData.shiftStartTime,
    payload.employee.shift_start_time,
  );
  pushFieldChange(
    changes,
    "Shift End",
    initialData.shiftEndTime,
    payload.employee.shift_end_time,
  );
  pushFieldChange(
    changes,
    "Work Days",
    initialData.workDays.join(", "),
    payload.employee.work_days?.join(", "),
  );
  pushFieldChange(
    changes,
    "Reporting Manager",
    resolveManagerLabel(
      initialData.reportingManagerId,
      initialData.reportingManagerName,
      activeEmployeeOptions,
    ),
    resolveManagerLabel(
      payload.employee.reporting_manager_id != null
        ? String(payload.employee.reporting_manager_id)
        : "",
      "",
      activeEmployeeOptions,
    ),
  );
  pushFieldChange(
    changes,
    "Employment Type",
    initialData.employmentType,
    payload.employee.employment_type,
  );
  pushFieldChange(
    changes,
    "Employment Status",
    initialData.employmentStatus,
    payload.employee.employment_status,
  );
  pushFieldChange(
    changes,
    "Payroll Schedule",
    initialData.payrollSchedule,
    payload.employee.payroll_schedule,
  );
  pushFieldChange(changes, "TIN", initialData.tin, payload.government_info.tin);
  pushFieldChange(changes, "SSS Number", initialData.sssNumber, payload.government_info.sss_number);
  pushFieldChange(
    changes,
    "PhilHealth Number",
    initialData.philHealthNumber,
    payload.government_info.philhealth_number,
  );
  pushFieldChange(
    changes,
    "Pag-IBIG Number",
    initialData.pagIbigNumber,
    payload.government_info.pagibig_number,
  );
  pushFieldChange(
    changes,
    "Tax Status",
    initialData.taxStatus,
    payload.government_info.tax_status,
  );
  pushFieldChange(
    changes,
    "Basic Salary",
    formatCurrency(parseCurrencyInput(initialData.basicSalary)),
    formatCurrency(payload.salary_profile.basic_salary),
  );
  pushFieldChange(
    changes,
    "Rate Type",
    initialData.rateType,
    payload.salary_profile.rate_type,
  );
  pushFieldChange(
    changes,
    "Linked Account Role",
    initialData.accountAccess.role,
    linkedAccountRole,
  );

  const previousAllowances = buildAllowanceComparisonMap(initialData.allowances);
  const currentAllowances = buildAllowanceComparisonMap(
    payload.salary_profile.allowances ?? initialData.allowances,
  );
  const allowanceNames = [
    ...new Set([...previousAllowances.keys(), ...currentAllowances.keys()]),
  ].sort();

  for (const allowanceName of allowanceNames) {
    const previousValue = previousAllowances.get(allowanceName);
    const currentValue = currentAllowances.get(allowanceName);

    pushFieldChange(
      changes,
      `Allowance: ${currentValue?.label ?? previousValue?.label ?? allowanceName}`,
      previousValue != null ? formatCurrency(previousValue.amount) : "Not included",
      currentValue != null ? formatCurrency(currentValue.amount) : "Not included",
    );
  }

  return changes;
}

function pushFieldChange(
  changes: EditChangeItem[],
  label: string,
  previousValue: string | null | undefined,
  currentValue: string | null | undefined,
) {
  const previous = normalizeDisplayValue(previousValue);
  const current = normalizeDisplayValue(currentValue);

  if (previous === current) {
    return;
  }

  changes.push({
    label,
    previous,
    current,
  });
}

function normalizeDisplayValue(value: string | null | undefined) {
  if (typeof value !== "string") {
    return "Not set";
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : "Not set";
}

function mergeAllowanceOptions(existingAllowances: string[]) {
  const mergedAllowances = [...allowanceOptions];
  const seenAllowanceNames = new Set(
    mergedAllowances.map((allowance) => normalizeAllowanceName(allowance)),
  );

  for (const allowance of existingAllowances) {
    const resolvedAllowance = resolveAllowanceDisplayName(allowance);
    const normalizedAllowance = normalizeAllowanceName(resolvedAllowance);
    if (!normalizedAllowance || seenAllowanceNames.has(normalizedAllowance)) {
      continue;
    }

    mergedAllowances.push(resolvedAllowance);
    seenAllowanceNames.add(normalizedAllowance);
  }

  return mergedAllowances;
}

function normalizeAllowanceName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function resolveAllowanceDisplayName(value: string) {
  const normalizedValue = normalizeAllowanceName(value);

  if (!normalizedValue) {
    return "";
  }

  return allowanceOptionByNormalizedName.get(normalizedValue) ?? value.trim().replace(/\s+/g, " ");
}

function dedupeAllowanceNames(values: string[]) {
  const dedupedAllowances: string[] = [];
  const seenAllowanceNames = new Set<string>();

  for (const value of values) {
    const resolvedAllowance = resolveAllowanceDisplayName(value);
    const normalizedAllowance = normalizeAllowanceName(resolvedAllowance);

    if (!normalizedAllowance || seenAllowanceNames.has(normalizedAllowance)) {
      continue;
    }

    dedupedAllowances.push(resolvedAllowance);
    seenAllowanceNames.add(normalizedAllowance);
  }

  return dedupedAllowances;
}

function buildAllowanceValueMap(
  allowances: Array<{ allowanceName: string; amount: string }>,
) {
  const entries: Record<string, string> = {};

  allowances.forEach((allowance) => {
    const resolvedAllowance = resolveAllowanceDisplayName(allowance.allowanceName);
    if (!resolvedAllowance) {
      return;
    }

    entries[resolvedAllowance] = allowance.amount;
  });

  return entries;
}

function buildAllowancePayload(
  selectedAllowanceNames: string[],
  allowanceValues: Record<string, string>,
) {
  return dedupeAllowanceNames(selectedAllowanceNames)
    .map((allowance) => ({
      allowance_name: allowance,
      amount: parseCurrencyInput(allowanceValues[allowance]),
    }))
    .filter((allowance) => allowance.amount > 0);
}

function buildAllowanceComparisonMap(allowances: AllowanceComparisonInput[]) {
  const entries = new Map<
    string,
    {
      label: string;
      amount: number;
    }
  >();

  for (const allowance of allowances) {
    const rawAllowanceName =
      "allowanceName" in allowance
        ? allowance.allowanceName
        : allowance.allowance_name;
    const resolvedAllowanceName = resolveAllowanceDisplayName(rawAllowanceName);
    const normalizedAllowanceName = normalizeAllowanceName(resolvedAllowanceName);
    const amount = parseCurrencyInput(String(allowance.amount));

    if (!normalizedAllowanceName || amount <= 0) {
      continue;
    }

    entries.set(normalizedAllowanceName, {
      label: resolvedAllowanceName,
      amount,
    });
  }

  return entries;
}

function areAllowanceInputsEqual(
  previousAllowances: AllowanceComparisonInput[],
  currentAllowances: AllowanceComparisonInput[],
) {
  const previousEntries = buildAllowanceComparisonMap(previousAllowances);
  const currentEntries = buildAllowanceComparisonMap(currentAllowances);

  if (previousEntries.size !== currentEntries.size) {
    return false;
  }

  for (const [allowanceName, previousEntry] of previousEntries.entries()) {
    const currentEntry = currentEntries.get(allowanceName);

    if (!currentEntry || currentEntry.amount !== previousEntry.amount) {
      return false;
    }
  }

  return true;
}

function mergeSelectOptions(options: string[], selectedValue?: string) {
  if (!selectedValue || options.includes(selectedValue)) {
    return options;
  }

  return [...options, selectedValue];
}

function buildPayrollPolicyFieldOptions(
  payrollPolicyProfiles: PayrollPolicyProfileRecord[],
  selectedValue?: string,
  selectedName?: string,
) {
  const options = [
    "Select payroll policy profile",
    ...payrollPolicyProfiles.map((profile) => profile.name),
  ];

  const selectedLabel =
    payrollPolicyProfiles.find((profile) => profile.name === selectedValue)?.name ??
    selectedName;

  return mergeSelectOptions(options, selectedLabel);
}

function getSuggestedPayrollPolicyName(
  workArrangementType: string,
  payrollPolicyProfiles: PayrollPolicyProfileRecord[],
) {
  if (isPlaceholderSelection(workArrangementType)) {
    return "";
  }

  const matchedProfile = payrollPolicyProfiles.find((profile) =>
    profile.default_work_arrangement_types.includes(workArrangementType),
  );

  return matchedProfile?.name ?? "";
}

function resolvePayrollPolicyProfileId(
  payrollPolicyName: string,
  payrollPolicyProfiles: PayrollPolicyProfileRecord[],
) {
  if (!payrollPolicyName) {
    return null;
  }

  const matchedProfile = payrollPolicyProfiles.find(
    (profile) => profile.name === payrollPolicyName,
  );

  return matchedProfile?.id ?? null;
}

function resolvePayrollPolicyProfileName(
  payrollPolicyId: string,
  fallbackName: string,
  payrollPolicyProfiles: PayrollPolicyProfileRecord[],
) {
  if (!payrollPolicyId) {
    return "Not set";
  }

  const matchedProfile = payrollPolicyProfiles.find(
    (profile) =>
      String(profile.id) === payrollPolicyId || profile.name === payrollPolicyId,
  );

  if (matchedProfile) {
    return matchedProfile.name;
  }

  return fallbackName.trim() || `Policy #${payrollPolicyId}`;
}

function getPayrollPolicyHelperText({
  payrollPolicyProfiles,
  payrollPolicyProfilesErrorMessage,
  payrollPolicyId,
  selectedPayrollPolicyName,
  suggestedPayrollPolicyId,
  hasManualPayrollPolicyOverride,
}: {
  payrollPolicyProfiles: PayrollPolicyProfileRecord[];
  payrollPolicyProfilesErrorMessage: string | null;
  payrollPolicyId: string;
  selectedPayrollPolicyName?: string;
  suggestedPayrollPolicyId: string;
  hasManualPayrollPolicyOverride: boolean;
}) {
  if (payrollPolicyProfilesErrorMessage) {
    return `${payrollPolicyProfilesErrorMessage} Payroll policy profiles could not be loaded.`;
  }

  if (payrollPolicyProfiles.length === 0) {
    return "No payroll policy profiles are currently available from the backend.";
  }

  if (!payrollPolicyId) {
    return "Choose the payroll computation policy that should apply to this employee.";
  }

  if (!hasManualPayrollPolicyOverride && payrollPolicyId === suggestedPayrollPolicyId) {
    return "This profile is the current default suggestion for the selected work arrangement type.";
  }

  return `Manual override active: ${selectedPayrollPolicyName ?? "selected payroll policy profile"}.`;
}

function normalizeRoleValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.trim().toLowerCase();
}

function resolveManagerLabel(
  managerId: string,
  fallbackName: string,
  activeEmployeeOptions: EmployeeManagerOption[],
) {
  if (!managerId) {
    return "Not set";
  }

  const selectedManager = activeEmployeeOptions.find(
    (option) => option.value === managerId,
  );

  if (selectedManager) {
    return selectedManager.label;
  }

  return fallbackName.trim() || `Employee #${managerId}`;
}

function generateTemporaryPassword(length = 12) {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const randomValues = new Uint32Array(length);
  globalThis.crypto.getRandomValues(randomValues);

  return Array.from(randomValues, (value) => alphabet[value % alphabet.length]).join(
    "",
  );
}

function formatTinValue(value: string) {
  return formatDigitGroups(value, [3, 3, 3, 3]);
}

function formatContactNumberValue(value: string) {
  return formatDigitGroups(value, [4, 3, 4]);
}

function formatSssNumberValue(value: string) {
  return formatDigitGroups(value, [2, 7, 1]);
}

function formatPhilHealthNumberValue(value: string) {
  return formatDigitGroups(value, [2, 9, 1]);
}

function formatPagIbigNumberValue(value: string) {
  return formatDigitGroups(value, [4, 4, 4]);
}

function formatDigitGroups(value: string, groups: number[]) {
  const digitsOnly = value.replace(/\D/g, "");
  let currentIndex = 0;
  const parts: string[] = [];

  for (const groupLength of groups) {
    if (currentIndex >= digitsOnly.length) {
      break;
    }

    parts.push(digitsOnly.slice(currentIndex, currentIndex + groupLength));
    currentIndex += groupLength;
  }

  return parts.join("-");
}
