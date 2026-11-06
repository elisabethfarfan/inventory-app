import { api } from "./client";
import type { User, UserCreateInput, UserUpdateInput } from "../types/user";

export const getUsers = () => api.get<User[]>("/users").then((r) => r.data);

export const createUser = (input: UserCreateInput) =>
  api.post<User>("/users", input).then((r) => r.data);

export const updateUser = (id: number, input: UserUpdateInput) =>
  api.put<User>(`/users/${id}`, input).then((r) => r.data);