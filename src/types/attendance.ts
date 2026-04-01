export interface AttendanceLog {
  employeeId: string;
  employeeName: string;
  workDate: string;
  timeIn: string;
  timeOut: string;
  lateMinutes: number;
  undertimeMinutes: number;
  overtimeMinutes: number;
  remarks: string;
}

export interface AttendanceApiRecord {
  id: number;
  employee_id: number;
  work_date: string;
  time_in?: string;
  time_out?: string;
  late_minutes: number;
  undertime_minutes: number;
  overtime_minutes: number;
  absence_flag: boolean;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

