import { api } from "./client";
import type { LoginInput, Session } from "../types/auth";

export const loginRequest = (input: LoginInput) =>
  api.post<Session>("/auth/login", input).then((r) => r.data);