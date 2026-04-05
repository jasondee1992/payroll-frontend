import { cookies } from "next/headers";
import {
  AUTH_ROLE_COOKIE,
  AUTH_TOKEN_COOKIE,
  normalizeAppRole,
  type AppRole,
} from "@/lib/auth/session";
import { getAuthUserFromAccessToken, isAccessTokenExpired } from "@/lib/auth/token";

export type ServerAuthSession = {
  isAuthenticated: boolean;
  role: AppRole | null;
  username: string | null;
  displayRole: string | null;
};

export async function getServerAuthSession(): Promise<ServerAuthSession> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const hasValidToken =
    authToken != null && authToken.length > 0 && !isAccessTokenExpired(authToken);
  const tokenUser = authToken
    && hasValidToken
    ? getAuthUserFromAccessToken(authToken)
    : { username: null, role: null };
  const role =
    (hasValidToken
      ? normalizeAppRole(cookieStore.get(AUTH_ROLE_COOKIE)?.value)
      : null) ??
    normalizeAppRole(tokenUser.role);

  return {
    isAuthenticated: hasValidToken,
    role,
    username: tokenUser.username,
    displayRole: tokenUser.role,
  };
}
