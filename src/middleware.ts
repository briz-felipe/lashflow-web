import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/agenda", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Protege todas as rotas do dashboard exceto:
     * - /login
     * - /agendar (booking público)
     * - /_next (assets internos do Next.js)
     * - /api (rotas de API)
     * - arquivos estáticos (.ico, .png, etc.)
     */
    "/((?!login|agendar|_next|api|.*\\..*).*)",
  ],
};
