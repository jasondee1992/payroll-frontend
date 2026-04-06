export type DocsCard = {
  title: string;
  description: string;
  bullets?: string[];
};

export type DocsStep = {
  title: string;
  description: string;
};

export type DocsTable = {
  columns: string[];
  rows: Array<{
    label: string;
    values: string[];
  }>;
};

export type DocsFaqItem = {
  question: string;
  answer: string;
};

export type DocsSection = {
  id: string;
  title: string;
  eyebrow: string;
  summary: string;
  paragraphs?: string[];
  cards?: DocsCard[];
  steps?: DocsStep[];
  table?: DocsTable;
  faqs?: DocsFaqItem[];
  note?: string;
};

export const payrollDocsHighlights = [
  {
    label: "Audience",
    value: "HR, Payroll Admin, Finance, Managers, Employees, and System Admins",
  },
  {
    label: "Primary Scope",
    value:
      "Employee setup, attendance review, payroll computation, statutory and loan deductions, payslips, and reporting",
  },
  {
    label: "Computation Basis",
    value:
      "Payroll behavior is driven by policy rules, not by work arrangement labels alone",
  },
];

export const payrollDocsSections: DocsSection[] = [
  {
    id: "overview",
    title: "Overview",
    eyebrow: "Platform Summary",
    summary:
      "This payroll system is an internal operations platform for managing employee records, attendance inputs, payroll computation, statutory deductions, and payroll release workflows from one controlled workspace.",
    paragraphs: [
      "The main purpose of the platform is to keep payroll data consistent from employee onboarding through final payslip generation. It connects employee profile setup, attendance review, leave and overtime decisions, deduction configuration, and payroll results into a single operational flow.",
      "The system is intended for multiple internal users. HR maintains employee records and employment status, payroll administrators and finance teams manage cutoffs and payroll runs, managers review attendance or time-related requests, employees view their own attendance and payslips, and system administrators maintain user access and configuration boundaries.",
    ],
    cards: [
      {
        title: "Operational Record Source",
        description:
          "Employee master data, salary profiles, government identifiers, work arrangement type, and payroll policy assignment are stored as structured records so payroll can compute from controlled inputs instead of ad hoc manual spreadsheets.",
      },
      {
        title: "Policy-Driven Payroll",
        description:
          "Attendance behavior, overtime handling, leave treatment, and absence logic can vary per employee through payroll policy profiles. This avoids hard-coding payroll behavior to a single schedule label.",
      },
      {
        title: "Role-Aware Usage",
        description:
          "Different user groups interact with different modules. Finance may run payroll, HR may maintain employees, managers may approve requests, and employees may only access personal records such as attendance review and payslips.",
      },
    ],
  },
  {
    id: "core-modules",
    title: "Core Modules",
    eyebrow: "Functional Coverage",
    summary:
      "The payroll workspace is organized into operational modules that capture data, route approvals, and support payroll calculation and release.",
    cards: [
      {
        title: "Authentication / Login",
        description:
          "Handles sign-in, session cookies, password change enforcement, and role-aware route access for protected areas of the application.",
      },
      {
        title: "Dashboard",
        description:
          "Provides the landing workspace for authenticated users and acts as the starting point for daily payroll, attendance, and employee administration tasks.",
      },
      {
        title: "Employee Management",
        description:
          "Stores employee identity, employment details, reporting hierarchy, payroll schedule, work arrangement type, salary profile, and government information.",
      },
      {
        title: "Attendance Management",
        description:
          "Receives imported attendance logs, groups data by cutoff, identifies missing logs or exceptions, and creates reviewable attendance summaries.",
      },
      {
        title: "Time In / Time Out Monitoring",
        description:
          "Tracks daily log entries, missing time in or out scenarios, late arrivals, undertime, and absence indicators used during payroll preparation.",
      },
      {
        title: "Leave Management",
        description:
          "Supports leave requests, approval status handling, leave categorization, and payroll effects for paid, unpaid, sick, or other leave types.",
      },
      {
        title: "Overtime Management",
        description:
          "Handles overtime requests, approval state, and payroll usage when the assigned payroll policy allows overtime and requires approval.",
      },
      {
        title: "Shift / Schedule Management",
        description:
          "Captures work arrangement type, work days, and optional shift start and end times that may be referenced by policy-driven payroll logic.",
      },
      {
        title: "Payroll Period / Cutoff Management",
        description:
          "Defines attendance cutoffs and payroll periods that control which attendance and request records belong to a given payroll run.",
      },
      {
        title: "Payroll Processing",
        description:
          "Combines employee salary data, attendance summaries, leave, overtime, adjustments, and deduction rules to produce payroll records.",
      },
      {
        title: "Payslip Generation",
        description:
          "Creates employee-facing payroll result records for released payroll batches and keeps them linked to the corresponding employee and cutoff.",
      },
      {
        title: "Government Deductions",
        description:
          "Calculates SSS, PhilHealth, Pag-IBIG, and withholding tax using configured rule sets, brackets, and current payroll basis amounts.",
      },
      {
        title: "Allowances and Adjustments",
        description:
          "Supports recurring salary allowances and payroll record adjustments that affect gross pay, deductions, or employer obligations.",
      },
      {
        title: "Reports",
        description:
          "Supports payroll summaries, history views, cutoff-level output, and other operational reporting for finance, HR, and audit review.",
      },
      {
        title: "User Management / Roles / Permissions",
        description:
          "Controls who can view dashboards, manage employees, upload attendance, process payroll, access payslips, or maintain settings.",
      },
      {
        title: "Audit / Logs",
        description:
          "If enabled in the current environment, this area captures review actions, payroll events, and traceability for controlled operational changes.",
      },
      {
        title: "Settings / Payroll Policies / Work Arrangement Types",
        description:
          "Holds configurable system behavior such as payroll policy profiles, deduction rule sets, and the work arrangement classifications used during employee setup.",
      },
    ],
  },
  {
    id: "employee-management",
    title: "Employee Management Process",
    eyebrow: "Setup Workflow",
    summary:
      "Employee records must be complete and consistent before payroll can run accurately. The employee module acts as the operational source for identity, employment, and payroll assignment.",
    steps: [
      {
        title: "Create the employee master record",
        description:
          "Add employee code, name, contact details, employment status, department, position, hire date, and reporting manager.",
      },
      {
        title: "Capture payroll-related information",
        description:
          "Assign payroll schedule, salary rate type, basic salary, recurring allowances, government numbers, and tax status.",
      },
      {
        title: "Assign work arrangement type",
        description:
          "Select the employee's current work arrangement classification such as fixed, flexible, output-based, or no time tracking.",
      },
      {
        title: "Assign payroll policy",
        description:
          "Confirm the suggested payroll policy profile or override it when a different computation behavior is required for that employee.",
      },
      {
        title: "Link schedule or shift details",
        description:
          "If applicable, capture shift start and end times and working days so attendance-based policies can evaluate schedule-dependent behavior.",
      },
      {
        title: "Manage active and inactive employees",
        description:
          "Inactive employees remain part of historical payroll records but should no longer be treated as active payroll candidates for future runs.",
      },
    ],
    cards: [
      {
        title: "Salary Type and Rate Assignment",
        description:
          "Monthly, daily, or hourly rate types influence how basic pay and derived rates are prepared for payroll computation.",
      },
      {
        title: "Policy Override Support",
        description:
          "The system can suggest a default payroll policy from work arrangement type, but payroll behavior remains editable at the employee level through explicit payroll policy assignment.",
      },
    ],
    note:
      "Employee setup is not complete until employment status, salary profile, work arrangement type, and payroll policy assignment are aligned with how the employee should actually be computed.",
  },
  {
    id: "attendance-process",
    title: "Attendance Process",
    eyebrow: "Daily Time Records",
    summary:
      "Attendance processing turns imported time logs into cutoff-based summaries that payroll can consume, while still allowing employees and managers to review exceptions before payroll is finalized.",
    paragraphs: [
      "Attendance logs may come from imported files or another upstream source. Once assigned to a cutoff, the system groups records by employee and identifies missing logs, late minutes, undertime minutes, absences, and unusual records that need review.",
      "When an employee finds an issue such as missing time out, incorrect lateness, or an absence that should be excused, the platform can route an attendance correction or review request for manager evaluation before payroll is locked.",
      "Attendance processing should be read as an operational review layer, not an automatic deduction layer. Raw attendance data is collected first, but the employee's effective payroll policy decides which attendance outcomes become payable, deductible, review-only, or fully ignored during payroll computation.",
    ],
    steps: [
      {
        title: "Load attendance logs into a cutoff",
        description:
          "Imported logs are attached to a defined cutoff window and grouped into employee summaries.",
      },
      {
        title: "Detect attendance exceptions",
        description:
          "The system identifies missing time in or out, late arrival, undertime, absences, and incomplete daily logs.",
      },
      {
        title: "Review and correct exceptions",
        description:
          "Employees can acknowledge their summary and file requests for corrections or clarifications where permitted.",
      },
      {
        title: "Approve or reject corrections",
        description:
          "Managers or authorized reviewers resolve attendance requests before the cutoff is locked for payroll.",
      },
      {
        title: "Lock the cutoff",
        description:
          "Once review is complete or the review window has closed, the cutoff becomes ready for payroll computation.",
      },
    ],
    cards: [
      {
        title: "Late",
        description:
          "Late minutes are tracked from attendance data and may or may not produce deductions depending on the assigned payroll policy.",
        bullets: [
          "A late log can still be recorded even if the employee is later exempted from late deductions by policy.",
          "Late deductions usually depend on minute-based salary conversion and the employee's effective payroll rules.",
        ],
      },
      {
        title: "Undertime",
        description:
          "Undertime captures work time shortfalls and is only deducted when the employee's payroll policy enables undertime deduction.",
        bullets: [
          "Undertime may be ignored for flexible or policy-exempt employees even if it remains visible in attendance review.",
          "Shift-aware policies can use expected daily work hours or shift windows when evaluating undertime.",
        ],
      },
      {
        title: "Absences and Missing Logs",
        description:
          "Absence behavior can differ by policy. Some policies treat no-log situations as absent, while others ignore attendance altogether.",
        bullets: [
          "If auto_absent_if_no_log is enabled, missing daily logs can convert to payable absence counts.",
          "If attendance is not required, the payroll run can still keep the attendance record for reference without using it for deductions.",
        ],
      },
    ],
  },
  {
    id: "leave-process",
    title: "Leave Process",
    eyebrow: "Leave Handling",
    summary:
      "Leave records affect payroll when the applicable payroll policy instructs the system to consider approved leave or approved sick leave during computation.",
    paragraphs: [
      "Leave should be treated as an approval-driven payroll input. Filing a leave request does not affect payroll by itself. The request must first become approved, then overlap the payroll cutoff, and finally be allowed by the employee's effective payroll policy before it can change payroll output.",
      "This distinction matters for employees on special arrangements. A worker may submit leave, but if the policy does not check leave records for that employee, the leave will remain part of operational history without changing payroll computation for that run.",
    ],
    steps: [
      {
        title: "Employee files a leave request",
        description:
          "The request captures leave type, date coverage, and supporting details such as reason or medical documents when required.",
      },
      {
        title: "Leave goes through approval",
        description:
          "Managers or authorized approvers decide whether the request becomes approved, returned, declined, or stays pending.",
      },
      {
        title: "Approved leave is mapped to the payroll cutoff",
        description:
          "Only leave that overlaps the active cutoff contributes to the payroll run for that period.",
      },
      {
        title: "Payroll applies leave rules",
        description:
          "Depending on policy, payroll may use approved leave records, approved sick leave records, both, or neither when resolving absences and leave pay.",
      },
    ],
    cards: [
      {
        title: "Vacation Leave",
        description:
          "Approved vacation leave typically offsets eligible unpaid absence impact when the policy checks leave records.",
        bullets: [
          "Used when approved leave days should count toward payroll credit instead of full absence deduction.",
          "Most useful for attendance-based employees whose payroll requires leave validation before protecting pay.",
        ],
      },
      {
        title: "Sick Leave",
        description:
          "Approved sick leave can be handled separately from other leave types if the payroll policy has a dedicated sick leave rule enabled.",
        bullets: [
          "This allows sick leave to be included even when general leave treatment is different.",
          "Medical or approval requirements remain part of the operational approval process before payroll sees the record.",
        ],
      },
      {
        title: "Unpaid Leave",
        description:
          "Unpaid leave may appear in request history but does not automatically create paid leave credit for payroll.",
        bullets: [
          "The record can still explain why a schedule gap exists without creating paid leave earnings.",
          "Unpaid leave generally protects auditability, not compensation.",
        ],
      },
      {
        title: "Leave Balances",
        description:
          "If leave balances are managed elsewhere or later extended in the platform, approved leave still needs to align with payroll rules before it changes pay impact.",
        bullets: [
          "Balance availability and payroll eligibility are related but not identical controls.",
          "A valid leave balance does not bypass payroll policy checks.",
        ],
      },
    ],
    note:
      "Leave affects payroll only when approved records are available and the employee's effective payroll policy is configured to check them.",
  },
  {
    id: "overtime-process",
    title: "Overtime Process",
    eyebrow: "Extended Work Time",
    summary:
      "Overtime is not automatically a payroll earning for every employee. It must first be allowed by policy, then evaluated according to approval requirements and cutoff timing.",
    paragraphs: [
      "Overtime handling should be read together with attendance policy. Some organizations capture overtime requests for operational visibility even when payroll policy says overtime is not payable for a given employee group.",
      "Where require_approved_overtime is enabled, the approval trail is part of the payroll control model. Extra hours suggested by attendance logs alone are not enough to generate overtime pay unless the approved request exists and falls within the relevant cutoff.",
    ],
    steps: [
      {
        title: "Employee submits an overtime request",
        description:
          "The request states the date, start and end time, and business justification for the extra work.",
      },
      {
        title: "Approver evaluates the request",
        description:
          "Managers or designated reviewers approve, return, or decline the overtime request.",
      },
      {
        title: "Approved overtime is attached to the cutoff",
        description:
          "Only overtime that falls within the selected cutoff and satisfies the effective policy is eligible for payroll use.",
      },
      {
        title: "Payroll applies overtime policy checks",
        description:
          "If overtime is disabled, payroll ignores overtime minutes. If approval is required, only approved overtime contributes to pay.",
      },
    ],
    cards: [
      {
        title: "Approved vs Unapproved Overtime",
        description:
          "A policy may require approved overtime before any overtime pay is recognized, even if raw attendance suggests extra time was worked.",
        bullets: [
          "This protects payroll from treating every late logout as payable overtime.",
          "It also creates a clearer audit trail for managers and finance reviewers.",
        ],
      },
      {
        title: "Policy-Disabled Overtime",
        description:
          "Some employees, such as output-based or no-tracking workers, may have overtime fully disabled by their payroll policy profile.",
        bullets: [
          "Requests can still exist for workflow visibility without affecting pay.",
          "This is common for output-based, field, or exempt employee groups.",
        ],
      },
      {
        title: "Payroll Effect",
        description:
          "When overtime is allowed, payroll converts eligible overtime minutes into earnings using configured rates and payroll context.",
        bullets: [
          "The earning is added after policy validation, not directly from the request alone.",
          "Approved overtime is tied to the same cutoff used by the payroll batch for consistent period accounting.",
        ],
      },
    ],
  },
  {
    id: "schedule-shift-process",
    title: "Schedule / Shift Process",
    eyebrow: "Work Arrangement Types",
    summary:
      "Work arrangement type classifies how an employee works, but it does not directly control all payroll logic by itself. It primarily helps suggest the default payroll policy and determine whether shift-based behavior is relevant.",
    cards: [
      {
        title: "Fixed Schedule",
        description:
          "Best suited for employees with a stable workday and expected shift boundaries. Often paired with attendance-based payroll and schedule-aware lateness or undertime checks.",
      },
      {
        title: "Flexible Schedule",
        description:
          "Used when start and end times are less rigid. Payroll may still require attendance while ignoring some late or undertime behavior.",
      },
      {
        title: "Output-Based Schedule",
        description:
          "Focuses on deliverables rather than daily time logs. Payroll often ignores attendance deductions and may disable overtime entirely.",
      },
      {
        title: "Shift-Based Schedule",
        description:
          "Suitable for operational teams that follow assigned shifts. Payroll can use shift schedules and hour requirements when the policy enables them.",
      },
      {
        title: "Rotational Shift",
        description:
          "Used where assigned shifts change over time. Payroll can still remain attendance-based while referencing schedule logic through policy.",
      },
      {
        title: "Compressed Workweek",
        description:
          "Supports longer workdays across fewer days. Policies may tolerate normal undertime differently while still tracking attendance and absences.",
      },
      {
        title: "Field Work Arrangement",
        description:
          "Useful when employees work away from a fixed office or standard log source. Payroll may rely less on strict attendance events and more on approved records.",
      },
      {
        title: "No Time Tracking",
        description:
          "Used for employees whose payroll should not depend on attendance logs. Policies typically disable late, undertime, absence, and overtime handling.",
      },
    ],
    note:
      "Work arrangement type is a classification layer. The effective payroll policy profile is the actual rule layer that decides what payroll will compute or ignore.",
  },
  {
    id: "payroll-policy-logic",
    title: "Payroll Policy Logic",
    eyebrow: "Computation Control Layer",
    summary:
      "Payroll policy profiles define the effective behavior used during payroll computation. This keeps payroll logic configurable and prevents the system from relying only on schedule labels or implicit assumptions.",
    paragraphs: [
      "A work arrangement type can suggest a default payroll policy profile, but employees can still be explicitly assigned a different payroll policy when needed. This supports exceptions such as employees on flexible schedules who should still ignore undertime, or field employees whose payroll should only check approved leave records.",
      "During payroll preparation, the system resolves the employee's effective payroll rules from the assigned payroll policy profile. Those rules then control whether payroll requires attendance, applies lateness deductions, allows overtime, uses approved leave, or treats missing logs as absences.",
      "This separation between classification and computation is one of the most important design rules in the platform. Two employees may both be tagged as Flexible Schedule, yet one may still be attendance-based while the other ignores late and undertime because their payroll policy profiles are different.",
    ],
    cards: [
      {
        title: "Default Suggestion vs Employee Override",
        description:
          "Work arrangement type can suggest a default payroll policy profile, but payroll should always compute from the employee's resolved effective policy rather than from the label alone.",
        bullets: [
          "Default mapping keeps employee setup consistent.",
          "Override support handles real operational exceptions without changing the classification itself.",
        ],
      },
      {
        title: "What the effective rule source means",
        description:
          "The effective rule source explains whether payroll is using an employee-specific assignment, a work-arrangement default, or a fallback default policy.",
        bullets: [
          "Employee override means the payroll policy was assigned directly to the employee.",
          "Work-arrangement default means the employee inherits the suggested policy for that classification.",
        ],
      },
      {
        title: "Practical example",
        description:
          "A field employee may still submit leave requests, but if attendance is disabled and overtime is disallowed, payroll will ignore daily time logs and overtime while still checking approved leave if that rule is enabled.",
      },
    ],
    table: {
      columns: ["Rule", "Meaning in payroll"],
      rows: [
        {
          label: "requires_attendance",
          values: [
            "Determines whether attendance data is required for payroll evaluation.",
          ],
        },
        {
          label: "deduct_late",
          values: ["Controls whether late minutes reduce pay."],
        },
        {
          label: "deduct_undertime",
          values: ["Controls whether undertime minutes reduce pay."],
        },
        {
          label: "deduct_absence",
          values: ["Determines whether absence counts create salary deductions."],
        },
        {
          label: "allow_overtime",
          values: ["Enables or disables overtime as a payable earning."],
        },
        {
          label: "require_approved_overtime",
          values: [
            "Requires approved overtime requests before overtime can be counted.",
          ],
        },
        {
          label: "check_leave_records",
          values: ["Allows approved leave records to affect payroll outcomes."],
        },
        {
          label: "check_sick_leave_records",
          values: [
            "Allows approved sick leave records to be evaluated separately in payroll.",
          ],
        },
        {
          label: "auto_absent_if_no_log",
          values: ["Treats no-log situations as absences when enabled."],
        },
        {
          label: "use_shift_schedule",
          values: [
            "Uses assigned shift schedule context when evaluating attendance-based behavior.",
          ],
        },
        {
          label: "use_daily_hour_requirement",
          values: [
            "Uses expected daily hour requirements when attendance-based computation needs them.",
          ],
        },
      ],
    },
  },
  {
    id: "payroll-computation",
    title: "Payroll Computation Process",
    eyebrow: "Run Sequence",
    summary:
      "Payroll computation is a staged workflow that starts from a selected cutoff and ends with reviewed payroll results and payslips.",
    paragraphs: [
      "Payroll computation is not a single formula call. It is a controlled sequence that validates whether each employee has eligible salary context, relevant attendance or request records, and an effective payroll policy that explains how their data should be treated.",
      "In practice, the same cutoff may produce very different payroll outcomes for different employees because the system applies policy rules before calculating late deductions, undertime, leave pay, overtime pay, and absence handling.",
    ],
    steps: [
      {
        title: "Select the payroll cutoff or attendance window",
        description:
          "The payroll batch is tied to a cutoff so all attendance, request, and payroll records are aligned to the same operational period.",
      },
      {
        title: "Load eligible employees",
        description:
          "The system evaluates employees with relevant salary profiles and operational records for that cutoff.",
      },
      {
        title: "Gather attendance data",
        description:
          "Attendance summaries, daily records, and exception states are loaded for each employee when attendance is part of the effective policy.",
      },
      {
        title: "Gather approved leave and sick leave",
        description:
          "Approved leave records that overlap the cutoff are collected so payroll can credit or offset absences where policy permits.",
      },
      {
        title: "Gather approved overtime",
        description:
          "Approved overtime requests are evaluated if the policy allows overtime and requires approval.",
      },
      {
        title: "Resolve effective payroll policy rules",
        description:
          "The employee's payroll policy profile determines which attendance and request inputs matter for that payroll run.",
      },
      {
        title: "Compute gross pay",
        description:
          "Basic pay, leave pay, allowances, overtime, and other earnings are combined according to salary profile and policy-driven behavior.",
      },
      {
        title: "Compute payroll deductions",
        description:
          "Late, undertime, absence, and other payroll deductions are applied only when enabled by the effective rules.",
      },
      {
        title: "Compute government contributions",
        description:
          "SSS, PhilHealth, Pag-IBIG, and withholding tax are calculated using the configured deduction rule set in effect.",
      },
      {
        title: "Compute net pay and generate payroll records",
        description:
          "The system produces payroll record results that capture gross pay, deductions, employer contributions, and review flags.",
      },
      {
        title: "Review, approve, and finalize payroll",
        description:
          "Authorized finance users review flagged records, recalculate if needed, approve the batch, and post payroll for release.",
      },
    ],
    cards: [
      {
        title: "Typical attendance-based run",
        description:
          "For a strict attendance employee, the payroll run may load lateness, undertime, approved leave, approved overtime, and missing-log absence treatment before computing gross and net pay.",
      },
      {
        title: "Typical no-tracking run",
        description:
          "For a no time tracking employee, the payroll run may skip attendance deductions entirely, ignore overtime, and compute mostly from salary profile plus any still-applicable policy-approved records.",
      },
      {
        title: "Why review flags matter",
        description:
          "Payroll records can still carry operational warnings such as missing attendance issues or unresolved requests so reviewers know where manual confirmation may still be needed before final posting.",
      },
    ],
  },
  {
    id: "example-work-arrangements",
    title: "Example Employee Payroll Behaviors by Work Arrangement Type",
    eyebrow: "Practical Examples",
    summary:
      "These examples show how work arrangement type can influence payroll behavior in practice. They are examples only. Actual payroll results still depend on the employee's effective payroll policy profile, salary setup, and approved records for the cutoff.",
    cards: [
      {
        title: "Fixed Schedule",
        description:
          "Typical use case: office-based employee with a standard shift, daily time logs, and attendance-based payroll.",
        bullets: [
          "Common behavior: attendance required, late and undertime deductible, approved overtime allowed.",
          "Example: a payroll analyst with an 08:30 to 17:30 schedule may be deducted for late arrival unless protected by approved leave or correction approval.",
        ],
      },
      {
        title: "Flexible Schedule",
        description:
          "Typical use case: employee whose output is time-sensitive but whose start and end time are not strictly fixed every day.",
        bullets: [
          "Common behavior: attendance may still be recorded, but late and undertime can be ignored if policy disables those deductions.",
          "Example: a senior HR officer may still appear in attendance review while payroll ignores minor lateness because the effective policy does not deduct late minutes.",
        ],
      },
      {
        title: "Output-Based Schedule",
        description:
          "Typical use case: employee measured mainly by deliverables instead of daily time logs.",
        bullets: [
          "Common behavior: attendance may be informational only, with overtime disabled and absences not automatically deducted from daily logs.",
          "Example: a project-based contributor may only have approved leave records considered in payroll, while time-in and time-out do not drive salary deductions.",
        ],
      },
      {
        title: "Shift-Based Schedule",
        description:
          "Typical use case: operations or support employee assigned to a defined shift pattern.",
        bullets: [
          "Common behavior: payroll can use shift windows and daily hour expectations when the policy enables them.",
          "Example: a support agent scheduled on a day shift may be evaluated for late and undertime against the assigned shift start and end time.",
        ],
      },
      {
        title: "Rotational Shift",
        description:
          "Typical use case: employee whose shift changes by roster, team rotation, or operating cycle.",
        bullets: [
          "Common behavior: attendance can remain payroll-relevant, but the applicable shift must match the day being evaluated.",
          "Example: a rotating operations employee may be late for one scheduled shift while being fully compliant on another, so schedule alignment matters before payroll review.",
        ],
      },
      {
        title: "Compressed Workweek",
        description:
          "Typical use case: employee works longer days across fewer workdays in a week.",
        bullets: [
          "Common behavior: payroll may still require attendance but treat undertime more carefully because the standard day is longer than a regular schedule.",
          "Example: if the employee's policy ignores routine undertime but still checks absences, missing a full scheduled day can matter more than leaving slightly early.",
        ],
      },
      {
        title: "Field Work Arrangement",
        description:
          "Typical use case: employee works off-site or spends significant time outside a fixed office log environment.",
        bullets: [
          "Common behavior: attendance can be less reliable as a direct payroll basis, while approved requests and policy rules become more important.",
          "Example: a field coordinator may not be deducted from incomplete daily logs if the effective policy disables attendance-based deductions but still checks approved leave.",
        ],
      },
      {
        title: "No Time Tracking",
        description:
          "Typical use case: employee whose compensation should not depend on daily attendance logs.",
        bullets: [
          "Common behavior: attendance, late, undertime, absence, and overtime can all be ignored for payroll purposes.",
          "Example: a retained consultant may still exist in the employee master record and payroll batch, but compensation is computed from salary terms rather than time logs.",
        ],
      },
    ],
    note:
      "These are documentation examples, not hard-coded rules. The actual payroll outcome depends on the employee's resolved payroll policy profile at runtime.",
  },
  {
    id: "example-attendance-interpretation",
    title: "Example Attendance Interpretation",
    eyebrow: "Operational Examples",
    summary:
      "Attendance interpretation happens before final payroll deduction logic. The examples below describe how records are commonly understood in review, while the effective payroll policy still decides whether they affect pay.",
    cards: [
      {
        title: "What counts as late",
        description:
          "Late generally means the recorded time in is later than the expected start time or shift start used for that employee on that day.",
        bullets: [
          "Example: expected start is 09:00, actual time in is 09:16, so the record is interpreted as 16 minutes late.",
          "If payroll policy disables late deduction, the lateness can remain visible in attendance review without reducing pay.",
        ],
      },
      {
        title: "What counts as undertime",
        description:
          "Undertime generally means the employee stopped working earlier than the expected end time or failed to complete required daily hours.",
        bullets: [
          "Example: expected end is 18:00, actual time out is 17:25, so the record may be interpreted as 35 minutes undertime.",
          "For flexible or compressed-workweek employees, undertime handling may differ depending on the effective payroll policy.",
        ],
      },
      {
        title: "What counts as absence",
        description:
          "Absence usually means a scheduled workday has no valid attendance presence and is not protected by approved leave or an accepted correction outcome.",
        bullets: [
          "Example: an employee has no approved leave and no valid attendance log for a scheduled workday, so the day may count as absent.",
          "A no time tracking or output-based policy can prevent the same record from becoming a deductible payroll absence.",
        ],
      },
      {
        title: "How missing logs may be handled",
        description:
          "Missing logs do not always become automatic deductions. They can remain a review issue, convert to an attendance exception request, or be treated as absence depending on policy and review outcome.",
        bullets: [
          "Example: missing time out can trigger an attendance correction request rather than an immediate payroll deduction.",
          "If auto_absent_if_no_log is enabled, repeated missing logs may convert into deductible absences once the cutoff is finalized.",
        ],
      },
    ],
    note:
      "These examples describe interpretation logic, not guaranteed deduction outcomes. Payroll deductions still depend on the resolved payroll policy and any approved review or request records.",
  },
  {
    id: "example-payroll-scenarios",
    title: "Example Payroll Computation Scenarios",
    eyebrow: "Scenario Samples",
    summary:
      "The scenarios below illustrate how different employees in the same payroll run can compute differently. They are sample documentation cases meant to explain behavior, not exact numeric formulas from every deployment.",
    cards: [
      {
        title: "Attendance-based employee",
        description:
          "Example profile: fixed schedule employee with requires_attendance, deduct_late, deduct_undertime, deduct_absence, and allow_overtime enabled.",
        bullets: [
          "Payroll loads attendance summaries, approved leave, and approved overtime for the cutoff.",
          "Late and undertime can reduce pay, absences can create deductions, and approved overtime can create earnings.",
          "Typical result: payroll outcome strongly reflects daily attendance compliance.",
        ],
      },
      {
        title: "Flexible employee with no late deduction",
        description:
          "Example profile: flexible schedule employee whose policy still requires attendance but disables deduct_late and deduct_undertime.",
        bullets: [
          "Payroll still reads attendance and may still check absences or approved leave.",
          "Late arrival can remain visible in review, but payroll does not reduce pay for late minutes.",
          "Typical result: attendance matters for presence and leave context, not for minute-level late penalties.",
        ],
      },
      {
        title: "Leave-based-only employee",
        description:
          "Example profile: employee whose payroll policy ignores attendance deductions but still checks approved leave and approved sick leave records.",
        bullets: [
          "Payroll gives more weight to approved request records than to raw time logs.",
          "Absence-like schedule gaps may only matter when approved leave is missing and the policy still uses leave as a protected record source.",
          "Typical result: the payroll review focuses on request approvals rather than late or undertime metrics.",
        ],
      },
      {
        title: "No time tracking employee",
        description:
          "Example profile: employee with no time tracking policy where attendance, overtime, and no-log absence behavior are disabled.",
        bullets: [
          "Payroll primarily uses salary profile, recurring amounts, and still-applicable configured rules such as deduction settings that do not depend on attendance.",
          "Time logs can exist operationally, but they do not control late, undertime, or absence deductions for payroll.",
          "Typical result: pay is stable across the cutoff unless another approved or configured input changes it.",
        ],
      },
    ],
    note:
      "Scenario outcomes depend on actual salary setup, pay frequency, deductions, allowances, and the employee's effective payroll policy profile for that cutoff.",
  },
  {
    id: "example-cutoff-lifecycle",
    title: "Example Payroll Processing Lifecycle per Cutoff",
    eyebrow: "Cutoff Lifecycle",
    summary:
      "This sample cutoff lifecycle shows how payroll usually moves from preparation to release. Actual approval depth or review roles may vary by deployment, but the overall operational pattern remains similar.",
    steps: [
      {
        title: "Setup",
        description:
          "Define the payroll cutoff or attendance window, verify the covered dates, and confirm which employees and salary profiles are expected to participate.",
      },
      {
        title: "Collect data",
        description:
          "Import or load attendance logs, gather approved leave records, gather approved overtime records, and make sure employee master data is current.",
      },
      {
        title: "Validate records",
        description:
          "Check missing logs, unresolved requests, inactive employees, incomplete salary setup, and other issues that could distort payroll output.",
      },
      {
        title: "Compute",
        description:
          "Run payroll for the cutoff so the system applies salary context, effective payroll policy rules, attendance results, request records, and government deduction settings.",
      },
      {
        title: "Review",
        description:
          "Examine flagged payroll records, recalculate where needed, and confirm that overrides, requests, and policy-driven behavior are intentional and supportable.",
      },
      {
        title: "Finalize",
        description:
          "Approve and post the payroll batch once finance or payroll reviewers are satisfied with the results and all key exceptions have been resolved or accepted.",
      },
      {
        title: "Generate payslips",
        description:
          "Release employee-facing payroll outputs for the cutoff and preserve payroll history for later review, reconciliation, and operational reporting.",
      },
    ],
    note:
      "If a deployment adds extra approval stages, audit signoff, export workflows, or notifications, those should be treated as implementation-specific extensions of this core lifecycle.",
  },
  {
    id: "government-deductions",
    title: "Government Deductions",
    eyebrow: "Statutory Contributions",
    summary:
      "Government deductions are computed from configured deduction rules and bracket logic rather than from fixed hard-coded values. This allows the system to adapt when contribution policies or tax tables change.",
    cards: [
      {
        title: "SSS",
        description:
          "Social Security System deductions may depend on salary brackets, employee share, employer share, and employer EC rules defined in the active deduction settings.",
      },
      {
        title: "PhilHealth",
        description:
          "PhilHealth can be computed using configured rates, floors, ceilings, and employee-employer share ratios depending on the active rule set.",
      },
      {
        title: "Pag-IBIG",
        description:
          "Pag-IBIG calculations may use thresholds, contribution caps, and rate settings that vary by pay frequency and active government deduction configuration.",
      },
      {
        title: "Withholding Tax",
        description:
          "Withholding tax can be calculated from taxable income using configured tax brackets and deduction set rules for the active period.",
      },
    ],
    note:
      "Statutory deductions should be reviewed whenever government contribution rules, employer policy, or payroll settings change.",
  },
  {
    id: "government-loan-management",
    title: "Government Loan Management",
    eyebrow: "Employee Loan Deductions",
    summary:
      "Government loan management covers HR-maintained employee loan records that payroll can deduct and track during payroll processing. The system uses encoded employer deduction details rather than rebuilding external amortization formulas from scratch.",
    paragraphs: [
      "This area is intended for government-related employee loans such as SSS or PAG-IBIG loan deductions that are already communicated to the employer. The system stores the loan configuration maintained by HR, then payroll applies those stored values when the selected cutoff becomes eligible for deduction.",
      "The current implementation is designed around operational deduction tracking, not around re-deriving official loan computation formulas. HR encodes the deduction amount, start date, deduction schedule, term, and any tracked balance fields. Payroll then uses those encoded fields as the controlled source for loan deduction behavior.",
      "Finance and Admin-Finance can review employee loan records and deduction progress in read-only form through employee record views where access is available. HR remains the only role allowed to create, edit, activate, stop, cancel, or manually complete employee loan records.",
    ],
    steps: [
      {
        title: "Select the supported loan type",
        description:
          "Choose the applicable government loan type from the configured list, such as SSS Salary Loan, SSS Calamity Loan, SSS Emergency Loan, PAG-IBIG Personal Loan, PAG-IBIG Emergency Loan, PAG-IBIG Calamity Loan, or PAG-IBIG Housing Loan.",
      },
      {
        title: "Encode the employee loan setup",
        description:
          "HR records the provider, loan name, deduction start date, monthly deduction amount, term in months, deduction schedule, deduction mode, and optional tracked totals such as total loan amount or remaining balance.",
      },
      {
        title: "Maintain the active loan state",
        description:
          "Only HR should activate, stop, cancel, complete, or otherwise update the employee loan record. Finance and Admin-Finance should review the record but not edit it.",
      },
      {
        title: "Payroll checks cutoff eligibility",
        description:
          "During payroll calculation, the system loads only deductible employee loans and checks whether the cutoff qualifies based on the loan start date, deduction schedule, remaining terms, tracked balance, and loan status.",
      },
      {
        title: "Post and record the deduction history",
        description:
          "Loan progress is finalized when payroll is posted. At that point, the system records the deduction history row, updates paid installment counts, updates total deducted amounts, and reduces remaining terms or tracked balance where applicable.",
      },
      {
        title: "Stop deductions when the loan is no longer deductible",
        description:
          "Completed, stopped, and cancelled loans are ignored for future payroll runs. Loans also stop automatically when the tracked completion conditions are reached and auto-stop is enabled.",
      },
    ],
    cards: [
      {
        title: "Supported Government Loan Types",
        description:
          "The current default loan-type seed covers the most common government-related employee loan deductions presently configured in the system.",
        bullets: [
          "SSS Salary Loan",
          "SSS Calamity Loan",
          "SSS Emergency Loan",
          "PAG-IBIG Personal Loan",
          "PAG-IBIG Emergency Loan",
          "PAG-IBIG Calamity Loan",
          "PAG-IBIG Housing Loan",
        ],
      },
      {
        title: "Deduction Start Date and Schedules",
        description:
          "A loan is only considered once its start date is already within or before the payroll cutoff being processed. Schedule settings then control which cutoff should carry the deduction.",
        bullets: [
          "first_cutoff means payroll should deduct on the first-half cutoff only.",
          "second_cutoff means payroll should deduct on the second-half cutoff only.",
          "every_cutoff means payroll may deduct on both cutoffs, subject to mode and remaining loan state.",
        ],
      },
      {
        title: "Deduction Modes",
        description:
          "The system currently supports fixed amount and split amount deduction modes for employer-maintained payroll deductions.",
        bullets: [
          "fixed_amount means payroll deducts the configured amount on the selected eligible cutoff.",
          "split_amount is intended for every_cutoff scheduling and can split the monthly amount across both cutoffs when configured that way.",
          "Validation prevents split_amount from being paired with an unsupported schedule or an invalid per-cutoff amount.",
        ],
      },
      {
        title: "Loan Completion Logic",
        description:
          "A loan can complete automatically when there are no remaining installments left, when a tracked remaining balance reaches zero, or when total deducted amount reaches a tracked total loan amount.",
        bullets: [
          "Auto-completion applies only when auto-stop is enabled for that loan record.",
          "Completed loans no longer qualify for future payroll deductions.",
          "Stopped and cancelled loans are also excluded from payroll deduction planning.",
        ],
      },
    ],
    table: {
      columns: ["Topic", "Current behavior"],
      rows: [
        {
          label: "HR editing responsibility",
          values: [
            "Only HR can create, edit, activate, stop, cancel, or manually complete employee government loan records.",
          ],
        },
        {
          label: "Finance / Admin-Finance visibility",
          values: [
            "Finance and Admin-Finance can review employee loan records, statuses, progress, and deduction history in read-only form where the current employee record views are available to them.",
          ],
        },
        {
          label: "Employee visibility",
          values: [
            "Employee self-service loan visibility should be treated as limited or future-state unless a dedicated employee portal view is explicitly implemented in the active deployment.",
          ],
        },
        {
          label: "Loan status visibility",
          values: [
            "Loan records may appear as draft, scheduled, active, completed, stopped, or cancelled so reviewers can distinguish upcoming deductions from historical or inactive records.",
          ],
        },
        {
          label: "Deduction history",
          values: [
            "Posted payroll deductions create loan deduction history records that show deduction date, batch linkage, installment number, and deducted amount for audit and reconciliation.",
          ],
        },
        {
          label: "Duplicate deduction safeguards",
          values: [
            "The system guards against duplicate deductions by preventing the same employee loan from being finalized more than once for the same payroll cutoff and by failing posting when a stale or duplicate loan deduction is detected.",
          ],
        },
      ],
    },
    note:
      "Government loan management is currently implemented as an HR-maintained payroll deduction workflow. Any broader employee self-service loan module, finance-wide standalone loan reporting page, or deeper remittance workflow should be documented separately as a future enhancement unless it is already live in the active deployment.",
  },
  {
    id: "payslips-and-reports",
    title: "Payslips and Reports",
    eyebrow: "Output and Visibility",
    summary:
      "Once payroll results are approved and posted, the system can expose employee-facing payslips and operational payroll summaries for finance, HR, and management review.",
    cards: [
      {
        title: "Payroll Summary",
        description:
          "Payroll batches provide aggregated totals such as record count, gross pay, total deductions, net pay, and records requiring attention.",
      },
      {
        title: "Employee Payslips",
        description:
          "Posted payroll batches generate employee-linked payslip records for the covered cutoff period.",
      },
      {
        title: "Payroll History",
        description:
          "Employee detail and payroll modules can present historical payroll activity per employee and per cutoff.",
      },
      {
        title: "Cutoff-Based Reporting",
        description:
          "Operational reporting can be organized around payroll cutoffs, payroll periods, departments, or employee groups depending on current implementation scope.",
      },
      {
        title: "Exports and Downloads",
        description:
          "If export capabilities are enabled in the environment, payroll summaries and reports can be extended for finance handoff, reconciliation, or audit support.",
      },
    ],
  },
  {
    id: "roles-and-permissions",
    title: "Roles and Permissions",
    eyebrow: "Access Model",
    summary:
      "The payroll platform uses role-aware access so each user group only sees the areas required for its operational responsibility.",
    table: {
      columns: ["Role", "Typical responsibilities"],
      rows: [
        {
          label: "Admin",
          values: [
            "Broad administrative access, user oversight, configuration support, and operational control depending on deployment policy.",
          ],
        },
        {
          label: "HR",
          values: [
            "Employee records, attendance oversight, leave administration, reporting manager coordination, and selected settings.",
          ],
        },
        {
          label: "Payroll Admin / Admin-Finance",
          values: [
            "Payroll batch calculation, payroll approval, posting, deduction configuration, and final payroll release controls.",
          ],
        },
        {
          label: "Finance",
          values: [
            "Attendance cutoffs, payroll visibility, payroll review, payslip oversight, and finance-aligned operational reporting.",
          ],
        },
        {
          label: "Manager",
          values: [
            "Approval or review of attendance corrections, leave requests, overtime requests, and employee issues within their team when the workflow supports it.",
          ],
        },
        {
          label: "Employee",
          values: [
            "Personal attendance review, request submission, leave filing, and payslip access based on enabled self-service features.",
          ],
        },
      ],
    },
    note:
      "Actual permissions depend on the current frontend and backend implementation. Some roles may have broader or narrower access in a given deployment.",
  },
  {
    id: "end-to-end-flow",
    title: "End-to-End Payroll Flow",
    eyebrow: "Operational Sequence",
    summary:
      "The following flow describes the full payroll lifecycle from employee setup to payroll release.",
    steps: [
      {
        title: "Set up the employee",
        description:
          "Create the employee record, salary profile, government information, work arrangement type, and payroll policy assignment.",
      },
      {
        title: "Collect attendance and request data",
        description:
          "Load attendance logs and capture leave, overtime, and attendance correction requests during the active cutoff.",
      },
      {
        title: "Review exceptions and approvals",
        description:
          "Resolve attendance issues, missing logs, leave approvals, and overtime approvals before final payroll computation.",
      },
      {
        title: "Lock the cutoff and prepare payroll",
        description:
          "Once attendance review is complete or closed, the cutoff becomes ready for payroll processing.",
      },
      {
        title: "Compute payroll records",
        description:
          "The system applies salary context, effective payroll policy rules, approved requests, and deduction settings to each employee.",
      },
      {
        title: "Review flagged records",
        description:
          "Finance or payroll admins check records with unusual attendance, unresolved requests, or adjustments before posting.",
      },
      {
        title: "Approve and post payroll",
        description:
          "Authorized users approve the batch, post it, and generate final employee payslips.",
      },
      {
        title: "Distribute results and maintain history",
        description:
          "Employees access their payslips while finance and HR retain payroll history and reporting data for later review.",
      },
    ],
  },
  {
    id: "faq-notes",
    title: "FAQ / Notes / Important Rules",
    eyebrow: "Practical Guidance",
    summary:
      "These notes explain common payroll questions and why two employees on similar schedules may still compute differently.",
    faqs: [
      {
        question: "How does flexible schedule work in payroll?",
        answer:
          "Flexible schedule is only the classification layer. One flexible employee may still be attendance-based, while another may ignore late and undertime because the assigned payroll policy turns those deductions off. Always check the employee's payroll policy profile before assuming how flexible schedule behaves in payroll.",
      },
      {
        question: "When is attendance ignored?",
        answer:
          "Attendance is ignored when the effective payroll policy sets requires_attendance to false. In that situation, payroll can skip late, undertime, and absence deductions even if attendance logs still exist in the system for visibility, audit, or operational reporting.",
      },
      {
        question: "When does leave affect salary?",
        answer:
          "Leave affects salary only when three conditions align: the request is approved, the leave dates overlap the payroll cutoff, and the employee's effective payroll policy is configured to check leave records or sick leave records. Filing alone is not enough.",
      },
      {
        question: "When is overtime counted?",
        answer:
          "Overtime is counted only when the effective policy allows overtime. If require_approved_overtime is enabled, the payroll run should use only approved overtime requests for that cutoff, not raw attendance overages by themselves.",
      },
      {
        question: "Why does payroll policy matter more than work arrangement label?",
        answer:
          "The work arrangement type is mainly a classification and default suggestion layer. Payroll policy is the actual computation layer. It determines whether attendance, leave, overtime, or no-log absences affect pay, which means two employees with the same work arrangement can still compute differently.",
      },
      {
        question: "Why are some employees not deducted for late or undertime?",
        answer:
          "Their payroll policy may disable deduct_late or deduct_undertime even if attendance is still being captured for review or record-keeping purposes. This is common for flexible, field, or exception-based payroll groups.",
      },
      {
        question: "Why does a missing log not always create an absence deduction?",
        answer:
          "Missing logs are only converted into payable absences when the effective payroll policy enables auto_absent_if_no_log or when attendance-based rules classify the day as deductible absence. In some profiles, the same missing log may remain a review issue without affecting pay.",
      },
      {
        question: "Can two employees in the same department have different payroll behavior?",
        answer:
          "Yes. Department is an organizational field, not a payroll behavior rule. Employees in the same department can still have different work arrangement types, payroll policy profiles, salary rates, leave treatment, and overtime behavior.",
      },
      {
        question: "What should reviewers check before posting payroll?",
        answer:
          "Reviewers should confirm the cutoff is correct, flagged attendance issues are understood, unresolved requests are handled appropriately, salary profiles are active, the correct deduction settings are in effect, and any employee-specific payroll policy overrides are intentional.",
      },
    ],
  },
  {
    id: "future-enhancements",
    title: "Future Enhancements",
    eyebrow: "Expansion Areas",
    summary:
      "The documentation and platform can be extended over time as additional payroll, compliance, and employee self-service features are introduced.",
    cards: [
      {
        title: "RFID / Biometric Integration",
        description:
          "Connect direct attendance sources to reduce manual imports and shorten attendance review cycles.",
      },
      {
        title: "Employee Self-Service",
        description:
          "Expand employee access for profile updates, document retrieval, request filing, and payroll history review.",
      },
      {
        title: "Payroll Approval Workflow",
        description:
          "Add more formal approval stages, escalation paths, or sign-off history before payroll posting.",
      },
      {
        title: "Tax and Government Table Configuration",
        description:
          "Extend deduction configuration tooling for easier updates when statutory tables change.",
      },
      {
        title: "Audit Logs and Compliance Trails",
        description:
          "Expand event logging for policy changes, recalculation actions, record overrides, and approval decisions.",
      },
      {
        title: "Notifications and Alerts",
        description:
          "Broaden reminders for pending approvals, payroll readiness, expiring records, and employee-facing payroll events.",
      },
      {
        title: "Exports and External Integrations",
        description:
          "Support accounting handoff, banking files, government remittance output, or other operational integrations.",
      },
      {
        title: "Role-Based Dashboards",
        description:
          "Provide role-specific landing pages with KPIs and pending tasks for HR, finance, managers, and employees.",
      },
    ],
  },
];
