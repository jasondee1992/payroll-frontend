import { NextRequest } from "next/server";
import {
  getEmployeeLoanCollectionPath,
  proxyEmployeeLoanRequest,
} from "@/app/api/employees/loan-proxy";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ employeeId: string }> },
) {
  const { employeeId } = await context.params;

  return proxyEmployeeLoanRequest(
    request,
    getEmployeeLoanCollectionPath(employeeId),
  );
}
