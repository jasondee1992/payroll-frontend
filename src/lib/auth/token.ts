import { normalizeAppRole, type AppRole } from "@/lib/auth/session";

type JwtPayload = {
  role?: string;
};

function decodeBase64UrlSegment(value: string) {
  const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalizedValue.length % 4)) % 4;
  const paddedValue = normalizedValue + "=".repeat(paddingLength);

  return Buffer.from(paddedValue, "base64").toString("utf-8");
}

export function getRoleFromAccessToken(token: string): AppRole | null {
  const segments = token.split(".");

  if (segments.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64UrlSegment(segments[1])) as JwtPayload;
    return normalizeAppRole(payload.role);
  } catch {
    return null;
  }
}
