import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "./AuthContext";
import { clearSession, getSession, saveSession } from "./authStorage";
import { loginRequest } from "../../api/auth";
import type { LoginInput, Session } from "../../types/auth";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(getSession);

  const login = useCallback(async (input: LoginInput) => {
    const data = await loginRequest(input);
    saveSession(data);
    setSession(data);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    queryClient.clear(); // no dejar datos del usuario anterior en caché
  }, [queryClient]);

  const value = useMemo(() => ({ session, login, logout }), [session, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}