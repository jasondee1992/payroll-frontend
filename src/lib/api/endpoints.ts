const API_V1_PREFIX = "/api/v1";

export const apiEndpoints = {
  auth: {
    me: `${API_V1_PREFIX}/auth/me`,
  },
  employees: {
    list: `${API_V1_PREFIX}/employees`,
    detail: (employeeId: string) => `${API_V1_PREFIX}/employees/${employeeId}`,
  },
  attendance: {
    list: `${API_V1_PREFIX}/attendance`,
    upload: `${API_V1_PREFIX}/attendance/imports`,
  },
  payroll: {
    periods: `${API_V1_PREFIX}/payroll/periods`,
    runs: `${API_V1_PREFIX}/payroll/runs`,
    results: `${API_V1_PREFIX}/payroll/results`,
    payslips: `${API_V1_PREFIX}/payroll/payslips`,
  },
  reports: {
    list: `${API_V1_PREFIX}/reports`,
  },
} as const;
