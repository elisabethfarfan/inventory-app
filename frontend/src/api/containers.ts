import { api } from "./client";
import type { ContainerSummary, OpenContainer } from "../types/container";

export const getOpenContainers = () =>
  api.get<OpenContainer[]>("/containers").then((r) => r.data);

export const getContainerSummary = () =>
  api.get<ContainerSummary[]>("/containers/summary").then((r) => r.data);

export const adjustContainer = (id: number, remaining: number, reason: string) =>
  api.patch<OpenContainer>(`/containers/${id}/adjust`, { remaining, reason }).then((r) => r.data);

export const writeOffContainer = (id: number, reason: string) =>
  api.post<OpenContainer>(`/containers/${id}/write-off`, { reason }).then((r) => r.data);