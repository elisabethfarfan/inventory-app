import { useMemo } from "react";
import { useProducts } from "./useProducts";
import { useStockList } from "../stock/useStock";
import type { ProductRow } from "../../types/product";

const DEFAULT_MINIMUM = 5;

export function useProductRows() {
  const products = useProducts();
  const stock = useStockList();

  const rows = useMemo<ProductRow[] | undefined>(() => {
    if (!products.data) return undefined;
    const byProduct = new Map(stock.data?.map((s) => [s.product.id, s]));

    return products.data.map((p) => {
      const s = byProduct.get(p.id);
      return {
        ...p,
        stock: s?.quantity ?? 0,
        minimumStock: s?.minimumStock ?? DEFAULT_MINIMUM,
      };
    });
  }, [products.data, stock.data]);

  return {
    rows,
    isLoading: products.isLoading || stock.isLoading,
    isError: products.isError || stock.isError,
    error: products.error ?? stock.error,
  };
}