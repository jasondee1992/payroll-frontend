"use client";

import Link from "next/link";
import { useState } from "react";
import { EmployeeFormSection } from "@/components/employees/employee-form-section";
import {
  EmployeeInputField,
  EmployeeSelectField,
} from "@/components/employees/employee-form-field";
import { cn } from "@/lib/utils";

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

const taxStatusOptions = [
  "Select tax status",
  "Single",
  "Married",
  "Head of Family",
];

const rateTypeOptions = ["Select rate type", "Monthly", "Daily", "Hourly"];

const suffixOptions = ["None", "Jr.", "Sr.", "II", "III", "IV"];

export function EmployeeForm() {
  const [createAccount, setCreateAccount] = useState(true);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <form className="space-y-6">
        <EmployeeFormSection
          title="Basic Information"
          description="Capture the core employee identity and employment dates used throughout payroll processing."
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <EmployeeInputField
              id="employee-id"
              label="Employee ID"
              placeholder="EMP-1082"
              required
            />
            <EmployeeInputField
              id="first-name"
              label="First Name"
              placeholder="First name"
              required
            />
            <EmployeeInputField
              id="middle-name"
              label="Middle Name"
              placeholder="Middle name"
            />
            <EmployeeInputField
              id="last-name"
              label="Last Name"
              placeholder="Last name"
              required
            />
            <EmployeeSelectField
              id="suffix"
              label="Suffix"
              options={suffixOptions}
              defaultValue="None"
            />
            <EmployeeInputField
              id="birth-date"
              label="Birth Date"
              type="date"
              required
            />
            <EmployeeInputField
              id="hire-date"
              label="Hire Date"
              type="date"
              required
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
              defaultValue="Select department"
              required
            />
            <EmployeeInputField
              id="position"
              label="Position"
              placeholder="Payroll Analyst"
              required
            />
            <EmployeeSelectField
              id="employment-type"
              label="Employment Type"
              options={employmentTypeOptions}
              defaultValue="Select employment type"
              required
            />
            <EmployeeSelectField
              id="employment-status"
              label="Employment Status"
              options={employmentStatusOptions}
              defaultValue="Select status"
              required
            />
            <EmployeeSelectField
              id="payroll-schedule"
              label="Payroll Schedule"
              options={payrollScheduleOptions}
              defaultValue="Select payroll schedule"
              required
            />
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
              required
            />
            <EmployeeInputField
              id="sss"
              label="SSS Number"
              placeholder="00-0000000-0"
              required
            />
            <EmployeeInputField
              id="philhealth"
              label="PhilHealth Number"
              placeholder="00-000000000-0"
              required
            />
            <EmployeeInputField
              id="pagibig"
              label="Pag-IBIG Number"
              placeholder="0000-0000-0000"
              required
            />
            <EmployeeSelectField
              id="tax-status"
              label="Tax Status"
              options={taxStatusOptions}
              defaultValue="Select tax status"
              required
            />
          </div>
        </EmployeeFormSection>

        <EmployeeFormSection
          title="Salary Information"
          description="Set the employee's compensation base and recurring allowance values for payroll preparation."
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <EmployeeInputField
              id="basic-salary"
              label="Basic Salary"
              type="number"
              placeholder="35000"
              prefix="PHP"
              required
            />
            <EmployeeSelectField
              id="rate-type"
              label="Rate Type"
              options={rateTypeOptions}
              defaultValue="Select rate type"
              required
            />
            <EmployeeInputField
              id="allowance"
              label="Allowance"
              type="number"
              placeholder="2500"
              prefix="PHP"
              helperText="Optional recurring allowance amount."
            />
          </div>
        </EmployeeFormSection>

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

            <div className="grid gap-5 md:grid-cols-2">
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
            </div>
          </div>
        </EmployeeFormSection>

        <div className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <p className="text-sm leading-6 text-slate-600">
            Required fields are marked with an asterisk. Submission is not wired
            yet in this frontend foundation.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/employees"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/15 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              Save Employee
            </button>
          </div>
        </div>
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
              Account access can be made conditional without changing the rest
              of the form structure.
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
            <ChecklistItem label="Government and tax information" />
            <ChecklistItem label="Salary and allowance values" />
            <ChecklistItem label="Optional account access" />
          </div>
        </section>
      </aside>
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
