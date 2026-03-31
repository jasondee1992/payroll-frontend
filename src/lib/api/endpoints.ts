export const apiEndpoints = {
  auth: {
    me: "/auth/me",
  },
  employees: {
    list: "/employees",
    detail: (employeeId: string) => `/employees/${employeeId}`,
  },
  attendance: {
    list: "/attendance",
    upload: "/attendance/imports",
  },
  payroll: {
    periods: "/payroll/periods",
    runs: "/payroll/runs",
    results: "/payroll/results",
    payslips: "/payroll/payslips",
  },
  reports: {
    list: "/reports",
  },
} as const;

