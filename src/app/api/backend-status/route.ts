import { NextResponse } from "next/server";
import { getBackendStatus } from "@/lib/api/health";

export async function GET() {
  const backendStatus = await getBackendStatus();

  return NextResponse.json(backendStatus, {
    status: backendStatus.available ? 200 : 503,
  });
}
