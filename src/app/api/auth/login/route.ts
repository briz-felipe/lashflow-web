import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const apiUrl = process.env.API_URL;
  console.log("[auth/login] API_URL:", apiUrl);
  console.log("[auth/login] AUTH_CLIENT_ID set:", !!process.env.AUTH_CLIENT_ID);
  console.log("[auth/login] AUTH_CLIENT_SECRET set:", !!process.env.AUTH_CLIENT_SECRET);

  const res = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
      clientId: process.env.AUTH_CLIENT_ID,
      clientSecret: process.env.AUTH_CLIENT_SECRET,
    }),
  });

  console.log("[auth/login] backend status:", res.status);

  const data = await res.json().catch(() => ({}));

  return NextResponse.json(data, { status: res.status });
}
