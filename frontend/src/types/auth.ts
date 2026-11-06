export type Role = "ADMIN" | "OPERATOR";

export interface Session {
  token: string;
  username: string;
  fullName: string;
  role: Role;
}

export interface LoginInput {
  username: string;
  password: string;
}