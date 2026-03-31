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

