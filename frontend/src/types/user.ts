import type { Role } from "./auth";

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface UserCreateInput {
  username: string;
  fullName: string;
  password: string;
  role: Role;
}

export interface UserUpdateInput {
  fullName: string;
  role: Role;
  active: boolean;
  password?: string;
}