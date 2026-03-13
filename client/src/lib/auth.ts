import type { PublicUser } from "@shared/types";

// Access token stored in memory only — never localStorage, never sessionStorage
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

// Attempt silent refresh on page load via httpOnly cookie
export async function silentRefresh(): Promise<{
  accessToken: string;
  user?: PublicUser;
} | null> {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) return null;

    const data = await res.json();
    setAccessToken(data.accessToken);
    return data;
  } catch {
    return null;
  }
}
