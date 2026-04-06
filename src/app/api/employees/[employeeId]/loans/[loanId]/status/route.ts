import { NextRequest } from "next/server";
import {
  getEmployeeLoanStatusPath,
  proxyEmployeeLoanRequest,
} from "@/app/api/employees/loan-proxy";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ employeeId: string; loanId: string }> },
) {
  const { employeeId, loanId } = await context.params;

  return proxyEmployeeLoanRequest(
    request,
    getEmployeeLoanStatusPath(employeeId, loanId),
  );
}
