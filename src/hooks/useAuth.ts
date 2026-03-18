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

export function useAuth(): AuthState & { logout: () => void; reloadProfile: () => Promise<void> } {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  const loadProfile = useCallback(async () => {
    try {
      const user = await api.get<AuthUser>("/auth/me");
      setState({ user, loading: false });
    } catch {
      setState({ user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const logout = useCallback(() => {
    clearSession();
    router.push("/login");
  }, [router]);

  return { ...state, logout, reloadProfile: loadProfile };
}
