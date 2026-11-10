import { api } from "./client";
import type { Sale, SaleInput } from "../types/sale";

export const createSale = (input: SaleInput) =>
  api.post<Sale>("/sales", input).then((r) => r.data);

export interface SaleFilters {
  from?: string; // yyyy-MM-dd
  to?: string;
  seller?: string;
}

export const getSales = (filters: SaleFilters) =>
  api
    .get<Sale[]>("/sales", {
      params: {
        from: filters.from || undefined,
        to: filters.to || undefined,
        seller: filters.seller || undefined,
      },
    })
    .then((r) => r.data);

  export const cancelSale = (id: number, reason: string) =>
  api.post<Sale>(`/sales/${id}/cancel`, { reason }).then((r) => r.data);