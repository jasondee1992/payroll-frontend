import { cookies } from "next/headers";
import {
  AUTH_ROLE_COOKIE,
  AUTH_TOKEN_COOKIE,
  normalizeAppRole,
  type AppRole,
} from "@/lib/auth/session";

export type ServerAuthSession = {
  isAuthenticated: boolean;
  role: AppRole | null;
};

export async function getServerAuthSession(): Promise<ServerAuthSession> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const role = normalizeAppRole(cookieStore.get(AUTH_ROLE_COOKIE)?.value);

  return {
    isAuthenticated: Boolean(authToken),
    role,
  };
}
