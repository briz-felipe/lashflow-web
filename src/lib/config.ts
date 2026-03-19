/**
 * Resolves the API base URL based on NEXT_PUBLIC_ENV.
 *
 * NEXT_PUBLIC_ENV=local       → NEXT_PUBLIC_API_LOCAL  (docker local)
 * NEXT_PUBLIC_ENV=production  → NEXT_PUBLIC_API_URL    (prod server)
 *
 * NEXT_PUBLIC_* vars are available on both client and server — no duplication needed.
 */
export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_ENV === "local"
    ? (process.env.NEXT_PUBLIC_API_LOCAL ?? "http://localhost:8001/api/v1")
    : (process.env.NEXT_PUBLIC_API_URL ?? "https://lash-flow.pc.seg.br/api/v1");
