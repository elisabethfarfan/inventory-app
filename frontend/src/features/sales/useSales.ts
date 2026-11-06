import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSale, getSales, type SaleFilters } from "../../api/sales";

export const useSales = (filters: SaleFilters) =>
  useQuery({ queryKey: ["sales", filters], queryFn: () => getSales(filters) });

export const useCreateSale = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      qc.invalidateQueries({ queryKey: ["containers"] });
    },
  });
};