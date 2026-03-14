const API = process.env.NEXT_PUBLIC_API_URL!

export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  isSuperuser: boolean;
  isActive: boolean;
  createdAt: string;
}

// ─── cookie helpers ────────────────────────────────────────────────────────

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

// ─── token access ──────────────────────────────────────────────────────────

export function getAccessToken(): string | undefined {
  return getCookie("access_token");
}

export function getRefreshToken(): string | undefined {
  return getCookie("refresh_token");
}

export function setTokens(accessToken: string, refreshToken: string) {
  setCookie("access_token", accessToken, 60 * 60 * 24 * 7);    // 7 dias
  setCookie("refresh_token", refreshToken, 60 * 60 * 24 * 30); // 30 dias
}

export function clearTokens() {
  deleteCookie("access_token");
  deleteCookie("refresh_token");
}

// ─── refresh ───────────────────────────────────────────────────────────────

export async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return false;
    }

    const data = await res.json() as { accessToken: string; refreshToken: string };
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

// ─── login / logout ────────────────────────────────────────────────────────

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Credenciais inválidas");
  }

  const data = await res.json() as { accessToken: string; refreshToken: string };
  setTokens(data.accessToken, data.refreshToken);
}

export function logout() {
  clearTokens();
}
