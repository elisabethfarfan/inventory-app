import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adjustContainer,
  getContainerSummary,
  getOpenContainers,
  writeOffContainer,
} from "../../api/containers";

export const useOpenContainers = () =>
  useQuery({ queryKey: ["containers", "open"], queryFn: getOpenContainers });

export const useContainerSummary = () =>
  useQuery({ queryKey: ["containers", "summary"], queryFn: getContainerSummary });

export const useAdjustContainer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; remaining: number; reason: string }) =>
      adjustContainer(v.id, v.remaining, v.reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["containers"] }),
  });
};

export const useWriteOffContainer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; reason: string }) => writeOffContainer(v.id, v.reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["containers"] }),
  });
};