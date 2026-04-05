import { normalizeAppRole, type AppRole } from "@/lib/auth/session";

type JwtPayload = {
  exp?: number;
  role?: string;
  username?: string;
};

function decodeBase64UrlSegment(value: string) {
  const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalizedValue.length % 4)) % 4;
  const paddedValue = normalizedValue + "=".repeat(paddingLength);

  if (typeof globalThis.atob === "function") {
    const binaryValue = globalThis.atob(paddedValue);
    const bytes = Uint8Array.from(binaryValue, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  return Buffer.from(paddedValue, "base64").toString("utf-8");
}

export function getRoleFromAccessToken(token: string): AppRole | null {
  const payload = getAccessTokenPayload(token);

  if (!payload) {
    return null;
  }

  return normalizeAppRole(payload.role);
}

export function getAuthUserFromAccessToken(token: string) {
  const payload = getAccessTokenPayload(token);

  if (!payload) {
    return {
      username: null,
      role: null,
    };
  }

  return {
    username:
      typeof payload.username === "string" && payload.username.trim().length > 0
        ? payload.username.trim()
        : null,
    role:
      typeof payload.role === "string" && payload.role.trim().length > 0
        ? payload.role.trim()
        : null,
  };
}

export function getAccessTokenExpirationTime(token: string) {
  const payload = getAccessTokenPayload(token);

  if (!payload || typeof payload.exp !== "number") {
    return null;
  }

  return payload.exp * 1000;
}

export function isAccessTokenExpired(token: string, now = Date.now()) {
  const expirationTime = getAccessTokenExpirationTime(token);

  if (expirationTime == null) {
    return true;
  }

  return expirationTime <= now;
}

function getAccessTokenPayload(token: string): JwtPayload | null {
  const segments = token.split(".");

  if (segments.length < 2) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64UrlSegment(segments[1])) as JwtPayload;
  } catch {
    return null;
  }
}
