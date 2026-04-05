const API_V1_PREFIX = "/api/v1";

export const apiEndpoints = {
  auth: {
    login: `${API_V1_PREFIX}/auth/login`,
    refresh: `${API_V1_PREFIX}/auth/refresh`,
    me: `${API_V1_PREFIX}/auth/me`,
    profileImage: `${API_V1_PREFIX}/auth/me/profile-image`,
    changePassword: `${API_V1_PREFIX}/auth/change-password`,
  },
  employees: {
    list: `${API_V1_PREFIX}/employees`,
    onboard: `${API_V1_PREFIX}/employees/onboard`,
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
    workflowCutoffs: `${API_V1_PREFIX}/payroll/cutoffs`,
    workflowBatches: `${API_V1_PREFIX}/payroll/batches`,
    workflowBatchDetail: (batchId: string) => `${API_V1_PREFIX}/payroll/batches/${batchId}`,
    workflowRecordDetail: (recordId: string) => `${API_V1_PREFIX}/payroll/records/${recordId}`,
    workflowPayslips: `${API_V1_PREFIX}/payroll/payslips`,
    workflowPayslipDetail: (payslipId: string) =>
      `${API_V1_PREFIX}/payroll/payslips/${payslipId}`,
    workflowMyPayslips: `${API_V1_PREFIX}/payroll/me/payslips`,
    workflowMyPayslipDetail: (payslipId: string) =>
      `${API_V1_PREFIX}/payroll/me/payslips/${payslipId}`,
    periods: `${API_V1_PREFIX}/payroll-periods`,
    periodDetail: (periodId: string) => `${API_V1_PREFIX}/payroll-periods/${periodId}`,
    runs: `${API_V1_PREFIX}/payroll-runs`,
    runDetail: (runId: string) => `${API_V1_PREFIX}/payroll-runs/${runId}`,
    process: `${API_V1_PREFIX}/payroll-runs/process`,
  },
  timeRequests: {
    list: `${API_V1_PREFIX}/time-requests`,
    status: (requestId: string) => `${API_V1_PREFIX}/time-requests/${requestId}/status`,
  },
  users: {
    list: `${API_V1_PREFIX}/users`,
    detail: (userId: string) => `${API_V1_PREFIX}/users/${userId}`,
  },
} as const;
