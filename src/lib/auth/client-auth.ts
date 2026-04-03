export async function handleUnauthorizedClientResponse(response: Response) {
  if (response.status !== 401) {
    return false;
  }

  try {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
  } catch {
    // Ignore logout cleanup errors and continue redirecting.
  }

  if (typeof window !== "undefined") {
    window.location.assign("/login");
  }

  return true;
}
