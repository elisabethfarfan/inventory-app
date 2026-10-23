import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllStock, registrarEntrada, registrarSalida } from "../../api/stock";
import { getAllMovements, getMovementsByProduct } from "../../api/stock";

import type { MovementType } from "../../types/stock";

export const useStockList = () =>
  useQuery({ queryKey: ["stock"], queryFn: getAllStock });

interface MovementVars {
  productId: number;
  type: MovementType;
  quantity: number;
}

export const useCreateMovement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, type, quantity }: MovementVars) =>
      type === "IN"
        ? registrarEntrada(productId, quantity)
        : registrarSalida(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });
};

export const useMovements = (productId?: number) =>
  useQuery({
    queryKey: ["movements", productId ?? "all"],
    queryFn: () =>
      productId ? getMovementsByProduct(productId) : getAllMovements(),
  });