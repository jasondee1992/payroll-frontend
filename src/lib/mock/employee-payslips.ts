export type EmployeePayslipRecord = {
  id: string;
  periodLabel: string;
  payoutDate: string;
  payrollSchedule: string;
  status: "Released" | "Processing";
  basicPay: number;
  additions: Array<{
    label: string;
    amount: number;
  }>;
  deductions: Array<{
    label: string;
    amount: number;
  }>;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
};

export type EmployeeMonthlyPayTrendRecord = {
  monthLabel: string;
  monthKey: string;
  grossPay: number;
  netPay: number;
};

export const employeePayslipHistory: EmployeePayslipRecord[] = [
  {
    id: "PS-2026-04-15",
    periodLabel: "Apr 1 - Apr 15, 2026",
    payoutDate: "2026-04-15",
    payrollSchedule: "Semi-monthly",
    status: "Released",
    basicPay: 17500,
    additions: [
      { label: "Rice allowance", amount: 1500 },
      { label: "Transportation allowance", amount: 2000 },
      { label: "Attendance allowance", amount: 800 },
    ],
    deductions: [
      { label: "SSS", amount: 650 },
      { label: "PhilHealth", amount: 350 },
      { label: "Pag-IBIG", amount: 200 },
      { label: "Withholding tax", amount: 1250 },
    ],
    grossPay: 21800,
    totalDeductions: 2450,
    netPay: 19350,
  },
  {
    id: "PS-2026-03-30",
    periodLabel: "Mar 16 - Mar 30, 2026",
    payoutDate: "2026-03-30",
    payrollSchedule: "Semi-monthly",
    status: "Released",
    basicPay: 17500,
    additions: [
      { label: "Rice allowance", amount: 1500 },
      { label: "Communication allowance", amount: 1000 },
      { label: "Night shift differential", amount: 1250 },
    ],
    deductions: [
      { label: "SSS", amount: 650 },
      { label: "PhilHealth", amount: 350 },
      { label: "Pag-IBIG", amount: 200 },
      { label: "Withholding tax", amount: 1180 },
    ],
    grossPay: 21250,
    totalDeductions: 2380,
    netPay: 18870,
  },
  {
    id: "PS-2026-03-15",
    periodLabel: "Mar 1 - Mar 15, 2026",
    payoutDate: "2026-03-15",
    payrollSchedule: "Semi-monthly",
    status: "Released",
    basicPay: 17500,
    additions: [
      { label: "Rice allowance", amount: 1500 },
      { label: "Meal allowance", amount: 900 },
    ],
    deductions: [
      { label: "SSS", amount: 650 },
      { label: "PhilHealth", amount: 350 },
      { label: "Pag-IBIG", amount: 200 },
      { label: "Withholding tax", amount: 1100 },
    ],
    grossPay: 19900,
    totalDeductions: 2300,
    netPay: 17600,
  },
];

export const employeeMonthlyPayTrend: EmployeeMonthlyPayTrendRecord[] = [
  { monthLabel: "May 2025", monthKey: "2025-05", grossPay: 38200, netPay: 33840 },
  { monthLabel: "Jun 2025", monthKey: "2025-06", grossPay: 38950, netPay: 34490 },
  { monthLabel: "Jul 2025", monthKey: "2025-07", grossPay: 40100, netPay: 35510 },
  { monthLabel: "Aug 2025", monthKey: "2025-08", grossPay: 39880, netPay: 35240 },
  { monthLabel: "Sep 2025", monthKey: "2025-09", grossPay: 41420, netPay: 36650 },
  { monthLabel: "Oct 2025", monthKey: "2025-10", grossPay: 42010, netPay: 37180 },
  { monthLabel: "Nov 2025", monthKey: "2025-11", grossPay: 43280, netPay: 38260 },
  { monthLabel: "Dec 2025", monthKey: "2025-12", grossPay: 44800, netPay: 39540 },
  { monthLabel: "Jan 2026", monthKey: "2026-01", grossPay: 43920, netPay: 38870 },
  { monthLabel: "Feb 2026", monthKey: "2026-02", grossPay: 45260, netPay: 40020 },
  { monthLabel: "Mar 2026", monthKey: "2026-03", grossPay: 46840, netPay: 41470 },
  { monthLabel: "Apr 2026", monthKey: "2026-04", grossPay: 48160, netPay: 42690 },
];
