import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelSale, createSale, getSales, type SaleFilters } from "../../api/sales";

export const useSales = (filters: SaleFilters) =>
  useQuery({ queryKey: ["sales", filters], queryFn: () => getSales(filters) });

const refreshAll = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["sales"] });
  qc.invalidateQueries({ queryKey: ["stock"] });
  qc.invalidateQueries({ queryKey: ["movements"] });
  qc.invalidateQueries({ queryKey: ["containers"] });
  qc.invalidateQueries({ queryKey: ["borrowings"] });
};

export const useCreateSale = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createSale, onSuccess: () => refreshAll(qc) });
};

export const useCancelSale = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => cancelSale(id, reason),
    onSuccess: () => refreshAll(qc),
  });
};