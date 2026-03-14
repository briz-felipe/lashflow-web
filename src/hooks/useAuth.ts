"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { logout as clearSession } from "@/lib/auth";
import { api } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

export function useAuth(): AuthState & { logout: () => void } {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    api
      .get<AuthUser>("/auth/me")
      .then((user) => setState({ user, loading: false }))
      .catch(() => setState({ user: null, loading: false }));
  }, []);

  const logout = useCallback(() => {
    clearSession();
    router.push("/login");
  }, [router]);

  return { ...state, logout };
}
