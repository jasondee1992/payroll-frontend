export type EmployeeAttendanceEntry = {
  id: string;
  workDate: string;
  dayLabel: string;
  status: "Present" | "Late" | "Absent" | "Leave";
  timeIn: string;
  timeOut: string;
  overtimeHours: number;
  remarks: string;
};

export type EmployeeAttendanceMonthRecord = {
  monthKey: string;
  monthLabel: string;
  payrollCutoff: string;
  attendanceRate: string;
  totalWorkedDays: number;
  totalLateCount: number;
  totalAbsentCount: number;
  totalOvertimeHours: number;
  entries: EmployeeAttendanceEntry[];
};

export const employeeAttendanceHistory: EmployeeAttendanceMonthRecord[] = [
  {
    monthKey: "2026-04",
    monthLabel: "April 2026",
    payrollCutoff: "Apr 1 - Apr 30",
    attendanceRate: "96%",
    totalWorkedDays: 21,
    totalLateCount: 1,
    totalAbsentCount: 0,
    totalOvertimeHours: 6,
    entries: [
      {
        id: "ATT-2026-04-30",
        workDate: "2026-04-30",
        dayLabel: "Thu",
        status: "Present",
        timeIn: "08:58",
        timeOut: "18:12",
        overtimeHours: 1.2,
        remarks: "Completed month-end validation.",
      },
      {
        id: "ATT-2026-04-29",
        workDate: "2026-04-29",
        dayLabel: "Wed",
        status: "Present",
        timeIn: "09:03",
        timeOut: "18:01",
        overtimeHours: 0.5,
        remarks: "Regular shift.",
      },
      {
        id: "ATT-2026-04-28",
        workDate: "2026-04-28",
        dayLabel: "Tue",
        status: "Late",
        timeIn: "09:21",
        timeOut: "18:04",
        overtimeHours: 0,
        remarks: "Traffic delay.",
      },
      {
        id: "ATT-2026-04-25",
        workDate: "2026-04-25",
        dayLabel: "Sat",
        status: "Present",
        timeIn: "08:55",
        timeOut: "17:48",
        overtimeHours: 1,
        remarks: "Weekend support shift.",
      },
    ],
  },
  {
    monthKey: "2026-03",
    monthLabel: "March 2026",
    payrollCutoff: "Mar 1 - Mar 31",
    attendanceRate: "91%",
    totalWorkedDays: 20,
    totalLateCount: 2,
    totalAbsentCount: 1,
    totalOvertimeHours: 4.5,
    entries: [
      {
        id: "ATT-2026-03-31",
        workDate: "2026-03-31",
        dayLabel: "Tue",
        status: "Present",
        timeIn: "08:57",
        timeOut: "18:06",
        overtimeHours: 0.8,
        remarks: "Payroll release support.",
      },
      {
        id: "ATT-2026-03-27",
        workDate: "2026-03-27",
        dayLabel: "Fri",
        status: "Absent",
        timeIn: "--",
        timeOut: "--",
        overtimeHours: 0,
        remarks: "Sick leave without time entry.",
      },
      {
        id: "ATT-2026-03-18",
        workDate: "2026-03-18",
        dayLabel: "Wed",
        status: "Late",
        timeIn: "09:18",
        timeOut: "17:59",
        overtimeHours: 0,
        remarks: "Late arrival.",
      },
      {
        id: "ATT-2026-03-12",
        workDate: "2026-03-12",
        dayLabel: "Thu",
        status: "Present",
        timeIn: "08:50",
        timeOut: "18:22",
        overtimeHours: 1.5,
        remarks: "Cutoff reconciliation.",
      },
    ],
  },
  {
    monthKey: "2026-02",
    monthLabel: "February 2026",
    payrollCutoff: "Feb 1 - Feb 28",
    attendanceRate: "98%",
    totalWorkedDays: 20,
    totalLateCount: 0,
    totalAbsentCount: 0,
    totalOvertimeHours: 3.2,
    entries: [
      {
        id: "ATT-2026-02-26",
        workDate: "2026-02-26",
        dayLabel: "Thu",
        status: "Present",
        timeIn: "08:54",
        timeOut: "17:46",
        overtimeHours: 0.4,
        remarks: "Regular shift.",
      },
      {
        id: "ATT-2026-02-20",
        workDate: "2026-02-20",
        dayLabel: "Fri",
        status: "Present",
        timeIn: "08:49",
        timeOut: "18:10",
        overtimeHours: 1.1,
        remarks: "Supported quarterly audit requests.",
      },
      {
        id: "ATT-2026-02-13",
        workDate: "2026-02-13",
        dayLabel: "Fri",
        status: "Leave",
        timeIn: "--",
        timeOut: "--",
        overtimeHours: 0,
        remarks: "Approved vacation leave.",
      },
      {
        id: "ATT-2026-02-05",
        workDate: "2026-02-05",
        dayLabel: "Thu",
        status: "Present",
        timeIn: "08:52",
        timeOut: "18:08",
        overtimeHours: 0.9,
        remarks: "End-of-day reports completed.",
      },
    ],
  },
];
