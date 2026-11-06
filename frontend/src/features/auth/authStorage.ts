import type { Session } from "../../types/auth";

const KEY = "inventory:session";

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export const getToken = () => getSession()?.token ?? null;

export const saveSession = (session: Session) =>
  localStorage.setItem(KEY, JSON.stringify(session));

export const clearSession = () => localStorage.removeItem(KEY);