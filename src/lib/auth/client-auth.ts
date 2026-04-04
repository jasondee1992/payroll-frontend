export async function performClientLogout(redirectTo = "/login") {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    const responseBody = (await response.json()) as {
      redirectTo?: string;
    };

    if (typeof window !== "undefined") {
      window.location.assign(responseBody.redirectTo ?? redirectTo);
    }
  } catch {
    if (typeof window !== "undefined") {
      window.location.assign(redirectTo);
    }
  }
}

export async function handleUnauthorizedClientResponse(response: Response) {
  if (response.status !== 401) {
    return false;
  }

  await performClientLogout("/login");

  return true;
}
