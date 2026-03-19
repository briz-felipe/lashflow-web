import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const apiUrl = process.env.NEXT_PUBLIC_ENV === "local"
    ? process.env.NEXT_PUBLIC_API_LOCAL
    : process.env.NEXT_PUBLIC_API_URL;
  console.log("[auth/login] ENV:", process.env.NEXT_PUBLIC_ENV, "→ API_URL:", apiUrl);
  console.log("[auth/login] AUTH_CLIENT_ID set:", !!process.env.AUTH_CLIENT_ID);
  console.log("[auth/login] AUTH_CLIENT_SECRET set:", !!process.env.AUTH_CLIENT_SECRET);
  console.log("[auth/login] username:", username);

  const body = {
    username,
    password,
    clientId: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET,
  };
  console.log("[auth/login] payload keys:", Object.keys(body));

  const res = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  console.log("[auth/login] backend status:", res.status);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) console.log("[auth/login] backend error:", JSON.stringify(data));

  return NextResponse.json(data, { status: res.status });
}
