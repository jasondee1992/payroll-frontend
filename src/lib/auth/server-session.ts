import { cookies } from "next/headers";
import {
  AUTH_ROLE_COOKIE,
  AUTH_TOKEN_COOKIE,
  normalizeAppRole,
  type AppRole,
} from "@/lib/auth/session";
import { getAuthUserFromAccessToken } from "@/lib/auth/token";

export type ServerAuthSession = {
  isAuthenticated: boolean;
  role: AppRole | null;
  username: string | null;
  displayRole: string | null;
};

export async function getServerAuthSession(): Promise<ServerAuthSession> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const tokenUser = authToken
    ? getAuthUserFromAccessToken(authToken)
    : { username: null, role: null };
  const role =
    normalizeAppRole(cookieStore.get(AUTH_ROLE_COOKIE)?.value) ??
    normalizeAppRole(tokenUser.role);

  return {
    isAuthenticated: Boolean(authToken),
    role,
    username: tokenUser.username,
    displayRole: tokenUser.role,
  };
}
