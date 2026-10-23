import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProducts,
  createProduct,
  updateProduct,
  setProductActive,
} from "../../api/products";
import type { ProductInput } from "../../types/product";

export const useProducts = () =>
  useQuery({ queryKey: ["products"], queryFn: getProducts });

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductInput }) =>
      updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
  });
};

export const useSetProductActive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, value }: { id: number; value: boolean }) =>
      setProductActive(id, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
};