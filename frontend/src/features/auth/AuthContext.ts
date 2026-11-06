import { createContext, useContext } from "react";
import type { LoginInput, Session } from "../../types/auth";

export interface AuthContextValue {
  session: Session | null;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}