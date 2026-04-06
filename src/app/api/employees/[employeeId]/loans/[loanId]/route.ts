import { NextRequest } from "next/server";
import {
  getEmployeeLoanDetailPath,
  proxyEmployeeLoanRequest,
} from "@/app/api/employees/loan-proxy";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ employeeId: string; loanId: string }> },
) {
  const { employeeId, loanId } = await context.params;

  return proxyEmployeeLoanRequest(
    request,
    getEmployeeLoanDetailPath(employeeId, loanId),
  );
}
