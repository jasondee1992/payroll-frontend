export type RequestFormKind =
  | "leave"
  | "overtime"
  | "attendance"
  | "arrangement";

export type RequestCatalogItem = {
  id: string;
  title: string;
  description: string;
  tag: string;
  formKind: RequestFormKind;
  approvalPath: string;
};

export type RequestGroup = {
  title: string;
  description: string;
  tone: string;
  items: RequestCatalogItem[];
};

const STANDARD_APPROVAL_PATH = "Reporting manager or HR";

const baseRequestGroups: RequestGroup[] = [
  {
    title: "Statutory and law-aligned leaves",
    description:
      "Core leave types commonly used in Philippine HR operations, including requests with specific legal or documentary requirements.",
    tone: "Law-aligned",
    items: [
      {
        id: "vacation-leave",
        title: "Vacation Leave / Service Incentive Leave",
        description:
          "Planned personal leave, rest days, or travel requests typically charged to available leave credits.",
        tag: "Leave",
        formKind: "leave",
        approvalPath: "Immediate lead -> HR",
      },
      {
        id: "sick-leave",
        title: "Sick Leave",
        description:
          "Illness, recovery, consultations, or medically advised absences with optional medical attachment handling.",
        tag: "Leave",
        formKind: "leave",
        approvalPath: "Immediate lead -> HR",
      },
      {
        id: "maternity-leave",
        title: "Maternity Leave",
        description:
          "Pregnancy, childbirth, miscarriage, or emergency termination-related leave with SSS and employer coordination.",
        tag: "Statutory",
        formKind: "leave",
        approvalPath: "Immediate lead -> HR -> Payroll/Finance",
      },
      {
        id: "paternity-leave",
        title: "Paternity Leave",
        description:
          "Paid leave request for qualified fathers for childbirth or miscarriage support, subject to filing rules.",
        tag: "Statutory",
        formKind: "leave",
        approvalPath: "Immediate lead -> HR",
      },
      {
        id: "solo-parent-leave",
        title: "Solo Parent Leave",
        description:
          "Parental leave filing for qualified solo parents with supporting identification or eligibility documents.",
        tag: "Statutory",
        formKind: "leave",
        approvalPath: "Immediate lead -> HR",
      },
      {
        id: "special-leave-for-women",
        title: "Special Leave for Women",
        description:
          "Leave for surgery caused by gynecological disorders, usually filed with medical certification support.",
        tag: "Statutory",
        formKind: "leave",
        approvalPath: "Immediate lead -> HR",
      },
      {
        id: "vawc-leave",
        title: "VAWC Leave",
        description:
          "Protected leave filing for qualified violence-against-women-and-children cases with confidential review handling.",
        tag: "Protected",
        formKind: "leave",
        approvalPath: "Restricted approver -> HR",
      },
      {
        id: "adoption-leave",
        title: "Adoption Leave",
        description:
          "Leave request for qualified adoptive parents during supervised trial custody and related adoption milestones.",
        tag: "Statutory",
        formKind: "leave",
        approvalPath: "Immediate lead -> HR",
      },
    ],
  },
  {
    title: "Attendance and payroll-impact requests",
    description:
      "Requests that directly affect timesheets, daily attendance records, overtime calculations, or payroll follow-through.",
    tone: "Attendance",
    items: [
      {
        id: "overtime",
        title: "Overtime",
        description:
          "Additional work hours beyond regular schedule that need approval before payroll processing.",
        tag: "Attendance",
        formKind: "overtime",
        approvalPath: "Immediate lead -> Attendance/HR -> Payroll",
      },
      {
        id: "rest-day-holiday-overtime",
        title: "Rest Day / Holiday Overtime",
        description:
          "Extra hours rendered on rest days or holidays with separate approval and premium-pay treatment.",
        tag: "Payroll",
        formKind: "overtime",
        approvalPath: "Immediate lead -> Attendance/HR -> Payroll",
      },
      {
        id: "undertime",
        title: "Undertime",
        description:
          "Early timeout or reduced work hours that require reason capture and supervisor acknowledgment.",
        tag: "Attendance",
        formKind: "attendance",
        approvalPath: "Immediate lead -> Attendance/HR",
      },
      {
        id: "half-day-leave",
        title: "Half-Day Leave",
        description:
          "AM or PM absence request that can later deduct leave credits or update schedule coverage.",
        tag: "Schedule",
        formKind: "leave",
        approvalPath: "Immediate lead -> HR",
      },
      {
        id: "late-arrival-early-out",
        title: "Late Arrival / Early Out Excuse",
        description:
          "Documented filing for late attendance, early departure, or short-duration schedule exceptions.",
        tag: "Attendance",
        formKind: "attendance",
        approvalPath: "Immediate lead -> Attendance/HR",
      },
      {
        id: "missing-time-log",
        title: "Missing Time-In / Time-Out Correction",
        description:
          "Attendance correction request for missed biometrics, forgotten punches, or incomplete DTR logs.",
        tag: "Correction",
        formKind: "attendance",
        approvalPath: "Immediate lead -> Attendance/HR",
      },
      {
        id: "dtr-adjustment",
        title: "Attendance / DTR Adjustment",
        description:
          "General correction request for wrong shift tagging, duplicate logs, or disputed attendance entries.",
        tag: "Correction",
        formKind: "attendance",
        approvalPath: "Immediate lead -> Attendance/HR",
      },
      {
        id: "offset-time-off",
        title: "Offset / Time Off in Lieu",
        description:
          "Conversion request for approved extra hours into time credits or future offset leave usage.",
        tag: "Payroll",
        formKind: "overtime",
        approvalPath: "Immediate lead -> HR",
      },
    ],
  },
  {
    title: "Common company-policy requests",
    description:
      "Operational requests many Philippine companies also manage in the same workspace even when they depend on internal policy.",
    tone: "Policy-based",
    items: [
      {
        id: "emergency-leave",
        title: "Emergency Leave",
        description:
          "Urgent absence filing for unforeseen personal or family situations requiring quick approval.",
        tag: "Policy",
        formKind: "leave",
        approvalPath: "Immediate lead -> HR",
      },
      {
        id: "bereavement-leave",
        title: "Bereavement Leave",
        description:
          "Leave request for death in the immediate family, usually paired with relationship and date details.",
        tag: "Policy",
        formKind: "leave",
        approvalPath: "Immediate lead -> HR",
      },
      {
        id: "unpaid-leave",
        title: "Unpaid Leave",
        description:
          "Time-off request when no paid leave credit is available or the absence falls outside paid categories.",
        tag: "Policy",
        formKind: "leave",
        approvalPath: "Immediate lead -> HR -> Payroll",
      },
      {
        id: "birthday-leave",
        title: "Birthday Leave",
        description:
          "Optional company-granted leave for employee birthday benefits where policy allows.",
        tag: "Policy",
        formKind: "leave",
        approvalPath: "Immediate lead -> HR",
      },
      {
        id: "official-business",
        title: "Official Business / Field Work",
        description:
          "External meeting, bank errand, client visit, or field assignment that affects attendance tagging.",
        tag: "Schedule",
        formKind: "arrangement",
        approvalPath: "Immediate lead -> Attendance/HR",
      },
      {
        id: "schedule-swap",
        title: "Change Shift / Schedule Swap",
        description:
          "Request to move a shift, exchange schedules, or align coverage across teammates.",
        tag: "Schedule",
        formKind: "arrangement",
        approvalPath: "Immediate lead -> Attendance/HR",
      },
      {
        id: "work-from-home",
        title: "Work From Home / Remote Work",
        description:
          "Request for offsite work arrangement on approved days, with manager and operations visibility.",
        tag: "Policy",
        formKind: "arrangement",
        approvalPath: "Immediate lead -> HR/Operations",
      },
      {
        id: "study-leave",
        title: "Study Leave / Exam Leave",
        description:
          "Training, board exam, or school-related request that some employers grant under internal policy.",
        tag: "Policy",
        formKind: "leave",
        approvalPath: "Immediate lead -> HR",
      },
    ],
  },
];

export const requestGroups: RequestGroup[] = baseRequestGroups.map((group) => ({
  ...group,
  items: group.items.map((item) => ({
    ...item,
    approvalPath: STANDARD_APPROVAL_PATH,
  })),
}));

export const allRequestTypes = requestGroups.flatMap((group) => group.items);
