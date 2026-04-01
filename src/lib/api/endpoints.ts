const API_V1_PREFIX = "/api/v1";

export const apiEndpoints = {
  auth: {
    login: `${API_V1_PREFIX}/auth/login`,
    me: `${API_V1_PREFIX}/auth/me`,
  },
  employees: {
    list: `${API_V1_PREFIX}/employees`,
    detail: (employeeId: string) => `${API_V1_PREFIX}/employees/${employeeId}`,
    governmentInfo: (employeeId: string) =>
      `${API_V1_PREFIX}/employees/${employeeId}/government-info`,
    salaryProfile: (employeeId: string) =>
      `${API_V1_PREFIX}/employees/${employeeId}/salary-profile`,
  },
  attendance: {
    list: `${API_V1_PREFIX}/attendance`,
  },
  payroll: {
    periods: `${API_V1_PREFIX}/payroll-periods`,
    periodDetail: (periodId: string) => `${API_V1_PREFIX}/payroll-periods/${periodId}`,
    runs: `${API_V1_PREFIX}/payroll-runs`,
    runDetail: (runId: string) => `${API_V1_PREFIX}/payroll-runs/${runId}`,
    process: `${API_V1_PREFIX}/payroll-runs/process`,
  },
  users: {
    list: `${API_V1_PREFIX}/users`,
    detail: (userId: string) => `${API_V1_PREFIX}/users/${userId}`,
  },
} as const;
