import { api } from "./client";
import type { ContainerSummary, OpenContainer } from "../types/container";

export const getOpenContainers = () =>
  api.get<OpenContainer[]>("/containers").then((r) => r.data);

export const getContainerSummary = () =>
  api.get<ContainerSummary[]>("/containers/summary").then((r) => r.data);