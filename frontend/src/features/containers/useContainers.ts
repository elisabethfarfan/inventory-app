import { useQuery } from "@tanstack/react-query";
import { getContainerSummary, getOpenContainers } from "../../api/containers";

export const useOpenContainers = () =>
  useQuery({ queryKey: ["containers", "open"], queryFn: getOpenContainers });

export const useContainerSummary = () =>
  useQuery({ queryKey: ["containers", "summary"], queryFn: getContainerSummary });