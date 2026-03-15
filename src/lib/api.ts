import { getAccessToken, refreshTokens, clearTokens } from "./auth";

class ApiClient {
  readonly baseURL: string;

  // Deduplicar chamadas simultâneas de refresh (Promise compartilhada)
  private refreshing: Promise<boolean> | null = null;

  constructor(baseURL: string) {
    // Upgrade http → https when page is served over HTTPS (avoids mixed-content blocks)
    if (typeof window !== "undefined" && window.location.protocol === "https:") {
      this.baseURL = baseURL.replace(/^http:\/\//, "https://");
    } else {
      this.baseURL = baseURL;
    }
  }

  private headers(extra?: HeadersInit): HeadersInit {
    const token = getAccessToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(extra ?? {}),
    };
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const fullUrl = `${this.baseURL}${path}`;
    console.log(`[api] ${options.method ?? "GET"} ${fullUrl}`);
    const res = await fetch(fullUrl, {
      ...options,
      headers: this.headers(options.headers),
    });

    // ─── 401: tenta refresh e repete a requisição ──────────────────────────
    if (res.status === 401) {
      if (!this.refreshing) {
        this.refreshing = refreshTokens().finally(() => {
          this.refreshing = null;
        });
      }

      const refreshed = await this.refreshing;

      if (refreshed) {
        const retry = await fetch(`${this.baseURL}${path}`, {
          ...options,
          headers: this.headers(options.headers),
        });

        if (!retry.ok) {
          const err = await retry.json().catch(() => ({}));
          throw Object.assign(new Error(err.detail ?? `HTTP ${retry.status}`), {
            status: retry.status,
            data: err,
          });
        }

        if (retry.status === 204) return undefined as T;
        return retry.json();
      } else {
        // Refresh falhou → sessão expirada
        clearTokens();
        if (typeof window !== "undefined") window.location.href = "/login";
        throw Object.assign(new Error("Sessão expirada"), { status: 401 });
      }
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (Array.isArray(err.detail)) {
        err.detail.forEach((d: { loc?: string[]; msg?: string; type?: string }) => {
          console.error(`[api] validation error — field: ${d.loc?.join(".")}, msg: ${d.msg}`);
        });
      }
      console.error(`[api] ${options.method ?? "GET"} ${path} → ${res.status}`, err);
      throw Object.assign(new Error(err.detail ?? err.message ?? `HTTP ${res.status}`), {
        status: res.status,
        data: err,
      });
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete(path: string): Promise<void> {
    return this.request<void>(path, { method: "DELETE" });
  }
}

export const api = new ApiClient(process.env.NEXT_PUBLIC_API_URL!);
